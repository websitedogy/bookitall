import 'package:flutter/material.dart';

import '../../../data/india_locations.dart';
import 'electrician_form_data.dart';

class PackersServiceType {
  const PackersServiceType({
    required this.id,
    required this.name,
    required this.icon,
    required this.tint,
    required this.iconColor,
  });

  final String id;
  final String name;
  final IconData icon;
  final Color tint;
  final Color iconColor;
}

class PackersLocation {
  PackersLocation({this.state = '', List<String>? districts}) : districts = districts ?? [];

  String state;
  List<String> districts;
}

const packersServiceTypes = [
  PackersServiceType(
    id: 'home-shifting',
    name: 'Home Shifting',
    icon: Icons.home_outlined,
    tint: Color(0xFFFEF3C7),
    iconColor: Color(0xFFB45309),
  ),
  PackersServiceType(
    id: 'office-shifting',
    name: 'Office Shifting',
    icon: Icons.apartment_outlined,
    tint: Color(0xFFDBEAFE),
    iconColor: Color(0xFF1D4ED8),
  ),
  PackersServiceType(
    id: 'local-shifting',
    name: 'Local Shifting',
    icon: Icons.local_shipping_outlined,
    tint: Color(0xFFFFEDD5),
    iconColor: Color(0xFFC2410C),
  ),
  PackersServiceType(
    id: 'long-distance-shifting',
    name: 'Long-Distance Shifting',
    icon: Icons.add_road,
    tint: Color(0xFFDCFCE7),
    iconColor: Color(0xFF15803D),
  ),
  PackersServiceType(
    id: 'other',
    name: 'Other',
    icon: Icons.inventory_2_outlined,
    tint: Color(0xFFF1F5F9),
    iconColor: Color(0xFF475569),
  ),
];

PackersServiceType? packersServiceById(String? id) {
  if (id == null || id.isEmpty) return null;
  final wanted = id.trim().toLowerCase();
  for (final item in packersServiceTypes) {
    if (item.id == wanted || item.name.toLowerCase() == wanted || item.name.toLowerCase().replaceAll(' ', '-') == wanted) {
      return item;
    }
  }
  return null;
}

List<String> packersStates() {
  final fromDistricts = <String>{};
  for (final item in electricianDistricts) {
    fromDistricts.add(item.state);
  }
  final extra = [
    for (final state in indianStates)
      if (!fromDistricts.contains(state)) state,
  ]..sort();
  return [...fromDistricts, ...extra];
}

List<String> packersDistricts(String state) {
  if (state.isEmpty) return const [];
  final official = [for (final item in electricianDistricts) if (item.state == state) item.name];
  if (official.isNotEmpty) return official;
  return citiesByState[state] ?? const [];
}

String formatPackersLocations(List<PackersLocation> locations) {
  return locations
      .where((item) => item.state.isNotEmpty && item.districts.isNotEmpty)
      .map((item) => '${item.districts.join(', ')} (${item.state})')
      .join(' · ');
}

bool matchesPackersType(String stored, String wantedId) {
  final wanted = packersServiceById(wantedId);
  if (wanted == null) return true;
  final parts = stored.split(',').map((part) => part.trim().toLowerCase()).where((part) => part.isNotEmpty);
  if (wanted.id == 'other') {
    return parts.any((part) {
      final slug = part.replaceAll(' ', '-');
      return part == 'other' || !packersServiceTypes.any((item) => item.id != 'other' && (item.name.toLowerCase() == part || item.id == slug));
    });
  }
  return parts.any((part) => part == wanted.name.toLowerCase() || part == wanted.id || part.replaceAll(' ', '-') == wanted.id);
}
