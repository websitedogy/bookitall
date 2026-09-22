import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../data/catalog.dart';
import '../data/service_catalog.dart';
import '../theme/app_colors.dart';

class SiteFooter extends StatelessWidget {
  const SiteFooter({super.key, this.onServiceTap});

  final ValueChanged<String>? onServiceTap;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<int>(
      valueListenable: ServiceCatalog.revision,
      builder: (context, _, _) {
        final items = ServiceCatalog.visible;
        final mid = (items.length / 2).ceil();
        final left = items.take(mid).toList();
        final right = items.skip(mid).toList();
        return _footer(left, right);
      },
    );
  }

  Widget _footer(List<ServiceItem> left, List<ServiceItem> right) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Stack(
        children: [
          const Positioned.fill(child: _FooterDoodle()),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 36),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Book It All',
                  style: TextStyle(
                    color: AppColors.text,
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Hotels, tours, cabs and home services — booked from the same desk.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.45),
                ),
                const SizedBox(height: 18),
                const Text(
                  'hello@bookitall.com',
                  style: TextStyle(color: AppColors.text, fontSize: 13),
                ),
                const SizedBox(height: 6),
                const Text(
                  '+91 40 4000 1200',
                  style: TextStyle(color: AppColors.text, fontSize: 13),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Banjara Hills, Hyderabad',
                  style: TextStyle(color: AppColors.text, fontSize: 13),
                ),
                const SizedBox(height: 22),
                const _FooterHeading('Services'),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _ServiceColumn(items: left, onTap: onServiceTap)),
                    const SizedBox(width: 16),
                    Expanded(child: _ServiceColumn(items: right, onTap: onServiceTap)),
                  ],
                ),
                const SizedBox(height: 22),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 16),
                Text(
                  '© ${DateTime.now().year} Book It All. All rights reserved.',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterHeading extends StatelessWidget {
  const _FooterHeading(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        child: Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.4,
          ),
        ),
      ),
    );
  }
}

class _ServiceColumn extends StatelessWidget {
  const _ServiceColumn({required this.items, this.onTap});

  final List<ServiceItem> items;
  final ValueChanged<String>? onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final service in items) ...[
          InkWell(
            onTap: onTap == null ? null : () => onTap!(service.id),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Text(
                service.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.text, fontSize: 13),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _FooterDoodle extends StatelessWidget {
  const _FooterDoodle();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Opacity(
        opacity: 0.42,
        child: SvgPicture.asset(
          'assets/brand/footer-doodle.svg',
          fit: BoxFit.cover,
          alignment: Alignment.center,
        ),
      ),
    );
  }
}
