import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'cleaning_form_data.dart';
import 'listing_draft.dart';
import 'vendor_form_draft.dart';
import 'vendor_location_picker.dart';

class CleaningRegistrationPage extends StatefulWidget {
  const CleaningRegistrationPage({super.key});

  @override
  State<CleaningRegistrationPage> createState() => _CleaningRegistrationPageState();
}

class _CleanRow {
  _CleanRow({
    String name = '',
    String oneTimeAmount = '',
    String monthlyAmount = '',
    this.selected = false,
    this.locked = false,
    this.oneTime = false,
    this.monthly = false,
  })  : name = TextEditingController(text: name),
        oneTimeAmount = TextEditingController(text: oneTimeAmount),
        monthlyAmount = TextEditingController(text: monthlyAmount);

  final TextEditingController name;
  final TextEditingController oneTimeAmount;
  final TextEditingController monthlyAmount;
  bool selected;
  bool locked;
  bool oneTime;
  bool monthly;

  void dispose() {
    name.dispose();
    oneTimeAmount.dispose();
    monthlyAmount.dispose();
  }

  Map<String, dynamic> toJson() => {
        'name': name.text,
        'selected': selected,
        'locked': locked,
        'oneTime': oneTime,
        'oneTimeAmount': oneTimeAmount.text,
        'monthly': monthly,
        'monthlyAmount': monthlyAmount.text,
      };
}

