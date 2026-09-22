import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import 'goods_transport_data.dart';

class GoodsTransportTypePicker extends StatelessWidget {
  const GoodsTransportTypePicker({
    super.key,
    required this.onSelect,
    this.selectedId,
    this.compact = false,
    this.title = 'Choose a vehicle',
    this.subtitle = 'Tata Ace, Mini Lorry, Light / Medium / Heavy Truck, or Other.',
  });

  final ValueChanged<GoodsTransportType> onSelect;
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
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: compact ? 8 : 10,
            crossAxisSpacing: compact ? 8 : 10,
            childAspectRatio: compact ? 0.95 : 0.88,
            children: [
              for (final item in goodsTransportTypes)
                _TypeTile(
                  item: item,
                  selected: selectedId == item.id,
                  compact: compact,
                  onTap: () => onSelect(item),
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

  final GoodsTransportType item;
  final bool selected;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 44.0 : 52.0;
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
          padding: EdgeInsets.symmetric(vertical: compact ? 8 : 10, horizontal: 6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: size,
                width: size,
                decoration: BoxDecoration(color: item.tint, borderRadius: BorderRadius.circular(16)),
                child: Icon(item.icon, color: item.iconColor, size: compact ? 22 : 26),
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
