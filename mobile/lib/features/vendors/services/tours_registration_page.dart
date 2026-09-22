import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'electrician_form_data.dart';
import 'listing_draft.dart';
import 'tours_form_data.dart';
import 'vendor_form_draft.dart';
import 'vendor_location_picker.dart';

class ToursRegistrationPage extends StatefulWidget {
  const ToursRegistrationPage({super.key});

  @override
  State<ToursRegistrationPage> createState() => _ToursRegistrationPageState();
}

class _ToursRegistrationPageState extends State<ToursRegistrationPage> {
  final _agency = TextEditingController();
  final _owner = TextEditingController();
  final _mobile = TextEditingController();
  final _location = TextEditingController();
  final _tourName = TextEditingController();
  final _pickup = TextEditingController();
  final _drop = TextEditingController();
  final _amount = TextEditingController();
  final _extraInfo = TextEditingController();
  final _places = <TextEditingController>[TextEditingController()];
  final _picker = ImagePicker();

  String _food = '';
  String _duration = '';
  String _licenseStatus = '';
  String _district = '';
  XFile? _licenseFile;
  final _photos = <XFile>[];
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';
  Timer? _saveTimer;

  @override
  void initState() {
    super.initState();
    _owner.text = SessionStore.fullName ?? '';
    _mobile.text = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    if (_mobile.text.length > 10) _mobile.text = _mobile.text.substring(_mobile.text.length - 10);
    for (final controller in [_agency, _owner, _mobile, _location, _tourName, _pickup, _drop, _amount, _extraInfo]) {
      controller.addListener(_scheduleSave);
    }
    _places.first.addListener(_scheduleSave);
    _restoreDraft();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    for (final controller in [_agency, _owner, _mobile, _location, _tourName, _pickup, _drop, _amount, _extraInfo, ..._places]) {
      controller.dispose();
    }
    super.dispose();
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), _persistDraft);
  }

  Future<void> _persistDraft() async {
    await VendorFormDraft.save('tours', {
      'agency': _agency.text,
      'owner': _owner.text,
      'mobile': _mobile.text,
      'location': _location.text,
      'tourName': _tourName.text,
      'places': _places.map((item) => item.text).toList(),
      'pickup': _pickup.text,
      'drop': _drop.text,
      'amount': _amount.text,
      'food': _food,
      'duration': _duration,
      'licenseStatus': _licenseStatus,
      'licensePath': _licenseFile?.path ?? '',
      'photos': _photos.map((file) => file.path).toList(),
      'extraInfo': _extraInfo.text,
      'district': _district,
      'lat': _lat,
      'lng': _lng,
    });
  }

  Future<void> _restoreDraft() async {
    final draft = await VendorFormDraft.load('tours');
    if (!mounted || draft.isEmpty) return;
    setState(() {
      _agency.text = draft['agency']?.toString() ?? _agency.text;
      _owner.text = (draft['owner']?.toString().isNotEmpty ?? false) ? draft['owner'].toString() : _owner.text;
      _mobile.text = (draft['mobile']?.toString().isNotEmpty ?? false) ? draft['mobile'].toString() : _mobile.text;
      _location.text = draft['location']?.toString() ?? '';
      _tourName.text = draft['tourName']?.toString() ?? '';
      _pickup.text = draft['pickup']?.toString() ?? '';
      _drop.text = draft['drop']?.toString() ?? '';
      _amount.text = draft['amount']?.toString() ?? '';
      _extraInfo.text = draft['extraInfo']?.toString() ?? '';
      _food = draft['food']?.toString() ?? '';
      _duration = draft['duration']?.toString() ?? '';
      _licenseStatus = draft['licenseStatus']?.toString() ?? '';
      _district = draft['district']?.toString() ?? '';
      _lat = (draft['lat'] as num?)?.toDouble();
      _lng = (draft['lng'] as num?)?.toDouble();
      final licensePath = draft['licensePath']?.toString() ?? '';
      if (licensePath.isNotEmpty) _licenseFile = XFile(licensePath);
      final photos = draft['photos'];
      if (photos is List) {
        _photos
          ..clear()
          ..addAll(photos.map((path) => XFile(path.toString())));
      }
      final places = draft['places'];
      if (places is List && places.isNotEmpty) {
        for (final controller in _places) {
          controller.dispose();
        }
        _places
          ..clear()
          ..addAll(places.map((place) {
            final controller = TextEditingController(text: place.toString());
            controller.addListener(_scheduleSave);
            return controller;
          }));
      }
    });
  }

  void _addPlace() {
    final controller = TextEditingController();
    controller.addListener(_scheduleSave);
    setState(() => _places.add(controller));
    _scheduleSave();
  }

  void _removePlace(int index) {
    if (_places.length <= 1) return;
    setState(() {
      _places[index].dispose();
      _places.removeAt(index);
    });
    _scheduleSave();
  }

  Future<void> _detect() async {
    final found = await pickVendorLocation(
      context,
      pinLabel: 'Tour location',
      initialLabel: _location.text,
      initialLat: _lat,
      initialLng: _lng,
    );
    if (!mounted || found == null) return;
    setState(() {
      _error = '';
      _location.text = found.label;
      _lat = found.lat;
      _lng = found.lng;
      if (found.district.isNotEmpty) _district = found.district;
    });
    _scheduleSave();
  }

  String? _validate() {
    if (_agency.text.trim().isEmpty) return 'Enter agency name.';
    if (_owner.text.trim().isEmpty) return 'Enter owner name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_location.text.trim().isEmpty) return 'Use current location, or enter the address.';
    if (_tourName.text.trim().isEmpty) return 'Enter tour name.';
    if (_places.every((place) => place.text.trim().isEmpty)) return 'Enter at least one place.';
    if (_pickup.text.trim().isEmpty) return 'Enter pickup point.';
    if (_drop.text.trim().isEmpty) return 'Enter drop point.';
    if (_amount.text.trim().isEmpty) return 'Enter package amount.';
    if (_food.isEmpty) return 'Select food option.';
    if (_licenseStatus.isEmpty) return 'Select license status.';
    if (_licenseStatus == 'Available' && _licenseFile == null) return 'Upload the travel license.';
    if (_photos.isEmpty) return 'Add at least one tour image.';
    return null;
  }

  Future<void> _submit() async {
    final message = _validate();
    if (message != null) {
      setState(() => _error = message);
      return;
    }
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final destinations = _places.map((place) => place.text.trim()).where((place) => place.isNotEmpty).join(', ');
      final amount = _amount.text.replaceAll(RegExp(r'\D'), '');
      ElectricianDistrict? info;
      for (final item in electricianDistricts) {
        if (item.name == _district) info = item;
      }
      await submitVendorListing(
        category: 'tours',
        fields: {
          'shopName': _agency.text.trim(),
          'businessName': _agency.text.trim(),
          'ownerName': _owner.text.trim(),
          'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
          'packageName': _tourName.text.trim(),
          'destinations': destinations,
          'pickupPoint': _pickup.text.trim(),
          'dropPoint': _drop.text.trim(),
          'pickupAvailable': 'Yes',
          'dropAvailable': 'Yes',
          'price': amount.isEmpty ? '0' : amount,
          'priceFrom': amount.isEmpty ? '0' : amount,
          'priceUnit': 'PER_PERSON',
          'food': _food,
          'inclusions': _food == 'Included' ? 'Food' : '',
          'duration': _duration,
          'tripDuration': _duration,
          'licenseStatus': _licenseStatus,
          'location': _location.text.trim(),
          'district': _district,
          'state': info?.state ?? '',
          'city': _district,
          'area': _location.text.trim(),
          if (_extraInfo.text.trim().isNotEmpty) 'description': _extraInfo.text.trim(),
          if (_lat != null) 'latitude': _lat.toString(),
          if (_lng != null) 'longitude': _lng.toString(),
        },
        photoPaths: _photos.map((file) => file.path).take(10).toList(),
        licensePath: _licenseFile?.path,
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: _agency.text.trim(), location: _location.text.trim()),
        ),
      );
    } catch (err) {
      setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() {
      _photos.addAll(picked);
      if (_photos.length > 10) _photos.removeRange(10, _photos.length);
    });
    _scheduleSave();
  }

  Future<void> _pickLicense() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() => _licenseFile = picked);
    _scheduleSave();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Tour Packages'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE6EBF1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _section(1, 'Agency Details'),
                _label('Agency Name', required: true),
                _field(_agency, hint: 'Enter agency name'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Owner Name', required: true),
                          _field(_owner, hint: 'Enter owner name'),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Mobile Number', required: true),
                          _field(_mobile, hint: 'Enter mobile number', keyboard: TextInputType.phone, digits: 10),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Current Location', required: true),
                if (_location.text.trim().isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(_location.text),
                  ),
                  TextButton(onPressed: _detecting ? null : _detect, child: Text(_detecting ? 'Detecting…' : 'Change location')),
                ] else
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: OutlinedButton.icon(
                      onPressed: _detecting ? null : _detect,
                      icon: const Icon(Icons.my_location, size: 18),
                      label: Text(_detecting ? 'Detecting…' : 'Use Current Location'),
                    ),
                  ),
                _section(2, 'Tour Details'),
                _label('Tour Name', required: true),
                _field(_tourName, hint: 'Enter tour name'),
                const SizedBox(height: 14),
                _label('Places', required: true),
                const SizedBox(height: 6),
                for (var i = 0; i < _places.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        SizedBox(width: 58, child: Text('Place ${i + 1}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted))),
                        Expanded(child: _field(_places[i], hint: 'Enter place')),
                        const SizedBox(width: 6),
                        if (_places.length > 1)
                          _iconBtn(Icons.remove, () => _removePlace(i), filled: false),
                        if (i == _places.length - 1) ...[
                          const SizedBox(width: 6),
                          _iconBtn(Icons.add, _addPlace, filled: true),
                        ],
                      ],
                    ),
                  ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Pickup Point', required: true),
                          _field(_pickup, hint: 'Enter pickup point'),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Drop Point', required: true),
                          _field(_drop, hint: 'Enter drop point'),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(3, 'Package Details'),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Package Amount', required: true),
                          _field(_amount, hint: '₹ Enter amount', keyboard: TextInputType.number, digits: 7),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Food', required: true),
                          _dropdown(_food, 'Select', tourFood, (value) {
                            setState(() => _food = value);
                            _scheduleSave();
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Trip Duration'),
                _dropdown(_duration, 'Select', tourDurations, (value) {
                  setState(() => _duration = value);
                  _scheduleSave();
                }),
                _section(4, 'Travel License'),
                _label('License Status', required: true),
                _dropdown(_licenseStatus, 'Select', tourLicenseStatus, (value) {
                  setState(() {
                    _licenseStatus = value;
                    if (value != 'Available') _licenseFile = null;
                  });
                  _scheduleSave();
                }),
                if (_licenseStatus == 'Available') ...[
                  const SizedBox(height: 14),
                  _label('License Document', required: true),
                  InkWell(
                    onTap: _pickLicense,
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFC5CED8), style: BorderStyle.solid),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.upload_file, size: 18, color: AppColors.textMuted),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _licenseFile?.name ?? 'Upload License',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.textMuted),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                _section(5, 'Tour Images'),
                _label('Add Images', required: true),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._photos.asMap().entries.map((entry) {
                      return GestureDetector(
                        onTap: () {
                          setState(() => _photos.removeAt(entry.key));
                          _scheduleSave();
                        },
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            width: 88,
                            height: 88,
                            child: FutureBuilder(
                              future: entry.value.readAsBytes(),
                              builder: (context, snap) {
                                if (!snap.hasData) return const ColoredBox(color: Color(0xFFF1F5F9));
                                return Image.memory(snap.data!, fit: BoxFit.cover);
                              },
                            ),
                          ),
                        ),
                      );
                    }),
                    if (_photos.length < 10)
                      InkWell(
                        onTap: _pickPhotos,
                        child: Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFC5CED8)),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add, color: AppColors.textMuted),
                              Text('Add Images', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                _section(6, 'Additional Information'),
                TextField(
                  controller: _extraInfo,
                  minLines: 3,
                  maxLines: 5,
                  decoration: _box().copyWith(hintText: 'Enter additional information'),
                ),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(_error, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
                ],
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    onPressed: _saving ? null : _submit,
                    child: Text(_saving ? 'Submitting…' : 'Submit Tour'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap, {required bool filled}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: filled ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: filled ? null : Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Icon(icon, color: filled ? Colors.white : AppColors.textMuted, size: 20),
      ),
    );
  }

  Widget _section(int n, String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 10),
      child: Text('$n. $title', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
    );
  }

  Widget _label(String text, {bool required = false}) {
    return Text.rich(
      TextSpan(
        text: text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        children: [if (required) const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFDC2626)))],
      ),
    );
  }

  InputDecoration _box() {
    return InputDecoration(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFD7DDE6))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFD7DDE6))),
    );
  }

  Widget _field(TextEditingController controller, {String? hint, TextInputType? keyboard, int? digits}) {
    return TextField(
      controller: controller,
      keyboardType: keyboard,
      inputFormatters: [if (digits != null) FilteringTextInputFormatter.digitsOnly, if (digits != null) LengthLimitingTextInputFormatter(digits)],
      decoration: _box().copyWith(hintText: hint),
    );
  }

  Widget _dropdown(String value, String hint, List<String> options, ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value.isEmpty ? null : value,
      hint: Text(hint),
      isExpanded: true,
      decoration: _box(),
      items: options.map((option) => DropdownMenuItem(value: option, child: Text(option, overflow: TextOverflow.ellipsis))).toList(),
      onChanged: (next) {
        if (next != null) onChanged(next);
      },
    );
  }
}
