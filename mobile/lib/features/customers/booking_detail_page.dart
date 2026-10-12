import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../data/booking.dart';
import '../../theme/app_colors.dart';

class BookingDetailPage extends StatefulWidget {
  const BookingDetailPage({super.key, required this.id, this.initial});

  final String id;
  final BookingSummary? initial;

  @override
  State<BookingDetailPage> createState() => _BookingDetailPageState();
}

class _BookingDetailPageState extends State<BookingDetailPage> {
  BookingSummary? _booking;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _booking = widget.initial;
    _load();
  }

  Future<void> _load() async {
    try {
      final booking = await fetchBooking(widget.id);
      if (!mounted) return;
      setState(() {
        _booking = booking;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = _booking;
    return Scaffold(
      appBar: AppBar(title: const Text('Booking')),
      body: _loading && booking == null
          ? const Center(child: CircularProgressIndicator())
          : booking == null
              ? const Center(child: Text('Booking not found.'))
              : ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  children: [
                    Text(booking.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text(booking.bookingNumber, style: const TextStyle(color: AppColors.textMuted)),
                    const SizedBox(height: 12),
                    Text(booking.status.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                    const SizedBox(height: 16),
                    _row('Amount', booking.total.startsWith('₹') ? booking.total : inr(num.tryParse(booking.total) ?? 0)),
                    _row('Type', booking.type.replaceAll('_', ' ')),
                    if (booking.address.isNotEmpty) _row('Address', booking.address),
                    if ((booking.scheduledAt ?? '').isNotEmpty) _row('When', formatSlotLabel(booking.scheduledAt!)),
                    if (booking.showCompletionCode) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3FAF7),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFD7EFE6)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('COMPLETION CODE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: Color(0xFF0F766E))),
                            const SizedBox(height: 6),
                            Text(booking.completionOtp!, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: 8)),
                            const SizedBox(height: 6),
                            const Text('Tell this to the vendor when the work is finished.', style: TextStyle(color: Color(0xFF5B6E68), height: 1.35)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label, style: const TextStyle(color: AppColors.textMuted))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
