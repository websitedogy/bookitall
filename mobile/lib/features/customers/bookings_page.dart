import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../data/booking.dart';
import '../../theme/app_colors.dart';
import 'booking_detail_page.dart';

class CustomerBookingsPage extends StatefulWidget {
  const CustomerBookingsPage({super.key});

  @override
  State<CustomerBookingsPage> createState() => _CustomerBookingsPageState();
}

class _CustomerBookingsPageState extends State<CustomerBookingsPage> {
  List<BookingSummary> _rows = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    BookingsRefresh.revision.addListener(_onRefresh);
    _load();
  }

  @override
  void dispose() {
    BookingsRefresh.revision.removeListener(_onRefresh);
    super.dispose();
  }

  void _onRefresh() => _load();

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final rows = await fetchMyBookings();
      if (!mounted) return;
      setState(() {
        _rows = rows;
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
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          const Text('CUSTOMER', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.6)),
          const SizedBox(height: 6),
          const Text('My Bookings', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          const Text('Hotels, tours, cabs and home services you booked.', style: TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error.isNotEmpty)
            Text(_error, style: const TextStyle(color: Color(0xFFB91C1C)))
          else if (_rows.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 32),
              child: Text('No bookings yet. Open a listing and tap Book now.', style: TextStyle(color: AppColors.textMuted, height: 1.4)),
            )
          else
            for (final booking in _rows)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Material(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    title: Text(booking.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      [
                        booking.bookingNumber,
                        booking.status.replaceAll('_', ' '),
                        if (booking.address.isNotEmpty) booking.address,
                      ].join(' · '),
                    ),
                    trailing: Text(booking.total.startsWith('₹') ? booking.total : inr(num.tryParse(booking.total) ?? 0)),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => BookingDetailPage(id: booking.id, initial: booking)),
                      );
                    },
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
