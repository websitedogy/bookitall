import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../data/api.dart';
import '../../data/firebase.dart';
import '../../theme/app_colors.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, this.onSignedIn});

  final VoidCallback? onSignedIn;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  bool _busy = false;
  bool _otpStep = false;
  String _error = '';
  String _verificationId = '';
  int? _resendToken;
  int _resendIn = 0;
  Timer? _resendTimer;
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _google = GoogleSignIn(scopes: const ['email', 'profile']);

  @override
  void dispose() {
    _resendTimer?.cancel();
    _name.dispose();
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _startResendClock() {
    _resendTimer?.cancel();
    setState(() => _resendIn = 30);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendIn <= 1) {
        timer.cancel();
        setState(() => _resendIn = 0);
        return;
      }
      setState(() => _resendIn -= 1);
    });
  }

  Future<void> _finish({required String idToken}) async {
    final name = _name.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    await continueWithPhone(fullName: name, phone: phone, idToken: idToken);
    if (!mounted) return;
    widget.onSignedIn?.call();
  }

  Future<void> _sendOtp() async {
    final name = _name.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    if (name.isEmpty) {
      setState(() => _error = 'Enter your name');
      return;
    }
    if (phone.length != 10) {
      setState(() => _error = 'Enter a 10-digit mobile number');
      return;
    }
    if (!isFirebaseConfigured()) {
      setState(() => _error = 'Add Firebase keys to mobile/.env, then hot restart the app.');
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final result = await sendPhoneOtp(phone, resendToken: _resendToken);
      if (!mounted) return;
      if (result.autoVerified) {
        await _finish(idToken: result.idToken!);
        return;
      }
      setState(() {
        _verificationId = result.verificationId ?? '';
        _resendToken = result.resendToken;
        _otpStep = true;
        _otp.clear();
        _busy = false;
      });
      _startResendClock();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = firebaseAuthMessage(error);
        _busy = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    final code = _otp.text.replaceAll(RegExp(r'\D'), '');
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit OTP');
      return;
    }
    if (_verificationId.isEmpty) {
      setState(() => _error = 'Request a new OTP');
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final idToken = await confirmPhoneOtp(verificationId: _verificationId, otp: code);
      await _finish(idToken: idToken);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = firebaseAuthMessage(error);
        _busy = false;
      });
    }
  }

  Future<void> _googleContinue() async {
    final name = _name.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    if (name.isEmpty) {
      setState(() => _error = 'Enter your name');
      return;
    }
    if (phone.length != 10) {
      setState(() => _error = 'Enter your 10-digit mobile number, then continue with Google');
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await _google.signOut();
      final account = await _google.signIn();
      if (account == null) {
        if (mounted) setState(() => _busy = false);
        return;
      }
      final googleName = (account.displayName ?? '').trim();
      await continueWithGoogle(
        fullName: googleName.isNotEmpty ? googleName : name,
        email: account.email,
        phone: phone,
      );
      if (!mounted) return;
      widget.onSignedIn?.call();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = 'Google sign-in needs a Google account on this phone. You can also enter with name and OTP.';
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
          children: [
            const Text('BOOK IT ALL', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, letterSpacing: 1.6, fontSize: 12)),
            const SizedBox(height: 10),
            const Text('Welcome', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(
              _otpStep
                  ? 'Enter the 6-digit OTP sent to +91 $phone.'
                  : 'Enter your name and mobile number. We will send an OTP to sign in.',
              style: const TextStyle(color: AppColors.textMuted, height: 1.45),
            ),
            const SizedBox(height: 24),
            if (!_otpStep) ...[
              TextField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                decoration: const InputDecoration(
                  labelText: 'Mobile number',
                  prefixText: '+91  ',
                ),
              ),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: _busy ? null : _googleContinue,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _GoogleMark(),
                    SizedBox(width: 10),
                    Text('Continue with Google', style: TextStyle(color: AppColors.text, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('or', style: TextStyle(color: AppColors.textMuted))),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 16),
            ] else ...[
              TextField(
                controller: _otp,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                decoration: const InputDecoration(labelText: 'OTP'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  TextButton(
                    onPressed: _busy
                        ? null
                        : () => setState(() {
                            _otpStep = false;
                            _error = '';
                            _otp.clear();
                          }),
                    child: const Text('Change number'),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _busy || _resendIn > 0 ? null : _sendOtp,
                    child: Text(_resendIn > 0 ? 'Resend in ${_resendIn}s' : 'Resend OTP'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            if (_error.isNotEmpty) ...[
              Text(_error, style: const TextStyle(color: Color(0xFFB91C1C))),
              const SizedBox(height: 16),
            ],
            FilledButton(
              onPressed: _busy ? null : (_otpStep ? _verifyOtp : _sendOtp),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              child: Text(_busy ? 'Please wait…' : (_otpStep ? 'Verify & continue' : 'Send OTP')),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFDADCE0)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text('G', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF4285F4))),
    );
  }
}
