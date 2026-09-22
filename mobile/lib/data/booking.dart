class BookingDraft {
  const BookingDraft({
    required this.listingId,
    required this.title,
    required this.vendor,
    required this.location,
    required this.image,
    required this.categoryId,
    required this.category,
    required this.unitPrice,
    required this.priceUnit,
    this.scheduledAt,
    this.address,
    this.notes,
    this.checkIn,
    this.checkOut,
    this.travelers,
    this.pickupAddress,
    this.dropAddress,
    this.customerLat,
    this.customerLng,
    this.quantity = 1,
  });

  final String listingId;
  final String title;
  final String vendor;
  final String location;
  final String image;
  final String categoryId;
  final String category;
  final double unitPrice;
  final String priceUnit;
  final String? scheduledAt;
  final String? address;
  final String? notes;
  final String? checkIn;
  final String? checkOut;
  final int? travelers;
  final String? pickupAddress;
  final String? dropAddress;
  final double? customerLat;
  final double? customerLng;
  final int quantity;

  bool get isHotel => categoryId == 'hotels';
  bool get isTour => categoryId == 'tours';
  bool get isCab => categoryId == 'cabs';
  bool get needsAddress => !isHotel && !isTour;

  Map<String, dynamic> toCheckoutItem([String? fallbackAddress]) {
    final qty = isTour ? (travelers ?? quantity) : quantity;
    return {
      'listingId': listingId,
      'quantity': qty,
      if (scheduledAt != null && scheduledAt!.isNotEmpty) 'scheduledAt': scheduledAt,
      if ((address ?? fallbackAddress)?.trim().isNotEmpty == true) 'address': (address ?? fallbackAddress)!.trim(),
      if (notes != null && notes!.trim().isNotEmpty) 'notes': notes!.trim(),
      'details': {
        if (checkIn != null) 'checkIn': checkIn,
        if (checkOut != null) 'checkOut': checkOut,
        if (isTour) 'travelers': travelers ?? quantity,
        'travelDate': scheduledAt?.substring(0, scheduledAt!.length >= 10 ? 10 : scheduledAt!.length) ?? checkIn,
        if (pickupAddress != null && pickupAddress!.isNotEmpty) 'pickupAddress': pickupAddress,
        if (dropAddress != null && dropAddress!.isNotEmpty) 'dropAddress': dropAddress,
        if (customerLat != null) 'customerLat': customerLat,
        if (customerLng != null) 'customerLng': customerLng,
        'quantity': quantity,
      },
    };
  }
}

class BookingQuote {
  const BookingQuote({required this.subtotal, required this.tax, required this.total, this.currency = 'INR'});

  final double subtotal;
  final double tax;
  final double total;
  final String currency;
}

class CheckoutResult {
  const CheckoutResult({
    required this.bookings,
    required this.total,
    required this.paid,
    this.currency = 'INR',
    this.method,
    this.payAfterService = false,
  });

  final List<BookingSummary> bookings;
  final double total;
  final bool paid;
  final String currency;
  final String? method;
  final bool payAfterService;
}

class BookingSummary {
  const BookingSummary({
    required this.id,
    required this.bookingNumber,
    required this.status,
    required this.total,
    required this.type,
    this.title = '',
    this.address = '',
    this.scheduledAt,
    this.createdAt,
  });

  final String id;
  final String bookingNumber;
  final String status;
  final String total;
  final String type;
  final String title;
  final String address;
  final String? scheduledAt;
  final String? createdAt;
}

String inr(num value) {
  final n = value.toDouble();
  if (n == n.roundToDouble()) return '₹${n.round()}';
  return '₹${n.toStringAsFixed(2)}';
}

String priceUnitWord(String unit) {
  final value = unit.replaceAll('_', ' ').trim().toLowerCase();
  return value;
}

String pad2(int n) => n.toString().padLeft(2, '0');

String soonSlot() {
  final d = DateTime.now().add(const Duration(minutes: 30));
  return '${d.year}-${pad2(d.month)}-${pad2(d.day)}T${pad2(d.hour)}:${pad2(d.minute)}';
}

String localDate([int days = 1]) {
  final d = DateTime.now().add(Duration(days: days));
  return '${d.year}-${pad2(d.month)}-${pad2(d.day)}';
}

String formatSlotLabel(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${parsed.day} ${months[parsed.month - 1]}, ${pad2(parsed.hour)}:${pad2(parsed.minute)}';
}
