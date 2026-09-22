import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../../data/api.dart';
import '../../../data/catalog.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/coming_soon_services.dart';
import '../../listing/listing_detail_page.dart';
import 'public_transport_data.dart';
import 'public_transport_registration_page.dart';
import 'public_transport_type_picker.dart';

class PublicTransportVendorPage extends StatelessWidget {
  const PublicTransportVendorPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Public Transport'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.text,
        elevation: 0,
      ),
      body: PublicTransportTypePicker(
        title: 'Register a vehicle',
        subtitle: 'Tap Auto, Car, Mini Bus, Bus or Van. All five use the same form. Local and Outstation only.',
        onSelect: (vehicle) {
          Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => PublicTransportRegistrationPage(vehicle: vehicle)),
          );
        },
      ),
    );
  }
}

class PublicTransportBrowsePage extends StatefulWidget {
  const PublicTransportBrowsePage({super.key, this.initialType});

  final PublicTransportType? initialType;

  @override
  State<PublicTransportBrowsePage> createState() => _PublicTransportBrowsePageState();
}

class _PublicTransportBrowsePageState extends State<PublicTransportBrowsePage> {
  PublicTransportType? _selected;
  bool _loading = true;
  bool _hasListings = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialType;
    _probe();
  }

  Future<void> _probe() async {
    try {
      final ads = await fetchNearbyListings(category: 'public-transport');
      if (!mounted) return;
      setState(() {
        _hasListings = ads.isNotEmpty;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _hasListings = false;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: Column(
        children: [
          ComingSoonHeader(
            title: _selected?.name ?? 'Public Transport',
            onClose: () => Navigator.of(context).pop(),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : !_hasListings
                    ? const ComingSoonServices(category: 'public-transport')
                    : Column(
                        children: [
                          PublicTransportTypePicker(
                            selectedId: _selected?.id,
                            compact: _selected != null,
                            title: 'Choose a vehicle',
                            subtitle: 'Pick Auto, Car, Mini Bus, Bus or Van to see listings.',
                            onSelect: (vehicle) => setState(() => _selected = vehicle),
                          ),
                          if (_selected != null) Expanded(child: _PublicTransportList(vehicle: _selected!)),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

class _PublicTransportList extends StatefulWidget {
  const _PublicTransportList({required this.vehicle});

  final PublicTransportType vehicle;

  @override
  State<_PublicTransportList> createState() => _PublicTransportListState();
}

class _PublicTransportListState extends State<_PublicTransportList> {
  List<CustomerAd> _ads = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant _PublicTransportList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.vehicle.id != widget.vehicle.id) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      double? lat;
      double? lng;
      try {
        final enabled = await Geolocator.isLocationServiceEnabled();
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (enabled && permission != LocationPermission.denied && permission != LocationPermission.deniedForever) {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
          );
          lat = pos.latitude;
          lng = pos.longitude;
        }
      } catch (_) {}
      final ads = await fetchNearbyListings(category: 'public-transport', lat: lat, lng: lng);
      final wanted = widget.vehicle.name.toLowerCase();
      if (!mounted) return;
      setState(() {
        _ads = ads.where((ad) {
          final type = ad.vehicleType.trim().toLowerCase();
          return type == wanted || type.replaceAll(' ', '-') == widget.vehicle.id;
        }).toList();
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _error = err.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error.isNotEmpty) {
      return Center(child: Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))));
    }
    if (_ads.isEmpty) {
      return const ComingSoonServices(category: 'public-transport');
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
        itemCount: _ads.length,
        itemBuilder: (context, index) {
          final ad = _ads[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: AppColors.studioLine),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => ListingDetailPage(ad: ad)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(ad.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(
                              [ad.vehicleType, ad.serviceType, ad.location].where((item) => item.isNotEmpty).join(' · '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppColors.studioMuted),
                            ),
                          ],
                        ),
                      ),
                      if (ad.priceLabel.isNotEmpty)
                        Text(ad.priceLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