class _CleaningRegistrationPageState extends State<CleaningRegistrationPage> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _location = TextEditingController();
  final _serviceKm = TextEditingController();
  final _items = <_CleanRow>[
    _CleanRow(name: 'House', locked: true),
    _CleanRow(name: 'Bathroom', locked: true),
    _CleanRow(name: 'Office', locked: true),
  ];
  final _photos = <XFile>[];
  final _picker = ImagePicker();
  double? _lat;
  double? _lng;
  String _district = '';
  bool _chargesDiscussed = false;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';
  Timer? _saveTimer;

  @override
  void initState() {
    super.initState();
    _name.text = SessionStore.fullName ?? '';
    _mobile.text = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    if (_mobile.text.length > 10) _mobile.text = _mobile.text.substring(_mobile.text.length - 10);
    for (final controller in [_name, _mobile, _location, _serviceKm]) {
      controller.addListener(_scheduleSave);
    }
    for (final item in _items) {
      _bindItem(item);
    }
    _restoreDraft();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    for (final controller in [_name, _mobile, _location, _serviceKm]) {
      controller.dispose();
    }
    for (final item in _items) {
      item.dispose();
    }
    super.dispose();
  }

  void _bindItem(_CleanRow item) {
    item.name.addListener(_scheduleSave);
    item.oneTimeAmount.addListener(_scheduleSave);
    item.monthlyAmount.addListener(_scheduleSave);
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), _persistDraft);
  }

  Future<void> _persistDraft() async {
    await VendorFormDraft.save('cleaning', {
      'name': _name.text,
      'mobile': _mobile.text,
      'location': _location.text,
      'serviceKm': _serviceKm.text,
      'district': _district,
      'lat': _lat,
      'lng': _lng,
      'items': _items.map((item) => item.toJson()).toList(),
      'chargesDiscussed': _chargesDiscussed,
      'photos': _photos.map((file) => file.path).toList(),
    });
  }

  Future<void> _restoreDraft() async {
    final draft = await VendorFormDraft.load('cleaning');
    if (!mounted || draft.isEmpty) return;
    setState(() {
      _name.text = draft['name']?.toString() ?? _name.text;
      _mobile.text = draft['mobile']?.toString() ?? _mobile.text;
      _location.text = draft['location']?.toString() ?? '';
      _serviceKm.text = draft['serviceKm']?.toString() ?? '';
      _district = draft['district']?.toString() ?? '';
      _lat = draft['lat'] is num ? (draft['lat'] as num).toDouble() : _lat;
      _lng = draft['lng'] is num ? (draft['lng'] as num).toDouble() : _lng;
      _chargesDiscussed = draft['chargesDiscussed'] == true;
      final photos = draft['photos'];
      if (photos is List) {
        _photos
          ..clear()
          ..addAll(photos.map((path) => XFile(path.toString())));
      }
      final items = draft['items'];
      if (items is List && items.isNotEmpty) {
        final hasHouse = items.any((raw) {
          final map = raw is Map ? raw : <String, dynamic>{};
          return '${map['name'] ?? ''}' == 'House';
        });
        if (hasHouse) {
          for (final item in _items) {
            item.dispose();
          }
          _items
            ..clear()
            ..addAll(items.map((raw) {
              final map = raw is Map ? raw : <String, dynamic>{};
              final row = _CleanRow(
                name: '${map['name'] ?? ''}',
                oneTimeAmount: '${map['oneTimeAmount'] ?? ''}',
                monthlyAmount: '${map['monthlyAmount'] ?? ''}',
                selected: map['selected'] == true,
                locked: map['locked'] == true || ['House', 'Bathroom', 'Office'].contains('${map['name'] ?? ''}'),
                oneTime: map['oneTime'] == true,
                monthly: map['monthly'] == true,
              );
              _bindItem(row);
              return row;
            }));
        }
      }
    });
  }

  List<_CleanRow> get _picked =>
      _items.where((item) => item.selected && item.name.text.trim().isNotEmpty).toList();

  void _addItem() {
    final row = _CleanRow(selected: true);
    _bindItem(row);
    setState(() => _items.add(row));
    _scheduleSave();
  }

  void _removeItem(int index) {
    if (_items[index].locked) return;
    setState(() {
      _items[index].dispose();
      _items.removeAt(index);
    });
    _scheduleSave();
  }

  Future<void> _detect() async {
    final found = await pickVendorLocation(
      context,
      pinLabel: 'Service location',
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

  Future<void> _pickPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() {
      _photos.addAll(picked);
      if (_photos.length > 10) _photos.removeRange(10, _photos.length);
    });
    _scheduleSave();
  }

  String? _validate() {
    if (_name.text.trim().isEmpty) return 'Enter your name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_location.text.trim().isEmpty) return 'Add your service location.';
    if (_serviceKm.text.trim().isEmpty) return 'Enter service area in KM.';
    if (_picked.isEmpty) return 'Select at least one thing you clean.';
    for (final item in _picked) {
      final oneTimeOk = item.oneTime && item.oneTimeAmount.text.trim().isNotEmpty;
      final monthlyOk = item.monthly && item.monthlyAmount.text.trim().isNotEmpty;
      if (!oneTimeOk && !monthlyOk) {
        return 'Enter one-time or monthly charge for ${item.name.text.trim()}.';
      }
    }
    if (!_chargesDiscussed) return 'Confirm that charges will be discussed before starting the work.';
    return null;
  }

  Map<String, String> _listingPrice() {
    for (final item in _picked) {
      if (item.oneTime && item.oneTimeAmount.text.trim().isNotEmpty) {
        return {'price': item.oneTimeAmount.text.trim(), 'unit': 'PER_WORK'};
      }
      if (item.monthly && item.monthlyAmount.text.trim().isNotEmpty) {
        return {'price': item.monthlyAmount.text.trim(), 'unit': 'MONTHLY'};
      }
    }
    return {'price': '', 'unit': 'PER_WORK'};
  }

  String _itemLabel(_CleanRow item) {
    final bits = <String>[];
    if (item.oneTime && item.oneTimeAmount.text.trim().isNotEmpty) {
      bits.add('One-Time ₹${item.oneTimeAmount.text.trim()} / Work');
    }
    if (item.monthly && item.monthlyAmount.text.trim().isNotEmpty) {
      bits.add('Monthly ₹${item.monthlyAmount.text.trim()} / Month');
    }
    final name = item.name.text.trim();
    return bits.isEmpty ? name : '$name (${bits.join(', ')})';
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
      final listing = _listingPrice();
      await submitVendorListing(
        category: 'cleaning',
        fields: {
          'cleanerName': _name.text.trim(),
          'serviceName': _name.text.trim(),
          'shopName': _name.text.trim(),
          'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
          'servicesOffered': _picked.map(_itemLabel).join('; '),
          'cleaningType': _picked.first.name.text.trim(),
          'cleaningItems': jsonEncode(_picked.map((item) => item.toJson()).toList()),
          'serviceKm': _serviceKm.text.trim(),
          'serviceArea': 'Within ${_serviceKm.text.trim()} KM',
          'coverage': 'Within ${_serviceKm.text.trim()} KM',
          'visitCharge': listing['price']!,
          'startingCharge': listing['price']!,
          'price': listing['price']!,
          'priceUnit': listing['unit']!,
          'workChargesNote': workChargesNote,
          'location': _location.text.trim(),
          'district': _district,
          'city': _district,
          'area': _location.text.trim(),
          if (_lat != null) 'latitude': _lat.toString(),
          if (_lng != null) 'longitude': _lng.toString(),
        },
        photoPaths: _photos.map((file) => file.path).take(10).toList(),
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(
            name: _name.text.trim(),
            location: _location.text.trim(),
          ),
        ),
      );
    } catch (err) {
      setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Cleaning Service Registration'),
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
                _section(1, 'Basic Details'),
                _label('Name', required: true),
                _field(_name, hint: 'Enter your name'),
                const SizedBox(height: 14),
                _label('Mobile Number', required: true),
                _field(_mobile, hint: 'Enter mobile number', keyboard: TextInputType.phone, digits: 10),
                const SizedBox(height: 14),
                _label('Service Location', required: true),
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
                      icon: const Icon(Icons.location_on_outlined, size: 18),
                      label: Text(_detecting ? 'Detecting…' : 'Add Location'),
                    ),
                  ),
                const SizedBox(height: 14),
                _label('Service Area', required: true),
                Row(
                  children: [
                    const Text('Within', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                    const SizedBox(width: 8),
                    SizedBox(width: 88, child: _field(_serviceKm, hint: '___', keyboard: TextInputType.number, digits: 3)),
                    const SizedBox(width: 8),
                    const Text('KM', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
                _section(2, 'Cleaning Services'),
                _label('What do you Clean?', required: true),
                const SizedBox(height: 8),
                for (var i = 0; i < _items.length; i++) _itemCard(i),
                const SizedBox(height: 14),
                _label('Work Charges'),
                InkWell(
                  onTap: () => setState(() {
                    _chargesDiscussed = !_chargesDiscussed;
                    _error = '';
                    _scheduleSave();
                  }),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _chargesDiscussed ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          _chargesDiscussed ? Icons.check_box : Icons.check_box_outline_blank,
                          size: 22,
                          color: _chargesDiscussed ? const Color(0xFF0F172A) : AppColors.textMuted,
                        ),
                        const SizedBox(width: 10),
                        const Expanded(child: Text(workChargesNote, style: TextStyle(fontSize: 13, height: 1.45))),
                      ],
                    ),
                  ),
                ),
                _section(3, 'Service Images'),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._photos.asMap().entries.map((entry) {
                      return GestureDetector(
                        onTap: () => setState(() {
                          _photos.removeAt(entry.key);
                          _scheduleSave();
                        }),
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
                              Text('Upload Images', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                      ),
                  ],
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
                    child: Text(_saving ? 'Submitting…' : 'Submit Registration'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _itemCard(int index) {
    final item = _items[index];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _check(item.selected, () => setState(() {
                      item.selected = !item.selected;
                      _scheduleSave();
                    })),
                const SizedBox(width: 8),
                Expanded(
                  child: item.locked
                      ? Text(item.name.text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))
                      : _field(item.name, hint: 'Enter type'),
                ),
                const SizedBox(width: 6),
                if (!item.locked) _iconBtn(Icons.remove, () => _removeItem(index), filled: false),
                if (index == _items.length - 1) ...[
                  const SizedBox(width: 6),
                  _iconBtn(Icons.add, _addItem, filled: true),
                ],
              ],
            ),
            if (item.selected) ...[
              const SizedBox(height: 10),
              _chargeRow(
                label: 'One-Time',
                suffix: '/ Work',
                controller: item.oneTimeAmount,
                onTyped: () => setState(() {
                  item.oneTime = item.oneTimeAmount.text.trim().isNotEmpty;
                  item.selected = true;
                }),
              ),
              const SizedBox(height: 8),
              _chargeRow(
                label: 'Monthly',
                suffix: '/ Month',
                controller: item.monthlyAmount,
                onTyped: () => setState(() {
                  item.monthly = item.monthlyAmount.text.trim().isNotEmpty;
                  item.selected = true;
                }),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _chargeRow({
    required String label,
    required String suffix,
    required TextEditingController controller,
    required VoidCallback onTyped,
  }) {
    return Row(
      children: [
        SizedBox(width: 72, child: Text(label, style: const TextStyle(fontSize: 13))),
        const Text('₹ ', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        Expanded(
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
            onChanged: (_) => onTyped(),
            decoration: _box().copyWith(hintText: '___'),
          ),
        ),
        const SizedBox(width: 8),
        Text(suffix, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
      ],
    );
  }

  Widget _check(bool on, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Icon(on ? Icons.check_box : Icons.check_box_outline_blank, size: 22, color: on ? const Color(0xFF0F172A) : AppColors.textMuted),
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text.rich(
        TextSpan(
          text: text,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          children: [if (required) const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFDC2626)))],
        ),
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
}
