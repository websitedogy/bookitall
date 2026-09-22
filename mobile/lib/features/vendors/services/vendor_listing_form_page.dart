import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../data/api.dart';
import '../../../data/catalog.dart';
import '../../../theme/app_colors.dart';
import 'listing_draft.dart';
import 'listing_wizard_chrome.dart';
import 'upload_photos_page.dart';
import 'vendor_form_draft.dart';
import 'vendor_form_config.dart';

class VendorListingFormPage extends StatefulWidget {
  const VendorListingFormPage({super.key, required this.service, required this.config});

  final ServiceItem service;
  final VendorFormConfig config;

  @override
  State<VendorListingFormPage> createState() => _VendorListingFormPageState();
}

class _VendorListingFormPageState extends State<VendorListingFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final Map<String, TextEditingController> _controllers;
  final Map<String, String> _selects = {};
  final Map<String, String> _priceUnits = {};
  Timer? _saveTimer;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _controllers = {};
    for (final section in widget.config.sections) {
      for (final field in section.fields) {
        if (field.type == 'select') {
          _selects[field.name] = '';
        } else if (field.type == 'price') {
          _controllers[field.name] = TextEditingController();
          _priceUnits[field.name] = field.options?.first ?? 'Per Service';
        } else {
          _controllers[field.name] = TextEditingController(text: _savedValue(field.name));
        }
      }
    }
    for (final controller in _controllers.values) {
      controller.addListener(_scheduleSave);
    }
    _restoreDraft();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), _persistDraft);
  }

  Future<void> _persistDraft() async {
    await VendorFormDraft.save(widget.config.id, {
      'controllers': {for (final entry in _controllers.entries) entry.key: entry.value.text},
      'selects': _selects,
      'priceUnits': _priceUnits,
    });
  }

  Future<void> _restoreDraft() async {
    final draft = await VendorFormDraft.load(widget.config.id);
    if (!mounted || draft.isEmpty) return;
    final controllers = draft['controllers'];
    final selects = draft['selects'];
    final priceUnits = draft['priceUnits'];
    setState(() {
      if (controllers is Map) {
        for (final entry in controllers.entries) {
          final controller = _controllers[entry.key.toString()];
          if (controller != null) controller.text = entry.value?.toString() ?? '';
        }
      }
      if (selects is Map) {
        for (final entry in selects.entries) {
          if (_selects.containsKey(entry.key.toString())) {
            _selects[entry.key.toString()] = entry.value?.toString() ?? '';
          }
        }
      }
      if (priceUnits is Map) {
        for (final entry in priceUnits.entries) {
          final key = entry.key.toString();
          if (_priceUnits.containsKey(key)) {
            final fallback = _priceUnits[key] ?? '';
            _priceUnits[key] = entry.value?.toString() ?? fallback;
          }
        }
      }
    });
  }

  String _savedValue(String name) {
    final phone = (SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
    final mobile = phone.length > 10 ? phone.substring(phone.length - 10) : phone;
    final fullName = SessionStore.fullName ?? '';
    return switch (name) {
      'phone' || 'mobileNumber' => mobile,
      'ownerName' => fullName,
      _ => '',
    };
  }

  String get _displayName {
    const keys = [
      'businessName',
      'companyName',
      'hotelName',
      'driverName',
      'beauticianName',
      'plumberName',
      'electricianName',
      'cleanerName',
      'technicianName',
      'carpenterName',
      'painterName',
      'propertyName',
      'packageName',
    ];
    for (final key in keys) {
      final value = _controllers[key]?.text.trim() ?? '';
      if (value.isNotEmpty) return value;
    }
    return widget.service.name;
  }

  Map<String, String> _fields() {
    final fields = <String, String>{};
    for (final section in widget.config.sections) {
      for (final field in section.fields) {
        if (field.type == 'select') {
          final value = _selects[field.name] ?? '';
          if (value.isEmpty) continue;
          fields[field.name] = value;
          continue;
        }
        final value = _controllers[field.name]?.text.trim() ?? '';
        if (value.isEmpty) continue;
        if (field.name == 'phone') {
          fields['mobileNumber'] = value;
        } else {
          fields[field.name] = value;
        }
        if (field.type == 'price') {
          fields['priceUnit'] = _priceUnits[field.name] ?? field.options?.first ?? '';
        }
      }
    }
    return fields;
  }

  void _next() {
    _error = '';
    if (!(_formKey.currentState?.validate() ?? false)) {
      setState(() => _error = 'Please fill in the required fields.');
      return;
    }
    for (final section in widget.config.sections) {
      for (final field in section.fields) {
        if (field.type == 'select' && field.required && (_selects[field.name] ?? '').isEmpty) {
          setState(() => _error = 'Please choose ${field.label.toLowerCase()}.');
          return;
        }
        if (field.type == 'price' && field.required) {
          final amount = num.tryParse(_controllers[field.name]?.text.trim() ?? '');
          if (amount == null || amount <= 0) {
            setState(() => _error = 'Please enter a valid ${field.label.toLowerCase()}.');
            return;
          }
        }
      }
    }

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => UploadPhotosPage(
          draft: ListingDraft(
            service: widget.service,
            config: widget.config,
            displayName: _displayName,
            fields: _fields(),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListingWizardScaffold(
      categoryId: widget.config.id,
      categoryTitle: widget.config.title,
      step: 1,
      error: _error,
      primaryLabel: 'Next',
      onPrimary: _next,
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            for (final section in widget.config.sections)
              for (final field in section.fields) _buildField(field),
          ],
        ),
      ),
    );
  }

  Widget _buildField(VendorField field) {
    if (field.type == 'select') {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _label(field.label, field.required),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: (_selects[field.name] ?? '').isEmpty ? null : _selects[field.name],
              decoration: _decoration(field.placeholder),
              items: [
                for (final option in field.options ?? const <String>[])
                  DropdownMenuItem(value: option, child: Text(option)),
              ],
              onChanged: (value) => setState(() {
                _selects[field.name] = value ?? '';
                _error = '';
                _scheduleSave();
              }),
              validator: field.required ? (value) => (value == null || value.isEmpty) ? 'Required' : null : null,
            ),
          ],
        ),
      );
    }

    if (field.type == 'price') {
      final units = field.options ?? const ['Per Service'];
      final selected = _priceUnits[field.name] ?? units.first;
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _label(field.label, field.required),
            const SizedBox(height: 8),
            TextFormField(
              controller: _controllers[field.name],
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: _decoration(field.placeholder),
              validator: (value) {
                if (!field.required) return null;
                final amount = num.tryParse(value?.trim() ?? '');
                if (amount == null || amount <= 0) return 'Enter a valid amount';
                return null;
              },
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final unit in units)
                  ChoiceChip(
                    label: Text(unit),
                    selected: selected == unit,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: selected == unit ? Colors.white : AppColors.textMuted,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                    onSelected: (_) => setState(() {
                      _priceUnits[field.name] = unit;
                      _scheduleSave();
                    }),
                  ),
              ],
            ),
          ],
        ),
      );
    }

    final keyboard = switch (field.type) {
      'tel' || 'number' => TextInputType.number,
      'email' => TextInputType.emailAddress,
      'textarea' => TextInputType.multiline,
      _ => TextInputType.text,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label(field.label, field.required),
          const SizedBox(height: 8),
          TextFormField(
            controller: _controllers[field.name],
            minLines: field.type == 'textarea' ? 3 : 1,
            maxLines: field.type == 'textarea' ? 5 : 1,
            keyboardType: keyboard,
            inputFormatters: field.type == 'tel' ? [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)] : null,
            decoration: _decoration(field.placeholder),
            validator: (value) {
              final text = value?.trim() ?? '';
              if (field.required && text.isEmpty) return 'Required';
              if ((field.name == 'phone' || field.name == 'mobileNumber') && text.isNotEmpty && text.length != 10) {
                return 'Enter a 10-digit mobile number';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _label(String label, bool required) {
    return Text.rich(
      TextSpan(
        text: label,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        children: [
          if (required) const TextSpan(text: ' *', style: TextStyle(color: Color(0xFFDC2626))),
        ],
      ),
    );
  }

  InputDecoration _decoration(String? hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
      ),
    );
  }
}
