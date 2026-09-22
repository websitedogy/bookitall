import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import 'public_transport_data.dart';

class PublicTransportTypePicker extends StatelessWidget {
  const PublicTransportTypePicker({
    super.key,
    required this.onSelect,
    this.selectedId,
    this.compact = false,
    this.title = 'Choose a vehicle',
    this.subtitle = 'Auto, Car, Mini Bus, Bus or Van. Local and Outstation only.',
  });

  final ValueChanged<PublicTransportType> onSelect;
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
          Row(
            children: [
              for (final item in publicTransportTypes)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _TypeTile(
                      item: item,
                      selected: selectedId == item.id,
                      compact: compact,
                      onTap: () => onSelect(item),
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

class _TypeTile extends StatelessWidget {
  const _TypeTile({
    required this.item,
    required this.selected,
    required this.compact,
    required this.onTap,
  });

  final PublicTransportType item;
  final bool selected;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 44.0 : 56.0;
    return Material(
      color: selected ? AppColors.primarySoft : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2 : 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: compact ? 8 : 12, horizontal: 4),
          child: Column(
            children: [
              Container(
                height: size,
                width: size,
                decoration: BoxDecoration(color: item.tint, borderRadius: BorderRadius.circular(16)),
                child: Icon(item.icon, color: item.iconColor, size: compact ? 22 : 28),
              ),
              const SizedBox(height: 6),
              Text(
                item.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: compact ? 10 : 11, fontWeight: FontWeight.w600, color: AppColors.text),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
