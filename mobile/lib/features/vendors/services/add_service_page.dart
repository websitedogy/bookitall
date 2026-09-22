import 'dart:async';

import 'package:flutter/material.dart';
import '../../../data/api.dart';
import '../../../data/catalog.dart';
import '../../../data/service_catalog.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/category_art.dart';
import 'ac_registration_page.dart';
import 'appliance_registration_page.dart';
import 'beautician_registration_page.dart';
import 'cab_registration_page.dart';
import 'stay_registration_page.dart';
import 'tours_registration_page.dart';
import 'carpenter_registration_page.dart';
import 'painting_registration_page.dart';
import 'cleaning_registration_page.dart';
import 'electrician_registration_page.dart';
import 'plumber_registration_page.dart';
import 'vendor_form_config.dart';
import 'vendor_listing_form_page.dart';
import 'public_transport_vendor_page.dart';
import 'goods_transport_vendor_page.dart';
import 'packers_movers_vendor_page.dart';
import 'cloud_kitchen_registration_page.dart';

class AddServicePage extends StatefulWidget {
  const AddServicePage({super.key});

  @override
  State<AddServicePage> createState() => _AddServicePageState();
}

class _AddServicePageState extends State<AddServicePage> {
  @override
  void initState() {
    super.initState();
    unawaited(ClaimedCategories.refresh());
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([ServiceCatalog.revision, ClaimedCategories.revision]),
      builder: (context, _) => _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    final items = ServiceCatalog.visible.where((service) => !ClaimedCategories.has(service.id)).toList(growable: false);
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final rows = <List<ServiceItem>>[];
    for (var i = 0; i < items.length; i += 2) {
      rows.add(items.sublist(i, (i + 2).clamp(0, items.length)));
    }

    if (items.isEmpty) {
      return const ColoredBox(
        color: Colors.white,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 24, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Place Register', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              SizedBox(height: 16),
              Text(
                'Every service you already posted is hidden here, so you cannot add the same one twice.',
                style: TextStyle(fontSize: 14, height: 1.45, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    if (wide) {
      return ColoredBox(
        color: const Color(0xFFF8FAFC),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          children: [
            const Text('Place Register', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.86,
              ),
              itemBuilder: (context, index) => _CategoryCard(service: items[index]),
            ),
          ],
        ),
      );
    }

    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Place Register', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Expanded(
            child: Column(
              children: [
                for (final row in rows)
                  Expanded(
                    child: DecoratedBox(
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: AppColors.border)),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _FitCategoryCell(service: row[0])),
                          const VerticalDivider(width: 1, thickness: 1, color: AppColors.border),
                          Expanded(
                            child: row.length > 1 ? _FitCategoryCell(service: row[1]) : const SizedBox.expand(),
                          ),
                        ],
                      ),
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

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.service});

  final ServiceItem service;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openVendorForm(context, service),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
          child: Column(
            children: [
              CategoryArt(id: service.id, size: 84),
              const SizedBox(height: 10),
              Text(
                service.name,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FitCategoryCell extends StatelessWidget {
  const _FitCategoryCell({required this.service});

  final ServiceItem service;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => openVendorForm(context, service),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final imageSize = (constraints.maxHeight - 22).clamp(36.0, 64.0);
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CategoryArt(id: service.id, size: imageSize),
                const SizedBox(height: 4),
                Text(
                  service.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.text),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

void openVendorForm(BuildContext context, ServiceItem service) {
  if (!ServiceCatalog.isEnabled(service.id)) return;
  if (ClaimedCategories.has(service.id)) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('You already listed this service')),
    );
    return;
  }
  if (service.id == 'electrician') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const ElectricianRegistrationPage()),
    );
    return;
  }
  if (service.id == 'plumber') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PlumberRegistrationPage()),
    );
    return;
  }
  if (service.id == 'cleaning') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CleaningRegistrationPage()),
    );
    return;
  }
  if (service.id == 'ac') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const AcRegistrationPage()),
    );
    return;
  }
  if (service.id == 'carpenter') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CarpenterRegistrationPage()),
    );
    return;
  }
  if (service.id == 'painting') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PaintingRegistrationPage()),
    );
    return;
  }
  if (service.id == 'appliance') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const ApplianceRegistrationPage()),
    );
    return;
  }
  if (service.id == 'beautician') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BeauticianRegistrationPage()),
    );
    return;
  }
  if (service.id == 'cabs') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CabRegistrationPage()),
    );
    return;
  }
  if (service.id == 'hotels') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const StayRegistrationPage()),
    );
    return;
  }
  if (service.id == 'tours') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const ToursRegistrationPage()),
    );
    return;
  }
  if (service.id == 'public-transport') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PublicTransportVendorPage()),
    );
    return;
  }
  if (service.id == 'goods-transport') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const GoodsTransportVendorPage()),
    );
    return;
  }
  if (service.id == 'packers-movers') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PackersMoversVendorPage()),
    );
    return;
  }
  if (service.id == 'cloud-kitchen') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CloudKitchenRegistrationPage()),
    );
    return;
  }
  final config = vendorFormById(service.id);
  if (config == null) return;
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => VendorListingFormPage(service: service, config: config),
    ),
  );
}
