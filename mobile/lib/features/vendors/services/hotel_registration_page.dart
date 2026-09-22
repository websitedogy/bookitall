import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'electrician_form_data.dart';
import 'hotel_form_data.dart';
import 'listing_draft.dart';
import 'vendor_location_picker.dart';

class HotelRegistrationPage extends StatefulWidget {
  const HotelRegistrationPage({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<HotelRegistrationPage> createState() => _HotelRegistrationPageState();
}

class _HotelRegistrationPageState extends State<HotelRegistrationPage> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => widget.embedded;
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _extraGuest = TextEditingController();
  final _location = TextEditingController();
  final _extraInfo = TextEditingController();
  final _picker = ImagePicker();

  String _propertyType = '';
  String _starCategory = 'Budget';
  String _checkPolicy = 'Standard';
  String _bookingMode = 'Instant Booking';
  String _cancellation = 'Free Cancellation';
  String _childPolicy = 'Children Allowed';
  String _advanceNotice = 'Immediate';
  String _booking24 = 'Yes';
  String _district = '';
  String _coverage = 'Entire District';
  final _rooms = <String>{};
  final _customRooms = <String>[];
  final _rates = <String, String>{};
  final _occupancy = <String, String>{};
  final _available = <String, String>{};
  final _features = <String>{};
  final _facilities = <String>{};
  final _suitableFor = <String>{};
  final _mandals = <String>{};
  final _workPhotos = <XFile>[];
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';

  List<String> get _roomOptions => [...hotelRooms, ..._customRooms];

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
    _extraGuest.dispose();
    _location.dispose();
    _extraInfo.dispose();
    super.dispose();
  }

  ElectricianDistrict? get _districtInfo {
    for (final item in electricianDistricts) {
      if (item.name == _district) return item;
    }
    return null;
  }

