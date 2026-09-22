import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../theme/app_colors.dart';
import 'listing_draft.dart';
import 'listing_location_page.dart';
import 'listing_wizard_chrome.dart';

class UploadPhotosPage extends StatefulWidget {
  const UploadPhotosPage({super.key, required this.draft});

  final ListingDraft draft;

  @override
  State<UploadPhotosPage> createState() => _UploadPhotosPageState();
}

class _UploadPhotosPageState extends State<UploadPhotosPage> {
  final _picker = ImagePicker();
  final List<XFile> _photos = [];
  bool _picking = false;

  Future<void> _add() async {
    if (_picking) return;
    setState(() => _picking = true);
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 85);
      if (picked.isNotEmpty) {
        setState(() {
          _photos.addAll(picked);
          if (_photos.length > 8) _photos.removeRange(8, _photos.length);
        });
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _camera() async {
    if (_picking) return;
    setState(() => _picking = true);
    try {
      final shot = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      if (shot != null) setState(() => _photos.add(shot));
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  void _next() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ListingLocationPage(
          draft: widget.draft.copyWith(photoPaths: _photos.map((file) => file.path).toList()),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListingWizardScaffold(
      categoryId: widget.draft.config.id,
      categoryTitle: widget.draft.config.title,
      step: 2,
      primaryLabel: 'Next',
      onPrimary: _next,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Material(
            color: const Color(0xFFF8FAFC),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: const BorderSide(color: AppColors.border),
            ),
            child: InkWell(
              onTap: _add,
              borderRadius: BorderRadius.circular(24),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 36),
                child: Column(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.photo_camera_outlined, color: AppColors.primary),
                    ),
                    const SizedBox(height: 12),
                    const Text('Add photos', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      '${_photos.length}/8 selected',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: _camera,
                      icon: const Icon(Icons.camera_alt_outlined, size: 18),
                      label: const Text('Take a photo'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_photos.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _photos.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
              ),
              itemBuilder: (context, index) {
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.file(File(_photos[index].path), fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: GestureDetector(
                        onTap: () => setState(() => _photos.removeAt(index)),
                        child: const CircleAvatar(
                          radius: 12,
                          backgroundColor: Color(0xA6000000),
                          child: Icon(Icons.close, size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}
