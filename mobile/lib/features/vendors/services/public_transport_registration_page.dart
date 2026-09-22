import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import '../../auth/auth_page.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';
import 'public_transport_data.dart';

class PublicTransportRegistrationPage extends StatefulWidget {
  const PublicTransportRegistrationPage({super.key, required this.vehicle});

  final PublicTransportType vehicle;

  @override
  State<PublicTransportRegistrationPage> createState() => _PublicTransportRegistrationPageState();
}

class _PublicTransportRegistrationPageState extends State<PublicTransportRegistrationPage> {
  final _picker = ImagePicker();
  int _step = 1;
  String _error = '';
  bool _saving = false;

  late final TextEditingController _reg;
  late final TextEditingController _make;
  late final TextEditingController _model;
  late final TextEditingController _seats;
  late final TextEditingController _price;
  late final TextEditingController _name;
  late final TextEditingController _mobile;
  late final TextEditingController _address;
  late final TextEditingController _licenceNo;
  late final TextEditingController _extra;

  String _year = '';
  String _service = '';
  DateTime? _dob;
  XFile? _licence;
  XFile? _rc;
  XFile? _insurance;
  XFile? _puc;
  XFile? _profile;

  @override
  void initState() {
    super.initState();
    final phone = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    _reg = TextEditingController();
    _make = TextEditingController();
    _model = TextEditingController();
    _seats = TextEditingController(text: widget.vehicle.seats);
    _price = TextEditingController();
    _name = TextEditingController(text: SessionStore.fullName ?? '');
    _mobile = TextEditingController(text: phone.length > 10 ? phone.substring(phone.length - 10) : phone);
    _address = TextEditingController();
    _licenceNo = TextEditingController();
    _extra = TextEditingController();
  }

  @override
  void dispose() {
    _reg.dispose();
    _make.dispose();
    _model.dispose();
    _seats.dispose();
    _price.dispose();
    _name.dispose();
    _mobile.dispose();
    _address.dispose();
    _licenceNo.dispose();
    _extra.dispose();
    super.dispose();
  }

