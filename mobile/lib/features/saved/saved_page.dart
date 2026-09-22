import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class SavedPage extends StatelessWidget {
  const SavedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.favorite_border, size: 40, color: AppColors.textMuted),
              SizedBox(height: 16),
              Text('Saved', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text(
                'Hotels, tours and services you heart will show up here.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
