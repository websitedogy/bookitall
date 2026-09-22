import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../data/booking.dart';
import '../../theme/app_colors.dart';
import '../customers/booking_detail_page.dart';

class CheckoutSuccessPage extends StatelessWidget {
  const CheckoutSuccessPage({super.key, required this.result});

  final CheckoutResult result;

  @override
  Widget build(BuildContext context) {
    final title = result.payAfterService
        ? 'Booking placed'
        : result.paid
            ? 'Payment successful'
            : 'Booking placed';
    final subtitle = result.payAfterService
        ? 'Pay ${inr(result.total)} after the service. Track it in My Bookings.'
        : 'Paid ${inr(result.total)}. Your booking is in My Bookings.';
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Done')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
        children: [
          const CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.primarySoft,
            child: Icon(Icons.check_circle_outline, color: AppColors.primary, size: 36),
          ),
          const SizedBox(height: 16),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, height: 1.4)),
          const SizedBox(height: 24),
          for (final booking in result.bookings)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AppColors.border),
                ),
                title: Text(booking.bookingNumber, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text('${booking.title} · ${booking.status.replaceAll('_', ' ')}'),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => BookingDetailPage(id: booking.id, initial: booking)),
                  );
                },
              ),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
              ShellTab.goToBookings();
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size.fromHeight(48),
              shape: const StadiumBorder(),
            ),
            child: const Text('View my bookings'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: const StadiumBorder(),
              foregroundColor: AppColors.primary,
            ),
            child: const Text('Book another service'),
          ),
        ],
      ),
    );
  }
}
