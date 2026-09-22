import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'cab_form_data.dart';
import 'electrician_form_data.dart';
import 'listing_draft.dart';
import 'vendor_location_picker.dart';

class CabRegistrationPage extends StatefulWidget {
  const CabRegistrationPage({super.key});

  @override
  State<CabRegistrationPage> createState() => _CabRegistrationPageState();
}

class _CabRegistrationPageState extends State<CabRegistrationPage> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _whatsapp = TextEditingController();
  final _driverName = TextEditingController();
  final _driverMobile = TextEditingController();
  final _extraKm = TextEditingController();
  final _waiting = TextEditingController();
  final _nightCharge = TextEditingController();
  final _driverAllowance = TextEditingController();
  final _location = TextEditingController();
  final _picker = ImagePicker();

  String _providerType = '';
  String _minKm = '5 KM';
  String _minHours = '1 Hour';
  String _drivingExperience = 'Below 1 Year';
  String _driverVerification = 'Verified';
  String _bookingMode = 'Instant Booking';
  String _advanceNotice = 'Immediate';
  String _emergency = 'Yes';
  String _driverAvailability = 'Available Now';
  String _startTime = '06:00';
  String _endTime = '22:00';
  String _district = '';
  String _coverage = 'Entire District';
  final _vehicles = <String>{};
  final _customVehicles = <String>[];
  final _fares = <String, String>{};
  final _capacities = <String, String>{};
  final _availability = <String, String>{};
  final _features = <String>{};
  final _bookingTypes = <String>{};
  final _documents = <String>{};
  final _days = <String>{};
  final _mandals = <String>{};
  final _workPhotos = <XFile>[];
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';

  List<String> get _vehicleOptions => [...cabVehicles, ..._customVehicles];

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
    _whatsapp.dispose();
    _driverName.dispose();
    _driverMobile.dispose();
    _extraKm.dispose();
    _waiting.dispose();
    _nightCharge.dispose();
    _driverAllowance.dispose();
    _location.dispose();
    super.dispose();
  }

  ElectricianDistrict? get _districtInfo {
    for (final item in electricianDistricts) {
      if (item.name == _district) return item;
    }
    return null;
  }

  Future<void> _addVehicle() async {
    final controller = TextEditingController();
    final label = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Vehicle type name'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Add')),
        ],
      ),
    );
    if (label == null || label.isEmpty || _vehicleOptions.contains(label)) return;
    setState(() {
      _customVehicles.add(label);
      _vehicles.add(label);
      _capacities[label] = '4';
      _availability[label] = 'Available';
    });
  }

  Future<void> _detect() async {
    final found = await pickVendorLocation(
      context,
      pinLabel: 'Cab location',
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
    if (_name.text.trim().isEmpty) return 'Enter cab service name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_providerType.isEmpty) return 'Select provider type.';
    if (_vehicles.isEmpty) return 'Select at least one vehicle type.';
    for (final vehicle in _vehicles) {
      if ((_fares[vehicle] ?? '').isEmpty) return 'Enter fare for $vehicle.';
    }
    if (_bookingTypes.isEmpty) return 'Select booking type.';
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
      final fares = _vehicles
          .map((vehicle) => '$vehicle: ₹${_fares[vehicle]} / ${_capacities[vehicle] ?? '4'} seats / ${_availability[vehicle] ?? 'Available'}')
          .join('; ');
      final first = _vehicles.first;
      final firstFare = _fares[first]?.replaceAll(RegExp(r'[^\d]'), '') ?? '0';
      final fields = <String, String>{
        'shopName': _name.text.trim(),
        'businessName': _name.text.trim(),
        'serviceName': _name.text.trim(),
        'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
        'providerType': _providerType,
        'whatsapp': _whatsapp.text.replaceAll(RegExp(r'\s'), ''),
        'cabType': first,
        'vehicleTypes': _vehicles.join(', '),
        'vehicleFares': fares,
        'vehicleFeatures': _features.join(', '),
        'bookingType': _bookingTypes.join(', '),
        'minKm': _minKm,
        'minHours': _minHours,
        'extraKmCharge': _extraKm.text,
        'waitingCharge': _waiting.text,
        'nightCharge': _nightCharge.text,
        'driverAllowance': _driverAllowance.text,
        'driverName': _driverName.text.trim().isEmpty ? _name.text.trim() : _driverName.text.trim(),
        'driverMobile': _driverMobile.text.replaceAll(RegExp(r'\s'), ''),
        'drivingExperience': _drivingExperience,
        'driverVerification': _driverVerification,
        'documents': _documents.join(', '),
        'bookingMode': _bookingMode,
        'advanceNotice': _advanceNotice,
        'emergency': _emergency,
        'driverAvailability': _driverAvailability,
        'availableDays': _days.join(', '),
        'openingTime': _startTime,
        'closingTime': _endTime,
        'availableTime': '$_startTime - $_endTime',
        'price': firstFare,
        'priceUnit': 'PER_KM',
        'seats': _capacities[first] ?? '4',
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
      await submitVendorListing(
        category: 'cabs',
        fields: fields,
        photoPaths: _workPhotos.map((file) => file.path).take(10).toList(),
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
        title: const Text('Cabs'),
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
                _label('Business / Provider Name', required: true),
                _field(_name, hint: 'Enter cab service name'),
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
                          _label('Provider Type', required: true),
                          _dropdown(_providerType, 'Select', cabProviderTypes, (value) => setState(() => _providerType = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Booking Contact / WhatsApp'),
                _field(_whatsapp, hint: 'WhatsApp number', keyboard: TextInputType.phone, digits: 10),
                _section(2, 'Vehicles', required: true, onAdd: _addVehicle),
                ..._vehicleOptions.map(_pricedVehicle),
                _section(3, 'Features'),
                _checks(vehicleFeatures, _features),
                _section(4, 'Fares'),
                _label('Booking Type', required: true),
                _checks(cabBookingTypes, _bookingTypes),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Minimum KM'),
                          _dropdown(_minKm, '5 KM', minKmOptions, (value) => setState(() => _minKm = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Minimum Hours'),
                          _dropdown(_minHours, '1 Hour', minHourOptions, (value) => setState(() => _minHours = value)),
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
                          _label('Extra KM Charge (₹)'),
                          _field(_extraKm, hint: 'Per extra KM', keyboard: TextInputType.number, digits: 6),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Waiting Charge (₹/Hour)'),
                          _field(_waiting, hint: 'Waiting charge', keyboard: TextInputType.number, digits: 6),
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
                          _label('Night Charge (₹)'),
                          _field(_nightCharge, hint: 'Optional', keyboard: TextInputType.number, digits: 6),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Driver Allowance (₹)'),
                          _field(_driverAllowance, hint: 'Optional', keyboard: TextInputType.number, digits: 6),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(5, 'Driver'),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Driver Name'),
                          _field(_driverName, hint: 'Driver name'),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Driver Mobile'),
                          _field(_driverMobile, hint: '10-digit mobile', keyboard: TextInputType.phone, digits: 10),
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
                          _label('Driving Experience'),
                          _dropdown(_drivingExperience, 'Below 1 Year', drivingExperienceOptions, (value) => setState(() => _drivingExperience = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Driver Verification'),
                          _dropdown(_driverVerification, 'Verified', driverVerificationOptions, (value) => setState(() => _driverVerification = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Documents Available'),
                _checks(cabDocuments, _documents),
                _section(6, 'Availability'),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Booking Mode'),
                          _dropdown(_bookingMode, 'Instant Booking', bookingModes, (value) => setState(() => _bookingMode = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Advance Notice'),
                          _dropdown(_advanceNotice, 'Immediate', advanceNoticeOptions, (value) => setState(() => _advanceNotice = value)),
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
                          _label('Emergency / Night Service'),
                          _dropdown(_emergency, 'Yes', const ['Yes', 'No'], (value) => setState(() => _emergency = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Driver Availability'),
                          _dropdown(_driverAvailability, 'Available Now', driverAvailabilityOptions, (value) => setState(() => _driverAvailability = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _label('Working Days'),
                _checks(availableDays, _days),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Start Time'),
                          _dropdown(_startTime, '06:00', cabHours, (value) => setState(() => _startTime = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('End Time'),
                          _dropdown(_endTime, '22:00', cabHours, (value) => setState(() => _endTime = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(7, 'Location'),
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
                _section(8, 'Photos'),
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

  Widget _pricedVehicle(String vehicle) {
    final on = _vehicles.contains(vehicle);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFD7DDE6)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => setState(() {
                if (on) {
                  _vehicles.remove(vehicle);
                  _fares.remove(vehicle);
                  _capacities.remove(vehicle);
                  _availability.remove(vehicle);
                } else {
                  _vehicles.add(vehicle);
                  _capacities[vehicle] = '4';
                  _availability[vehicle] = 'Available';
                }
              }),
              child: Row(
                children: [
                  Icon(on ? Icons.check_box : Icons.check_box_outline_blank, size: 18, color: on ? const Color(0xFF0F172A) : AppColors.textMuted),
                  const SizedBox(width: 8),
                  Expanded(child: Text(vehicle, style: const TextStyle(fontSize: 13))),
                ],
              ),
            ),
            if (on) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Fare'),
                        TextField(
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                          onChanged: (value) => _fares[vehicle] = value,
                          decoration: _box().copyWith(hintText: '₹'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Capacity'),
                        _dropdown(_capacities[vehicle] ?? '4', '4', vehicleCapacities, (value) => setState(() => _capacities[vehicle] = value)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Availability'),
                        _dropdown(_availability[vehicle] ?? 'Available', 'Available', vehicleAvailability, (value) => setState(() => _availability[vehicle] = value)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _section(int n, String title, {bool required = false, VoidCallback? onAdd}) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text.rich(
              TextSpan(
                text: '$n. $title',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                children: [if (required) const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFDC2626)))],
              ),
            ),
          ),
          if (onAdd != null)
            InkWell(
              onTap: onAdd,
              child: Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(color: Color(0xFF2563EB), shape: BoxShape.circle),
                child: const Icon(Icons.add, color: Colors.white, size: 18),
              ),
            ),
        ],
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
      items: options.map((option) => DropdownMenuItem(value: option, child: Text(option, overflow: TextOverflow.ellipsis))).toList(),
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
}
