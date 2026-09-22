import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_lan_stub.dart' if (dart.library.io) 'api_lan_io.dart';
import 'booking.dart';
import 'catalog.dart';

const _requestTimeout = Duration(seconds: 8);
const _probeTimeout = Duration(milliseconds: 900);
String? _resolvedBase;

bool _isHttpUrl(String value) {
  return value.startsWith('http://') || value.startsWith('https://');
}

String? _dotenvApiUrl() {
  if (!dotenv.isInitialized) return null;
  final value = (dotenv.env['API_URL'] ?? '').trim();
  return _isHttpUrl(value) ? value.replaceAll(RegExp(r'/$'), '') : null;
}

Future<List<String>> _quickApiCandidates() async {
  const fromDefine = String.fromEnvironment('API_URL');
  final fromDotenv = _dotenvApiUrl();
  if (fromDefine.isNotEmpty) return [fromDefine];
  if (kIsWeb) return ['http://localhost:4000/api/v1'];
  return [
    if (fromDotenv != null) fromDotenv,
    'http://127.0.0.1:4000/api/v1',
    'http://localhost:4000/api/v1',
    'http://10.0.2.2:4000/api/v1',
    'http://192.168.137.1:4000/api/v1',
    'http://192.168.43.1:4000/api/v1',
  ];
}

Future<String?> _firstReachable(Iterable<String> bases) async {
  final completer = Completer<String?>();
  final seen = <String>{};
  var pending = 0;

  void tryBase(String base) {
    if (!_isHttpUrl(base) || !seen.add(base)) return;
    pending += 1;
    () async {
      final ok = await _reachable(base);
      if (ok && !completer.isCompleted) {
        completer.complete(base);
      }
      pending -= 1;
      if (pending == 0 && !completer.isCompleted) {
        completer.complete(null);
      }
    }();
  }

  for (final base in bases) {
    tryBase(base);
  }
  if (pending == 0) return null;
  return completer.future;
}

Uri _joinApi(String base, String path, [Map<String, String>? query]) {
  if (!_isHttpUrl(base) || path.contains('{') || path.contains('"')) {
    throw Exception('Cannot reach the Book It All server. Keep the phone on the same Wi-Fi as this PC, or keep USB connected.');
  }
  final root = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
  final suffix = path.startsWith('/') ? path : '/$path';
  late final Uri uri;
  try {
    uri = Uri.parse('$root$suffix');
  } catch (_) {
    throw Exception('Cannot reach the Book It All server. Keep the phone on the same Wi-Fi as this PC, or keep USB connected.');
  }
  if (query == null || query.isEmpty) return uri;
  return uri.replace(queryParameters: {...uri.queryParameters, ...query});
}

Future<bool> _reachable(String base) async {
  if (!_isHttpUrl(base)) return false;
  try {
    final response = await http.get(_joinApi(base, '/health')).timeout(_probeTimeout);
    return response.statusCode < 500;
  } catch (_) {
    return false;
  }
}

Never _unreachable() {
  throw Exception('Cannot reach the Book It All server. Keep the phone on the same Wi-Fi as this PC, or keep USB connected.');
}

Future<String> apiBaseUrl() async {
  if (_resolvedBase != null && _isHttpUrl(_resolvedBase!)) return _resolvedBase!;
  _resolvedBase = null;
  final prefs = await SharedPreferences.getInstance();
  final saved = prefs.getString('apiBaseUrl');
  if (saved != null && !_isHttpUrl(saved)) {
    await prefs.remove('apiBaseUrl');
  }

  final quick = [
    if (saved != null && _isHttpUrl(saved)) saved,
    ...await _quickApiCandidates(),
  ];
  var base = await _firstReachable(quick);
  base ??= await _firstReachable(await lanApiBases());
  if (base == null) _unreachable();

  _resolvedBase = base;
  await prefs.setString('apiBaseUrl', base);
  return base;
}

Map<String, dynamic> _asJsonMap(String body) {
  dynamic decoded = jsonDecode(body);
  if (decoded is String) {
    decoded = jsonDecode(decoded);
  }
  if (decoded is Map<String, dynamic>) return decoded;
  if (decoded is Map) return Map<String, dynamic>.from(decoded);
  throw Exception('Could not read server response');
}

Map<String, dynamic>? _dataMap(dynamic data) {
  if (data is Map<String, dynamic>) return data;
  if (data is Map) return Map<String, dynamic>.from(data);
  if (data is List && data.isNotEmpty) {
    final first = data.first;
    if (first is Map<String, dynamic>) return first;
    if (first is Map) return Map<String, dynamic>.from(first);
  }
  return null;
}

