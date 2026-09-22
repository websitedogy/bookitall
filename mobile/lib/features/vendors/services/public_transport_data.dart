import 'package:flutter/material.dart';

class PublicTransportType {
  const PublicTransportType({
    required this.id,
    required this.name,
    required this.icon,
    required this.tint,
    required this.iconColor,
    required this.seats,
  });

  final String id;
  final String name;
  final IconData icon;
  final Color tint;
  final Color iconColor;
  final String seats;
}

const publicTransportTypes = [
  PublicTransportType(
    id: 'auto',
    name: 'Auto',
    icon: Icons.local_taxi,
    tint: Color(0xFFFEF3C7),
    iconColor: Color(0xFFB45309),
    seats: '3',
  ),
  PublicTransportType(
    id: 'car',
    name: 'Car',
    icon: Icons.directions_car_filled,
    tint: Color(0xFFDBEAFE),
    iconColor: Color(0xFF0369A1),
    seats: '4',
  ),
  PublicTransportType(
    id: 'mini-bus',
    name: 'Mini Bus',
    icon: Icons.airport_shuttle,
    tint: Color(0xFFE0E7FF),
    iconColor: Color(0xFF4F46E5),
    seats: '12',
  ),
  PublicTransportType(
    id: 'bus',
    name: 'Bus',
    icon: Icons.directions_bus_filled,
    tint: Color(0xFFDCFCE7),
    iconColor: Color(0xFF15803D),
    seats: '40',
  ),
  PublicTransportType(
    id: 'van',
    name: 'Van',
    icon: Icons.airport_shuttle_outlined,
    tint: Color(0xFFF3E8FF),
    iconColor: Color(0xFF7C3AED),
    seats: '7',
  ),
];

const publicTransportServices = ['Local', 'Outstation'];

PublicTransportType? publicTransportTypeById(String? id) {
  if (id == null || id.isEmpty) return null;
  final wanted = id.trim().toLowerCase();
  for (final item in publicTransportTypes) {
    if (item.id == wanted || item.name.toLowerCase() == wanted) return item;
  }
  return null;
}

final manufacturingYears = [
  for (var year = DateTime.now().year; year >= 1995; year--) '$year',
];
