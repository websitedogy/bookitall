import 'dart:async';

import 'package:flutter/material.dart';
import '../../data/api.dart';

const reportReasons = [
  'Fake or misleading',
  'Wrong photos',
  'Wrong price or details',
  'Inappropriate',
  'Spam',
  'Other',
];

const _destinationKeys = {
  'pickupPoint',
  'dropPoint',
  'destinations',
  'pickupAvailable',
  'dropAvailable',
};

const _locationKeys = {
  'location',
  'address',
  'city',
  'area',
  'state',
  'street',
  'houseNumber',
  'district',
  'mandals',
  'coverageType',
  'coverage',
  'serviceArea',
  'serviceKm',
  'serviceLocations',
  'routeType',
  'travelType',
};

const _priceKeys = {
  'price',
  'priceUnit',
  'priceFrom',
  'feeFrom',
  'entryPrice',
  'visitCharge',
  'perKm',
  'hourlyCharge',
  'fullDayCharge',
  'extraKmCharge',
  'waitingCharge',
  'nightCharge',
  'driverAllowance',
  'advancePayment',
  'packagePricing',
  'vehicleFares',
  'minKm',
  'minHours',
  'extraGuestCharge',
  'roomRates',
  'servicePricing',
  'startingCharge',
  'workChargesNote',
};

const _extraKeys = {
  'description',
  'inclusions',
  'food',
  'meals',
  'houseRules',
  'facilities',
  'roomFeatures',
  'vehicleFeatures',
  'cancellation',
  'childPolicy',
  'checkPolicy',
  'tools',
  'materialResponsibility',
  'productResponsibility',
  'spareParts',
  'paintTypes',
  'cleaningItems',
  'beautyServices',
  'notes',
  'additional',
};

enum _DetailTab { destinations, location, basics, prices, extra }

Map<_DetailTab, String> _tabNames(String categoryId) {
  if (categoryId == 'hotels' || categoryId == 'homestay') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Location',
      _DetailTab.basics: 'Stay',
      _DetailTab.prices: 'Rates',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'tours') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Places',
      _DetailTab.basics: 'Package',
      _DetailTab.prices: 'Price',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'cabs' || categoryId == 'public-transport' || categoryId == 'goods-transport') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Area',
      _DetailTab.basics: 'Vehicle',
      _DetailTab.prices: 'Fares',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'packers-movers') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Area',
      _DetailTab.basics: 'Move',
      _DetailTab.prices: 'Charges',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'cloud-kitchen') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Place',
      _DetailTab.basics: 'Kitchen',
      _DetailTab.prices: 'Prices',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'jobs') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Area',
      _DetailTab.basics: 'Profile',
      _DetailTab.prices: 'Fees',
      _DetailTab.extra: 'Extra',
    };
  }
  if (categoryId == 'electrician' ||
      categoryId == 'plumber' ||
      categoryId == 'ac' ||
      categoryId == 'cleaning' ||
      categoryId == 'carpenter' ||
      categoryId == 'painting' ||
      categoryId == 'appliance' ||
      categoryId == 'beautician') {
    return {
      _DetailTab.destinations: 'Destinations',
      _DetailTab.location: 'Area',
      _DetailTab.basics: 'Service',
      _DetailTab.prices: 'Charges',
      _DetailTab.extra: 'Extra',
    };
  }
  return {
    _DetailTab.destinations: 'Destinations',
    _DetailTab.location: 'Location',
    _DetailTab.basics: 'Basics',
    _DetailTab.prices: 'Prices',
    _DetailTab.extra: 'Extra',
  };
}

_DetailTab _classify(String key) {
  if (_destinationKeys.contains(key)) return _DetailTab.destinations;
  if (_locationKeys.contains(key)) return _DetailTab.location;
  if (_priceKeys.contains(key)) return _DetailTab.prices;
  if (_extraKeys.contains(key)) return _DetailTab.extra;
  return _DetailTab.basics;
}

class _RouteStop {
  const _RouteStop({required this.kind, required this.label, required this.name});
  final String kind;
  final String label;
  final String name;
}

