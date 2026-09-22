import 'package:flutter/material.dart';
import '../../tabs/tab_pages.dart';

class VendorOrdersPage extends StatelessWidget {
  const VendorOrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      children: const [
        PlaceholderTab(
          title: 'My Orders',
          kicker: 'Vendor',
          body: 'Incoming jobs from customers for the services you listed.',
          icon: Icons.receipt_long_outlined,
        ),
      ],
    );
  }
}
