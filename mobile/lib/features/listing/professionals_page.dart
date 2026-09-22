import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../data/api.dart';
import '../../data/catalog.dart';
import '../../theme/app_colors.dart';
import '../../widgets/catalog_image.dart';
import '../../widgets/coming_soon_services.dart';
import 'listing_detail_page.dart';

class ProfessionalsPage extends StatefulWidget {
  const ProfessionalsPage({super.key, required this.service});

  final ServiceItem service;

  @override
  State<ProfessionalsPage> createState() => _ProfessionalsPageState();
}

class _ProfessionalsPageState extends State<ProfessionalsPage> {
  List<CustomerAd> _ads = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<({double lat, double lng})?> _coords() async {
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) return null;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return null;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
      );
      return (lat: position.latitude, lng: position.longitude);
    } catch (_) {
      return null;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final here = await _coords();
      final ads = await fetchNearbyListings(
        category: widget.service.id,
        lat: here?.lat,
        lng: here?.lng,
      );
      if (!mounted) return;
      setState(() {
        _ads = ads;
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
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ComingSoonHeader(
            title: widget.service.name,
            onClose: () => Navigator.of(context).pop(),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error.isNotEmpty
                    ? Center(child: Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))))
                    : _ads.isEmpty
                        ? ComingSoonServices(category: widget.service.id)
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView(
                              padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
                              children: [
                                for (final ad in _ads)
                                  _NearbyCard(
                                    ad: ad,
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute<void>(builder: (_) => ListingDetailPage(ad: ad)),
                                      );
                                    },
                                  ),
                              ],
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _NearbyCard extends StatelessWidget {
  const _NearbyCard({required this.ad, required this.onTap});

  final CustomerAd ad;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.studioLine),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
            child: Row(
              children: [
                Container(
                  width: 76,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.studioLine),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: CatalogImage(src: ad.image, fit: BoxFit.cover),
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
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.studioInk),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        ad.category.isEmpty ? ad.vendor : ad.category,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, color: AppColors.studioMuted),
                      ),
                      if (ad.location.isNotEmpty || ad.distanceKm != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          [
                            if (ad.location.isNotEmpty) ad.location,
                            if (ad.distanceKm != null) '${ad.distanceKm} km',
                          ].join(' · '),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppColors.studioMuted),
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
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Book now',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
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