List<_RouteStop> _tourStops(List<ListingField> fields) {
  String valueOf(String key) {
    for (final field in fields) {
      if (field.key == key) return field.value.trim();
    }
    return '';
  }

  final pickup = valueOf('pickupPoint');
  final drop = valueOf('dropPoint');
  final places = valueOf('destinations')
      .split(RegExp(r'[,;\n]'))
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty)
      .toList();
  final stops = <_RouteStop>[];
  if (pickup.isNotEmpty) stops.add(_RouteStop(kind: 'pickup', label: 'Pickup', name: pickup));
  for (var i = 0; i < places.length; i++) {
    stops.add(_RouteStop(kind: 'place', label: 'Place ${i + 1}', name: places[i]));
  }
  if (drop.isNotEmpty) stops.add(_RouteStop(kind: 'drop', label: 'Drop', name: drop));
  return stops;
}

class ListingInfoTabs extends StatefulWidget {
  const ListingInfoTabs({
    super.key,
    required this.listingId,
    required this.listingTitle,
    required this.categoryId,
    this.location = '',
    this.description = '',
    this.phone = '',
    this.details = const [],
    this.reviewCount = 0,
    this.child,
  });

  final String listingId;
  final String listingTitle;
  final String categoryId;
  final String location;
  final String description;
  final String phone;
  final List<ListingField> details;
  final int reviewCount;
  final Widget? child;

  @override
  State<ListingInfoTabs> createState() => _ListingInfoTabsState();
}

class _ListingInfoTabsState extends State<ListingInfoTabs> {
  _DetailTab _tab = _DetailTab.destinations;

  Map<_DetailTab, List<ListingField>> get _groups {
    final groups = {
      _DetailTab.destinations: <ListingField>[],
      _DetailTab.location: <ListingField>[],
      _DetailTab.basics: <ListingField>[],
      _DetailTab.prices: <ListingField>[],
      _DetailTab.extra: <ListingField>[],
    };
    if (widget.phone.isNotEmpty) {
      groups[_DetailTab.basics]!.add(ListingField(key: 'phone', label: 'Phone', value: widget.phone));
    }
    for (final field in widget.details) {
      if (field.label == 'About' || field.label == 'Phone' || field.key == 'phone' || field.key == 'mobileNumber') {
        continue;
      }
      groups[_classify(field.key)]!.add(field);
    }
    if (widget.location.trim().isNotEmpty &&
        !groups[_DetailTab.location]!.any((row) => row.value.trim().toLowerCase() == widget.location.trim().toLowerCase())) {
      groups[_DetailTab.location]!.insert(0, ListingField(key: 'location', label: 'Location', value: widget.location.trim()));
    }
    if (widget.description.trim().isNotEmpty && !groups[_DetailTab.extra]!.any((row) => row.key == 'description')) {
      groups[_DetailTab.extra]!.insert(0, ListingField(key: 'description', label: 'About', value: widget.description.trim()));
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    final names = _tabNames(widget.categoryId);
    final groups = _groups;
    final tabs = _DetailTab.values.where((id) => groups[id]!.isNotEmpty).toList();
    final active = tabs.contains(_tab) ? _tab : (tabs.isNotEmpty ? tabs.first : _DetailTab.basics);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _badge(
                label: 'Reviews',
                icon: Icons.star_border,
                badge: '${widget.reviewCount}',
                onTap: _openReviews,
              ),
              _badge(
                label: 'Report',
                icon: Icons.flag_outlined,
                alert: true,
                onTap: _openReport,
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: Color(0xFFEFE6D4)),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.child != null) widget.child!,
              const SizedBox(height: 18),
              if (tabs.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: const Color(0xFFF4EFE4), borderRadius: BorderRadius.circular(99)),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final id in tabs)
                          Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: GestureDetector(
                              onTap: () => setState(() => _tab = id),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 160),
                                height: 36,
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: active == id ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(99),
                                ),
                                child: Text(
                                  names[id]!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: active == id ? const Color(0xFF0F3D38) : const Color(0xFF7A6A52),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                if (active == _DetailTab.destinations && _tourStops(groups[active]!).isNotEmpty)
                  _TourRouteTracker(fields: groups[active]!)
                else ...[
                  for (final field in groups[active]!)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(width: 140, child: Text(field.label, style: const TextStyle(color: Color(0xFF7A6A52)))),
                          Expanded(
                            child: Text(
                              field.value,
                              textAlign: TextAlign.right,
                              style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF12241F)),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ],
              if (tabs.isEmpty)
                const Text('No extra details for this listing yet.', style: TextStyle(color: Color(0xFF7A6A52))),
            ],
          ),
        ),
      ],
    );
  }

  void _openReviews() {
    showDialog<void>(
      context: context,
      barrierColor: const Color(0x80000000),
      builder: (dialog) => _ListingModal(
        title: 'Reviews',
        onClose: () => Navigator.of(dialog).pop(),
        child: _reviews(),
      ),
    );
  }

  void _openReport() {
    showDialog<void>(
      context: context,
      barrierColor: const Color(0x80000000),
      builder: (dialog) => _ListingModal(
        title: 'Report listing',
        onClose: () => Navigator.of(dialog).pop(),
        child: _ReportForm(listingId: widget.listingId, listingTitle: widget.listingTitle),
      ),
    );
  }

  Widget _badge({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    String? badge,
    bool alert = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF4EFE4),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: const Color(0xFF5B6E68)),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF5B6E68))),
            if (badge != null) ...[
              const SizedBox(width: 6),
              Container(
                constraints: const BoxConstraints(minWidth: 16),
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99)),
                child: Text(
                  badge,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF0F3D38)),
                ),
              ),
            ],
            if (alert) ...[
              const SizedBox(width: 6),
              const CircleAvatar(radius: 3, backgroundColor: Color(0xFFDC2626)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _reviews() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 22),
      decoration: BoxDecoration(color: const Color(0xFFF7F3EA), borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.star_border, size: 18, color: Color(0xFFEADFCD)),
              Icon(Icons.star_border, size: 18, color: Color(0xFFEADFCD)),
              Icon(Icons.star_border, size: 18, color: Color(0xFFEADFCD)),
              Icon(Icons.star_border, size: 18, color: Color(0xFFEADFCD)),
              Icon(Icons.star_border, size: 18, color: Color(0xFFEADFCD)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            widget.reviewCount > 0 ? '${widget.reviewCount} reviews' : 'No reviews yet',
            style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF12241F)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Ratings show here after a completed booking.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, height: 1.35, color: Color(0xFF7A6A52)),
          ),
        ],
      ),
    );
  }
}

