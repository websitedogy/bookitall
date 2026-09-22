import 'package:flutter/material.dart';

class GoodsTransportType {
  const GoodsTransportType({
    required this.id,
    required this.name,
    required this.icon,
    required this.tint,
    required this.iconColor,
    required this.needsPermit,
  });

  final String id;
  final String name;
  final IconData icon;
  final Color tint;
  final Color iconColor;
  final bool needsPermit;
}

const goodsTransportTypes = [
  GoodsTransportType(
    id: 'tata-ace',
    name: 'Tata Ace',
    icon: Icons.local_shipping_outlined,
    tint: Color(0xFFFEF3C7),
    iconColor: Color(0xFFB45309),
    needsPermit: false,
  ),
  GoodsTransportType(
    id: 'mini-lorry',
    name: 'Mini Lorry',
    icon: Icons.fire_truck_outlined,
    tint: Color(0xFFFFEDD5),
    iconColor: Color(0xFFC2410C),
    needsPermit: false,
  ),
  GoodsTransportType(
    id: 'light-truck',
    name: 'Light Truck',
    icon: Icons.local_shipping,
    tint: Color(0xFFDBEAFE),
    iconColor: Color(0xFF1D4ED8),
    needsPermit: true,
  ),
  GoodsTransportType(
    id: 'medium-truck',
    name: 'Medium Truck',
    icon: Icons.airport_shuttle,
    tint: Color(0xFFE0E7FF),
    iconColor: Color(0xFF4338CA),
    needsPermit: true,
  ),
  GoodsTransportType(
    id: 'heavy-truck',
    name: 'Heavy Truck',
    icon: Icons.fire_truck,
    tint: Color(0xFFDCFCE7),
    iconColor: Color(0xFF15803D),
    needsPermit: true,
  ),
  GoodsTransportType(
    id: 'other',
    name: 'Other',
    icon: Icons.inventory_2_outlined,
    tint: Color(0xFFF1F5F9),
    iconColor: Color(0xFF475569),
    needsPermit: true,
  ),
];

GoodsTransportType? goodsTransportTypeById(String? id) {
  if (id == null || id.isEmpty) return null;
  final wanted = id.trim().toLowerCase();
  for (final item in goodsTransportTypes) {
    if (item.id == wanted || item.name.toLowerCase() == wanted || item.name.toLowerCase().replaceAll(' ', '-') == wanted) {
      return item;
    }
  }
  return null;
}

bool matchesGoodsType(String stored, String wantedId) {
  final wanted = wantedId.trim().toLowerCase();
  final value = stored.trim().toLowerCase();
  if (wanted.isEmpty) return true;
  if (wanted == 'other') {
    return !goodsTransportTypes.any((item) => item.id != 'other' && (value == item.name.toLowerCase() || value == item.id));
  }
  final type = goodsTransportTypeById(wanted);
  return value == wanted || value == (type?.name.toLowerCase() ?? '') || value.replaceAll(' ', '-') == wanted;
}

final goodsYears = [
  for (var year = DateTime.now().year; year >= 1995; year--) '$year',
];
