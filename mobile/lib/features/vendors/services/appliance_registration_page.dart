import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'appliance_form_data.dart';
import 'electrician_form_data.dart';
import 'listing_draft.dart';
import 'vendor_location_picker.dart';

class ApplianceRegistrationPage extends StatefulWidget {
  const ApplianceRegistrationPage({super.key});

  @override
  State<ApplianceRegistrationPage> createState() => _ApplianceRegistrationPageState();
}

class _ApplianceRegistrationPageState extends State<ApplianceRegistrationPage> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _location = TextEditingController();
  final _visitCharge = TextEditingController();
  final _hourlyCharge = TextEditingController();
  final _fullDayCharge = TextEditingController();
  final _picker = ImagePicker();

  String _experience = '';
  String _teamSize = '1 Person';
  String _spareParts = 'Customer Provides';
  String _serviceMode = 'Home Service';
  String _emergency = 'Yes';
  String _availableTime = 'Morning';
  String _district = '';
  String _coverage = 'Entire District';
  final _appliances = <String>{};
  final _services = <String>{};
  final _brands = <String>{};
  final _tools = <String>{};
  final _days = <String>{};
  final _mandals = <String>{};
  final _workPhotos = <XFile>[];
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _name.text = SessionStore.fullName ?? '';
    _mobile.text = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    if (_mobile.text.length > 10) _mobile.text = _mobile.text.substring(_mobile.text.length - 10);
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _location.dispose();
    _visitCharge.dispose();
    _hourlyCharge.dispose();
    _fullDayCharge.dispose();
    super.dispose();
  }

  ElectricianDistrict? get _districtInfo {
    for (final item in electricianDistricts) {
      if (item.name == _district) return item;
    }
    return null;
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
      if (found.district.isNotEmpty) {
        _district = found.district;
        _mandals.clear();
      }
    });
  }

  String? _validate() {
    if (_name.text.trim().isEmpty) return 'Enter business / technician name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_experience.isEmpty) return 'Select experience.';
    if (_appliances.isEmpty) return 'Select at least one appliance.';
    if (_services.isEmpty) return 'Select at least one service.';
    if (_visitCharge.text.trim().isEmpty) return 'Enter visit charge.';
    if (_hourlyCharge.text.trim().isEmpty) return 'Enter hourly charge.';
    if (_location.text.trim().isEmpty) return 'Detect or enter your current location.';
    if (_district.isEmpty) return 'Select district.';
    if (_coverage == 'Selected Mandals' && _mandals.isEmpty) return 'Select at least one mandal.';
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
      final info = _districtInfo;
      final fields = <String, String>{
        'technicianName': _name.text.trim(),
        'shopName': _name.text.trim(),
        'serviceName': _name.text.trim(),
        'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
        'experienceYears': _experience,
        'applianceType': _appliances.join(', '),
        'servicesOffered': _services.join(', '),
        'serviceType': _services.join(', '),
        'brand': _brands.join(', '),
        'serviceMode': _serviceMode,
        'tools': _tools.join(', '),
        'spareParts': _spareParts,
        'material': _spareParts,
        'visitCharge': _visitCharge.text.trim(),
        'startingCharge': _visitCharge.text.trim(),
        'price': _visitCharge.text.trim(),
        'priceUnit': 'PER_VISIT',
        'hourlyCharge': _hourlyCharge.text.trim(),
        'fullDayCharge': _fullDayCharge.text.trim(),
        'teamSize': _teamSize,
        'emergency': _emergency,
        'availableDays': _days.join(', '),
        'availableTime': _availableTime,
        'location': _location.text.trim(),
        'district': _district,
        'state': info?.state ?? '',
        'city': _district,
        'area': _coverage == 'Selected Mandals' ? _mandals.join(', ') : _district,
        'coverageType': _coverage,
        'coverage': _coverage == 'Entire District' ? 'Entire $_district' : _mandals.join(', '),
        'mandals': _mandals.join(', '),
        if (_lat != null) 'latitude': _lat.toString(),
        if (_lng != null) 'longitude': _lng.toString(),
      };
      final photos = <String>[
        ..._workPhotos.map((file) => file.path),
      ].take(10).toList();
      await submitVendorListing(category: 'appliance', fields: fields, photoPaths: photos);
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

  Future<void> _pickWork() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() {
      _workPhotos.addAll(picked);
      if (_workPhotos.length > 10) {
        _workPhotos.removeRange(10, _workPhotos.length);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ts = electricianDistricts.where((d) => d.state == 'Telangana').toList();
    final ap = electricianDistricts.where((d) => d.state == 'Andhra Pradesh').toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Appliance'),
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
                _section(1, 'Details'),
                _label('Business / Technician Name', required: true),
                _field(_name, hint: 'Enter name'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Mobile Number', required: true),
                          _field(_mobile, hint: '10-digit mobile', keyboard: TextInputType.phone, digits: 10),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Experience', required: true),
                          _dropdown(_experience, 'Select', experienceOptions, (value) => setState(() => _experience = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(2, 'Appliances', required: true),
                _checks(appliancesServiced, _appliances),
                _section(3, 'Services', required: true),
                _checks(applianceServices, _services),
                _section(4, 'Brands'),
                _label('Brands Supported'),
                _checks(applianceBrands, _brands),
                const SizedBox(height: 14),
                _label('Service Mode', required: true),
                Row(
                  children: [
                    Expanded(child: _mode('Home Service')),
                    const SizedBox(width: 8),
                    Expanded(child: _mode('Shop / Center')),
                  ],
                ),
                _section(5, 'Charges'),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Visit Charge', required: true),
                          _field(_visitCharge, hint: 'Enter amount', keyboard: TextInputType.number, digits: 7),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Hourly Charge', required: true),
                          _field(_hourlyCharge, hint: 'Enter amount', keyboard: TextInputType.number, digits: 7),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Full Day Charge'),
                          _field(_fullDayCharge, hint: 'Enter amount', keyboard: TextInputType.number, digits: 7),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Service Team Size'),
                          _dropdown(_teamSize, '1 Person', teamSizes, (value) => setState(() => _teamSize = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Spare Parts'),
                          _dropdown(_spareParts, 'Customer Provides', sparePartsOptions, (value) => setState(() => _spareParts = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Emergency / Same-Day'),
                          _dropdown(_emergency, 'Yes', const ['Yes', 'No'], (value) => setState(() => _emergency = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Tools Available'),
                _checks(applianceTools, _tools),
                const SizedBox(height: 14),
                _label('Available Days'),
                _checks(availableDays, _days),
                const SizedBox(height: 14),
                _label('Available Time'),
                _dropdown(_availableTime, 'Morning', availableTimes, (value) => setState(() => _availableTime = value)),
                _section(6, 'Location'),
                _label('Current Location', required: true),
                Row(
                  children: [
                    Expanded(child: _field(_location, hint: 'Tap Detect Location')),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _detecting ? null : _detect,
                      style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0F172A), minimumSize: const Size(88, 46)),
                      child: Text(_detecting ? '…' : 'Detect'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('District', required: true),
                DropdownButtonFormField<String>(
                  initialValue: _district.isEmpty ? null : _district,
                  hint: const Text('Select District'),
                  isExpanded: true,
                  decoration: _box(),
                  items: [
                    ...ts.map((d) => DropdownMenuItem(value: d.name, child: Text(d.name))),
                    ...ap.map((d) => DropdownMenuItem(value: d.name, child: Text(d.name))),
                  ],
                  onChanged: (value) => setState(() {
                    _district = value ?? '';
                    _mandals.clear();
                  }),
                ),
                const SizedBox(height: 14),
                _label('Service Coverage', required: true),
                Row(
                  children: [
                    Expanded(child: _radio('Entire District')),
                    const SizedBox(width: 8),
                    Expanded(child: _radio('Selected Mandals')),
                  ],
                ),
                if (_coverage == 'Selected Mandals' && _districtInfo != null) ...[
                  const SizedBox(height: 10),
                  _checks(_districtInfo!.mandals, _mandals),
                ],
                _section(7, 'Photos'),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._workPhotos.asMap().entries.map((entry) {
                      return GestureDetector(
                        onTap: () => setState(() => _workPhotos.removeAt(entry.key)),
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
                    if (_workPhotos.length < 10)
                      InkWell(
                        onTap: _pickWork,
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
                              Text('Add Photo', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(_error, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    onPressed: _saving ? null : _submit,
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF2563EB), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: Text(_saving ? 'Submitting…' : 'Submit'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(int n, String title, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 10),
      child: Text.rich(
        TextSpan(
          text: '$n. $title',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          children: [if (required) const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFDC2626)))],
        ),
      ),
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
      items: options.map((option) => DropdownMenuItem(value: option, child: Text(option))).toList(),
      onChanged: (next) {
        if (next != null) onChanged(next);
      },
    );
  }

  Widget _checks(List<String> values, Set<String> selected) {
    return Column(
      children: [
        for (var i = 0; i < values.length; i += 2)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Expanded(child: _check(values[i], selected)),
                const SizedBox(width: 8),
                Expanded(child: i + 1 < values.length ? _check(values[i + 1], selected) : const SizedBox.shrink()),
              ],
            ),
          ),
      ],
    );
  }

  Widget _check(String value, Set<String> selected) {
    final on = selected.contains(value);
    return InkWell(
      onTap: () => setState(() => on ? selected.remove(value) : selected.add(value)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFD7DDE6)),
        ),
        child: Row(
          children: [
            Icon(on ? Icons.check_box : Icons.check_box_outline_blank, size: 18, color: on ? const Color(0xFF0F172A) : AppColors.textMuted),
            const SizedBox(width: 8),
            Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
          ],
        ),
      ),
    );
  }

  Widget _radio(String value) {
    final on = _coverage == value;
    return InkWell(
      onTap: () => setState(() => _coverage = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: on ? const Color(0xFF2563EB) : const Color(0xFFD7DDE6)),
        ),
        child: Row(
          children: [
            Icon(on ? Icons.radio_button_checked : Icons.radio_button_off, size: 18, color: on ? const Color(0xFF2563EB) : AppColors.textMuted),
            const SizedBox(width: 8),
            Expanded(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: on ? const Color(0xFF1D4ED8) : AppColors.text))),
          ],
        ),
      ),
    );
  }

  Widget _mode(String value) {
    final on = _serviceMode == value;
    return InkWell(
      onTap: () => setState(() => _serviceMode = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: on ? const Color(0xFF2563EB) : const Color(0xFFD7DDE6)),
        ),
        child: Row(
          children: [
            Icon(on ? Icons.radio_button_checked : Icons.radio_button_off, size: 18, color: on ? const Color(0xFF2563EB) : AppColors.textMuted),
            const SizedBox(width: 8),
            Expanded(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: on ? const Color(0xFF1D4ED8) : AppColors.text))),
          ],
        ),
      ),
    );
  }
}
