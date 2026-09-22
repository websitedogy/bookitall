import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
export '../account/profile_page.dart';

class PlaceholderTab extends StatelessWidget {
  const PlaceholderTab({
    super.key,
    required this.title,
    required this.kicker,
    required this.body,
    required this.icon,
  });

  final String title;
  final String kicker;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              kicker.toUpperCase(),
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.6,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Text(body, style: const TextStyle(color: AppColors.textMuted, height: 1.45)),
      ],
    );
  }
}

