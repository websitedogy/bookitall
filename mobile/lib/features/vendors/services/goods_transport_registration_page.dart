import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import '../../auth/auth_page.dart';
import 'goods_transport_data.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';

class GoodsTransportRegistrationPage extends StatefulWidget {
  const GoodsTransportRegistrationPage({super.key, required this.vehicle});

  final GoodsTransportType vehicle;

  @override
  State<GoodsTransportRegistrationPage> createState() => _GoodsTransportRegistrationPageState();
}

class _GoodsTransportRegistrationPageState extends State<GoodsTransportRegistrationPage> {
  final _picker = ImagePicker();
  int _step = 1;
  String _error = '';
  bool _saving = false;
  bool _isOwner = true;

  late final TextEditingController _customType;
  late final TextEditingController _reg;
  late final TextEditingController _make;
  late final TextEditingController _model;
  late final TextEditingController _capacity;
  late final TextEditingController _price;
  late final TextEditingController _name;
  late final TextEditingController _mobile;
  late final TextEditingController _licenceNo;
  late final TextEditingController _address;
  late final TextEditingController _ownerName;
  late final TextEditingController _driverName;
  late final TextEditingController _driverMobile;

  String _year = '';
  XFile? _front;
  XFile? _side;
  XFile? _profile;
  XFile? _licence;
  XFile? _rc;
  XFile? _insurance;
  XFile? _puc;
  XFile? _permit;
  XFile? _vehiclePhoto;

  bool get _needsPermit => widget.vehicle.needsPermit;

  String get _typeLabel {
    if (widget.vehicle.id == 'other') {
      final custom = _customType.text.trim();
      return custom.isEmpty ? 'Other' : custom;
    }
    return widget.vehicle.name;
  }

  @override
  void initState() {
    super.initState();
    final phone = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    _customType = TextEditingController();
    _reg = TextEditingController();
    _make = TextEditingController();
    _model = TextEditingController();
    _capacity = TextEditingController();
    _price = TextEditingController();
    _name = TextEditingController(text: SessionStore.fullName ?? '');
    _mobile = TextEditingController(text: phone.length > 10 ? phone.substring(phone.length - 10) : phone);
    _licenceNo = TextEditingController();
    _address = TextEditingController();
    _ownerName = TextEditingController();
    _driverName = TextEditingController();
    _driverMobile = TextEditingController();
  }

  @override
  void dispose() {
    _customType.dispose();
    _reg.dispose();
    _make.dispose();
    _model.dispose();
    _capacity.dispose();
    _price.dispose();
    _name.dispose();
    _mobile.dispose();
    _licenceNo.dispose();
    _address.dispose();
    _ownerName.dispose();
    _driverName.dispose();
    _driverMobile.dispose();
    super.dispose();
  }