class SessionStore {
  static String? accessToken;
  static String? refreshToken;
  static String? userId;
  static String? fullName;
  static String? email;
  static String? phone;
  static String? nickname;
  static String? avatarUrl;
  static String? dateOfBirth;
  static String? gender;
  static String? personalAddress;
  static String? pincode;
  static double? addressLatitude;
  static double? addressLongitude;
  static String? profileStatus;
  static List<String> missingFields = [];

  static bool get isSignedIn => accessToken != null && accessToken!.isNotEmpty;

  static bool get isProfilePending {
    if (profileStatus == 'COMPLETE') return false;
    if (profileStatus == 'PENDING') return true;
    return computedMissingFields().isNotEmpty;
  }

  static String? _nonEmpty(String? value) =>
      value != null && value.trim().isNotEmpty ? value.trim() : null;

  static double? _double(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse('$value');
  }

  static List<String> computedMissingFields() {
    final missing = <String>[];
    if (_nonEmpty(fullName) == null) missing.add('fullName');
    if (_nonEmpty(phone) == null) missing.add('phone');
    if (_nonEmpty(nickname) == null) missing.add('nickname');
    if (_nonEmpty(email) == null) missing.add('email');
    if (_nonEmpty(avatarUrl) == null) missing.add('avatarUrl');
    if (_nonEmpty(dateOfBirth) == null) missing.add('dateOfBirth');
    if (_nonEmpty(gender) == null) missing.add('gender');
    if (_nonEmpty(personalAddress) == null) missing.add('personalAddress');
    if (!RegExp(r'^\d{6}$').hasMatch((pincode ?? '').replaceAll(RegExp(r'\D'), ''))) {
      missing.add('pincode');
    }
    return missing;
  }

  static Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    accessToken = _nonEmpty(prefs.getString('accessToken'));
    refreshToken = _nonEmpty(prefs.getString('refreshToken'));
    userId = _nonEmpty(prefs.getString('userId'));
    fullName = _nonEmpty(prefs.getString('fullName'));
    email = _nonEmpty(prefs.getString('email'));
    phone = _nonEmpty(prefs.getString('phone'));
    nickname = _nonEmpty(prefs.getString('nickname'));
    avatarUrl = _nonEmpty(prefs.getString('avatarUrl'));
    dateOfBirth = _nonEmpty(prefs.getString('dateOfBirth'));
    gender = _nonEmpty(prefs.getString('gender'));
    personalAddress = _nonEmpty(prefs.getString('personalAddress'));
    pincode = _nonEmpty(prefs.getString('pincode'));
    addressLatitude = _double(prefs.getString('addressLatitude'));
    addressLongitude = _double(prefs.getString('addressLongitude'));
    profileStatus = _nonEmpty(prefs.getString('profileStatus'));
    missingFields = (prefs.getString('missingFields') ?? '')
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  static Future<void> applyUser(Map<String, dynamic>? user) async {
    if (user == null) return;
    userId = user['id'] as String? ?? userId;
    fullName = user['fullName'] as String? ?? fullName;
    email = user['email'] as String? ?? email;
    phone = user['phone'] as String? ?? phone;
    nickname = user['nickname'] as String? ?? nickname;
    avatarUrl = user['avatarUrl'] as String? ?? avatarUrl;
    dateOfBirth = user['dateOfBirth'] as String? ?? dateOfBirth;
    gender = user['gender'] as String? ?? gender;
    personalAddress = user['personalAddress'] as String? ?? personalAddress;
    pincode = user['pincode'] as String? ?? pincode;
    addressLatitude = _double(user['addressLatitude']) ?? addressLatitude;
    addressLongitude = _double(user['addressLongitude']) ?? addressLongitude;
    profileStatus = user['profileStatus'] as String? ?? profileStatus;
    final rawMissing = user['missingFields'];
    if (rawMissing is List) {
      missingFields = rawMissing.map((item) => '$item').toList();
    }
    await _persistProfile();
  }

  static Future<void> applyAuth(Map<String, dynamic> data) async {
    final user = _dataMap(data['user']);
    accessToken = data['accessToken'] as String?;
    refreshToken = data['refreshToken'] as String?;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', accessToken ?? '');
    await prefs.setString('refreshToken', refreshToken ?? '');
    await applyUser(user);
  }

