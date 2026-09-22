import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/india_locations.dart';
import '../../../theme/app_colors.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';
import 'vendor_form_draft.dart';
import 'vendor_location_picker.dart';

class ListingLocationPage extends StatefulWidget {
  const ListingLocationPage({super.key, required this.draft});

  final ListingDraft draft;

  @override
  State<ListingLocationPage> createState() => _ListingLocationPageState();
}

class _ListingLocationPageState extends State<ListingLocationPage> {
  final _search = TextEditingController();
  List<String> _recent = [];
  PlaceChoice? _current;
  PlaceChoice? _selected;
  bool _locating = false;
  bool _saving = false;
  String _query = '';
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadRecent();
    _detect(silent: true);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _loadRecent() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _recent = prefs.getStringList('recent_listing_places') ?? []);
  }

  Future<void> _remember(String value) async {
    final next = [value, ..._recent.where((item) => item != value)].take(6).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_listing_places', next);
  }

  Future<void> _detect({bool silent = false}) async {
    if (!silent) setState(() => _locating = true);
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
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 12)),
      );
      final uri = Uri.https('nominatim.openstreetmap.org', '/reverse', {
        'lat': position.latitude.toStringAsFixed(6),
        'lon': position.longitude.toStringAsFixed(6),
        'format': 'jsonv2',
        'addressdetails': '1',
        'zoom': '18',
        'accept-language': 'en',
      });
      final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0 (hello@bookitall.com)'});
      if (response.statusCode != 200) return;
      final json = jsonDecode(response.body);
      if (json is! Map<String, dynamic>) return;
      final address = json['address'];
      if (address is! Map<String, dynamic>) return;
      String? pick(List<String> keys) {
        for (final key in keys) {
          final value = address[key];
          if (value is String && value.trim().isNotEmpty) return value.trim();
        }
        return null;
      }

      final area = pick(['neighbourhood', 'suburb', 'quarter', 'residential', 'city_district']) ?? '';
      final city = pick(['city', 'town', 'village', 'county']) ?? 'Current location';
      final state = pick(['state']) ?? '';
      if (!mounted) return;
      final place = PlaceChoice(
        label: area.isNotEmpty ? '$area, $city' : city,
        area: area.isEmpty ? city : area,
        city: city,
        state: state,
        latitude: position.latitude,
        longitude: position.longitude,
      );
      setState(() {
        _current = place;
        if (!silent) _selected = place;
      });
    } catch (_) {
      // Keep last known place if GPS / geocode fails.
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _select(PlaceChoice place) {
    setState(() {
      _selected = place;
      _error = '';
    });
  }

  Future<void> _save() async {
    final place = _selected;
    if (place == null) {
      setState(() => _error = 'Choose a city or use current location, then save.');
      return;
    }
    if (_saving) return;
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      await _remember(place.full);
      await submitListingDraft(widget.draft, place);
      await VendorFormDraft.clear(widget.draft.config.id);
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: widget.draft.displayName, location: place.full),
        ),
        (route) => route.isFirst,
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = '$error';
      });
    }
  }

  PlaceChoice _cityPlace(String city, String state) {
    return PlaceChoice(
      label: city,
      area: city,
      city: city,
      state: state,
      latitude: coordsFor(city, state)?.$1,
      longitude: coordsFor(city, state)?.$2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final results = searchPlaces(_query);
    return ListingWizardScaffold(
      categoryId: widget.draft.config.id,
      categoryTitle: widget.draft.config.title,
      step: 3,
      error: _error,
      primaryLabel: 'Save listing',
      primaryEnabled: _selected != null,
      primaryBusy: _saving,
      onPrimary: _save,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          TextField(
            controller: _search,
            onChanged: (value) => setState(() => _query = value),
            decoration: InputDecoration(
              hintText: 'Search city or area',
              prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
          if (results.isNotEmpty) ...[
            const SizedBox(height: 12),
            DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  for (final place in results)
                    ListTile(
                      leading: const Icon(Icons.place_outlined),
                      title: Text(place.city),
                      subtitle: Text(place.state),
                      selected: _selected?.full == place.full,
                      onTap: () => _select(place),
                    ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 12),
            Material(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
              child: ListTile(
                leading: _locating
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location, color: Color(0xFF1D4ED8)),
                title: const Text('Use current location', style: TextStyle(color: Color(0xFF1D4ED8), fontWeight: FontWeight.w700)),
                subtitle: Text(
                  _locating ? 'Finding your area…' : (_current?.label ?? 'Find your area'),
                  style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12),
                ),
                onTap: () async {
                  final found = await pickVendorLocation(
                    context,
                    pinLabel: 'Your location',
                    initialLabel: _current?.label ?? '',
                    initialLat: _current?.latitude,
                    initialLng: _current?.longitude,
                  );
                  if (!mounted || found == null) return;
                  final place = PlaceChoice(
                    label: found.label,
                    area: found.label,
                    city: found.district.isNotEmpty ? found.district : found.label,
                    state: '',
                    latitude: found.lat,
                    longitude: found.lng,
                  );
                  setState(() {
                    _current = place;
                    _selected = place;
                    _error = '';
                  });
                },
              ),
            ),
            if (_recent.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Text(
                'RECENT LOCATIONS',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1),
              ),
              const SizedBox(height: 8),
              for (final item in _recent)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.location_on_outlined, color: Color(0xFF9CA3AF)),
                  title: Text(item, maxLines: 1, overflow: TextOverflow.ellipsis),
                  onTap: () {
                    final parts = item.split(',').map((part) => part.trim()).where((part) => part.isNotEmpty).toList();
                    _select(PlaceChoice(
                      label: item,
                      area: parts.isNotEmpty ? parts.first : item,
                      city: parts.length > 1 ? parts[parts.length - 2] : parts.first,
                      state: parts.length > 1 ? parts.last : '',
                      latitude: coordsFor(parts.length > 1 ? parts[parts.length - 2] : parts.first, parts.length > 1 ? parts.last : '')?.$1,
                      longitude: coordsFor(parts.length > 1 ? parts[parts.length - 2] : parts.first, parts.length > 1 ? parts.last : '')?.$2,
                    ));
                  },
                ),
            ],
            const SizedBox(height: 12),
            const Text(
              'POPULAR LOCATIONS',
              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final entry in citiesByState.entries.take(6))
                  for (final city in entry.value.take(2))
                    InkWell(
                      onTap: () => _select(_cityPlace(city, entry.key)),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        width: (MediaQuery.sizeOf(context).width - 48) / 2,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _selected?.city == city && _selected?.state == entry.key
                                ? AppColors.primary
                                : AppColors.border,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(city, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text(entry.key, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
            const SizedBox(height: 18),
            const Text(
              'CHOOSE STATE',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1),
            ),
            for (final state in indianStates)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(state),
                trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                onTap: () async {
                  final city = await Navigator.of(context).push<String>(
                    MaterialPageRoute(builder: (_) => _CityPickerPage(state: state)),
                  );
                  if (city == null) return;
                  _select(_cityPlace(city, state));
                },
              ),
          ],
          if (_selected != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Selected: ${_selected!.full}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ),
        ],
      ),
    );
  }
}

class _CityPickerPage extends StatelessWidget {
  const _CityPickerPage({required this.state});

  final String state;

  @override
  Widget build(BuildContext context) {
    final cities = citiesByState[state] ?? const <String>[];
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(state, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      ),
      body: ListView.separated(
        itemCount: cities.length,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final city = cities[index];
          return ListTile(
            title: Text(city),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
            onTap: () => Navigator.pop(context, city),
          );
        },
      ),
    );
  }
}