  String? _validate([int? at]) {
    final step = at ?? _step;
    if (step == 1) {
      if (widget.vehicle.id == 'other' && _customType.text.trim().isEmpty) return 'Enter the vehicle type.';
      if (_reg.text.trim().isEmpty) return 'Enter the vehicle registration number.';
      if (_make.text.trim().isEmpty) return 'Enter the vehicle make / brand.';
      if (_model.text.trim().isEmpty) return 'Enter the vehicle model.';
      if (_year.isEmpty) return 'Choose the manufacturing year.';
      if (_capacity.text.trim().isEmpty) return 'Enter load capacity.';
      if ((int.tryParse(_price.text) ?? 0) <= 0) return 'Enter a starting price.';
      if (_front == null) return 'Upload the front vehicle photo.';
      if (_side == null) return 'Upload the side vehicle photo.';
      return null;
    }
    if (step == 2) {
      if (_name.text.trim().isEmpty) return 'Enter the full name.';
      if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
        return 'Enter a 10-digit mobile number.';
      }
      if (_licenceNo.text.trim().isEmpty) return 'Enter the driving licence number.';
      if (_address.text.trim().isEmpty) return 'Enter the address.';
      if (_profile == null) return 'Upload a profile photo.';
      if (!_isOwner) {
        if (_ownerName.text.trim().isEmpty) return 'Enter the vehicle owner name.';
        if (_driverName.text.trim().isEmpty) return 'Enter the driver name.';
        if (!RegExp(r'^\d{10}$').hasMatch(_driverMobile.text.replaceAll(RegExp(r'\s'), ''))) {
          return 'Enter the driver mobile number.';
        }
      }
      return null;
    }
    if (_rc == null) return 'Upload the RC.';
    if (_licence == null) return 'Upload the driving licence.';
    if (_insurance == null) return 'Upload the vehicle insurance.';
    if (_puc == null) return 'Upload the PUC certificate.';
    if (_needsPermit && _permit == null) return 'Upload the permit.';
    if (_vehiclePhoto == null) return 'Upload a vehicle photo.';
    return null;
  }

  void _goToStep(int next) {
    if (next == _step) return;
    if (next > _step) {
      for (var at = _step; at < next; at++) {
        final message = _validate(at);
        if (message != null) {
          setState(() => _error = message);
          return;
        }
      }
    }
    setState(() {
      _error = '';
      _step = next;
    });
  }

  void _next() => _goToStep(_step + 1);

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
      final fields = {
        'vehicleType': _typeLabel,
        'vehicleNumber': _reg.text.trim().toUpperCase(),
        'vehicleMake': _make.text.trim(),
        'vehicleModel': _model.text.trim(),
        'manufacturingYear': _year,
        'loadCapacity': _capacity.text.trim(),
        'price': _price.text.trim(),
        'priceUnit': 'PER_TRIP',
        'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
        'drivingLicenceNumber': _licenceNo.text.trim().toUpperCase(),
        'address': _address.text.trim(),
        'location': _address.text.trim(),
        'ownerSame': _isOwner ? 'yes' : 'no',
        'driverName': _isOwner ? _name.text.trim() : _driverName.text.trim(),
        'ownerName': _isOwner ? _name.text.trim() : _ownerName.text.trim(),
        if (!_isOwner) 'driverMobile': _driverMobile.text.replaceAll(RegExp(r'\s'), ''),
      };
      await submitVendorListing(
        category: 'goods-transport',
        fields: fields,
        photoPaths: [_front!.path, _side!.path, _vehiclePhoto!.path, _profile!.path],
        licensePath: _licence!.path,
        extraFiles: {
          'rc': _rc!.path,
          'insurance': _insurance!.path,
          'puc': _puc!.path,
          if (_permit != null) 'permit': _permit!.path,
        },
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: _name.text.trim(), location: _address.text.trim()),
        ),
      );
    } catch (err) {
      setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pick(void Function(XFile file) assign) async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file != null) setState(() => assign(file));
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
                Text('Sign in to register ${widget.vehicle.name}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                const Text('Same form for Tata Ace to Heavy Truck, or Other.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)),
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
      categoryId: 'goods-transport',
      categoryTitle: '$_typeLabel · ${switch (_step) { 1 => 'Vehicle Details', 2 => 'Vendor / Driver', _ => 'Documents' }}',
      step: _step,
      steps: const ['Vehicle', 'Vendor / Driver', 'Documents'],
      error: _error,
      primaryBusy: _saving,
      primaryLabel: _step < 3 ? 'Next' : 'Submit for Verification',
      onPrimary: _step < 3 ? _next : _submit,
      onSelectStep: _goToStep,
      onBack: () {
        if (_step > 1) {
          _goToStep(_step - 1);
        } else {
          Navigator.of(context).maybePop();
        }
      },
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          if (_step == 1) ..._vehicleFields(),
          if (_step == 2) ..._driverFields(),
          if (_step == 3) ..._documentFields(),
        ],
      ),
    );
  }

  List<Widget> _vehicleFields() {
    return [
      _lockedType(),
      if (widget.vehicle.id == 'other') _field('Enter Vehicle Type', _customType, hint: 'e.g. Bolero Pickup'),
      _field('Vehicle Registration Number', _reg, hint: 'TS09 AB 1234', caps: true),
      _field('Vehicle Make / Brand', _make, hint: 'Tata / Ashok Leyland / Eicher'),
      _field('Vehicle Model', _model, hint: 'Ace / 407 / 1616'),
      _dropdown('Manufacturing Year', _year, goodsYears, (value) => setState(() => _year = value)),
      _field('Load Capacity', _capacity, hint: '1 ton / 3 ton / 9 ton'),
      _field('Starting price (₹)', _price, hint: '1499', number: true),
      _fileTile('Vehicle Photo — Front', _front, () => _pick((file) => _front = file)),
      _fileTile('Vehicle Photo — Side', _side, () => _pick((file) => _side = file)),
    ];
  }

  List<Widget> _driverFields() {
    return [
      CheckboxListTile(
        value: _isOwner,
        onChanged: (value) => setState(() => _isOwner = value ?? true),
        controlAffinity: ListTileControlAffinity.leading,
        contentPadding: EdgeInsets.zero,
        title: const Text('I am the Vehicle Owner', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      _field('Full Name', _name, hint: 'Ravi Kumar'),
      _field('Mobile Number', _mobile, hint: '9876543210', number: true),
      _field('Driving Licence Number', _licenceNo, hint: 'TS09 20200012345', caps: true),
      _field('Address', _address, hint: 'House no, street, area, city', lines: 3),
      _fileTile('Profile Photo', _profile, () => _pick((file) => _profile = file)),
      if (!_isOwner) ...[
        _field('Vehicle Owner Name', _ownerName, hint: 'Owner full name'),
        _field('Driver Name', _driverName, hint: 'Driver full name'),
        _field('Driver Mobile Number', _driverMobile, hint: '9876543210', number: true),
      ],
    ];
  }

  List<Widget> _documentFields() {
    return [
      _fileTile('RC (Registration Certificate)', _rc, () => _pick((file) => _rc = file)),
      _fileTile('Driving Licence', _licence, () => _pick((file) => _licence = file)),
      _fileTile('Vehicle Insurance', _insurance, () => _pick((file) => _insurance = file)),
      _fileTile('PUC Certificate', _puc, () => _pick((file) => _puc = file)),
      if (_needsPermit) _fileTile('Permit', _permit, () => _pick((file) => _permit = file)),
      _fileTile('Vehicle Photo', _vehiclePhoto, () => _pick((file) => _vehiclePhoto = file)),
    ];
  }

  Widget _lockedType() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(color: widget.vehicle.tint, borderRadius: BorderRadius.circular(12)),
            child: Icon(widget.vehicle.icon, color: widget.vehicle.iconColor),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Vehicle Type', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              Text(widget.vehicle.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    String hint = '',
    bool number = false,
    bool caps = false,
    int lines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: lines,
        keyboardType: number ? TextInputType.number : (lines > 1 ? TextInputType.multiline : TextInputType.text),
        inputFormatters: [
          if (number) FilteringTextInputFormatter.digitsOnly,
          if (caps) TextInputFormatter.withFunction((old, next) => next.copyWith(text: next.text.toUpperCase())),
        ],
        decoration: InputDecoration(
          labelText: '$label *',
          hintText: hint,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  Widget _dropdown(String label, String value, List<String> options, ValueChanged<String> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InputDecorator(
        decoration: InputDecoration(labelText: '$label *', border: const OutlineInputBorder()),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value.isEmpty ? null : value,
            isExpanded: true,
            hint: const Text('Select'),
            items: [for (final item in options) DropdownMenuItem(value: item, child: Text(item))],
            onChanged: (next) {
              if (next != null) onChanged(next);
            },
          ),
        ),
      ),
    );
  }

  Widget _fileTile(String label, XFile? file, VoidCallback onPick) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: const Color(0xFFF8FAFC),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        child: InkWell(
          onTap: onPick,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(file == null ? Icons.add_photo_alternate_outlined : Icons.check_circle, color: file == null ? AppColors.textMuted : AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    file == null ? 'Upload $label *' : file.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