  static Future<void> _persistProfile() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userId', userId ?? '');
    await prefs.setString('fullName', fullName ?? '');
    await prefs.setString('email', email ?? '');
    await prefs.setString('phone', phone ?? '');
    await prefs.setString('nickname', nickname ?? '');
    await prefs.setString('avatarUrl', avatarUrl ?? '');
    await prefs.setString('dateOfBirth', dateOfBirth ?? '');
    await prefs.setString('gender', gender ?? '');
    await prefs.setString('personalAddress', personalAddress ?? '');
    await prefs.setString('pincode', pincode ?? '');
    await prefs.setString('addressLatitude', addressLatitude?.toString() ?? '');
    await prefs.setString('addressLongitude', addressLongitude?.toString() ?? '');
    await prefs.setString('profileStatus', profileStatus ?? '');
    await prefs.setString('missingFields', missingFields.join(','));
  }

  static Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
    userId = null;
    fullName = null;
    email = null;
    phone = null;
    nickname = null;
    avatarUrl = null;
    dateOfBirth = null;
    gender = null;
    personalAddress = null;
    pincode = null;
    addressLatitude = null;
    addressLongitude = null;
    profileStatus = null;
    missingFields = [];
    final prefs = await SharedPreferences.getInstance();
    for (final key in [
      'accessToken',
      'refreshToken',
      'userId',
      'fullName',
      'email',
      'phone',
      'nickname',
      'avatarUrl',
      'dateOfBirth',
      'gender',
      'personalAddress',
      'pincode',
      'addressLatitude',
      'addressLongitude',
      'profileStatus',
      'missingFields',
    ]) {
      await prefs.remove(key);
    }
    ClaimedCategories.clear();
  }
}

String _errorMessage(Map<String, dynamic> json, String fallback) {
  final message = json['message'];
  if (message is List) return message.join(', ');
  if (message is String && message.isNotEmpty) return message;
  return fallback;
}

MediaType _photoContentType(String path) {
  final ext = path.split('.').last.toLowerCase();
  return switch (ext) {
    'png' => MediaType('image', 'png'),
    'webp' => MediaType('image', 'webp'),
    'gif' => MediaType('image', 'gif'),
    'heic' => MediaType('image', 'heic'),
    'heif' => MediaType('image', 'heif'),
    _ => MediaType('image', 'jpeg'),
  };
}

Future<http.MultipartFile> _photoPart(String path) {
  return http.MultipartFile.fromPath('photos', path, contentType: _photoContentType(path));
}

Future<Map<String, dynamic>> _authPost(String path, Map<String, String> body) async {
  try {
    final base = await apiBaseUrl();
    final response = await http
        .post(
          _joinApi(base, path),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(_requestTimeout);
    final json = _asJsonMap(response.body);
    if (response.statusCode >= 400) {
      throw Exception(_errorMessage(json, 'Request failed'));
    }
    final data = _dataMap(json['data']) ?? json;
    await SessionStore.applyAuth(data);
    if (SessionStore.accessToken == null) {
      throw Exception('Could not sign in');
    }
    return data;
  } on TimeoutException {
    _resolvedBase = null;
    throw Exception('Server took too long. Keep USB connected or join the same Wi-Fi as this PC.');
  }
}

Future<void> registerVendor({
  required String fullName,
  required String email,
  required String phone,
  required String password,
}) {
  return _authPost('/auth/register', {
    'fullName': fullName,
    'email': email,
    'phone': phone,
    'password': password,
  });
}

Future<void> loginVendor(String email, String password) {
  return _authPost('/auth/login', {'email': email, 'password': password});
}

Future<void> continueWithPhone({
  required String fullName,
  required String phone,
  String? idToken,
  String? otp,
}) {
  return _authPost('/auth/phone', {
    'fullName': fullName,
    'phone': phone,
    if (idToken != null && idToken.isNotEmpty) 'idToken': idToken,
    if (otp != null && otp.isNotEmpty) 'otp': otp,
  });
}

Future<void> continueWithGoogle({
  required String fullName,
  required String email,
  String? phone,
}) {
  return _authPost('/auth/google', {
    'fullName': fullName,
    'email': email,
    if (phone != null && phone.isNotEmpty) 'phone': phone,
  });
}

Future<bool> _refreshAccessToken() async {
  final userId = SessionStore.userId;
  final refresh = SessionStore.refreshToken;
  if (userId == null || refresh == null) return false;
  try {
    final base = await apiBaseUrl();
    final response = await http
        .post(
          _joinApi(base, '/auth/refresh'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'userId': userId, 'refreshToken': refresh}),
        )
        .timeout(const Duration(seconds: 6));
    if (response.statusCode >= 400) return false;
    final json = _asJsonMap(response.body);
    final data = _dataMap(json['data']) ?? json;
    await SessionStore.applyAuth(data);
    return SessionStore.isSignedIn;
  } catch (_) {
    return false;
  }
}

