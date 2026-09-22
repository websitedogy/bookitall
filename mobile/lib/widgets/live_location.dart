import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';

class StreetAddress {
  const StreetAddress({required this.line1, required this.line2, required this.full});

  final String line1;
  final String line2;
  final String full;

  String get pinLabel => line1;

  String get key => (full.isNotEmpty ? full : line1).trim().toLowerCase();

  Map<String, String> toJson() => {'line1': line1, 'line2': line2, 'full': full};

  factory StreetAddress.fromJson(Map<String, dynamic> json) {
    return StreetAddress(
      line1: json['line1'] as String? ?? '',
      line2: json['line2'] as String? ?? '',
      full: json['full'] as String? ?? '',
    );
  }
}

const _cityPlaces = <String, StreetAddress>{
  'Hyderabad': StreetAddress(line1: 'Hyderabad', line2: 'Telangana', full: 'Hyderabad, Telangana'),
  'Bengaluru': StreetAddress(line1: 'Bengaluru', line2: 'Karnataka', full: 'Bengaluru, Karnataka'),
  'Goa': StreetAddress(line1: 'Goa', line2: '', full: 'Goa'),
  'Chennai': StreetAddress(line1: 'Chennai', line2: 'Tamil Nadu', full: 'Chennai, Tamil Nadu'),
  'Mumbai': StreetAddress(line1: 'Mumbai', line2: 'Maharashtra', full: 'Mumbai, Maharashtra'),
  'Vijayawada': StreetAddress(line1: 'Vijayawada', line2: 'Andhra Pradesh', full: 'Vijayawada, Andhra Pradesh'),
  'Delhi': StreetAddress(line1: 'Delhi', line2: 'Delhi', full: 'Delhi'),
  'Pune': StreetAddress(line1: 'Pune', line2: 'Maharashtra', full: 'Pune, Maharashtra'),
};

const _popularCities = ['Hyderabad', 'Bengaluru', 'Goa', 'Chennai', 'Mumbai', 'Vijayawada', 'Delhi', 'Pune'];

const _savedKey = 'bookitall-live-location';
const _recentKey = 'bookitall-recent-locations';
const _locationBlue = Color(0xFF2563EB);
const _locationBlueSoft = Color(0xFF60A5FA);
const _pinBlue = Color(0xFF2B7CFF);
const _navyBorder = Color(0x5A1E3A5F);

final _doorNo = RegExp(r'^(?:h\.?\s*no\.?\s*|plot\s*(?:no\.?\s*)?)?\d[\dA-Za-z]*([-/][\dA-Za-z]+)+$', caseSensitive: false);
StreetAddress? _cachedPlace;
List<StreetAddress> _cachedRecent = [];

class LiveLocation extends StatefulWidget {
  const LiveLocation({super.key});

  @override
  State<LiveLocation> createState() => _LiveLocationState();
}

class _LiveLocationState extends State<LiveLocation> {
  final _portal = OverlayPortalController();
  final _link = LayerLink();
  final _query = TextEditingController();
  final _focus = FocusNode();
  StreetAddress place = _cityPlaces['Hyderabad']!;
  List<StreetAddress> recent = List<StreetAddress>.from(_cachedRecent);
  List<StreetAddress> hits = [];
  Timer? _searchTimer;
  bool busy = false;
  bool open = false;

  @override
  void initState() {
    super.initState();
    if (_cachedPlace != null) {
      place = _cachedPlace!;
    }
    _query.text = place.pinLabel;
    _focus.addListener(_onFocus);
    _restore();
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    _focus.removeListener(_onFocus);
    _focus.dispose();
    _query.dispose();
    super.dispose();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final savedRaw = prefs.getString(_savedKey);
    final recentRaw = prefs.getStringList(_recentKey) ?? const <String>[];
    StreetAddress? saved;
    if (savedRaw != null) {
      try {
        final json = jsonDecode(savedRaw);
        if (json is Map<String, dynamic> && (json['line1'] as String?)?.isNotEmpty == true) {
          saved = StreetAddress.fromJson(json);
        }
      } catch (_) {}
    }
    final loadedRecent = <StreetAddress>[];
    for (final item in recentRaw) {
      try {
        final json = jsonDecode(item);
        if (json is Map<String, dynamic> && (json['line1'] as String?)?.isNotEmpty == true) {
          loadedRecent.add(StreetAddress.fromJson(json));
        }
      } catch (_) {}
    }
    if (!mounted) return;
    _cachedRecent = loadedRecent;
    setState(() {
      if (saved != null) {
        _cachedPlace = saved;
        place = saved;
      }
      recent = loadedRecent;
    });
    if (!open) _query.text = place.pinLabel;
    if (saved == null) {
      _detect(force: false, addRecent: false);
    }
  }

