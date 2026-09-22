import 'dart:async';

import 'package:flutter/material.dart';
import '../../../data/api.dart';
import '../../../data/catalog.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/catalog_image.dart';
import '../../listing/listing_detail_page.dart';
import 'vendor_wallet_page.dart';

class VendorPostsPage extends StatefulWidget {
  const VendorPostsPage({super.key});

  @override
  State<VendorPostsPage> createState() => _VendorPostsPageState();
}

class _VendorPostsPageState extends State<VendorPostsPage> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  Timer? _poll;
  List<CustomerAd> _posts = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    PostsRefresh.revision.addListener(_load);
    _load();
    _poll = Timer.periodic(const Duration(seconds: 8), (_) => _silentLoad());
  }

  @override
  void dispose() {
    _poll?.cancel();
    PostsRefresh.revision.removeListener(_load);
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _silentLoad() async {
    try {
      final posts = await fetchVendorPosts();
      if (!mounted) return;
      setState(() => _posts = posts);
    } catch (_) {}
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final posts = await fetchVendorPosts();
      if (!mounted) return;
      setState(() {
        _posts = posts;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'My Services'),
            Tab(text: 'Wallet'),
            Tab(text: 'Wallet History'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _feed(),
              const VendorWalletPage(),
              const VendorWalletHistoryPage(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _feed() {
    return ColoredBox(
      color: AppColors.cream,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 8, 0, 24),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
              child: Text(
                _loading ? 'My Services' : '${_posts.length} ${_posts.length == 1 ? 'service' : 'services'}',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text),
              ),
            ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 32),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))),
              )
            else if (_posts.isEmpty)
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Text('No services yet', style: TextStyle(fontWeight: FontWeight.w600)),
              )
            else
              for (final ad in _posts) _PostCard(ad: ad),
          ],
        ),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.ad});

  final CustomerAd ad;

  @override
  Widget build(BuildContext context) {
    final status = _statusStyle(ad.status);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.studioLine),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ListingDetailPage(ad: ad)));
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          child: Row(
            children: [
              Container(
                width: 76,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                clipBehavior: Clip.antiAlias,
                child: ad.image.startsWith('http://') || ad.image.startsWith('https://')
                    ? Image.network(
                        ad.image,
                        fit: BoxFit.cover,
                        alignment: Alignment.center,
                        errorBuilder: (_, _, _) => const ColoredBox(
                          color: Color(0xFFF1F5F9),
                          child: Icon(Icons.image_outlined, color: AppColors.textMuted),
                        ),
                      )
                    : CatalogImage(src: ad.image, fit: BoxFit.cover),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ad.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      ad.category.isEmpty ? ad.vendor : ad.category,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                    ),
                    if (ad.location.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        ad.location,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (ad.priceLabel.isNotEmpty)
                    Text(
                      ad.priceLabel,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.text),
                    ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: status.background,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      status.label,
                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, height: 1.1, color: status.color),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

({String label, Color background, Color color}) _statusStyle(String status) {
  if (status == 'ACCEPTED') {
    return (label: 'Accepted', background: const Color(0xFFE8F6EE), color: const Color(0xFF15803D));
  }
  if (status == 'HOLD') {
    return (label: 'Hold', background: const Color(0xFFFFF4D6), color: const Color(0xFF92400E));
  }
  if (status == 'REJECTED') {
    return (label: 'Rejected', background: const Color(0xFFFEE2E2), color: const Color(0xFFB91C1C));
  }
  return (label: 'Pending', background: const Color(0xFFFFF4D6), color: const Color(0xFF92400E));
}