  Future<void> _addRoom() async {
    final controller = TextEditingController();
    final label = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Room type name'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Add')),
        ],
      ),
    );
    if (label == null || label.isEmpty || _roomOptions.contains(label)) return;
    setState(() {
      _customRooms.add(label);
      _rooms.add(label);
      _occupancy[label] = '2';
      _available[label] = '1';
    });
  }

  Future<void> _detect() async {
    final found = await pickVendorLocation(
      context,
      pinLabel: 'Hotel location',
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
    if (_name.text.trim().isEmpty) return 'Enter hotel / property name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_propertyType.isEmpty) return 'Select property type.';
    if (_rooms.isEmpty) return 'Select at least one room type.';
    for (final room in _rooms) {
      if ((_rates[room] ?? '').isEmpty) return 'Enter per-night rate for $room.';
    }
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
      final rates = _rooms
          .map((room) => '$room: ₹${_rates[room]} / ${_occupancy[room] ?? '2'} guests / ${_available[room] ?? '1'} rooms')
          .join('; ');
      final first = _rooms.first;
      final firstRate = _rates[first]?.replaceAll(RegExp(r'[^\d]'), '') ?? '0';
      await submitHotelListing(
        hotelName: _name.text.trim(),
        mobileNumber: _mobile.text.replaceAll(RegExp(r'\s'), ''),
        hotelType: _propertyType,
        roomType: first,
        location: _location.text.trim(),
        price: firstRate,
        priceUnit: 'PER_ROOM',
        checkInTime: '12:00',
        checkOutTime: '11:00',
        photoPaths: _workPhotos.map((file) => file.path).take(10).toList(),
        latitude: _lat,
        longitude: _lng,
        extraFields: {
          'shopName': _name.text.trim(),
          'propertyType': _propertyType,
          'starCategory': _starCategory,
          'checkPolicy': _checkPolicy,
          'roomRates': rates,
          'roomFeatures': _features.join(', '),
          'facilities': _facilities.join(', '),
          'suitableFor': _suitableFor.join(', '),
          'bookingMode': _bookingMode,
          'cancellation': _cancellation,
          'extraGuestCharge': _extraGuest.text,
          'childPolicy': _childPolicy,
          'advanceNotice': _advanceNotice,
          'booking24x7': _booking24,
          'district': _district,
          'state': info?.state ?? '',
          'city': _district,
          'area': _coverage == 'Selected Mandals' ? _mandals.join(', ') : _district,
          'coverageType': _coverage,
          'coverage': _coverage == 'Entire District' ? 'Entire $_district' : _mandals.join(', '),
          'mandals': _mandals.join(', '),
          'stayKind': 'hotel',
          if (_extraInfo.text.trim().isNotEmpty) 'description': _extraInfo.text.trim(),
        },
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
    super.build(context);
    final ts = electricianDistricts.where((d) => d.state == 'Telangana').toList();
    final ap = electricianDistricts.where((d) => d.state == 'Andhra Pradesh').toList();

    final form = ListView(
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
                _label('Hotel / Property Name', required: true),
                _field(_name, hint: 'Enter property name'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Contact Number', required: true),
                          _field(_mobile, hint: '10-digit mobile', keyboard: TextInputType.phone, digits: 10),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Property Type', required: true),
                          _dropdown(_propertyType, 'Select', hotelPropertyTypes, (value) => setState(() => _propertyType = value)),
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
                          _label('Star / Category'),
                          _dropdown(_starCategory, 'Budget', hotelStarCategories, (value) => setState(() => _starCategory = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Check-in / Check-out'),
                          _dropdown(_checkPolicy, 'Standard', hotelCheckPolicies, (value) => setState(() => _checkPolicy = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(2, 'Rooms', required: true, onAdd: _addRoom),
                ..._roomOptions.map(_pricedRoom),
                _section(3, 'Features'),
                _checks(hotelRoomFeatures, _features),
                _section(4, 'Facilities'),
                _checks(hotelFacilities, _facilities),
                _section(5, 'Rules'),
                _label('Suitable For'),
                _checks(hotelSuitableFor, _suitableFor),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Booking Mode'),
                          _dropdown(_bookingMode, 'Instant Booking', hotelBookingModes, (value) => setState(() => _bookingMode = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Cancellation'),
                          _dropdown(_cancellation, 'Free Cancellation', hotelCancellation, (value) => setState(() => _cancellation = value)),
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
                          _label('Extra Guest Charge (₹)'),
                          _field(_extraGuest, hint: 'Per guest/night', keyboard: TextInputType.number, digits: 6),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Child Policy'),
                          _dropdown(_childPolicy, 'Children Allowed', hotelChildPolicy, (value) => setState(() => _childPolicy = value)),
                        ],
                      ),
                    ),
                  ],
                ),
                _section(6, 'Availability'),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Advance Notice'),
                          _dropdown(_advanceNotice, 'Immediate', hotelAdvanceNotice, (value) => setState(() => _advanceNotice = value)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('24x7 Booking'),
                          _dropdown(_booking24, 'Yes', const ['Yes', 'No'], (value) => setState(() => _booking24 = value)),
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
                _label('Service / Booking Coverage', required: true),
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
                _section(9, 'Additional Information'),
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
      );

    if (widget.embedded) return form;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Hotels'),
      ),
      body: form,
    );
  }

  Widget _pricedRoom(String room) {
    final on = _rooms.contains(room);
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
                  _rooms.remove(room);
                  _rates.remove(room);
                  _occupancy.remove(room);
                  _available.remove(room);
                } else {
                  _rooms.add(room);
                  _occupancy[room] = '2';
                  _available[room] = '1';
                }
              }),
              child: Row(
                children: [
                  Icon(on ? Icons.check_box : Icons.check_box_outline_blank, size: 18, color: on ? const Color(0xFF0F172A) : AppColors.textMuted),
                  const SizedBox(width: 8),
                  Expanded(child: Text(room, style: const TextStyle(fontSize: 13))),
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
                        _label('Per night'),
                        TextField(
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(7)],
                          onChanged: (value) => _rates[room] = value,
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
                        _label('Occupancy'),
                        _dropdown(_occupancy[room] ?? '2', '2', roomOccupancy, (value) => setState(() => _occupancy[room] = value)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Rooms'),
                        _dropdown(_available[room] ?? '1', '1', roomsAvailable, (value) => setState(() => _available[room] = value)),
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
