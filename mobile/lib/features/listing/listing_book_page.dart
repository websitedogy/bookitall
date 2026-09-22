import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../../data/booking.dart';
import '../../theme/app_colors.dart';
import 'checkout_page.dart';
import 'pickup_map_page.dart';

class ListingBookPage extends StatefulWidget {
  const ListingBookPage({super.key, required this.draft});

  final BookingDraft draft;

  @override
  State<ListingBookPage> createState() => _ListingBookPageState();
}

class _ListingBookPageState extends State<ListingBookPage> {
  final _house = TextEditingController();
  final _building = TextEditingController();
  final _address = TextEditingController();
  final _drop = TextEditingController();
  final _notes = TextEditingController();
  late String _checkIn;
  late String _checkOut;
  late String _scheduledAt;
  bool _schedule = false;
  String _error = '';
  double? _lat;
  double? _lng;

  bool get _isStay => widget.draft.isHotel || widget.draft.isTour;

  @override
  void initState() {
    super.initState();
    _address.text = widget.draft.address ?? '';
    _drop.text = widget.draft.dropAddress ?? '';
    _notes.text = widget.draft.notes ?? '';
    _checkIn = widget.draft.checkIn ?? localDate(1);
    _checkOut = widget.draft.checkOut ?? localDate(2);
    _scheduledAt = widget.draft.scheduledAt ?? '${localDate(1)}T10:00';
  }

  @override
  void dispose() {
    _house.dispose();
    _building.dispose();
    _address.dispose();
    _drop.dispose();
    _notes.dispose();
    super.dispose();
  }

  String _exactAddress() {
    final pin = [_house.text.trim(), _building.text.trim()].where((p) => p.isNotEmpty).join(', ');
    final rest = _address.text.trim();
    if (pin.isEmpty) return rest;
    if (rest.isEmpty) return pin;
    if (rest.toLowerCase().contains(pin.toLowerCase())) return rest;
    return '$pin, $rest';
  }

  BookingDraft _buildDraft(String when) {
    final address = _exactAddress();
    return BookingDraft(
      listingId: widget.draft.listingId,
      title: widget.draft.title,
      vendor: widget.draft.vendor,
      location: widget.draft.location,
      image: widget.draft.image,
      categoryId: widget.draft.categoryId,
      category: widget.draft.category,
      unitPrice: widget.draft.unitPrice,
      priceUnit: widget.draft.priceUnit,
      scheduledAt: widget.draft.isHotel ? null : when,
      address: widget.draft.isTour ? null : address,
      notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      checkIn: widget.draft.isHotel ? _checkIn : null,
      checkOut: widget.draft.isHotel ? _checkOut : null,
      travelers: widget.draft.isTour ? 1 : null,
      pickupAddress: widget.draft.isCab ? address : null,
      dropAddress: widget.draft.isCab && _drop.text.trim().isNotEmpty ? _drop.text.trim() : null,
      customerLat: _lat,
      customerLng: _lng,
    );
  }

  bool _validate() {
    if (_isStay) {
      final inn = DateTime.tryParse(_checkIn);
      final out = DateTime.tryParse(_checkOut);
      if (widget.draft.isHotel && inn != null && out != null && !out.isAfter(inn)) {
        setState(() => _error = 'Check-out must be after check-in');
        return false;
      }
      return true;
    }
    if (_house.text.trim().isEmpty && _building.text.trim().isEmpty) {
      setState(() => _error = 'Add house / flat number or building name.');
      return false;
    }
    if (_exactAddress().trim().isEmpty) {
      setState(() => _error = 'Add house / building number and the service location first.');
      return false;
    }
    return true;
  }

