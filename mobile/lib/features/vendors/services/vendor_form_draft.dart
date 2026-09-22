import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/api.dart';

class VendorFormDraft {
  static String _key(String formId) => 'bookitall-vendor-form:$formId:${SessionStore.userId ?? 'guest'}';

  static Future<Map<String, dynamic>> load(String formId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(formId));
    if (raw == null || raw.isEmpty) return {};
    try {
      final parsed = jsonDecode(raw);
      return parsed is Map<String, dynamic> ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  static Future<void> save(String formId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key(formId), jsonEncode(data));
  }

  static Future<void> clear(String formId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(formId));
  }
}
