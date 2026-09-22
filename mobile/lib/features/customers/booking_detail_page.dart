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