Future<int?> _fetchMe() async {
  try {
    final base = await apiBaseUrl();
    final response = await http
        .get(
          _joinApi(base, '/auth/me'),
          headers: {'Authorization': 'Bearer ${SessionStore.accessToken}'},
        )
        .timeout(const Duration(seconds: 4));
    if (response.statusCode == 200) {
      final json = _asJsonMap(response.body);
      final user = _dataMap(json['data']) ?? json;
      await SessionStore.applyAuth({
        'accessToken': SessionStore.accessToken,
        'refreshToken': SessionStore.refreshToken,
        'user': user,
      });
    }
    return response.statusCode;
  } catch (_) {
    return null;
  }
}

Future<bool> restoreSession() async {
  await SessionStore.restore();
  if (!SessionStore.isSignedIn) return false;

  final status = await _fetchMe();
  if (status == 200) return true;

  if (status == 401 || status == 403) {
    final refreshed = await _refreshAccessToken();
    if (refreshed) {
      final again = await _fetchMe();
      if (again == 200 || again == null) return true;
    }
    await SessionStore.clear();
    return false;
  }

  // Phone cannot reach API yet (USB / Wi-Fi). Keep the saved login.
  return true;
}

Future<String?> profilePhotoUrl() async {
  final src = SessionStore.avatarUrl;
  if (src == null || src.isEmpty) return null;
  if (src.startsWith('http')) return src;
  final base = await apiBaseUrl();
  return '${base.replaceAll(RegExp(r'/api/v1/?$'), '')}$src';
}

