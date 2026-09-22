import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'catalog.dart';

const _cacheKey = 'bookitall-enabled-services';

class ServiceCatalog {
  ServiceCatalog._();

  static final revision = ValueNotifier<int>(0);
  static Set<String>? _enabled;

  static Set<String> get enabledSlugs =>
      _enabled ?? {for (final service in services) service.id};

  static List<ServiceItem> get visible =>
      services.where((service) => isEnabled(service.id)).toList(growable: false);

  static List<BannerSlide> get visibleBanners => banners
      .where((banner) => banner.id == 'home' || isEnabled(banner.id))
      .toList(growable: false);

  static bool isEnabled(String id) {
    if (id == 'home') return true;
    final live = _enabled;
    if (live == null) return true;
    return live.contains(id);
  }

  static Future<void> restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getStringList(_cacheKey);
      if (cached != null && cached.isNotEmpty) {
        _enabled = cached.toSet();
        revision.value++;
      }
    } catch (_) {}
  }

  static Future<void> refresh() async {
    try {
      final rows = await fetchPlatformServices();
      if (rows.isEmpty) return;
      _enabled = {
        for (final row in rows)
          if (row['isEnabled'] != false) '${row['slug'] ?? row['id']}',
      }..removeWhere((id) => id.isEmpty);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_cacheKey, _enabled!.toList());
      revision.value++;
    } catch (_) {}
  }
}
