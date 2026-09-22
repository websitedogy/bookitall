import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../data/booking.dart';
import '../../data/catalog.dart';
import '../../widgets/photo_carousel.dart';
import 'listing_book_page.dart';
import 'listing_info_tabs.dart';

class ListingDetailPage extends StatefulWidget {
  const ListingDetailPage({super.key, required this.ad});

  final CustomerAd ad;

  @override
  State<ListingDetailPage> createState() => _ListingDetailPageState();
}

class _ListingDetailPageState extends State<ListingDetailPage> {
  ListingDetailData? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final id = widget.ad.id.trim();
    final canFetch = id.length >= 8 && id.length <= 80 && !id.contains('{') && !id.contains('"');
    if (!canFetch) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final detail = await fetchListingDetail(id);
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _book(CustomerAd ad, ListingDetailData? detail) {
    final unitPrice = detail?.unitPrice ?? 0;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ListingBookPage(
          draft: BookingDraft(
            listingId: ad.id,
            title: ad.title,
            vendor: ad.vendor,
            location: ad.location,
            image: (detail?.photoUrls.isNotEmpty ?? false) ? detail!.photoUrls.first : ad.image,
            categoryId: ad.categoryId,
            category: ad.category,
            unitPrice: unitPrice,
            priceUnit: detail?.priceUnit ?? '',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ad = _detail?.ad ?? widget.ad;
    final pending = ad.status == 'PENDING';
    final hold = ad.status == 'HOLD';
    final live = ad.status == 'ACCEPTED';
    final canBook = live && (_detail?.bookable ?? false) && (_detail?.unitPrice ?? 0) > 0;
    final isOwner = _detail?.isOwner ?? false;
    final phone = _detail?.mobileNumber ?? '';
    return Scaffold(
      backgroundColor: const Color(0xFFF2F6F4),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: EdgeInsets.zero,
              children: [
                Stack(
                  children: [
                    ColoredBox(
                      color: const Color(0xFF0A1F1C),
                      child: PhotoCarousel(
                        photos: _detail?.photoUrls.isNotEmpty == true ? _detail!.photoUrls : ad.photoUrls,
                        fallback: ad.image,
                        height: MediaQuery.sizeOf(context).height * 0.42,
                        fit: BoxFit.contain,
                      ),
                    ),
                    Positioned(
                      left: 12,
                      top: MediaQuery.paddingOf(context).top + 8,
                      child: Material(
                        color: Colors.black45,
                        shape: const CircleBorder(),
                        child: IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.arrow_back, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
                Container(
                    margin: const EdgeInsets.fromLTRB(12, 16, 12, 24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFDF8),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: const Color(0xFFE6DCC8)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (ad.category.trim().isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE6F4F1),
                                        borderRadius: BorderRadius.circular(99),
                                      ),
                                      child: Text(
                                        ad.category,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF0F766E),
                                        ),
                                      ),
                                    ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: live
                                          ? const Color(0xFF1D4A3F)
                                          : hold || pending
                                              ? const Color(0xFF5C4316)
                                              : const Color(0xFF5C1D1D),
                                      borderRadius: BorderRadius.circular(99),
                                    ),
                                    child: Text(
                                      live
                                          ? 'Live'
                                          : hold
                                              ? 'Hold'
                                              : pending
                                                  ? 'Pending'
                                                  : ad.status,
                                      style: TextStyle(
                                        color: live ? const Color(0xFFC8F0E4) : const Color(0xFFF6E7C2),
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                ad.title,
                                textAlign: TextAlign.left,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.4,
                                  color: Color(0xFF12241F),
                                ),
                              ),
                            ],
                          ),
                        ),
                        ListingInfoTabs(
                          listingId: ad.id,
                          listingTitle: ad.title,
                          categoryId: ad.categoryId,
                          location: ad.location,
                          description: _detail?.description ?? '',
                          phone: phone,
                          details: _detail?.details ?? const <ListingField>[],
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (isOwner)
                                Container(
                                  width: double.infinity,
                                  margin: const EdgeInsets.only(bottom: 14),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: const Color(0xFFF4EFE4), borderRadius: BorderRadius.circular(16)),
                                  child: Text(
                                    live
                                        ? 'This is your post. Nearby customers can book it.'
                                        : 'This is your post. Customers see it after admin accepts.',
                                    style: const TextStyle(color: Color(0xFF5B6E68), height: 1.4),
                                  ),
                                ),
                              if ((_detail?.unitPrice ?? 0) > 0)
                                Text(
                                  '${inr(_detail!.unitPrice)}${_detail!.priceUnit.isNotEmpty ? '  ${priceUnitWord(_detail!.priceUnit)}' : ''}',
                                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Color(0xFF12241F)),
                                )
                              else if ((_detail?.price ?? '').isNotEmpty)
                                Text('₹${_detail!.price}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                              if (live) ...[
                                const SizedBox(height: 14),
                                if (canBook)
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFF0F3D38),
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: const StadiumBorder(),
                                      ),
                                      onPressed: () => _book(ad, _detail),
                                      child: const Text('Book now'),
                                    ),
                                  )
                                else
                                  const Text('This listing has no bookable price yet.', style: TextStyle(color: Color(0xFF7A6A52))),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}