Future<void> updateMyProfile(Map<String, dynamic> body) async {
  final token = SessionStore.accessToken;
  if (token == null) throw Exception('Sign in again');
  final base = await apiBaseUrl();
  final response = await http
      .patch(
        _joinApi(base, '/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      )
      .timeout(_requestTimeout);
  final json = _asJsonMap(response.body);
  if (response.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not save profile'));
  }
  await SessionStore.applyUser(_dataMap(json['data']) ?? json);
}

Future<void> uploadProfilePhoto(String path) async {
  final token = SessionStore.accessToken;
  if (token == null) throw Exception('Sign in again');
  final base = await apiBaseUrl();
  final request = http.MultipartRequest('POST', _joinApi(base, '/auth/me/avatar'));
  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('photo', path, contentType: _photoContentType(path)));
  final streamed = await request.send().timeout(const Duration(seconds: 20));
  final response = await http.Response.fromStream(streamed);
  final json = _asJsonMap(response.body);
  if (response.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not upload photo'));
  }
  await SessionStore.applyUser(_dataMap(json['data']) ?? json);
}

Future<Map<String, dynamic>> submitHotelListing({
  required String hotelName,
  required String mobileNumber,
  required String hotelType,
  required String roomType,
  required String location,
  required String price,
  required String priceUnit,
  String? entryPrice,
  required String checkInTime,
  required String checkOutTime,
  List<String> photoPaths = const [],
  double? latitude,
  double? longitude,
  Map<String, String> extraFields = const {},
}) async {
  final token = SessionStore.accessToken;
  if (token == null) {
    throw Exception('Please sign in first');
  }

  final request = http.MultipartRequest('POST', _joinApi(await apiBaseUrl(), '/hotels/listings'));
  request.headers['Authorization'] = 'Bearer $token';
  request.fields.addAll({
    'hotelName': hotelName,
    'mobileNumber': mobileNumber,
    'hotelType': hotelType,
    'roomType': roomType,
    'location': location,
    'listedBy': SessionStore.fullName ?? hotelName,
    'price': price,
    'priceUnit': priceUnit == 'Per Day' ? 'PER_DAY' : 'PER_ROOM',
    'checkInTime': checkInTime,
    'checkOutTime': checkOutTime,
  });
  if (latitude != null) request.fields['latitude'] = latitude.toString();
  if (longitude != null) request.fields['longitude'] = longitude.toString();
  if (entryPrice != null && entryPrice.trim().isNotEmpty) {
    request.fields['entryPrice'] = entryPrice.trim();
  }
  extraFields.forEach((key, value) {
    if (value.trim().isNotEmpty) request.fields[key] = value;
  });
  for (final path in photoPaths) {
    request.files.add(await _photoPart(path));
  }

  final streamed = await request.send().timeout(const Duration(seconds: 20));
  final body = await streamed.stream.bytesToString();
  final json = jsonDecode(body) as Map<String, dynamic>;
  if (streamed.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not save hotel'));
  }
  ClaimedCategories.mark('hotels');
  return (json['data'] as Map<String, dynamic>?) ?? json;
}

String priceUnitCode(String label) {
  const units = {
    'Per KM': 'PER_KM',
    'Per Day': 'PER_DAY',
    'Per Trip': 'PER_TRIP',
    'Per Service': 'PER_SERVICE',
    'Per Visit': 'PER_VISIT',
    'Per Hour': 'PER_HOUR',
    'Per Room': 'PER_ROOM',
    'Per Work': 'PER_WORK',
    'Per Sq.Ft': 'PER_SQFT',
    'Per Candidate': 'PER_CANDIDATE',
    'Monthly': 'MONTHLY',
  };
  return units[label] ?? label;
}

Future<Map<String, dynamic>> submitVendorListing({
  required String category,
  required Map<String, String> fields,
  List<String> photoPaths = const [],
  String? licensePath,
  Map<String, String> extraFiles = const {},
}) async {
  final token = SessionStore.accessToken;
  if (token == null) {
    throw Exception('Please sign in first');
  }

  final request = http.MultipartRequest('POST', _joinApi(await apiBaseUrl(), '/vendor-listings/$category'));
  request.headers['Authorization'] = 'Bearer $token';
  request.fields.addAll(fields);
  if (SessionStore.fullName != null && SessionStore.fullName!.isNotEmpty) {
    request.fields['listedBy'] = SessionStore.fullName!;
  }
  for (final path in photoPaths) {
    request.files.add(await _photoPart(path));
  }
  if (licensePath != null && licensePath.isNotEmpty) {
    request.files.add(await http.MultipartFile.fromPath('license', licensePath, contentType: _photoContentType(licensePath)));
  }
  for (final entry in extraFiles.entries) {
    if (entry.value.isEmpty) continue;
    request.files.add(await http.MultipartFile.fromPath(entry.key, entry.value, contentType: _photoContentType(entry.value)));
  }

  final streamed = await request.send().timeout(const Duration(seconds: 20));
  final body = await streamed.stream.bytesToString();
  final json = jsonDecode(body) as Map<String, dynamic>;
  if (streamed.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not save listing'));
  }
  ClaimedCategories.mark(category);
  return (json['data'] as Map<String, dynamic>?) ?? json;
}

class PostsRefresh {
  static final revision = ValueNotifier<int>(0);
  static void bump() => revision.value++;
}

class ClaimedCategories {
  ClaimedCategories._();

  static final revision = ValueNotifier<int>(0);
  static Set<String> slugs = {};

  static bool has(String id) => slugs.contains(id);

  static void mark(String id) {
    if (id.isEmpty || slugs.contains(id)) return;
    slugs = {...slugs, id};
    revision.value++;
  }

  static void clear() {
    if (slugs.isEmpty) return;
    slugs = {};
    revision.value++;
  }

  static Future<void> refresh() async {
    if (!SessionStore.isSignedIn) {
      clear();
      return;
    }
    try {
      final next = await fetchClaimedCategories();
      if (setEquals(slugs, next)) return;
      slugs = next;
      revision.value++;
    } catch (_) {}
  }
}

class ShellTab {
  static const posts = 1;
  static const addService = 2;
  static const bookings = 4;
  static final index = ValueNotifier<int?>(null);
  static void goToPosts() => index.value = posts;
  static void goToAddService() => index.value = addService;
  static void goToBookings() => index.value = bookings;
}

class BookingsRefresh {
  static final revision = ValueNotifier<int>(0);
  static void bump() => revision.value++;
}

Future<List<CustomerAd>> fetchVendorPosts({String category = 'all'}) async {
  final token = SessionStore.accessToken;
  if (token == null) return const [];
  final base = await apiBaseUrl();
  final response = await http
      .get(
        _joinApi(base, '/vendor-listings/mine', category == 'all' ? null : {'category': category}),
        headers: {'Authorization': 'Bearer $token'},
      )
      .timeout(const Duration(seconds: 8));
  return _parseAds(response, base);
}

Future<Set<String>> fetchClaimedCategories() async {
  if (!SessionStore.isSignedIn) return {};
  final json = await _apiSend('GET', '/vendor-listings/claimed-categories');
  final data = json['data'];
  if (data is! List) return {};
  return {
    for (final row in data)
      if (row is String && row.isNotEmpty) row,
  };
}

Future<List<Map<String, dynamic>>> fetchPlatformServices() async {
  final json = await _apiSend('GET', '/services');
  final data = json['data'];
  if (data is! List) return const [];
  return [
    for (final row in data)
      if (row is Map)
        row.map((key, value) => MapEntry('$key', value)),
  ];
}

Future<List<CustomerAd>> fetchNearbyListings({
  required String category,
  double? lat,
  double? lng,
  String? city,
}) async {
  final base = await apiBaseUrl();
  final params = <String, String>{
    if (category != 'all') 'category': category,
    if (lat != null) 'lat': lat.toString(),
    if (lng != null) 'lng': lng.toString(),
    if (city != null && city.isNotEmpty) 'city': city,
  };
  final uri = _joinApi(base, '/vendor-listings', params.isEmpty ? null : params);
  final response = await http.get(uri).timeout(const Duration(seconds: 8));
  return _parseAds(response, base);
}

double _asDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse('$value') ?? 0;
}