  String? _validate([int? at]) {
    final step = at ?? _step;
    if (step == 1) {
      if (_reg.text.trim().isEmpty) return 'Enter the vehicle registration number.';
      if (_make.text.trim().isEmpty) return 'Enter the vehicle make.';
      if (_model.text.trim().isEmpty) return 'Enter the vehicle model.';
      if (_year.isEmpty) return 'Choose the manufacturing year.';
      if ((int.tryParse(_seats.text) ?? 0) <= 0) return 'Enter seating capacity.';
      if (_service.isEmpty) return 'Choose Local or Outstation.';
      if ((int.tryParse(_price.text) ?? 0) <= 0) return 'Enter a starting price.';
      return null;
    }
    if (step == 2) {
      if (_name.text.trim().isEmpty) return 'Enter the driver full name.';
      if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
        return 'Enter a 10-digit mobile number.';
      }
      if (_dob == null) return 'Enter date of birth.';
      if (_address.text.trim().isEmpty) return 'Enter the address.';
      if (_licenceNo.text.trim().isEmpty) return 'Enter the driving licence number.';
      return null;
    }
    if (_licence == null) return 'Upload the driving licence.';
    if (_rc == null) return 'Upload the RC.';
    if (_insurance == null) return 'Upload the insurance.';
    if (_puc == null) return 'Upload the PUC.';
    if (_profile == null) return 'Upload a profile photo.';
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
      final dob = _dob!;
      final fields = {
        'vehicleType': widget.vehicle.name,
        'vehicleNumber': _reg.text.trim().toUpperCase(),
        'vehicleMake': _make.text.trim(),
        'vehicleModel': _model.text.trim(),
        'manufacturingYear': _year,
        'seats': _seats.text.trim(),
        'serviceType': _service,
        'price': _price.text.trim(),
        'priceUnit': 'PER_TRIP',
        'driverName': _name.text.trim(),
        'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
        'dateOfBirth':
            '${dob.year.toString().padLeft(4, '0')}-${dob.month.toString().padLeft(2, '0')}-${dob.day.toString().padLeft(2, '0')}',
        'address': _address.text.trim(),
        'location': _address.text.trim(),
        'drivingLicenceNumber': _licenceNo.text.trim().toUpperCase(),
        if (_extra.text.trim().isNotEmpty) 'description': _extra.text.trim(),
      };
      await submitVendorListing(
        category: 'public-transport',
        fields: fields,
        photoPaths: [_profile!.path],
        licensePath: _licence!.path,
        extraFiles: {
          'rc': _rc!.path,
          'insurance': _insurance!.path,
          'puc': _puc!.path,
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

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 25),
      firstDate: DateTime(1950),
      lastDate: DateTime(now.year - 16),
    );
    if (picked != null) setState(() => _dob = picked);
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
                const Text('Same form for Auto, Car, Mini Bus, Bus and Van.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)),
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
      categoryId: 'public-transport',
      categoryTitle: '${widget.vehicle.name} · ${switch (_step) { 1 => 'Vehicle Details', 2 => 'Driver Details', _ => 'Documents' }}',
      step: _step,
      steps: const ['Vehicle', 'Driver', 'Documents'],
      error: _error,
      primaryBusy: _saving,
      primaryLabel: _step < 3 ? 'Next' : 'Submit Registration',
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
      _field('Vehicle Registration Number', _reg, hint: 'TS09 AB 1234', caps: true),
      _field('Vehicle Make', _make, hint: 'Bajaj / Maruti / Tata'),
      _field('Vehicle Model', _model, hint: 'RE / Swift / Winger'),
      _dropdown('Manufacturing Year', _year, manufacturingYears, (value) => setState(() => _year = value)),
      _field('Seating Capacity', _seats, hint: widget.vehicle.seats, number: true),
      const SizedBox(height: 8),
      const Text('Service *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Row(
        children: [
          for (final item in publicTransportServices)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(item),
                  selected: _service == item,
                  onSelected: (_) => setState(() => _service = item),
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(color: _service == item ? Colors.white : AppColors.text, fontWeight: FontWeight.w600),
                ),
              ),
            ),
        ],
      ),
      _field('Starting price (₹)', _price, hint: '499', number: true),
    ];
  }

  List<Widget> _driverFields() {
    return [
      _field('Full Name', _name, hint: 'Ravi Kumar'),
      _field('Mobile Number', _mobile, hint: '9876543210', number: true),
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: _pickDob,
          child: InputDecorator(
            decoration: const InputDecoration(labelText: 'Date of Birth *', border: OutlineInputBorder()),
            child: Text(
              _dob == null ? 'Select date' : '${_dob!.day}/${_dob!.month}/${_dob!.year}',
              style: TextStyle(color: _dob == null ? AppColors.textMuted : AppColors.text),
            ),
          ),
        ),
      ),
      _field('Driving Licence Number', _licenceNo, hint: 'TS09 20200012345', caps: true),
      _field('Address', _address, hint: 'House no, street, area, city', lines: 3),
    ];
  }

  List<Widget> _documentFields() {
    return [
      _fileTile('Driving Licence', _licence, () => _pick((file) => _licence = file)),
      _fileTile('RC', _rc, () => _pick((file) => _rc = file)),
      _fileTile('Insurance', _insurance, () => _pick((file) => _insurance = file)),
      _fileTile('PUC', _puc, () => _pick((file) => _puc = file)),
      _fileTile('Profile Photo', _profile, () => _pick((file) => _profile = file)),
      _field('Additional details', _extra, hint: 'Optional — routes, night service, luggage', lines: 4, required: false),
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
    bool required = true,
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
          labelText: required ? '$label *' : label,
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