  void _goCheckout(String when) {
    setState(() => _error = '');
    if (!_validate()) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => CheckoutPage(draft: _buildDraft(when))),
    );
  }

  Future<void> _openLocationSheet() async {
    setState(() => _error = '');
    if (widget.draft.isHotel) {
      final inn = DateTime.tryParse(_checkIn);
      final out = DateTime.tryParse(_checkOut);
      if (inn != null && out != null && !out.isAfter(inn)) {
        setState(() => _error = 'Check-out must be after check-in');
        return;
      }
    }
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      barrierColor: const Color(0x8C071614),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (sheet) {
        var localError = '';
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(sheet).bottom),
          child: StatefulBuilder(
            builder: (sheetContext, setSheet) {
              return SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEADFCD),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Your location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                                SizedBox(height: 4),
                                Text('Use GPS, or add house / flat details.', style: TextStyle(fontSize: 13, height: 1.35, color: Color(0xFF7A6A52))),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(sheet).pop(),
                            style: IconButton.styleFrom(backgroundColor: const Color(0xFFF4EFE4)),
                            icon: const Icon(Icons.close, size: 18, color: Color(0xFF5B6E68)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: () async {
                          Navigator.of(sheet).pop();
                          await _openExactMap();
                        },
                        icon: const Icon(Icons.my_location, size: 18),
                        label: const Text('Use exact location'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0F3D38),
                          minimumSize: const Size.fromHeight(44),
                          shape: const StadiumBorder(),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Row(
                          children: [
                            Expanded(child: Divider(color: Color(0xFFEFE6D4))),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10),
                              child: Text(
                                'OR ENTER ADDRESS',
                                style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.w700, color: Color(0xFFB3A48C)),
                              ),
                            ),
                            Expanded(child: Divider(color: Color(0xFFEFE6D4))),
                          ],
                        ),
                      ),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F3EA),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(child: TextField(controller: _house, decoration: _sheetDec('House / flat', '12A'))),
                                  const SizedBox(width: 8),
                                  Expanded(child: TextField(controller: _building, decoration: _sheetDec('Building', 'Name'))),
                                ],
                              ),
                              const SizedBox(height: 8),
                              TextField(controller: _address, minLines: 2, maxLines: 3, decoration: _sheetDec('Street, area, city', 'Road, area, city')),
                            ],
                          ),
                        ),
                      ),
                      if (localError.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(localError, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13)),
                      ],
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () {
                          if (_house.text.trim().isEmpty && _building.text.trim().isEmpty) {
                            setSheet(() => localError = 'Add house / flat number or building name.');
                            return;
                          }
                          if (_address.text.trim().isEmpty) {
                            setSheet(() => localError = 'Add the area and city too.');
                            return;
                          }
                          Navigator.of(sheet).pop();
                          _goCheckout(widget.draft.isHotel ? _checkIn : _scheduledAt);
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFF4EFE4),
                          foregroundColor: const Color(0xFF12241F),
                          minimumSize: const Size.fromHeight(44),
                          shape: const StadiumBorder(),
                        ),
                        child: const Text('Continue with address'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _openExactMap() async {
    await _detect();
    if (!mounted || _lat == null || _lng == null) return;
    final picked = await Navigator.of(context).push<PickupResult>(
      MaterialPageRoute<PickupResult>(
        builder: (_) => PickupMapPage(
          lat: _lat!,
          lng: _lng!,
          house: _house.text,
          building: _building.text,
          address: _address.text,
        ),
      ),
    );
    if (!mounted || picked == null) return;
    setState(() {
      _house.text = picked.house;
      _building.text = picked.building;
      _address.text = picked.address;
      _lat = picked.lat;
      _lng = picked.lng;
    });
    _goCheckout(widget.draft.isHotel ? _checkIn : _scheduledAt);
  }

  Future<void> _detect() async {
    setState(() => _error = '');
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) throw Exception('Turn on location so we can send the vendor to you.');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('Turn on location so we can send the vendor to you.');
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 12)),
      );
      final uri = Uri.https('nominatim.openstreetmap.org', '/reverse', {
        'lat': position.latitude.toStringAsFixed(6),
        'lon': position.longitude.toStringAsFixed(6),
        'format': 'jsonv2',
        'addressdetails': '1',
        'zoom': '18',
        'accept-language': 'en',
      });
      final response = await http.get(uri, headers: {'User-Agent': 'BookItAll/1.0'});
      if (response.statusCode != 200) throw Exception('Could not read address');
      final json = jsonDecode(response.body);
      if (json is! Map) throw Exception('Could not read address');
      final address = json['address'];
      String pick(List<String> keys) {
        if (address is! Map) return '';
        for (final key in keys) {
          final value = address[key];
          if (value is String && value.trim().isNotEmpty) return value.trim();
        }
        return '';
      }

      final house = pick(['house_number', 'housenumber']);
      final rawBuilding = pick(['amenity', 'shop', 'office', 'tourism', 'leisure']);
      final named = json['name'] is String ? (json['name'] as String).trim() : '';
      final type = json['addresstype'] is String ? json['addresstype'] as String : '';
      const areas = {'suburb', 'village', 'hamlet', 'town', 'city', 'neighbourhood', 'neighborhood', 'road', 'county'};
      final building = rawBuilding.isNotEmpty && rawBuilding.toLowerCase() != 'yes'
          ? rawBuilding
          : named.isNotEmpty && named.toLowerCase() != 'yes' && !areas.contains(type)
            ? named
            : '';
      final road = pick(['road', 'pedestrian', 'neighbourhood', 'suburb']);
      final area = pick(['suburb', 'neighbourhood', 'city_district']);
      final city = pick(['city', 'town', 'village', 'county']);
      final state = pick(['state']);
      final full = [
        if (road.isNotEmpty) road,
        if (area.isNotEmpty && area != road) area,
        if (city.isNotEmpty) city,
        if (state.isNotEmpty) state,
      ].join(', ');
      if (!mounted) return;
      setState(() {
        if (house.isNotEmpty) _house.text = house;
        if (building.isNotEmpty) _building.text = building;
        _address.text = full.isNotEmpty ? full : '${position.latitude}, ${position.longitude}';
        _lat = position.latitude;
        _lng = position.longitude;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _pickDate({required bool checkIn}) async {
    final initial = DateTime.tryParse(checkIn ? _checkIn : _checkOut) ?? DateTime.now().add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    final value = '${picked.year}-${pad2(picked.month)}-${pad2(picked.day)}';
    setState(() {
      if (checkIn) {
        _checkIn = value;
      } else {
        _checkOut = value;
      }
    });
  }

  Future<void> _pickSlot() async {
    final parsed = DateTime.tryParse(_scheduledAt) ?? DateTime.now().add(const Duration(days: 1));
    final date = await showDatePicker(
      context: context,
      initialDate: parsed,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(parsed));
    if (time == null || !mounted) return;
    setState(() {
      _scheduledAt = '${date.year}-${pad2(date.month)}-${pad2(date.day)}T${pad2(time.hour)}:${pad2(time.minute)}';
    });
  }

  InputDecoration _dec(String hint) {
    return InputDecoration(
      hintText: hint,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }

  InputDecoration _sheetDec(String label, String hint) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEADFCD))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0F766E))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unit = priceUnitWord(widget.draft.priceUnit);
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: const Text('Book')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(widget.draft.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
          if (widget.draft.vendor.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(widget.draft.vendor, style: const TextStyle(color: AppColors.textMuted)),
          ],
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              text: inr(widget.draft.unitPrice),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
              children: [
                if (unit.isNotEmpty)
                  TextSpan(
                    text: '  $unit',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textMuted),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (_isStay) ...[
            if (widget.draft.isHotel)
              Row(
                children: [
                  Expanded(child: _tapField('Check-in', _checkIn, () => _pickDate(checkIn: true))),
                  const SizedBox(width: 12),
                  Expanded(child: _tapField('Check-out', _checkOut, () => _pickDate(checkIn: false))),
                ],
              )
            else
              _tapField('Travel date', _scheduledAt.substring(0, 10), () async {
                final parsed = DateTime.tryParse(_scheduledAt) ?? DateTime.now().add(const Duration(days: 1));
                final picked = await showDatePicker(
                  context: context,
                  initialDate: parsed,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked == null) return;
                setState(() => _scheduledAt = '${picked.year}-${pad2(picked.month)}-${pad2(picked.day)}T10:00');
              }),
            const SizedBox(height: 12),
            TextField(controller: _notes, decoration: _dec('Any special request')),
            const SizedBox(height: 8),
            const Text('Estimated before tax. Tax is added at checkout.', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFFFFDF8), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE6DCC8))),
              child: const Row(
                children: [
                  Icon(Icons.location_on_outlined, color: Color(0xFF0F766E)),
                  SizedBox(width: 10),
                  Expanded(child: Text('Your service location will be added after you tap Book now.', style: TextStyle(color: Color(0xFF5B6E68), height: 1.35))),
                ],
              ),
            ),
            if (widget.draft.isCab) ...[
              const SizedBox(height: 10),
              TextField(controller: _drop, decoration: _dec('Drop location')),
            ],
            if (_schedule) ...[
              const SizedBox(height: 12),
              _tapField('When', formatSlotLabel(_scheduledAt), _pickSlot),
            ],
          ],
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))),
          ],
          const SizedBox(height: 20),
          if (_isStay)
            FilledButton(
              onPressed: _openLocationSheet,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size.fromHeight(48),
                shape: const StadiumBorder(),
              ),
              child: const Text('Book now'),
            )
          else
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: _openLocationSheet,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size.fromHeight(48),
                      shape: const StadiumBorder(),
                    ),
                    child: const Text('Book now'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      if (!_schedule) {
                        setState(() => _schedule = true);
                      } else {
                        _openLocationSheet();
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      shape: const StadiumBorder(),
                      foregroundColor: AppColors.text,
                    ),
                    child: Text(_schedule ? 'Confirm' : 'Schedule'),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _tapField(String label, String value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: InputDecorator(
        decoration: InputDecoration(labelText: label),
        child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}