bool _asBool(dynamic value) => value == true || value == 'true' || value == 1;

Map<String, String> _authHeaders({bool json = true}) {
  return {
    if (json) 'Content-Type': 'application/json',
    if (SessionStore.accessToken != null) 'Authorization': 'Bearer ${SessionStore.accessToken}',
  };
}

Future<Map<String, dynamic>> _apiSend(
  String method,
  String path, {
  Object? body,
  Map<String, String>? query,
  Duration? timeout,
}) async {
  final uri = _joinApi(await apiBaseUrl(), path, query);
  final headers = _authHeaders();
  final encoded = body == null ? null : jsonEncode(body);
  final wait = timeout ?? _requestTimeout;
  late final http.Response response;
  switch (method) {
    case 'POST':
      response = await http.post(uri, headers: headers, body: encoded).timeout(wait);
    case 'PATCH':
      response = await http.patch(uri, headers: headers, body: encoded).timeout(wait);
    default:
      response = await http.get(uri, headers: headers).timeout(wait);
  }
  final json = _asJsonMap(response.body);
  if (response.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Request failed'));
  }
  return json;
}

class ListingField {
  const ListingField({this.key = '', required this.label, required this.value});
  final String key;
  final String label;
  final String value;
}

class ListingDetailData {
  const ListingDetailData({
    required this.ad,
    this.mobileNumber = '',
    this.description = '',
    this.price = '',
    this.priceUnit = '',
    this.unitPrice = 0,
    this.bookable = false,
    this.isOwner = false,
    this.photoUrls = const [],
    this.details = const [],
  });

  final CustomerAd ad;
  final String mobileNumber;
  final String description;
  final String price;
  final String priceUnit;
  final double unitPrice;
  final bool bookable;
  final bool isOwner;
  final List<String> photoUrls;
  final List<ListingField> details;
}

Future<ListingDetailData> fetchListingDetail(String id) async {
  if (id.contains('{') || id.contains('"') || id.length > 80) {
    throw Exception('Listing not found');
  }
  final base = await apiBaseUrl();
  final headers = <String, String>{};
  if (SessionStore.accessToken != null) {
    headers['Authorization'] = 'Bearer ${SessionStore.accessToken}';
  }
  final response = await http.get(_joinApi(base, '/vendor-listings/$id'), headers: headers).timeout(const Duration(seconds: 8));
  final json = _asJsonMap(response.body);
  if (response.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not load listing'));
  }
  final row = _dataMap(json['data']) ?? json;
  final origin = base.replaceAll('/api/v1', '');
  final ads = _parseAds(
    http.Response(jsonEncode({'data': [row]}), 200),
    base,
  );
  final photos = <String>[];
  final rawPhotos = row['photoUrls'];
  if (rawPhotos is List) {
    for (final item in rawPhotos) {
      final src = '$item';
      if (src.startsWith('/uploads/')) photos.add('$origin$src');
    }
  }
  final details = <ListingField>[];
  final rawDetails = row['details'];
  if (rawDetails is List) {
    for (final item in rawDetails) {
      if (item is Map && '${item['value'] ?? ''}'.isNotEmpty) {
        details.add(ListingField(key: '${item['key'] ?? ''}', label: '${item['label'] ?? item['key']}', value: '${item['value']}'));
      }
    }
  }
  return ListingDetailData(
    ad: ads.isNotEmpty
        ? ads.first
        : CustomerAd(id: id, categoryId: '', category: '', title: '', vendor: '', location: '', image: '', route: ''),
    mobileNumber: '${row['mobileNumber'] ?? ''}',
    description: '${row['description'] ?? ''}',
    price: '${row['price'] ?? ''}',
    priceUnit: '${row['priceUnit'] ?? ''}',
    unitPrice: _asDouble(row['unitPrice'] ?? row['price']),
    bookable: _asBool(row['bookable']),
    isOwner: _asBool(row['isOwner']) || '${row['partnerId'] ?? ''}' == (SessionStore.userId ?? ''),
    photoUrls: photos,
    details: details,
  );
}

