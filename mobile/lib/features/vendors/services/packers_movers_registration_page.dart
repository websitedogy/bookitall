import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import '../../auth/auth_page.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';
import 'packers_movers_data.dart';

class PackersMoversRegistrationPage extends StatefulWidget {
  const PackersMoversRegistrationPage({super.key});

  @override
  State<PackersMoversRegistrationPage> createState() => _PackersMoversRegistrationPageState();
}

class _PackersMoversRegistrationPageState extends State<PackersMoversRegistrationPage> {
  final _picker = ImagePicker();
  int _step = 1;
  String _error = '';
  bool _saving = false;
  final _selected = <String>{};
  final _locations = [PackersLocation()];

  late final TextEditingController _customService;
  late final TextEditingController _business;
  late final TextEditingController _contact;
  late final TextEditingController _mobile;
  late final TextEditingController _address;
  XFile? _logo;

  @override
  void initState() {
    super.initState();
    final phone = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    _customService = TextEditingController();
    _business = TextEditingController();
    _contact = TextEditingController(text: SessionStore.fullName ?? '');
    _mobile = TextEditingController(text: phone.length > 10 ? phone.substring(phone.length - 10) : phone);
    _address = TextEditingController();
  }

  @override
  void dispose() {
    _customService.dispose();
    _business.dispose();
    _contact.dispose();
    _mobile.dispose();
    _address.dispose();
    super.dispose();
  }

  List<String> get _serviceLabels {
    return [
      for (final id in _selected)
        if (id == 'other')
          _customService.text.trim().isEmpty ? 'Other' : _customService.text.trim()
        else
          packersServiceById(id)?.name ?? id,
    ];
  }

  String? _validate([int? at]) {
    final step = at ?? _step;
    if (step == 1) {
      if (_selected.isEmpty) return 'Select at least one service type.';
      if (_selected.contains('other') && _customService.text.trim().isEmpty) return 'Enter the other service type.';
      final valid = _locations.where((item) => item.state.isNotEmpty && item.districts.isNotEmpty);
      if (valid.isEmpty) return 'Select a state and at least one district.';
      if (_locations.any((item) => item.state.isNotEmpty && item.districts.isEmpty)) {
        return 'Select districts for each added location.';
      }
      return null;
    }
    if (_business.text.trim().isEmpty) return 'Enter the business / vendor name.';
    if (_contact.text.trim().isEmpty) return 'Enter the contact person name.';
    if (!RegExp(r'^\d{10}$').hasMatch(_mobile.text.replaceAll(RegExp(r'\s'), ''))) {
      return 'Enter a 10-digit mobile number.';
    }
    if (_address.text.trim().isEmpty) return 'Enter the business address.';
    if (_logo == null) return 'Upload a business logo / profile photo.';
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
      final valid = _locations.where((item) => item.state.isNotEmpty && item.districts.isNotEmpty).toList();
      final coverage = formatPackersLocations(valid);
      await submitVendorListing(
        category: 'packers-movers',
        fields: {
          'companyName': _business.text.trim(),
          'businessName': _business.text.trim(),
          'ownerName': _contact.text.trim(),
          'mobileNumber': _mobile.text.replaceAll(RegExp(r'\s'), ''),
          'address': _address.text.trim(),
          'location': coverage.isEmpty ? _address.text.trim() : coverage,
          'serviceType': _serviceLabels.join(', '),
          'serviceLocations': valid
              .map((item) => '${item.state}:${item.districts.join("|")}')
              .join('; '),
          'state': valid.isEmpty ? '' : valid.first.state,
          'district': valid.expand((item) => item.districts).join(', '),
          'coverage': coverage,
        },
        photoPaths: [_logo!.path],
      );
      PostsRefresh.bump();
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ListingSavedPage(name: _business.text.trim(), location: coverage),
        ),
      );
    } catch (err) {
      setState(() => _error = err.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickLogo() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file != null) setState(() => _logo = file);
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
                const Text('Sign in to register Packers & Movers', textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
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
      categoryId: 'packers-movers',
      categoryTitle: _step == 1 ? 'Service & Location' : 'Vendor Details',
      step: _step,
      stepCount: 2,
      steps: const ['Service & Location', 'Vendor Details'],
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
          if (_step == 1) ..._serviceFields(),
          if (_step == 2) ..._vendorFields(),
        ],
      ),
    );
  }

  List<Widget> _serviceFields() {
    return [
      const Text('Service Type *', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      for (final item in packersServiceTypes)
        CheckboxListTile(
          value: _selected.contains(item.id),
          onChanged: (value) {
            setState(() {
              if (value == true) {
                _selected.add(item.id);
              } else {
                _selected.remove(item.id);
              }
            });
          },
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          secondary: CircleAvatar(backgroundColor: item.tint, child: Icon(item.icon, color: item.iconColor, size: 20)),
          title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
      if (_selected.contains('other'))
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: TextField(
            controller: _customService,
            decoration: const InputDecoration(labelText: 'Enter other service type *', border: OutlineInputBorder()),
          ),
        ),
      const SizedBox(height: 8),
      const Text('Service Location *', style: TextStyle(fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      for (var index = 0; index < _locations.length; index++) _locationCard(index),
      TextButton.icon(
        onPressed: () => setState(() => _locations.add(PackersLocation())),
        icon: const Icon(Icons.add),
        label: const Text('Add Location'),
      ),
    ];
  }

  Widget _locationCard(int index) {
    final location = _locations[index];
    final districts = packersDistricts(location.state);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Location ${index + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
              const Spacer(),
              if (_locations.length > 1)
                TextButton(
                  onPressed: () => setState(() => _locations.removeAt(index)),
                  child: const Text('Remove'),
                ),
            ],
          ),
          InputDecorator(
            decoration: const InputDecoration(labelText: 'Select State *', border: OutlineInputBorder()),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: location.state.isEmpty ? null : location.state,
                isExpanded: true,
                hint: const Text('Select state'),
                items: [for (final state in packersStates()) DropdownMenuItem(value: state, child: Text(state))],
                onChanged: (next) {
                  if (next == null) return;
                  setState(() {
                    location.state = next;
                    location.districts = [];
                  });
                },
              ),
            ),
          ),
          if (location.state.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Districts', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 0,
              children: [
                for (final district in districts)
                  FilterChip(
                    label: Text(district),
                    selected: location.districts.contains(district),
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          location.districts.add(district);
                        } else {
                          location.districts.remove(district);
                        }
                      });
                    },
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _vendorFields() {
    return [
      _field('Business / Vendor Name', _business, hint: 'SafeShift Hyd'),
      _field('Contact Person Name', _contact, hint: 'Ravi Kumar'),
      _field('Mobile Number', _mobile, hint: '9876543210', number: true),
      _field('Business Address', _address, hint: 'Shop / warehouse, street, area, city', lines: 3),
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Material(
          color: const Color(0xFFF8FAFC),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
          child: InkWell(
            onTap: _pickLogo,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(_logo == null ? Icons.add_photo_alternate_outlined : Icons.check_circle, color: _logo == null ? AppColors.textMuted : AppColors.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _logo == null ? 'Upload business logo / profile photo *' : _logo!.name,
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
      ),
    ];
  }

  Widget _field(String label, TextEditingController controller, {String hint = '', bool number = false, int lines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: lines,
        keyboardType: number ? TextInputType.number : (lines > 1 ? TextInputType.multiline : TextInputType.text),
        inputFormatters: [if (number) FilteringTextInputFormatter.digitsOnly],
        decoration: InputDecoration(labelText: '$label *', hintText: hint, border: const OutlineInputBorder()),
      ),
    );
  }
}
