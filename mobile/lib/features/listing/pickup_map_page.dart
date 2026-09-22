import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../widgets/location_map_pin.dart';

class PickupResult {
  const PickupResult({
    required this.lat,
    required this.lng,
    required this.house,
    required this.building,
    required this.address,
  });

  final double lat;
  final double lng;
  final String house;
  final String building;
  final String address;
}

class PickupMapPage extends StatefulWidget {
  const PickupMapPage({
    super.key,
    required this.lat,
    required this.lng,
    this.house = '',
    this.building = '',
    this.address = '',
  });

  final double lat;
  final double lng;
  final String house;
  final String building;
  final String address;

  @override
  State<PickupMapPage> createState() => _PickupMapPageState();
}

class _PickupMapPageState extends State<PickupMapPage> {
  final _map = MapController();
  final _house = TextEditingController();
  final _building = TextEditingController();
  late double _lat;
  late double _lng;
  late String _address;
  bool _resolving = false;
  String _error = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _lat = widget.lat;
    _lng = widget.lng;
    _house.text = widget.house;
    _building.text = widget.building;
    _address = widget.address;
    WidgetsBinding.instance.addPostFrameCallback((_) => _reverse(_lat, _lng));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _house.dispose();
    _building.dispose();
    super.dispose();
  }

  String get _street {
    final skip = {_house.text.trim().toLowerCase(), _building.text.trim().toLowerCase()}..remove('');
    final parts = _address.split(',').map((p) => p.trim()).where((p) => p.isNotEmpty && !skip.contains(p.toLowerCase()));
    final next = parts.join(', ');
    return next.isEmpty ? _address : next;
  }

  Future<void> _reverse(double lat, double lng) async {
    setState(() {
      _lat = lat;
      _lng = lng;
      _resolving = true;
    });
    try {
      final pin = await Future.wait([_nominatim(lat, lng), _overpass(lat, lng)]);
      if (!mounted) return;
      final house = pin[0]['house'] ?? pin[1]['house'] ?? '';
      final building = pin[0]['building'] ?? pin[1]['building'] ?? '';
      final full = pin[0]['address'] ?? pin[1]['address'] ?? '';
      setState(() {
        if (house.isNotEmpty) _house.text = house;
        if (building.isNotEmpty && building.toLowerCase() != 'yes') _building.text = building;
        if (full.isNotEmpty) _address = full;
        _resolving = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _address = '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
        _resolving = false;
      });
    }
  }

  Future<Map<String, String>> _nominatim(double lat, double lng) async {
    final uri = Uri.https('nominatim.openstreetmap.org', '/reverse', {
      'lat': lat.toStringAsFixed(6),
      'lon': lng.toStringAsFixed(6),
      'format': 'jsonv2',
      'addressdetails': '1',
      'extratags': '1',
      'zoom': '20',
      'accept-language': 'en',
    });
    final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0'});
    if (response.statusCode != 200) return {};
    final json = jsonDecode(response.body);
    if (json is! Map) return {};
    final address = json['address'];
    String pick(List<String> keys) {
      if (address is! Map) return '';
      for (final key in keys) {
        final value = address[key];
        if (value is String && value.trim().isNotEmpty && value.trim().toLowerCase() != 'yes') return value.trim();
      }
      return '';
    }

    final area = pick(['suburb', 'neighbourhood', 'city_district']);
    final named = json['name'] is String ? (json['name'] as String).trim() : '';
    final type = json['addresstype'] is String ? json['addresstype'] as String : '';
    const areas = {'suburb', 'village', 'hamlet', 'town', 'city', 'neighbourhood', 'neighborhood', 'road', 'county'};
    var building = pick(['amenity', 'shop', 'office', 'tourism', 'leisure', 'addr:housename']);
    if (building.isEmpty && named.isNotEmpty && !areas.contains(type) && named.toLowerCase() != area.toLowerCase()) {
      building = named;
    }
    return {
      'house': pick(['house_number', 'housenumber', 'addr:housenumber']),
      'building': building,
      'address': [
        pick(['road', 'pedestrian']),
        if (area.isNotEmpty) area,
        pick(['city', 'town', 'village']),
        pick(['state']),
      ].where((p) => p.isNotEmpty).join(', '),
    };
  }

  Future<Map<String, String>> _overpass(double lat, double lng) async {
    final query = '''[out:json][timeout:12];
(
  way(around:70,$lat,$lng)["building"]["name"];
  way(around:70,$lat,$lng)["addr:housename"];
  way(around:40,$lat,$lng)["addr:housenumber"];
  node(around:40,$lat,$lng)["addr:housenumber"];
  node(around:20,$lat,$lng)["amenity"]["name"];
);
out tags center 20;''';
    final response = await http.post(
      Uri.parse('https://overpass-api.de/api/interpreter'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
      body: 'data=${Uri.encodeQueryComponent(query)}',
    );
    if (response.statusCode != 200) return {};
    final json = jsonDecode(response.body);
    if (json is! Map || json['elements'] is! List) return {};

    double dist(double elat, double elon) {
      const r = 6371000.0;
      final p1 = lat * math.pi / 180;
      final p2 = elat * math.pi / 180;
      final dLat = p2 - p1;
      final dLon = (elon - lng) * math.pi / 180;
      final a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(p1) * math.cos(p2) * math.sin(dLon / 2) * math.sin(dLon / 2);
      return 2 * r * math.asin(math.sqrt(a));
    }

    final rows = <({Map<dynamic, dynamic> tags, double metres})>[];
    for (final el in json['elements'] as List) {
      if (el is! Map) continue;
      final tags = el['tags'];
      final center = el['center'] is Map ? el['center'] as Map : el;
      final elat = center['lat'];
      final elon = center['lon'];
      if (tags is! Map || elat is! num || elon is! num) continue;
      rows.add((tags: tags, metres: dist(elat.toDouble(), elon.toDouble())));
    }
    rows.sort((a, b) => a.metres.compareTo(b.metres));
    String tag(Map<dynamic, dynamic> tags, String key) {
      final value = tags[key];
      return value is String ? value.trim() : '';
    }

    String? house;
    String? building;
    for (final row in rows) {
      final no = tag(row.tags, 'addr:housenumber');
      if (house == null && no.isNotEmpty && row.metres <= 40) house = no;
      final named = tag(row.tags, 'addr:housename');
      final name = named.isNotEmpty ? named : tag(row.tags, 'name');
      if (building == null && name.isNotEmpty && name.toLowerCase() != 'yes' && row.metres <= 70) building = name;
    }
    return {if (house != null) 'house': house, if (building != null) 'building': building};
  }

  void _onMoved(LatLng center) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), () => _reverse(center.latitude, center.longitude));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _map,
                  options: MapOptions(
                    initialCenter: LatLng(_lat, _lng),
                    initialZoom: 18,
                    onMapEvent: (event) {
                      if (event is MapEventMoveEnd) _onMoved(event.camera.center);
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.bookitall.bookitall_mobile',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: LatLng(_lat, _lng),
                          width: 160,
                          height: 86,
                          alignment: Alignment.bottomCenter,
                          child: const LocationMapPin(label: 'Pickup Point'),
                        ),
                      ],
                    ),
                  ],
                ),
                Positioned(
                  left: 16,
                  bottom: 16,
                  child: Material(
                    color: Colors.white,
                    shape: const CircleBorder(),
                    elevation: 3,
                    child: IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 18, 20, 16 + MediaQuery.viewInsetsOf(context).bottom),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Select a pickup point', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                  const SizedBox(height: 2),
                  const Text('House and building come from your pin.', style: TextStyle(fontSize: 13, color: Color(0xFF8A8F8C))),
                  const SizedBox(height: 12),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1B8A4A)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('House / flat', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF5B6E68))),
                                    const SizedBox(height: 2),
                                    Text(_resolving ? 'Finding…' : (_house.text.trim().isEmpty ? '—' : _house.text.trim()), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Building', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF5B6E68))),
                                    const SizedBox(height: 2),
                                    Text(_resolving ? 'Finding…' : (_building.text.trim().isEmpty ? '—' : _building.text.trim()), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (!_resolving && (_house.text.trim().isEmpty || _building.text.trim().isEmpty)) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                if (_house.text.trim().isEmpty) Expanded(child: TextField(controller: _house, onChanged: (_) => setState(() {}), decoration: _fieldDec('House / flat', ''))),
                                if (_house.text.trim().isEmpty && _building.text.trim().isEmpty) const SizedBox(width: 8),
                                if (_building.text.trim().isEmpty) Expanded(child: TextField(controller: _building, onChanged: (_) => setState(() {}), decoration: _fieldDec('Building name', ''))),
                              ],
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            _resolving ? 'Updating area…' : _street,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF3D4F4A)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_error, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13)),
                  ],
                  const SizedBox(height: 14),
                  FilledButton(
                    onPressed: () {
                      if (_house.text.trim().isEmpty && _building.text.trim().isEmpty) {
                        setState(() => _error = 'Add house / flat number or building name so the vendor can find the door.');
                        return;
                      }
                      Navigator.of(context).pop(PickupResult(
                        lat: _lat,
                        lng: _lng,
                        house: _house.text.trim(),
                        building: _building.text.trim(),
                        address: _address,
                      ));
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFF5C400),
                      foregroundColor: const Color(0xFF12241F),
                      minimumSize: const Size.fromHeight(48),
                      shape: const StadiumBorder(),
                    ),
                    child: const Text('Confirm pickup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _fieldDec(String label, String hint) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      isDense: true,
      filled: true,
      fillColor: const Color(0xFFF7F3EA),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEADFCD))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1B8A4A))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    );
  }
}