Future<void> submitListingReport({
  required String listingId,
  required String listingTitle,
  required String reason,
  required String message,
  String? name,
  String? phone,
}) async {
  final who = (name ?? SessionStore.fullName ?? '').trim();
  final mobile = (phone ?? SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
  if (who.length < 2) throw Exception('Add your name.');
  if (mobile.length != 10 && (SessionStore.phone ?? '').isEmpty) {
    throw Exception('Add a 10-digit mobile number.');
  }
  final subject = '$reason · $listingTitle';
  await _apiSend('POST', '/support/tickets', body: {
    'name': who,
    'phone': mobile.isNotEmpty ? mobile : (SessionStore.phone ?? ''),
    'email': SessionStore.email ?? '',
    'topic': 'Listing report',
    'subject': subject.length > 180 ? subject.substring(0, 180) : subject,
    'message': '$message\n\nListing: $listingTitle\nID: $listingId',
    'bookingRef': listingId.length > 64 ? listingId.substring(0, 64) : listingId,
  });
}


List<CustomerAd> _parseAds(http.Response response, String base) {
  final json = _asJsonMap(response.body);
  if (response.statusCode >= 400) {
    throw Exception(_errorMessage(json, 'Could not load listings'));
  }
  final data = json['data'];
  if (data is! List) return const [];
  final origin = base.replaceAll('/api/v1', '');
  return [
    for (final item in data)
      if (item is Map)
        CustomerAd(
          id: '${item['id']}',
          categoryId: '${item['categoryId'] ?? ''}',
          category: '${item['category'] ?? ''}',
          title: '${item['title'] ?? ''}',
          vendor: '${item['vendor'] ?? ''}',
          location: '${item['location'] ?? ''}',
          status: '${item['status'] ?? ''}',
          distanceKm: item['distanceKm'] is num ? (item['distanceKm'] as num).toDouble() : null,
          priceLabel: '${item['priceLabel'] ?? ''}',
          vehicleType: '${item['vehicleType'] ?? ''}',
          serviceType: '${item['serviceType'] ?? ''}',
          loadCapacity: '${item['loadCapacity'] ?? ''}',
          image: () {
            final image = '${item['image'] ?? ''}';
            if (image.startsWith('http://') || image.startsWith('https://')) return image;
            if (image.startsWith('/uploads/')) return '$origin$image';
            return image;
          }(),
          route: '${item['href'] ?? '/'}',
        ),
  ];
}

String _detailString(Map<String, dynamic> details, List<String> keys) {
  for (final key in keys) {
    final value = '${details[key] ?? ''}'.trim();
    if (value.isNotEmpty) return value;
  }
  return '';
}

BookingSummary _bookingSummary(Map<String, dynamic> row) {
  final details = _dataMap(row['details']) ?? {};
  return BookingSummary(
    id: '${row['id'] ?? ''}',
    bookingNumber: '${row['bookingNumber'] ?? ''}',
    status: '${row['status'] ?? ''}',
    total: '${row['total'] ?? ''}',
    type: '${row['type'] ?? ''}',
    title: _detailString(details, ['listingTitle', 'hotelName', 'tourName', 'serviceName', 'vehicleName']).ifEmpty('${row['type'] ?? 'Booking'}'),
    address: _detailString(details, ['address', 'pickupAddress']),
    scheduledAt: row['scheduledAt']?.toString(),
    createdAt: row['createdAt']?.toString(),
  );
}

Future<BookingQuote> quoteBooking(BookingDraft draft) async {
  final json = await _apiSend('POST', '/bookings/quote', body: {'items': [draft.toCheckoutItem()]});
  final data = _dataMap(json['data']) ?? json;
  return BookingQuote(
    subtotal: _asDouble(data['subtotal']),
    tax: _asDouble(data['tax']),
    total: _asDouble(data['total']),
    currency: '${data['currency'] ?? 'INR'}',
  );
}

class WalletInfo {
  const WalletInfo({required this.available, required this.pending});
  final double available;
  final double pending;
}

class WalletTx {
  const WalletTx({
    required this.id,
    required this.type,
    required this.reason,
    required this.amount,
    required this.balanceAfter,
    this.note,
    this.createdAt,
  });
  final String id;
  final String type;
  final String reason;
  final double amount;
  final double balanceAfter;
  final String? note;
  final String? createdAt;
}

WalletInfo _walletFrom(Map<String, dynamic> data) {
  return WalletInfo(
    available: _asDouble(data['availableBalance'] ?? data['balance']),
    pending: _asDouble(data['pendingBalance']),
  );
}

Future<double> fetchWalletBalance() async {
  final wallet = await fetchWallet();
  return wallet.available;
}

Future<WalletInfo> fetchWallet() async {
  final json = await _apiSend('GET', '/wallet');
  final data = _dataMap(json['data']) ?? json;
  return _walletFrom(data);
}

Future<double> topUpWallet(num amount) async {
  final json = await _apiSend('POST', '/wallet/topup', body: {'amount': amount});
  final data = _dataMap(json['data']) ?? json;
  return _asDouble(data['availableBalance'] ?? data['balance']);
}

Future<List<WalletTx>> fetchWalletTransactions() async {
  final json = await _apiSend('GET', '/wallet/transactions', query: {'limit': '50'});
  final data = json['data'];
  if (data is! List) return const [];
  return [
    for (final row in data)
      if (row is Map)
        WalletTx(
          id: '${row['id']}',
          type: '${row['type'] ?? ''}',
          reason: '${row['reason'] ?? ''}',
          amount: _asDouble(row['amount']),
          balanceAfter: _asDouble(row['balanceAfter']),
          note: row['note'] == null ? null : '${row['note']}',
          createdAt: row['createdAt'] == null ? null : '${row['createdAt']}',
        ),
  ];
}

Future<CheckoutResult> checkoutBooking({
  required BookingDraft draft,
  required String method,
  required String address,
  String? upiId,
  String? cardNumber,
  String? cardHolder,
  String? cardExpiry,
  String? bankCode,
}) async {
  final json = await _apiSend(
    'POST',
    '/bookings/checkout',
    body: {
      'items': [draft.toCheckoutItem(address)],
      'method': method,
      'address': address.trim(),
      'customerName': SessionStore.fullName,
      'customerPhone': SessionStore.phone,
      'pay': true,
      if (upiId != null && upiId.isNotEmpty) 'upiId': upiId,
      if (cardNumber != null && cardNumber.isNotEmpty) 'cardNumber': cardNumber,
      if (cardHolder != null && cardHolder.isNotEmpty) 'cardHolder': cardHolder,
      if (cardExpiry != null && cardExpiry.isNotEmpty) 'cardExpiry': cardExpiry,
      if (bankCode != null && bankCode.isNotEmpty) 'bankCode': bankCode,
    },
    timeout: const Duration(seconds: 20),
  );
  final data = _dataMap(json['data']) ?? json;
  final rows = data['bookings'];
  return CheckoutResult(
    bookings: [
      if (rows is List)
        for (final row in rows)
          if (row is Map) _bookingSummary(Map<String, dynamic>.from(row)),
    ],
    total: _asDouble(data['total']),
    paid: data['paid'] == true,
    currency: '${data['currency'] ?? 'INR'}',
    method: data['method']?.toString(),
    payAfterService: data['payAfterService'] == true,
  );
}

Future<List<BookingSummary>> fetchMyBookings() async {
  final json = await _apiSend('GET', '/bookings', query: {'scope': 'mine', 'limit': '30'});
  final data = json['data'];
  if (data is! List) return const [];
  return [
    for (final row in data)
      if (row is Map) _bookingSummary(Map<String, dynamic>.from(row)),
  ];
}

Future<BookingSummary> fetchBooking(String id) async {
  final json = await _apiSend('GET', '/bookings/$id');
  final data = _dataMap(json['data']) ?? json;
  return _bookingSummary(data);
}

extension on String {
  String ifEmpty(String fallback) => trim().isEmpty ? fallback : this;
}


