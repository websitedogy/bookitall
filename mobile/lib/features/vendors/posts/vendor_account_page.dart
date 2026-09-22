import 'package:flutter/material.dart';
import '../../../data/api.dart';
import '../../../theme/app_colors.dart';
import '../../account/profile_page.dart';
import '../../auth/auth_gate.dart';

class VendorAccountPage extends StatelessWidget {
  const VendorAccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: [
        const Text(
          'SIGNED IN',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.6,
          ),
        ),
        const SizedBox(height: 8),
        const Text('Your account', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        const Text(
          'Listings you add are saved under this name in the database.',
          style: TextStyle(color: AppColors.textMuted, height: 1.4),
        ),
        const SizedBox(height: 20),
        _row('Name', SessionStore.fullName ?? '—'),
        _row('Email', SessionStore.email ?? '—'),
        _row('Phone', SessionStore.phone ?? '—'),
        const SizedBox(height: 8),
        if (SessionStore.isProfilePending) const PendingDot(),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () {
            Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AccountPage()));
          },
          child: const Text('Edit my profile'),
        ),
        const SizedBox(height: 16),
        FilledButton.tonal(
          onPressed: () async {
            await SessionStore.clear();
            if (!context.mounted) return;
            Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
              MaterialPageRoute<void>(builder: (_) => const AuthGate()),
              (_) => false,
            );
          },
          child: const Text('Sign out'),
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted)),
          Flexible(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