class _TourRouteTracker extends StatefulWidget {
  const _TourRouteTracker({required this.fields});
  final List<ListingField> fields;

  @override
  State<_TourRouteTracker> createState() => _TourRouteTrackerState();
}

class _TourRouteTrackerState extends State<_TourRouteTracker> {
  Timer? _timer;
  int _lit = 0;

  List<_RouteStop> get _stops => _tourStops(widget.fields);

  List<ListingField> get _leftover => widget.fields
      .where((field) =>
          field.key != 'pickupPoint' &&
          field.key != 'dropPoint' &&
          field.key != 'destinations' &&
          field.key != 'pickupAvailable' &&
          field.key != 'dropAvailable')
      .toList();

  @override
  void initState() {
    super.initState();
    _arm();
  }

  @override
  void didUpdateWidget(covariant _TourRouteTracker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.fields != widget.fields) {
      _lit = 0;
      _arm();
    }
  }

  void _arm() {
    _timer?.cancel();
    final stops = _stops;
    if (stops.length < 2) return;
    _timer = Timer(Duration(milliseconds: _lit >= stops.length ? 700 : 850), () {
      if (!mounted) return;
      setState(() => _lit = _lit >= stops.length ? 0 : _lit + 1);
      _arm();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final stops = _stops;
    if (stops.isEmpty) return const SizedBox.shrink();
    return Column(
      children: [
        for (var i = 0; i < stops.length; i++) _stopRow(stops, i),
        for (final field in _leftover)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 140, child: Text(field.label, style: const TextStyle(color: Color(0xFF7A6A52)))),
                Expanded(
                  child: Text(
                    field.value,
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF12241F)),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _stopRow(List<_RouteStop> stops, int index) {
    final stop = stops[index];
    final visited = _lit > index;
    final arriving = _lit == index;
    final last = index == stops.length - 1;
    final lit = arriving || visited;
    final placeNumber = stops.take(index).where((item) => item.kind == 'place').length + 1;

    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 4),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 32,
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 280),
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: arriving
                          ? const Color(0xFF0F766E)
                          : visited
                              ? const Color(0xFF0F3D38)
                              : const Color(0xFFF4EFE4),
                      shape: BoxShape.circle,
                      border: arriving || visited ? null : Border.all(color: const Color(0xFFEADFCD)),
                      boxShadow: arriving
                          ? const [BoxShadow(color: Color(0x880F766E), blurRadius: 12, spreadRadius: 1)]
                          : null,
                    ),
                    child: Center(
                      child: stop.kind == 'pickup'
                          ? Icon(Icons.place_outlined, size: 16, color: lit ? Colors.white : const Color(0xFF7A6A52))
                          : stop.kind == 'drop'
                              ? Icon(Icons.flag_outlined, size: 16, color: lit ? Colors.white : const Color(0xFF7A6A52))
                              : Text(
                                  '$placeNumber',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: lit ? Colors.white : const Color(0xFF7A6A52),
                                  ),
                                ),
                    ),
                  ),
                  if (!last)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 500),
                        width: 2,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        color: visited ? const Color(0xFF0F766E) : const Color(0xFFEADFCD),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stop.label.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                        color: lit ? const Color(0xFF0F766E) : const Color(0xFFA89880),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      stop.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: lit ? const Color(0xFF12241F) : const Color(0xFF5B6E68),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingModal extends StatelessWidget {
  const _ListingModal({required this.title, required this.onClose, required this.child});

  final String title;
  final VoidCallback onClose;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 480, maxHeight: MediaQuery.sizeOf(context).height * 0.82),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
                  ),
                  IconButton(
                    onPressed: onClose,
                    icon: const Icon(Icons.close, size: 20, color: Color(0xFF5B6E68)),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFEADFCD)),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                child: child,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportForm extends StatefulWidget {
  const _ReportForm({required this.listingId, required this.listingTitle});

  final String listingId;
  final String listingTitle;

  @override
  State<_ReportForm> createState() => _ReportFormState();
}

