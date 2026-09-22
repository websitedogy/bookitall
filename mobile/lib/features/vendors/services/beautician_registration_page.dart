import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'beautician_form_data.dart';
import 'listing_draft.dart';
import 'vendor_form_draft.dart';
import 'vendor_location_picker.dart';

class BeauticianRegistrationPage extends StatefulWidget {
  const BeauticianRegistrationPage({super.key});

  @override
  State<BeauticianRegistrationPage> createState() => _BeauticianRegistrationPageState();
}

class _BeautyRow {
  _BeautyRow({String name = '', String amount = ''})
      : name = TextEditingController(text: name),
        amount = TextEditingController(text: amount);

  final TextEditingController name;
  final TextEditingController amount;

  void dispose() {
    name.dispose();
    amount.dispose();
  }

  Map<String, String> toJson() => {'name': name.text, 'amount': amount.text};
}

class _BeauticianRegistrationPageState extends State<BeauticianRegistrationPage> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _location = TextEditingController();
  final _extraInfo = TextEditingController();
  final _rows = <_BeautyRow>[_BeautyRow()];
  final _photos = <XFile>[];
  final _picker = ImagePicker();
  final _serviceAreas = <String>{};
  double? _lat;
  double? _lng;
  String _district = '';
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
    for (final controller in [_name, _mobile, _location, _extraInfo]) {
      controller.addListener(_scheduleSave);
    }
    _bindRow(_rows.first);
    _restoreDraft();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    for (final controller in [_name, _mobile, _location, _extraInfo]) {
      controller.dispose();
    }
    for (final row in _rows) {
      row.dispose();
    }
    super.dispose();
  }

  void _bindRow(_BeautyRow row) {
    row.name.addListener(_scheduleSave);
    row.amount.addListener(_scheduleSave);
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), _persistDraft);
  }

  Future<void> _persistDraft() async {
    await VendorFormDraft.save('beautician', {
      'name': _name.text,
      'mobile': _mobile.text,
      'location': _location.text,
      'extraInfo': _extraInfo.text,
      'district': _district,
      'lat': _lat,
      'lng': _lng,
      'serviceAreas': _serviceAreas.toList(),
      'rows': _rows.map((row) => row.toJson()).toList(),
      'photos': _photos.map((file) => file.path).toList(),
    });
  }

  Future<void> _restoreDraft() async {
    final draft = await VendorFormDraft.load('beautician');
    if (!mounted || draft.isEmpty) return;
    setState(() {
      _name.text = draft['name']?.toString() ?? _name.text;
      _mobile.text = draft['mobile']?.toString() ?? _mobile.text;
      _location.text = draft['location']?.toString() ?? '';
      _extraInfo.text = draft['extraInfo']?.toString() ?? '';
      _district = draft['district']?.toString() ?? '';
      _lat = draft['lat'] is num ? (draft['lat'] as num).toDouble() : _lat;
      _lng = draft['lng'] is num ? (draft['lng'] as num).toDouble() : _lng;
      final areas = draft['serviceAreas'];
      if (areas is List) {
        _serviceAreas
          ..clear()
          ..addAll(areas.map((item) => item.toString()));
      }
      final photos = draft['photos'];
      if (photos is List) {
        _photos
          ..clear()
          ..addAll(photos.map((path) => XFile(path.toString())));
      }
      final rows = draft['rows'];
      if (rows is List && rows.isNotEmpty) {
        for (final row in _rows) {
          row.dispose();
        }
        _rows
          ..clear()
          ..addAll(rows.map((raw) {
            final map = raw is Map ? raw : <String, dynamic>{};
            final row = _BeautyRow(name: '${map['name'] ?? ''}', amount: '${map['amount'] ?? ''}');
            _bindRow(row);
            return row;
          }));
      }
    });
  }

  List<_BeautyRow> get _filled =>
      _rows.where((row) => row.name.text.trim().isNotEmpty && row.amount.text.trim().isNotEmpty).toList();

  void _addRow() {
    final row = _BeautyRow();
    _bindRow(row);
    setState(() => _rows.add(row));
    _scheduleSave();
  }

  void _removeRow(int index) {
    if (_rows.length <= 1) return;
    setState(() {
      _rows[index].dispose();
      _rows.removeAt(index);
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
    if (_serviceAreas.isEmpty) return 'Select at least one service area.';
    if (_filled.isEmpty) return 'Add at least one service with amount.';
    for (final row in _rows) {
      if (row.name.text.trim().isNotEmpty && row.amount.text.trim().isEmpty) {
        return 'Enter amount for ${row.name.text.trim()}.';
      }
      if (row.name.text.trim().isEmpty && row.amount.text.trim().isNotEmpty) {
        return 'Enter service name.';
      }
    }
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
      final area = _serviceAreas.join(', ');
      await submitVendorListing(
        category: 'beautician',
        fields: {
          'beauticianName': _name.text.trim(),
          'shopName': _name.text.trim(),
          'serviceName': _name.text.trim(),
          'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
          'serviceType': _filled.first.name.text.trim(),
          'servicesOffered': _filled.map((row) => '${row.name.text.trim()} ₹${row.amount.text.trim()}').join('; '),
          'beautyServices': jsonEncode(_filled.map((row) => row.toJson()).toList()),
          'serviceArea': area,
          'coverage': area,
          'serviceFor': area,
          'serviceMode': area,
          'price': _filled.first.amount.text.trim(),
          'priceUnit': 'PER_SERVICE',
          'location': _location.text.trim(),
          'district': _district,
          'city': _district,
          'area': _location.text.trim(),
          if (_extraInfo.text.trim().isNotEmpty) 'description': _extraInfo.text.trim(),
          if (_lat != null) 'latitude': _lat.toString(),
          if (_lng != null) 'longitude': _lng.toString(),
        },
        photoPaths: _photos.map((file) => file.path).take(10).toList(),
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: _name.text.trim(), location: _location.text.trim()),
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
        title: const Text('Beauty Service Registration'),
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
                for (final option in beautyServiceAreas)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => setState(() {
                        if (_serviceAreas.contains(option)) {
                          _serviceAreas.remove(option);
                        } else {
                          _serviceAreas.add(option);
                        }
                        _scheduleSave();
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _serviceAreas.contains(option) ? Icons.check_box : Icons.check_box_outline_blank,
                              size: 22,
                              color: _serviceAreas.contains(option) ? const Color(0xFF0F172A) : AppColors.textMuted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(option, style: const TextStyle(fontSize: 13))),
                          ],
                        ),
                      ),
                    ),
                  ),
                _section(2, 'Beauty Services'),
                Row(
                  children: [
                    const Expanded(child: Text('Service name *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                    const SizedBox(width: 8),
                    SizedBox(width: 100, child: Text('Amount *', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                    const SizedBox(width: 50),
                  ],
                ),
                const SizedBox(height: 6),
                for (var i = 0; i < _rows.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(child: _field(_rows[i].name, hint: 'e.g. Haircut')),
                        const SizedBox(width: 8),
                        SizedBox(width: 100, child: _field(_rows[i].amount, hint: '₹ 0', keyboard: TextInputType.number, digits: 6)),
                        const SizedBox(width: 6),
                        if (_rows.length > 1) _iconBtn(Icons.remove, () => _removeRow(i), filled: false),
                        if (i == _rows.length - 1) ...[
                          if (_rows.length == 1) const SizedBox(width: 0),
                          _iconBtn(Icons.add, _addRow, filled: true),
                        ] else
                          const SizedBox(width: 44),
                      ],
                    ),
                  ),
                const SizedBox(height: 12),
                _label('Service Images'),
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
                const SizedBox(height: 14),
                _label('Additional Details'),
                TextField(
                  controller: _extraInfo,
                  minLines: 4,
                  maxLines: 8,
                  decoration: _box().copyWith(hintText: 'Enter additional details'),
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
