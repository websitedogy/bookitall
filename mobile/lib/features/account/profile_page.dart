import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../../data/api.dart';
import '../../theme/app_colors.dart';
import '../auth/auth_page.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _nickname = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _pincode = TextEditingController();
  final _addressFocus = FocusNode();
  final _picker = ImagePicker();
  DateTime? _dob;
  String? _gender;
  double? _lat;
  double? _lng;
  String? _photoUrl;
  String? _error;
  bool _saving = false;
  bool _photoBusy = false;
  bool _locateBusy = false;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    _hydrate();
    restoreSession().then((_) {
      if (mounted) _hydrate();
    });
  }

  @override
  void dispose() {
    _nickname.dispose();
    _email.dispose();
    _address.dispose();
    _pincode.dispose();
    _addressFocus.dispose();
    super.dispose();
  }

  void _hydrate() {
    _nickname.text = SessionStore.nickname ?? '';
    _email.text = SessionStore.email ?? '';
    _address.text = SessionStore.personalAddress ?? '';
    _pincode.text = SessionStore.pincode ?? '';
    _gender = SessionStore.gender;
    _lat = SessionStore.addressLatitude;
    _lng = SessionStore.addressLongitude;
    _photoUrl = SessionStore.avatarUrl;
    final raw = SessionStore.dateOfBirth;
    if (raw != null && raw.length >= 10) {
      _dob = DateTime.tryParse(raw.substring(0, 10));
    }
    profilePhotoUrl().then((url) {
      if (mounted && url != null) setState(() => _photoUrl = url);
    });
    setState(() {});
  }

  List<String> get _missing {
    final missing = <String>[];
    if ((SessionStore.fullName ?? '').trim().isEmpty) missing.add('fullName');
    if ((SessionStore.phone ?? '').trim().isEmpty) missing.add('phone');
    if (_nickname.text.trim().isEmpty) missing.add('nickname');
    if (_email.text.trim().isEmpty) missing.add('email');
    if ((_photoUrl ?? SessionStore.avatarUrl ?? '').isEmpty) missing.add('avatarUrl');
    if (_dob == null) missing.add('dateOfBirth');
    if ((_gender ?? '').isEmpty) missing.add('gender');
    if (_address.text.trim().isEmpty) missing.add('personalAddress');
    if (!RegExp(r'^\d{6}$').hasMatch(_pincode.text.replaceAll(RegExp(r'\D'), ''))) missing.add('pincode');
    return missing;
  }

  bool _isMissing(String key) => _missing.contains(key);

  InputDecoration _decoration({required bool missing}) {
    return InputDecoration(
      filled: true,
      fillColor: missing ? const Color(0xFFFFFBEB) : Colors.white,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: missing ? const Color(0xFFFBBF24) : AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: missing ? const Color(0xFFD97706) : AppColors.primary),
      ),
    );
  }

  Future<void> _pickPhoto() async {
    setState(() => _photoBusy = true);
    try {
      final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (file == null) return;
      await uploadProfilePhoto(file.path);
      final url = await profilePhotoUrl();
      if (!mounted) return;
      setState(() => _photoUrl = url ?? SessionStore.avatarUrl);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _photoBusy = false);
    }
  }

  Future<void> _pickLocation() async {
    setState(() => _locateBusy = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('Allow location access, or enter your address manually.');
      }
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      final resolved = await _reverseAddress(position.latitude, position.longitude);
      if (!mounted) return;
      setState(() {
        if (resolved != null) _address.text = resolved;
        if (_pincode.text.isEmpty && resolved != null) {
          final pin = RegExp(r'\b(\d{6})\b').firstMatch(resolved)?.group(1);
          if (pin != null) _pincode.text = pin;
        }
        _lat = position.latitude;
        _lng = position.longitude;
      });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _locateBusy = false);
    }
  }

  Future<String?> _reverseAddress(double lat, double lon) async {
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
    final display = json['display_name'] as String?;
    final address = json['address'];
    if (display != null && display.trim().isNotEmpty) return display.trim();
    if (address is Map<String, dynamic>) {
      return [
        address['road'],
        address['suburb'],
        address['city'] ?? address['town'] ?? address['village'],
        address['state'],
        address['postcode'],
      ].whereType<String>().where((part) => part.trim().isNotEmpty).join(', ');
    }
    return null;
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
      _saved = false;
    });
    try {
      await updateMyProfile({
        'nickname': _nickname.text.trim(),
        'email': _email.text.trim(),
        'dateOfBirth': _dob == null ? null : _dob!.toIso8601String().substring(0, 10),
        'gender': _gender,
        'personalAddress': _address.text.trim(),
        'pincode': _pincode.text.replaceAll(RegExp(r'\D'), ''),
        'addressLatitude': _lat,
        'addressLongitude': _lng,
      });
      if (!mounted) return;
      setState(() => _saved = true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionStore.isSignedIn;
    final pending = _missing.isNotEmpty;
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          Row(
            children: [
              const Text('My Profile', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
              if (pending) ...[const SizedBox(width: 8), const PendingDot()],
            ],
          ),
          const SizedBox(height: 16),
          if (!signedIn)
            FilledButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AuthPage()));
              },
              child: const Text('Sign in'),
            )
          else ...[
            _photoCard(),
            const SizedBox(height: 16),
            _label('Nick name', missing: _isMissing('nickname')),
            TextField(
              controller: _nickname,
              decoration: _decoration(missing: _isMissing('nickname')),
              onChanged: (_) => setState(() {}),
            ),
            _label('Email', missing: _isMissing('email')),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: _decoration(missing: _isMissing('email')),
              onChanged: (_) => setState(() {}),
            ),
            _label('Date of birth', missing: _isMissing('dateOfBirth')),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dob ?? DateTime(2000, 1, 1),
                  firstDate: DateTime(1920),
                  lastDate: DateTime.now(),
                );
                if (picked != null) setState(() => _dob = picked);
              },
              child: InputDecorator(
                decoration: _decoration(missing: _isMissing('dateOfBirth')),
                child: Text(
                  _dob == null ? '' : '${_dob!.year}-${_two(_dob!.month)}-${_two(_dob!.day)}',
                ),
              ),
            ),
            _label('Gender', missing: _isMissing('gender')),
            Row(
              children: [
                for (final option in const [('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')])
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(option.$2),
                        selected: _gender == option.$1,
                        onSelected: (_) => setState(() => _gender = option.$1),
                        selectedColor: AppColors.primarySoft,
                      ),
                    ),
                  ),
              ],
            ),
            _label('Address', missing: _isMissing('personalAddress')),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _locateBusy ? null : _pickLocation,
                    icon: const Icon(Icons.my_location, size: 16),
                    label: Text(_locateBusy ? 'Detecting…' : 'Current location'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _addressFocus.requestFocus(),
                    icon: const Icon(Icons.edit_location_alt_outlined, size: 16),
                    label: const Text('Enter manually'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _address,
              focusNode: _addressFocus,
              minLines: 2,
              maxLines: 4,
              decoration: _decoration(missing: _isMissing('personalAddress')),
              onChanged: (value) {
                final pin = RegExp(r'\b(\d{6})\b').firstMatch(value)?.group(1);
                if (pin != null && _pincode.text.isEmpty) _pincode.text = pin;
                setState(() {});
              },
            ),
            _label('Pincode', missing: _isMissing('pincode')),
            TextField(
              controller: _pincode,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: _decoration(missing: _isMissing('pincode')).copyWith(counterText: ''),
              onChanged: (_) => setState(() {}),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C))),
            ],
            if (_saved) ...[
              const SizedBox(height: 8),
              const Text('Profile saved.', style: TextStyle(color: Color(0xFF047857))),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Saving…' : 'Save'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _photoCard() {
    final missing = _isMissing('avatarUrl');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: missing ? const Color(0xFFFBBF24) : AppColors.border),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _photoBusy ? null : _pickPhoto,
            child: CircleAvatar(
              radius: 36,
              backgroundColor: AppColors.primary,
              backgroundImage: _avatarImage(),
              child: _avatarImage() == null
                  ? Text(
                      ((SessionStore.fullName ?? '?').trim().isEmpty ? '?' : SessionStore.fullName!.trim()[0]).toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                    )
                  : null,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(SessionStore.fullName ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                Text(SessionStore.phone ?? '', style: const TextStyle(color: AppColors.textMuted)),
                if (_photoBusy || missing)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      _photoBusy ? 'Uploading…' : 'Photo required',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  ImageProvider? _avatarImage() {
    final src = _photoUrl;
    if (src == null || src.isEmpty) return null;
    if (src.startsWith('http')) return NetworkImage(src);
    if (!kIsWeb && (src.startsWith('/') || src.contains(':'))) {
      final file = File(src);
      if (file.existsSync()) return FileImage(file);
    }
    return null;
  }

  Widget _label(String text, {required bool missing}) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 6),
      child: Row(
        children: [
          Text(text.toUpperCase(), style: const TextStyle(fontSize: 11, letterSpacing: 1.2, color: AppColors.textMuted, fontWeight: FontWeight.w700)),
          if (missing) ...[
            const Spacer(),
            const Text('REQUIRED', style: TextStyle(fontSize: 10, color: Color(0xFFB45309), fontWeight: FontWeight.w700)),
          ],
        ],
      ),
    );
  }
}

class PendingDot extends StatefulWidget {
  const PendingDot({super.key});

  @override
  State<PendingDot> createState() => _PendingDotState();
}

class _PendingDotState extends State<PendingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.35, end: 1).animate(_controller),
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(color: Color(0xFFF59E0B), shape: BoxShape.circle),
      ),
    );
  }
}

String _two(int value) => value.toString().padLeft(2, '0');
