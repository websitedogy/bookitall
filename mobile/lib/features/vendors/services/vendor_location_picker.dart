import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../../widgets/location_map_pin.dart';
import 'electrician_form_data.dart';

class VendorPickedLocation {
  const VendorPickedLocation({
    required this.label,
    required this.lat,
    required this.lng,
    this.district = '',
  });

  final String label;
  final double lat;
  final double lng;
  final String district;
}

Future<VendorPickedLocation?> pickVendorLocation(
  BuildContext context, {
  String pinLabel = 'Your location',
  String? initialLabel,
  double? initialLat,
  double? initialLng,
}) {
  return Navigator.of(context).push<VendorPickedLocation>(
    MaterialPageRoute(
      builder: (_) => VendorLocationPickerPage(
        pinLabel: pinLabel,
        initialLabel: initialLabel ?? '',
        initialLat: initialLat,
        initialLng: initialLng,
      ),
    ),
  );
}

class VendorLocationPickerPage extends StatefulWidget {
  const VendorLocationPickerPage({
    super.key,
    this.pinLabel = 'Your location',
    this.initialLabel = '',
    this.initialLat,
    this.initialLng,
  });

  final String pinLabel;
  final String initialLabel;
  final double? initialLat;
  final double? initialLng;

  @override
  State<VendorLocationPickerPage> createState() => _VendorLocationPickerPageState();
}

class _VendorLocationPickerPageState extends State<VendorLocationPickerPage> {
  final _map = MapController();
  final _address = TextEditingController();
  double? _lat;
  double? _lng;
  String _district = '';
  bool _locating = false;
  bool _resolving = false;
  String _error = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _address.text = widget.initialLabel;
    _lat = widget.initialLat;
    _lng = widget.initialLng;
    if (_lat != null && _lng != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _reverse(_lat!, _lng!, fly: false));
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) => _useCurrent());
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _address.dispose();
    super.dispose();
  }

  Future<void> _useCurrent() async {
    setState(() {
      _locating = true;
      _error = '';
    });
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) throw Exception('Turn on location');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('Allow location access');
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 12)),
      );
      await _reverse(position.latitude, position.longitude, fly: true);
    } catch (err) {
      setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _reverse(double lat, double lng, {required bool fly}) async {
    setState(() {
      _lat = lat;
      _lng = lng;
      _resolving = true;
    });
    if (fly) {
      try {
        _map.move(LatLng(lat, lng), 18);
      } catch (_) {}
    }
    try {
      final uri = Uri.https('nominatim.openstreetmap.org', '/reverse', {
        'lat': lat.toStringAsFixed(6),
        'lon': lng.toStringAsFixed(6),
        'format': 'jsonv2',
        'addressdetails': '1',
        'zoom': '18',
        'accept-language': 'en',
      });
      final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0 (hello@bookitall.com)'});
      var label = '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
      var district = '';
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json is Map<String, dynamic>) {
          final display = json['display_name']?.toString() ?? '';
          final address = json['address'];
          if (address is Map<String, dynamic>) {
            final city = (address['city'] ?? address['town'] ?? address['village'] ?? address['county'] ?? '').toString();
            final state = (address['state'] ?? '').toString();
            final area = (address['suburb'] ?? address['neighbourhood'] ?? address['city_district'] ?? '').toString();
            label = display.isNotEmpty ? display : [area, city, state].where((part) => part.isNotEmpty).join(', ');
            final matched = matchDistrict(city, state);
            if (matched != null) district = matched.name;
          } else if (display.isNotEmpty) {
            label = display;
          }
        }
      }
      if (!mounted) return;
      setState(() {
        _address.text = label;
        _district = district;
        _resolving = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _address.text = '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
        _resolving = false;
      });
    }
  }

  void _onMoved(LatLng center) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), () => _reverse(center.latitude, center.longitude, fly: false));
  }

  void _confirm() {
    final label = _address.text.trim();
    if (label.isEmpty || _lat == null || _lng == null) {
      setState(() => _error = 'Use current location, or move the pin on the map.');
      return;
    }
    Navigator.of(context).pop(VendorPickedLocation(label: label, lat: _lat!, lng: _lng!, district: _district));
  }

  @override
  Widget build(BuildContext context) {
    final center = LatLng(_lat ?? 17.385044, _lng ?? 78.486671);
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _map,
                  options: MapOptions(
                    initialCenter: center,
                    initialZoom: _lat == null ? 12 : 18,
                    onMapEvent: (event) {
                      if (event is MapEventMoveEnd) _onMoved(event.camera.center);
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.bookitall.bookitall_mobile',
                    ),
                    if (_lat != null && _lng != null)
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: LatLng(_lat!, _lng!),
                            width: 160,
                            height: 86,
                            alignment: Alignment.bottomCenter,
                            child: LocationMapPin(label: widget.pinLabel),
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
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: Material(
                    color: Colors.white,
                    shape: const StadiumBorder(),
                    elevation: 3,
                    child: InkWell(
                      onTap: _locating ? null : _useCurrent,
                      borderRadius: BorderRadius.circular(99),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            const Icon(Icons.my_location, color: Color(0xFF2B7CFF), size: 18),
                            const SizedBox(width: 8),
                            Text(_locating ? 'Finding…' : 'Current location', style: const TextStyle(fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
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
                  const Text('Property location', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                  const SizedBox(height: 2),
                  const Text('Pin on the map, use current location, or type the address.', style: TextStyle(fontSize: 13, color: Color(0xFF8A8F8C))),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _locating ? null : _useCurrent,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0F3D38),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                      shape: const StadiumBorder(),
                    ),
                    icon: const Icon(Icons.my_location, size: 18),
                    label: Text(_locating ? 'Detecting current location…' : 'Use current location'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _address,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Kitchen / service address',
                      hintText: 'Street, area, city',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _locating ? 'Finding your current location…' : _resolving ? 'Updating area…' : _address.text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, color: Color(0xFF3D4F4A)),
                  ),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_error, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13)),
                  ],
                  const SizedBox(height: 14),
                  FilledButton(
                    onPressed: _locating || _resolving ? null : _confirm,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFF5C400),
                      foregroundColor: const Color(0xFF12241F),
                      minimumSize: const Size.fromHeight(48),
                      shape: const StadiumBorder(),
                    ),
                    child: const Text('Use this location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
