import 'dart:async';

import 'package:flutter/material.dart';
import '../../data/api.dart';
import '../../data/service_catalog.dart';
import '../../theme/app_colors.dart';
import '../shell/app_shell.dart';
import 'auth_page.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _loading = true;
  bool _signedIn = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    await ServiceCatalog.restore();
    unawaited(ServiceCatalog.refresh());
    final ok = await restoreSession();
    if (ok) unawaited(ClaimedCategories.refresh());
    if (!mounted) return;
    setState(() {
      _signedIn = ok;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (!_signedIn) {
      return AuthPage(
        onSignedIn: () {
          unawaited(ClaimedCategories.refresh());
          setState(() => _signedIn = true);
        },
      );
    }
    return const AppShell();
  }
}