  Future<void> _persist(StreetAddress next, {required bool addRecent}) async {
    _cachedPlace = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_savedKey, jsonEncode(next.toJson()));
    if (!addRecent) return;
    final nextRecent = [next, ...recent.where((item) => item.key != next.key)].take(6).toList();
    _cachedRecent = nextRecent;
    await prefs.setStringList(_recentKey, nextRecent.map((item) => jsonEncode(item.toJson())).toList());
    if (mounted) setState(() => recent = nextRecent);
  }

  void _onFocus() {
    if (_focus.hasFocus && !open) _openMenu();
  }

  void _openMenu() {
    if (open) return;
    setState(() {
      open = true;
      _query.clear();
      hits = [];
      _portal.show();
    });
  }

  void _toggle() {
    if (open) {
      _close();
      return;
    }
    _openMenu();
    _focus.requestFocus();
  }

  void _close() {
    if (!open || !mounted) return;
    _searchTimer?.cancel();
    _focus.unfocus();
    setState(() {
      open = false;
      hits = [];
      _query.text = busy ? 'Detecting…' : place.pinLabel;
      _portal.hide();
    });
  }

  void _onQueryChanged(String value) {
    if (!open) _openMenu();
    _searchTimer?.cancel();
    setState(() {
      if (value.trim().length < 2) hits = [];
    });
    if (value.trim().length >= 2) {
      _searchTimer = Timer(const Duration(milliseconds: 280), () => _search(value.trim()));
    }
  }

  Future<void> _search(String q) async {
    try {
      final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
        'q': q,
        'format': 'jsonv2',
        'addressdetails': '1',
        'countrycodes': 'in',
        'limit': '8',
        'accept-language': 'en',
      });
      final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0 (hello@bookitall.com)'});
      if (response.statusCode != 200 || !mounted || _query.text.trim() != q) return;
      final json = jsonDecode(response.body);
      if (json is! List) return;
      final next = <StreetAddress>[];
      final seen = <String>{};
      for (final row in json) {
        if (row is! Map<String, dynamic>) continue;
        final address = row['address'];
        if (address is! Map<String, dynamic>) continue;
        final place = _format(address, row['display_name'] as String?);
        if (place.line1.isEmpty || seen.contains(place.key)) continue;
        seen.add(place.key);
        next.add(place);
      }
      if (mounted) setState(() => hits = next);
    } catch (_) {
      if (mounted && _query.text.trim() == q) setState(() => hits = []);
    }
  }

  Future<void> _select(StreetAddress next, {bool addRecent = true}) async {
    setState(() {
      place = next;
      _query.text = next.pinLabel;
    });
    _close();
    await _persist(next, addRecent: addRecent);
  }

  Future<void> _detect({bool force = true, bool addRecent = false}) async {
    if (!force && _cachedPlace != null) {
      setState(() => place = _cachedPlace!);
      return;
    }
    if (force) setState(() => busy = true);
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) return;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: force ? LocationAccuracy.high : LocationAccuracy.medium,
          timeLimit: Duration(seconds: force ? 12 : 8),
        ),
      );
      final resolved = await _reverse(position.latitude, position.longitude);
      if (!mounted) return;
      if (resolved != null) {
        setState(() {
          place = resolved;
          if (!open) _query.text = resolved.pinLabel;
        });
        await _persist(resolved, addRecent: addRecent);
      }
    } catch (_) {
      // Keep last known city if GPS / geocode fails.
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<StreetAddress?> _reverse(double lat, double lon) async {
    final uri = Uri.https('nominatim.openstreetmap.org', '/reverse', {
      'lat': lat.toStringAsFixed(6),
      'lon': lon.toStringAsFixed(6),
      'format': 'jsonv2',
      'addressdetails': '1',
      'zoom': '18',
      'accept-language': 'en',
    });
    final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0 (hello@bookitall.com)'});
    if (response.statusCode != 200) return null;
    final json = jsonDecode(response.body);
    if (json is! Map<String, dynamic>) return null;
    final address = json['address'];
    if (address is! Map<String, dynamic>) return null;
    return _format(address, json['display_name'] as String?);
  }

  StreetAddress _format(Map<String, dynamic> address, String? displayName) {
    String? pick(List<String> keys) {
      for (final key in keys) {
        final value = address[key];
        if (value is String && value.trim().isNotEmpty) return value.trim();
      }
      return null;
    }

    List<String> unique(List<String?> parts) {
      final seen = <String>{};
      final out = <String>[];
      for (final part in parts) {
        if (part == null || part.isEmpty) continue;
        final key = part.toLowerCase();
        if (seen.contains(key)) continue;
        seen.add(key);
        out.add(part);
      }
      return out;
    }

    String? doorFromDisplay() {
      final first = displayName?.split(',').first.trim();
      if (first != null && _doorNo.hasMatch(first)) return first;
      return null;
    }

    final house = pick(['house_number', 'house_name']) ?? doorFromDisplay();
    final street = pick(['road', 'pedestrian']);
    final area = pick(['neighbourhood', 'suburb', 'quarter', 'residential', 'city_district']);
    final city = pick(['city', 'town', 'village']);
    final line1 = unique([house, street]).join(', ');
    final line2 = unique([area, city]).join(', ');
    if (line1.isNotEmpty) {
      return StreetAddress(
        line1: line1,
        line2: line2,
        full: unique([line1, line2, pick(['postcode'])]).join(', '),
      );
    }
    if (line2.isNotEmpty) {
      return StreetAddress(line1: line2, line2: pick(['state']) ?? '', full: line2);
    }
    return StreetAddress(line1: city ?? 'Current location', line2: pick(['state']) ?? '', full: city ?? 'Current location');
  }

  List<StreetAddress> get _popular {
    final unused = [
      for (final city in _popularCities)
        if (_cityPlaces[city] != null && recent.every((item) => item.key != _cityPlaces[city]!.key)) _cityPlaces[city]!,
    ];
    if (unused.length >= 5) return unused;
    final extra = [
      for (final city in _popularCities)
        if (_cityPlaces[city] != null && unused.every((item) => item.key != _cityPlaces[city]!.key)) _cityPlaces[city]!,
    ];
    return [...unused, ...extra].take(5).toList();
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _link,
      child: OverlayPortal(
        controller: _portal,
        overlayChildBuilder: (context) {
          return Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _close,
                ),
              ),
              CompositedTransformFollower(
                link: _link,
                showWhenUnlinked: false,
                targetAnchor: Alignment.bottomRight,
                followerAnchor: Alignment.topRight,
                offset: const Offset(0, 6),
                child: Material(
                  color: Colors.transparent,
                  child: _LocationMenu(
                    busy: busy,
                    searching: _query.text.trim().length >= 2,
                    currentHint: busy ? 'Finding your area…' : (place.full.isNotEmpty ? place.full : place.line1),
                    recent: recent,
                    popular: _popular,
                    hits: hits,
                    onUseCurrent: () {
                      _close();
                      _detect(force: true, addRecent: true);
                    },
                    onSelect: (next) => _select(next),
                  ),
                ),
              ),
            ],
          );
        },
        child: Align(
          alignment: Alignment.centerRight,
          child: ConstrainedBox(
            constraints: MediaQuery.sizeOf(context).width < 768
                ? const BoxConstraints(maxWidth: 128, minWidth: 104)
                : const BoxConstraints(maxWidth: 220, minWidth: 168),
            child: Material(
              color: Colors.white,
              shape: StadiumBorder(side: BorderSide(color: _navyBorder)),
              child: Padding(
                padding: MediaQuery.sizeOf(context).width < 768
                    ? const EdgeInsets.fromLTRB(8, 0, 0, 0)
                    : const EdgeInsets.fromLTRB(12, 2, 4, 2),
                child: Row(
                  children: [
                    Icon(Icons.location_on, size: MediaQuery.sizeOf(context).width < 768 ? 15 : 18, color: _pinBlue),
                    SizedBox(width: MediaQuery.sizeOf(context).width < 768 ? 4 : 6),
                    Expanded(
                      child: TextField(
                        controller: _query,
                        focusNode: _focus,
                        onTap: _openMenu,
                        onChanged: _onQueryChanged,
                        style: TextStyle(
                          color: _locationBlue,
                          fontSize: MediaQuery.sizeOf(context).width < 768 ? 12 : 13,
                          fontWeight: FontWeight.w600,
                        ),
                        cursorColor: _locationBlue,
                        decoration: InputDecoration(
                          isDense: true,
                          border: InputBorder.none,
                          hintText: 'Search area, city, street',
                          hintStyle: TextStyle(
                            color: const Color(0xFF93C5FD),
                            fontSize: MediaQuery.sizeOf(context).width < 768 ? 12 : 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      constraints: BoxConstraints(
                        minWidth: MediaQuery.sizeOf(context).width < 768 ? 24 : 28,
                        minHeight: MediaQuery.sizeOf(context).width < 768 ? 24 : 28,
                      ),
                      onPressed: _toggle,
                      icon: Icon(
                        open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        size: MediaQuery.sizeOf(context).width < 768 ? 16 : 18,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LocationMenu extends StatelessWidget {
  const _LocationMenu({
    required this.busy,
    required this.searching,
    required this.currentHint,
    required this.recent,
    required this.popular,
    required this.hits,
    required this.onUseCurrent,
    required this.onSelect,
  });

  final bool busy;
  final bool searching;
  final String currentHint;
  final List<StreetAddress> recent;
  final List<StreetAddress> popular;
  final List<StreetAddress> hits;
  final VoidCallback onUseCurrent;
  final ValueChanged<StreetAddress> onSelect;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 252, maxWidth: 328, maxHeight: 360),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: const [BoxShadow(color: Color(0x2E15202B), blurRadius: 28, offset: Offset(0, 12))],
        ),
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 4),
          shrinkWrap: true,
          children: [
            InkWell(
              onTap: onUseCurrent,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.my_location, size: 18, color: busy ? _locationBlueSoft : _locationBlue),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            busy ? 'Detecting GPS…' : 'Use current location',
                            style: const TextStyle(color: _locationBlue, fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            currentHint,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: _locationBlueSoft, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (searching) ...[
              const Divider(height: 1, color: Color(0xFFEEF2F6)),
              const _SectionLabel('SEARCH RESULTS'),
              if (hits.isEmpty)
                const Padding(
                  padding: EdgeInsets.fromLTRB(14, 10, 14, 12),
                  child: Text('No match. Try an area, city, or street.', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                )
              else
                for (final item in hits)
                  _PlaceRow(label: item.pinLabel, subtitle: item.line2.isNotEmpty ? item.line2 : item.full, onTap: () => onSelect(item)),
            ] else ...[
              if (recent.isNotEmpty) ...[
                const Divider(height: 1, color: Color(0xFFEEF2F6)),
                const _SectionLabel('RECENT LOCATIONS'),
                for (final item in recent) _PlaceRow(label: item.pinLabel, onTap: () => onSelect(item)),
              ],
              if (popular.isNotEmpty) ...[
                const Divider(height: 1, color: Color(0xFFEEF2F6)),
                const _SectionLabel('POPULAR LOCATIONS'),
                for (final item in popular) _PlaceRow(label: item.line1, onTap: () => onSelect(item)),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}

class _PlaceRow extends StatelessWidget {
  const _PlaceRow({required this.label, this.subtitle, required this.onTap});

  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        child: Row(
          children: [
            const Icon(Icons.location_on_outlined, size: 18, color: Color(0xFF9CA3AF)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFF111827), fontSize: 14),
                  ),
                  if (subtitle != null && subtitle!.isNotEmpty && subtitle != label)
                    Text(
                      subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
