import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../data/service_catalog.dart';
import '../../data/professionals.dart';
import '../../data/api.dart';
import '../../theme/app_colors.dart';
import '../../widgets/catalog_image.dart';
import '../../widgets/category_art.dart';
import '../saved/saved_page.dart';
import '../tabs/tab_pages.dart';
import '../listing/professionals_page.dart';
import '../vendors/services/public_transport_vendor_page.dart';
import '../vendors/services/goods_transport_vendor_page.dart';
import '../vendors/services/packers_movers_vendor_page.dart';
import '../../widgets/live_location.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int bannerIndex = 0;
  Timer? _timer;
  final _search = TextEditingController();

  void _openService(String id) {
    if (id == 'home') {
      final home = ServiceCatalog.visible.where((item) => item.id != 'hotels' && item.id != 'tours' && item.id != 'cabs').toList();
      final fallback = home.isNotEmpty ? home : ServiceCatalog.visible;
      if (fallback.isEmpty) return;
      id = fallback.first.id;
    }
    if (!ServiceCatalog.isEnabled(id)) return;
    if (id == 'public-transport') {
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          fullscreenDialog: true,
          builder: (_) => const PublicTransportBrowsePage(),
        ),
      );
      return;
    }
    if (id == 'goods-transport') {
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          fullscreenDialog: true,
          builder: (_) => const GoodsTransportBrowsePage(),
        ),
      );
      return;
    }
    if (id == 'packers-movers') {
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          fullscreenDialog: true,
          builder: (_) => const PackersMoversBrowsePage(),
        ),
      );
      return;
    }
    final service = serviceById(id == 'home' ? 'electrician' : id);
    if (service == null) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => ProfessionalsPage(service: service),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    ServiceCatalog.revision.addListener(_onCatalog);
    unawaited(ServiceCatalog.refresh());
    _timer = Timer.periodic(const Duration(milliseconds: 4200), (_) {
      if (!mounted) return;
      final slides = ServiceCatalog.visibleBanners;
      if (slides.isEmpty) return;
      setState(() => bannerIndex = (bannerIndex + 1) % slides.length);
    });
  }

  void _onCatalog() {
    if (!mounted) return;
    final slides = ServiceCatalog.visibleBanners;
    setState(() {
      if (slides.isEmpty) {
        bannerIndex = 0;
      } else if (bannerIndex >= slides.length) {
        bannerIndex = 0;
      }
    });
  }

  @override
  void dispose() {
    ServiceCatalog.revision.removeListener(_onCatalog);
    _timer?.cancel();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _header()),
        SliverToBoxAdapter(child: _banners()),
        SliverToBoxAdapter(child: _serviceGrid()),
        SliverToBoxAdapter(child: _brandMark()),
      ],
    );
  }

  Widget _brand() {
    return const Text(
      'Book It All',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(
        color: AppColors.primary,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
      ),
    );
  }

  Widget _searchField() {
    return TextField(
      controller: _search,
      onChanged: (_) {},
      decoration: InputDecoration(
        hintText: 'Search "Hotels"',
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(99),
          borderSide: const BorderSide(color: Color(0x8A0F172A)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(99),
          borderSide: const BorderSide(color: Color(0x8A0F172A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(99),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }

  List<Widget> _headerActions() {
    return [
      IconButton(
        tooltip: 'Likes',
        onPressed: () {
          Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const SavedPage()));
        },
        icon: const Icon(Icons.favorite_border, size: 24),
      ),
      IconButton(
        tooltip: 'Account',
        onPressed: () {
          Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AccountPage()));
        },
        icon: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.account_circle_outlined, size: 26),
            if (SessionStore.isSignedIn && SessionStore.isProfilePending)
              const Positioned(right: -1, top: -1, child: PendingDot()),
          ],
        ),
      ),
    ];
  }

  Widget _header() {
    final width = MediaQuery.sizeOf(context).width;
    final wide = width >= 768;
    final searchWidth = (width - 460).clamp(200.0, 416.0);
    return ColoredBox(
      color: AppColors.surface,
      child: Padding(
        padding: EdgeInsets.fromLTRB(wide ? 20 : 12, wide ? 8 : 4, wide ? 12 : 4, 12),
        child: wide
            ? SizedBox(
                height: 52,
                child: Row(
                  children: [
                    _brand(),
                    const Spacer(),
                    SizedBox(width: searchWidth, child: _searchField()),
                    const SizedBox(width: 10),
                    const LiveLocation(),
                    ..._headerActions(),
                  ],
                ),
              )
            : Column(
                children: [
                  SizedBox(
                    height: 44,
                    child: Row(
                      children: [
                        _brand(),
                        const Spacer(),
                        const LiveLocation(),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(child: _searchField()),
                      ..._headerActions(),
                    ],
                  ),
                ],
              ),
      ),
    );
  }

  Widget _banners() {
    final slides = ServiceCatalog.visibleBanners;
    if (slides.isEmpty) return const SizedBox.shrink();
    final safeIndex = bannerIndex.clamp(0, slides.length - 1);
    final banner = slides[safeIndex];
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(26),
            child: GestureDetector(
              onTap: () => _openService(banner.id),
              child: SizedBox(
                height: 184,
                width: double.infinity,
                child: CatalogImage(src: banner.image),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < slides.length; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: GestureDetector(
                    onTap: () => setState(() => bannerIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      height: 6,
                      width: i == safeIndex ? 24 : 6,
                      decoration: BoxDecoration(
                        color: i == safeIndex ? AppColors.primary : AppColors.border,
                        borderRadius: BorderRadius.circular(99),
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

  Widget _serviceGrid() {
    final items = ServiceCatalog.visible;
    if (items.isEmpty) return const SizedBox.shrink();
    return ColoredBox(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('All services', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            const SizedBox(height: 18),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: MediaQuery.sizeOf(context).width >= 900 ? 6 : 4,
                mainAxisSpacing: 18,
                crossAxisSpacing: 8,
                childAspectRatio: 0.78,
              ),
              itemBuilder: (context, index) {
                final service = items[index];
                return InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: () => _openService(service.id),
                  child: Column(
                    children: [
                      CategoryArt(id: service.id, size: 72),
                      const SizedBox(height: 8),
                      Text(
                        service.name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.15),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _brandMark() {
    return SizedBox(
      width: double.infinity,
      child: Stack(
        children: [
          const Positioned.fill(
            child: IgnorePointer(
              child: Opacity(
                opacity: 0.42,
                child: _BrandDoodle(),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 36, 28, 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'BOOK it all',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    fontStyle: FontStyle.italic,
                    letterSpacing: -0.6,
                    height: 1.05,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  '🇮🇳  Made for India',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 15, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 6),
                const Text(
                  '❤️  Made in Telangana',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 15, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandDoodle extends StatelessWidget {
  const _BrandDoodle();

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/brand/footer-doodle.svg',
      fit: BoxFit.cover,
      alignment: Alignment.center,
    );
  }
}

