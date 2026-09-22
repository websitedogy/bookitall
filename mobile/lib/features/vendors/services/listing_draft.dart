import 'package:flutter/material.dart';
import '../../../data/api.dart';
import '../../../data/catalog.dart';
import '../../../data/india_locations.dart';
import '../../../theme/app_colors.dart';
import 'vendor_form_config.dart';

class ListingDraft {
  const ListingDraft({
    required this.service,
    required this.config,
    required this.displayName,
    required this.fields,
    this.photoPaths = const [],
  });

  final ServiceItem service;
  final VendorFormConfig config;
  final String displayName;
  final Map<String, String> fields;
  final List<String> photoPaths;

  ListingDraft copyWith({List<String>? photoPaths}) {
    return ListingDraft(
      service: service,
      config: config,
      displayName: displayName,
      fields: fields,
      photoPaths: photoPaths ?? this.photoPaths,
    );
  }
}

Future<void> submitListingDraft(ListingDraft draft, PlaceChoice place) async {
  final fields = Map<String, String>.from(draft.fields);
  fields['location'] = place.full;
  fields['city'] = place.city;
  fields['state'] = place.state;
  fields['area'] = place.area;
  if (place.latitude != null) fields['latitude'] = place.latitude!.toString();
  if (place.longitude != null) fields['longitude'] = place.longitude!.toString();
  if (SessionStore.fullName != null && SessionStore.fullName!.isNotEmpty) {
    fields['listedBy'] = SessionStore.fullName!;
  }

  final mobile = (fields['mobileNumber'] ?? fields['phone'] ?? SessionStore.phone ?? '').replaceAll(RegExp(r'\D'), '');
  if (mobile.isNotEmpty) fields['mobileNumber'] = mobile.length > 10 ? mobile.substring(mobile.length - 10) : mobile;
  fields.remove('phone');

  if ((fields['price'] ?? '').isEmpty) {
    final amount = fields['feeFrom'] ?? fields['priceFrom'];
    if (amount != null && amount.isNotEmpty) fields['price'] = amount;
  }

  if (draft.config.id == 'hotels') {
    await submitHotelListing(
      hotelName: fields['hotelName'] ?? draft.displayName,
      mobileNumber: fields['mobileNumber'] ?? SessionStore.phone ?? '',
      hotelType: fields['hotelType'] ?? '',
      roomType: fields['roomType'] ?? '',
      location: place.full,
      price: fields['price'] ?? '',
      priceUnit: fields['priceUnit'] ?? 'Per Room',
      entryPrice: fields['entryPrice'],
      checkInTime: fields['checkIn'] ?? '',
      checkOutTime: fields['checkOut'] ?? '',
      photoPaths: draft.photoPaths,
      latitude: place.latitude,
      longitude: place.longitude,
    );
  } else {
    if (fields['priceUnit'] != null) {
      fields['priceUnit'] = priceUnitCode(fields['priceUnit']!);
    }
    await submitVendorListing(
      category: draft.config.id,
      fields: fields,
      photoPaths: draft.photoPaths,
    );
  }
  PostsRefresh.bump();
}

class ListingSavedPage extends StatelessWidget {
  const ListingSavedPage({super.key, required this.name, required this.location});

  final String name;
  final String location;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
          child: Column(
            children: [
              const Icon(Icons.check_circle_outline, size: 56, color: AppColors.primary),
              const SizedBox(height: 16),
              const Text(
                'PENDING REVIEW',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.6,
                ),
              ),
              const SizedBox(height: 8),
              Text(name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Text(
                'Saved${location.isEmpty ? '' : ' in $location'}. It appears in My Services as pending. Customers within 10 km see it after admin accepts.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textMuted, height: 1.45),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () {
                    ShellTab.goToPosts();
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: FilledButton.styleFrom(shape: const StadiumBorder()),
                  child: const Text('View My Services'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () {
                    ShellTab.goToAddService();
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: OutlinedButton.styleFrom(shape: const StadiumBorder()),
                  child: const Text('Register another place'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
