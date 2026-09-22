import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

const _art = {
  'hotels',
  'tours',
  'cabs',
  'electrician',
  'plumber',
  'ac',
  'cleaning',
  'jobs',
  'beautician',
  'painting',
  'carpenter',
  'appliance',
  'public-transport',
  'goods-transport',
  'packers-movers',
  'cloud-kitchen',
};

String comingSoonAsset(String? category) {
  final id = category != null && _art.contains(category) ? category : 'default';
  return 'assets/coming-soon/$id.png';
}

class ComingSoonHeader extends StatelessWidget {
  const ComingSoonHeader({super.key, required this.title, required this.onClose});

  final String title;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
        child: Row(
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            IconButton(
              tooltip: 'Close',
              onPressed: onClose,
              style: IconButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.studioInk,
              ),
              icon: const Icon(Icons.close, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

class ComingSoonServices extends StatefulWidget {
  const ComingSoonServices({super.key, this.category});

  final String? category;

  @override
  State<ComingSoonServices> createState() => _ComingSoonServicesState();
}

class _ComingSoonServicesState extends State<ComingSoonServices> with SingleTickerProviderStateMixin {
  late final AnimationController _bob;

  @override
  void initState() {
    super.initState();
    _bob = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _bob.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedBuilder(
              animation: _bob,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, -6 * _bob.value),
                  child: child,
                );
              },
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: width < 420 ? width - 40 : 420, maxHeight: 230),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Image.asset(
                    comingSoonAsset(widget.category),
                    fit: BoxFit.contain,
                    errorBuilder: (_, error, stack) => const SizedBox.shrink(),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'COMING SOON',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 2.2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Services not available',
              style: TextStyle(
                color: AppColors.studioInk,
                fontSize: 17,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