class _ReportFormState extends State<_ReportForm> {
  final _name = TextEditingController(text: SessionStore.fullName ?? '');
  final _phone = TextEditingController(text: SessionStore.phone ?? '');
  final _message = TextEditingController();
  String _reason = reportReasons.first;
  bool _busy = false;
  bool _sent = false;
  String _error = '';

  bool get _signedIn => SessionStore.isSignedIn;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  InputDecoration _box(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: const Color(0xFFF6F1E8),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await submitListingReport(
        listingId: widget.listingId,
        listingTitle: widget.listingTitle,
        reason: _reason,
        message: _message.text.trim(),
        name: _signedIn ? SessionStore.fullName : _name.text,
        phone: _signedIn ? SessionStore.phone : _phone.text,
      );
      if (!mounted) return;
      setState(() {
        _sent = true;
        _busy = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = err.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sent) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 22),
        decoration: BoxDecoration(color: const Color(0xFFF7F3EA), borderRadius: BorderRadius.circular(16)),
        child: const Column(
          children: [
            Text('Report sent', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF12241F))),
            SizedBox(height: 4),
            Text(
              'Support will check this listing from the Hyderabad desk.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, height: 1.35, color: Color(0xFF7A6A52)),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tell us what is wrong. This goes to Book It All support, not the vendor.',
          style: TextStyle(fontSize: 13, height: 1.35, color: Color(0xFF7A6A52)),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            for (final item in reportReasons)
              ChoiceChip(
                label: Text(item),
                selected: _reason == item,
                showCheckmark: false,
                onSelected: (_) => setState(() => _reason = item),
                selectedColor: const Color(0xFF0F3D38),
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _reason == item ? Colors.white : const Color(0xFF5B6E68),
                ),
                backgroundColor: const Color(0xFFF4EFE4),
                side: BorderSide.none,
                shape: const StadiumBorder(),
              ),
          ],
        ),
        if (!_signedIn) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: TextField(controller: _name, decoration: _box('Your name'))),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: _box('Mobile'),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 10),
        TextField(
          controller: _message,
          minLines: 3,
          maxLines: 4,
          decoration: _box('Describe the issue'),
        ),
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_error, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13)),
        ],
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _busy ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF0F3D38),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: const StadiumBorder(),
            ),
            child: Text(_busy ? 'Sending…' : 'Submit report'),
          ),
        ),
      ],
    );
  }
}
