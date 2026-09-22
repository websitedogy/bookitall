import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import 'packers_movers_data.dart';

class PackersMoversTypePicker extends StatelessWidget {
  const PackersMoversTypePicker({
    super.key,
    required this.onSelect,
    this.selectedId,
    this.compact = false,
    this.title = 'Choose a service',
    this.subtitle = 'Home, office, local or long-distance shifting.',
  });

  final ValueChanged<PackersServiceType> onSelect;
  final String? selectedId;
  final bool compact;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, compact ? 8 : 16, 16, compact ? 8 : 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!compact) ...[
            Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4)),
            const SizedBox(height: 6),
            Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4)),
            const SizedBox(height: 16),
          ],
          GridView.count(
            crossAxisCount: compact ? 5 : 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: compact ? 0.72 : 0.95,
            children: [
              for (final item in packersServiceTypes)
                Material(
                  color: selectedId == item.id ? AppColors.primarySoft : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(color: selectedId == item.id ? AppColors.primary : AppColors.border, width: selectedId == item.id ? 2 : 1),
                  ),
                  child: InkWell(
                    onTap: () => onSelect(item),
                    borderRadius: BorderRadius.circular(18),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            height: compact ? 36 : 48,
                            width: compact ? 36 : 48,
                            decoration: BoxDecoration(color: item.tint, borderRadius: BorderRadius.circular(14)),
                            child: Icon(item.icon, color: item.iconColor, size: compact ? 18 : 24),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.name,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: compact ? 9 : 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
