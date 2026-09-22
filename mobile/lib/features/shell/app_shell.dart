import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../theme/app_colors.dart';
import '../customers/bookings_page.dart';
import '../home/home_page.dart';
import '../vendors/services/add_service_page.dart';
import '../vendors/my_orders/orders_page.dart';
import '../vendors/posts/posts_page.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int index = 0;

  final pages = const [
    HomePage(),
    VendorPostsPage(),
    AddServicePage(),
    VendorOrdersPage(),
    CustomerBookingsPage(),
  ];

  @override
  void initState() {
    super.initState();
    ShellTab.index.addListener(_onShellTab);
  }

  @override
  void dispose() {
    ShellTab.index.removeListener(_onShellTab);
    super.dispose();
  }

  void _onShellTab() {
    final next = ShellTab.index.value;
    if (next == null) return;
    if (next != index) setState(() => index = next);
    ShellTab.index.value = null;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        return Scaffold(
          body: SafeArea(
            child: wide
                ? Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1180),
                      child: IndexedStack(index: index, children: pages),
                    ),
                  )
                : IndexedStack(index: index, children: pages),
          ),
          bottomNavigationBar: _bottomBar(),
        );
      },
    );
  }

  Widget _bottomBar() {
    return Material(
      color: AppColors.surface.withValues(alpha: 0.97),
      elevation: 8,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 6, 4, 6),
          child: Row(
            children: [
              _TabItem(
                icon: Icons.home_rounded,
                label: 'Home',
                selected: index == 0,
                onTap: () => setState(() => index = 0),
              ),
              _TabItem(
                icon: Icons.article_outlined,
                label: 'My Services',
                selected: index == 1,
                onTap: () => setState(() => index = 1),
              ),
              _OfficialServiceTab(
                selected: index == 2,
                onTap: () => setState(() => index = 2),
              ),
              _TabItem(
                icon: Icons.receipt_long_outlined,
                label: 'My Orders',
                selected: index == 3,
                onTap: () => setState(() => index = 3),
              ),
              _TabItem(
                icon: Icons.event_available_outlined,
                label: 'My Bookings',
                selected: index == 4,
                onTap: () => setState(() => index = 4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.primary : AppColors.textMuted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primarySoft : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(icon, size: 22, color: color),
              ),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfficialServiceTab extends StatelessWidget {
  const _OfficialServiceTab({required this.selected, required this.onTap});

  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Transform.translate(
              offset: const Offset(0, -14),
              child: Container(
                height: 52,
                width: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: const [
                    BoxShadow(color: Color(0x660F766E), blurRadius: 16, offset: Offset(0, 6)),
                  ],
                ),
                child: const Icon(Icons.add, color: Colors.white, size: 28),
              ),
            ),
            Text(
              'Register',
              textAlign: TextAlign.center,
              maxLines: 1,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 10,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                height: 1.15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
