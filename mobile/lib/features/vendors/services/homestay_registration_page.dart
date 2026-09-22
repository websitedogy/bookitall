import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import 'electrician_form_data.dart';
import 'homestay_form_data.dart';
import 'hotel_form_data.dart';
import 'listing_draft.dart';
import 'vendor_location_picker.dart';

class HomestayRegistrationPage extends StatefulWidget {
  const HomestayRegistrationPage({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<HomestayRegistrationPage> createState() => _HomestayRegistrationPageState();
}

class _HomestayRegistrationPageState extends State<HomestayRegistrationPage> with AutomaticKeepAliveClientMixin {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _location = TextEditingController();
  final _picker = ImagePicker();

  String _stayType = '';
  String _hostOnProperty = 'Yes';
  String _maxGuests = '4';
  String _bookingMode = 'On Confirmation';
  String _cancellation = 'Free Cancellation';
  String _advanceNotice = '1 day';
  String _district = '';
  String _coverage = 'Entire District';
  final _rooms = <String>{};
  final _rates = <String, String>{};
  final _occupancy = <String, String>{};
  final _available = <String, String>{};
  final _amenities = <String>{};
  final _meals = <String>{};
  final _rules = <String>{};
  final _suitableFor = <String>{};
  final _mandals = <String>{};
  final _workPhotos = <XFile>[];
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  String _error = '';

  @override
  bool get wantKeepAlive => widget.embedded;

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
      pinLabel: 'Homestay location',
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
    if (_name.text.trim().isEmpty) return 'Enter homestay name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_stayType.isEmpty) return 'Select homestay type.';
    if (_rooms.isEmpty) return 'Select at least one room / unit.';
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
          .map((room) => '$room: ₹${_rates[room]} / ${_occupancy[room] ?? '2'} guests / ${_available[room] ?? '1'} units')
          .join('; ');
      final first = _rooms.first;
      final firstRate = _rates[first]?.replaceAll(RegExp(r'[^\d]'), '') ?? '0';
      await submitHotelListing(
        hotelName: _name.text.trim(),
        mobileNumber: _mobile.text.replaceAll(RegExp(r'\s'), ''),
        hotelType: 'Homestay',
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
          'propertyType': _stayType,
          'stayKind': 'homestay',
          'hostOnProperty': _hostOnProperty,
          'meals': _meals.join(', '),
          'houseRules': _rules.join(', '),
          'maxGuests': _maxGuests,
          'starCategory': 'Homestay',
          'checkPolicy': 'Standard',
          'roomRates': rates,
          'roomFeatures': _amenities.join(', '),
          'facilities': _amenities.join(', '),
          'suitableFor': _suitableFor.join(', '),
          'bookingMode': _bookingMode,
          'cancellation': _cancellation,
          'advanceNotice': _advanceNotice,
          'booking24x7': 'No',
          'district': _district,
          'state': info?.state ?? '',
          'city': _district,
          'area': _coverage == 'Selected Mandals' ? _mandals.join(', ') : _district,
          'coverageType': _coverage,
          'coverage': _coverage == 'Entire District' ? 'Entire $_district' : _mandals.join(', '),
          'mandals': _mandals.join(', '),
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
              _section(1, 'Homestay details'),
              _label('Homestay name', required: true),
              _field(_name, hint: 'House / homestay name'),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Host mobile', required: true),
                        _field(_mobile, hint: '10-digit mobile', keyboard: TextInputType.phone, digits: 10),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Homestay type', required: true),
                        _dropdown(_stayType, 'Select', homestayTypes, (value) => setState(() => _stayType = value)),
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
                        _label('Host lives on property'),
                        _dropdown(_hostOnProperty, 'Yes', const ['Yes', 'No — whole house'], (value) => setState(() => _hostOnProperty = value)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Max guests'),
                        _dropdown(_maxGuests, '4', roomOccupancy, (value) => setState(() => _maxGuests = value)),
                      ],
                    ),
                  ),
                ],
              ),
              _section(2, 'Rooms / units & rates', required: true),
              ...homestayRooms.map(_pricedRoom),
              _section(3, 'House amenities'),
              _checks(homestayAmenities, _amenities),
              _section(4, 'Meals'),
              _checks(homestayMeals, _meals),
              _section(5, 'House rules'),
              _checks(homestayRules, _rules),
              const SizedBox(height: 10),
              _label('Suitable for'),
              _checks(homestaySuitableFor, _suitableFor),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Booking mode'),
                        _dropdown(_bookingMode, 'On Confirmation', hotelBookingModes, (value) => setState(() => _bookingMode = value)),
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
              _label('Advance notice'),
              _dropdown(_advanceNotice, '1 day', hotelAdvanceNotice, (value) => setState(() => _advanceNotice = value)),
              _section(6, 'Location'),
              _label('Current location', required: true),
              Row(
                children: [
                  Expanded(child: _field(_location, hint: 'Tap Detect')),
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
              _label('Booking coverage', required: true),
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
              _section(7, 'Homestay photos'),
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
                  child: Text(_saving ? 'Submitting…' : 'Submit homestay'),
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
        title: const Text('Homestays'),
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
                        _label('Units'),
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
