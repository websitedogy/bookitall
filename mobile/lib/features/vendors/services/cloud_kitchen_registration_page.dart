import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import '../../auth/auth_page.dart';
import 'cloud_kitchen_form_data.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';
import 'vendor_form_draft.dart';
import 'vendor_location_picker.dart';

class CloudKitchenRegistrationPage extends StatefulWidget {
  const CloudKitchenRegistrationPage({super.key});

  @override
  State<CloudKitchenRegistrationPage> createState() => _CloudKitchenRegistrationPageState();
}

class _FoodRow {
  _FoodRow({String name = '', String amount = ''})
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

class _CloudKitchenRegistrationPageState extends State<CloudKitchenRegistrationPage> {
  final _picker = ImagePicker();
  final _kitchen = TextEditingController();
  final _owner = TextEditingController();
  final _mobile = TextEditingController();
  final _address = TextEditingController();
  final _rows = <_FoodRow>[];
  final _photos = <XFile>[];
  XFile? _logo;
  int _step = 1;
  String _error = '';
  String _district = '';
  double? _lat;
  double? _lng;
  bool _detecting = false;
  bool _saving = false;
  Timer? _saveTimer;

  @override
  void initState() {
    super.initState();
    final phone = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    _owner.text = SessionStore.fullName ?? '';
    _mobile.text = phone.length > 10 ? phone.substring(phone.length - 10) : phone;
    for (final name in defaultCloudKitchenFoods) {
      final row = _FoodRow(name: name);
      _bindRow(row);
      _rows.add(row);
    }
    for (final controller in [_kitchen, _owner, _mobile, _address]) {
      controller.addListener(_scheduleSave);
    }
    _restoreDraft();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    for (final controller in [_kitchen, _owner, _mobile, _address]) {
      controller.dispose();
    }
    for (final row in _rows) {
      row.dispose();
    }
    super.dispose();
  }

  void _bindRow(_FoodRow row) {
    row.name.addListener(_scheduleSave);
    row.amount.addListener(_scheduleSave);
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), _persistDraft);
  }

  Future<void> _persistDraft() async {
    await VendorFormDraft.save('cloud-kitchen', {
      'step': _step,
      'kitchen': _kitchen.text,
      'owner': _owner.text,
      'mobile': _mobile.text,
      'address': _address.text,
      'district': _district,
      'lat': _lat,
      'lng': _lng,
      'rows': _rows.map((row) => row.toJson()).toList(),
      'logo': _logo?.path,
      'photos': _photos.map((file) => file.path).toList(),
    });
  }

  Future<void> _restoreDraft() async {
    final draft = await VendorFormDraft.load('cloud-kitchen');
    if (!mounted || draft.isEmpty) return;
    setState(() {
      _step = draft['step'] is num ? (draft['step'] as num).toInt().clamp(1, 2) : _step;
      _kitchen.text = draft['kitchen']?.toString() ?? _kitchen.text;
      _owner.text = draft['owner']?.toString() ?? _owner.text;
      _mobile.text = draft['mobile']?.toString() ?? _mobile.text;
      _address.text = draft['address']?.toString() ?? '';
      _district = draft['district']?.toString() ?? '';
      _lat = draft['lat'] is num ? (draft['lat'] as num).toDouble() : _lat;
      _lng = draft['lng'] is num ? (draft['lng'] as num).toDouble() : _lng;
      final logo = draft['logo']?.toString() ?? '';
      if (logo.isNotEmpty) _logo = XFile(logo);
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
            final row = _FoodRow(name: '${map['name'] ?? ''}', amount: '${map['amount'] ?? ''}');
            _bindRow(row);
            return row;
          }));
      }
    });
  }

  List<_FoodRow> get _filled =>
      _rows.where((row) => row.name.text.trim().isNotEmpty && row.amount.text.trim().isNotEmpty).toList();

  void _addRow() {
    final row = _FoodRow();
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
      pinLabel: 'Kitchen location',
      initialLabel: _address.text,
      initialLat: _lat,
      initialLng: _lng,
    );
    if (!mounted || found == null) return;
    setState(() {
      _error = '';
      _address.text = found.label;
      _lat = found.lat;
      _lng = found.lng;
      if (found.district.isNotEmpty) _district = found.district;
    });
    _scheduleSave();
  }

  Future<void> _pickLogo() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() => _logo = file);
    _scheduleSave();
  }

  Future<void> _pickPhotos() async {
    final picked = await _picker.pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() => _photos.addAll(picked));
    _scheduleSave();
  }

  String? _validate([int? at]) {
    final step = at ?? _step;
    if (step == 1) {
      if (_filled.isEmpty) return 'Add at least one food type with price.';
      for (final row in _rows) {
        if (row.name.text.trim().isNotEmpty && row.amount.text.trim().isEmpty) {
          return 'Enter price for ${row.name.text.trim()}.';
        }
        if (row.name.text.trim().isEmpty && row.amount.text.trim().isNotEmpty) {
          return 'Enter food type.';
        }
      }
      if (_address.text.trim().isEmpty) return 'Add kitchen address or use current location.';
      return null;
    }
    if (_kitchen.text.trim().isEmpty) return 'Enter the cloud kitchen name.';
    if (_owner.text.trim().isEmpty) return 'Enter the owner / contact person name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_logo == null) return 'Upload a kitchen logo / profile photo.';
    return null;
  }

  void _goToStep(int next) {
    if (next == _step) return;
    if (next > _step) {
      final message = _validate(_step);
      if (message != null) {
        setState(() => _error = message);
        return;
      }
    }
    setState(() {
      _error = '';
      _step = next;
    });
    _scheduleSave();
  }

  void _next() => _goToStep(2);

  Future<void> _submit() async {
    final message = _validate();
    if (message != null) {
      setState(() => _error = message);
      return;
    }
    if (!SessionStore.isSignedIn) {
      await Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AuthPage()));
      if (!SessionStore.isSignedIn || !mounted) return;
    }
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final foods = _filled.map((row) => '${row.name.text.trim()} ₹${row.amount.text.trim()}').join('; ');
      await submitVendorListing(
        category: 'cloud-kitchen',
        fields: {
          'kitchenName': _kitchen.text.trim(),
          'ownerName': _owner.text.trim(),
          'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
          'cuisineType': _filled.map((row) => row.name.text.trim()).join(', '),
          'kitchenType': 'Cloud kitchen',
          'serviceType': _filled.map((row) => row.name.text.trim()).join(', '),
          'foodTypes': jsonEncode(_filled.map((row) => row.toJson()).toList()),
          'servicesOffered': foods,
          'price': _filled.first.amount.text.trim(),
          'priceUnit': 'PER_ORDER',
          'address': _address.text.trim(),
          'location': _address.text.trim(),
          'district': _district,
          'city': _district,
          'area': _address.text.trim(),
          if (_lat != null) 'latitude': _lat.toString(),
          if (_lng != null) 'longitude': _lng.toString(),
        },
        photoPaths: [_logo!.path, ..._photos.map((file) => file.path)].take(40).toList(),
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: _kitchen.text.trim(), location: _address.text.trim()),
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
    if (!SessionStore.isSignedIn) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Sign in to register Cloud Kitchen', textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AuthPage())),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary, minimumSize: const Size.fromHeight(48), shape: const StadiumBorder()),
                  child: const Text('Sign in to continue'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ListingWizardScaffold(
      categoryId: 'cloud-kitchen',
      categoryTitle: _step == 1 ? 'Food & Location' : 'Vendor Details',
      step: _step,
      stepCount: 2,
      steps: const ['Food & Location', 'Vendor Details'],
      error: _error,
      primaryBusy: _saving,
      primaryLabel: _step < 2 ? 'Next' : 'Register',
      onPrimary: _step < 2 ? _next : _submit,
      onSelectStep: _goToStep,
      onBack: () {
        if (_step > 1) {
          _goToStep(1);
        } else {
          Navigator.of(context).maybePop();
        }
      },
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          if (_step == 1) ..._foodFields(),
          if (_step == 2) ..._vendorFields(),
        ],
      ),
    );
  }

  List<Widget> _foodFields() {
    return [
      const Text('Food Type + Price *', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 10),
      Row(
        children: [
          const Expanded(child: Text('Food type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
          const SizedBox(width: 8),
          SizedBox(width: 100, child: Text('Price', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
          const SizedBox(width: 50),
        ],
      ),
      const SizedBox(height: 6),
      for (var i = 0; i < _rows.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Expanded(child: _boxField(_rows[i].name, hint: i == 0 ? '🍱 Meals' : i == 1 ? '🍔 Fast Food' : 'Food type')),
              const SizedBox(width: 8),
              SizedBox(width: 100, child: _boxField(_rows[i].amount, hint: '₹ ___', keyboard: TextInputType.number, digits: 6)),
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
      Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(
          onPressed: _addRow,
          icon: const Icon(Icons.add),
          label: const Text('Add Food Type + Price'),
        ),
      ),
      const SizedBox(height: 12),
      const Text('Service Location *', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      SizedBox(
        width: double.infinity,
        height: 44,
        child: OutlinedButton.icon(
          onPressed: _detecting ? null : _detect,
          icon: const Icon(Icons.location_on_outlined, size: 18),
          label: Text(_detecting ? 'Detecting…' : _address.text.trim().isEmpty ? 'Use Current Location' : 'Change location'),
        ),
      ),
      const SizedBox(height: 12),
      TextField(
        controller: _address,
        minLines: 3,
        maxLines: 5,
        decoration: const InputDecoration(
          labelText: 'Kitchen Address *',
          hintText: 'Kitchen, street, area, city',
          border: OutlineInputBorder(),
        ),
      ),
    ];
  }

  List<Widget> _vendorFields() {
    return [
      _field('Cloud Kitchen Name', _kitchen, hint: 'Spice Cloud'),
      _field('Owner / Contact Person Name', _owner, hint: 'Ravi Kumar'),
      _field('Mobile Number', _mobile, hint: '9876543210', number: true),
      _fileTile(
        _logo == null ? 'Kitchen Logo / Profile Photo *' : _logo!.name,
        picked: _logo != null,
        onTap: _pickLogo,
      ),
      const SizedBox(height: 8),
      const Text('Food / Kitchen Photos', style: TextStyle(fontWeight: FontWeight.w600)),
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
                  Text('Add photos', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                ],
              ),
            ),
          ),
        ],
      ),
    ];
  }

  Widget _fileTile(String label, {required bool picked, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: const Color(0xFFF8FAFC),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(picked ? Icons.check_circle : Icons.add_photo_alternate_outlined, color: picked ? AppColors.primary : AppColors.textMuted),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
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

  Widget _field(String label, TextEditingController controller, {String hint = '', bool number = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: number ? TextInputType.number : TextInputType.text,
        inputFormatters: [if (number) FilteringTextInputFormatter.digitsOnly, if (number) LengthLimitingTextInputFormatter(10)],
        decoration: InputDecoration(labelText: '$label *', hintText: hint, border: const OutlineInputBorder()),
      ),
    );
  }

  Widget _boxField(TextEditingController controller, {String? hint, TextInputType? keyboard, int? digits}) {
    return TextField(
      controller: controller,
      keyboardType: keyboard,
      inputFormatters: [if (digits != null) FilteringTextInputFormatter.digitsOnly, if (digits != null) LengthLimitingTextInputFormatter(digits)],
      decoration: InputDecoration(
        isDense: true,
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFD7DDE6))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFD7DDE6))),
      ),
    );
  }
}
