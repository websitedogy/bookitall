import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

String _env(String key, [String fallback = '']) {
  const defines = {
    'FIREBASE_API_KEY': String.fromEnvironment('FIREBASE_API_KEY'),
    'FIREBASE_AUTH_DOMAIN': String.fromEnvironment('FIREBASE_AUTH_DOMAIN'),
    'FIREBASE_PROJECT_ID': String.fromEnvironment('FIREBASE_PROJECT_ID'),
    'FIREBASE_MESSAGING_SENDER_ID': String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID'),
    'FIREBASE_WEB_APP_ID': String.fromEnvironment('FIREBASE_WEB_APP_ID'),
    'FIREBASE_ANDROID_APP_ID': String.fromEnvironment('FIREBASE_ANDROID_APP_ID'),
    'FIREBASE_IOS_APP_ID': String.fromEnvironment('FIREBASE_IOS_APP_ID'),
    'FIREBASE_IOS_BUNDLE_ID': String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID'),
  };
  final fromDefine = defines[key] ?? '';
  if (fromDefine.isNotEmpty) return fromDefine;
  if (!dotenv.isInitialized) return fallback;
  final value = dotenv.env[key] ??
      dotenv.env['NEXT_PUBLIC_$key'] ??
      (key == 'FIREBASE_WEB_APP_ID' ? dotenv.env['NEXT_PUBLIC_FIREBASE_APP_ID'] : null) ??
      (key == 'FIREBASE_API_KEY' ? dotenv.env['NEXT_PUBLIC_FIREBASE_API_KEY'] : null) ??
      '';
  return value.trim().isEmpty ? fallback : value.trim();
}

String get _apiKey => _env('FIREBASE_API_KEY', _env('NEXT_PUBLIC_FIREBASE_API_KEY'));
String get _authDomain => _env('FIREBASE_AUTH_DOMAIN', _env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'));
String get _projectId => _env('FIREBASE_PROJECT_ID', _env('NEXT_PUBLIC_FIREBASE_PROJECT_ID'));
String get _senderId => _env('FIREBASE_MESSAGING_SENDER_ID', _env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'));
String get _webAppId => _env('FIREBASE_WEB_APP_ID', _env('NEXT_PUBLIC_FIREBASE_APP_ID'));
String get _androidAppId => _env('FIREBASE_ANDROID_APP_ID', _webAppId);
String get _iosAppId => _env('FIREBASE_IOS_APP_ID', _webAppId);
String get _iosBundleId => _env('FIREBASE_IOS_BUNDLE_ID', 'com.bookitall.bookitallMobile');

String get _appId {
  if (kIsWeb) return _webAppId;
  switch (defaultTargetPlatform) {
    case TargetPlatform.iOS:
    case TargetPlatform.macOS:
      return _iosAppId;
    default:
      return _androidAppId;
  }
}

bool isFirebaseConfigured() {
  return _apiKey.isNotEmpty && _projectId.isNotEmpty && _appId.isNotEmpty && _senderId.isNotEmpty;
}

FirebaseOptions? firebaseOptions() {
  if (!isFirebaseConfigured()) return null;
  return FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _senderId,
    projectId: _projectId,
    authDomain: _authDomain.isEmpty ? null : _authDomain,
    iosBundleId: _iosBundleId,
  );
}

Future<void> initFirebase() async {
  try {
    await dotenv.load(fileName: '.env', isOptional: true);
  } catch (_) {}
  if (Firebase.apps.isNotEmpty) return;
  final options = firebaseOptions();
  if (options == null) return;
  await Firebase.initializeApp(options: options);
}

String e164India(String phone) {
  final digits = phone.replaceAll(RegExp(r'\D'), '');
  return '+91${digits.length >= 10 ? digits.substring(digits.length - 10) : digits}';
}

String firebaseAuthMessage(Object error) {
  if (error is FirebaseAuthException) {
    switch (error.code) {
      case 'invalid-phone-number':
        return 'Enter a valid 10-digit mobile number';
      case 'too-many-requests':
        return 'Too many OTP attempts. Wait a few minutes and try again.';
      case 'invalid-verification-code':
        return 'That OTP is incorrect. Check the SMS and try again.';
      case 'session-expired':
      case 'invalid-verification-id':
        return 'OTP expired. Request a new code.';
      case 'missing-verification-code':
        return 'Enter the 6-digit OTP';
      case 'quota-exceeded':
        return 'SMS quota exceeded for today. Try again tomorrow.';
      case 'operation-not-allowed':
        return 'Enable Phone sign-in in Firebase Authentication.';
      case 'api-key-not-valid.-please-pass-a-valid-api-key.':
      case 'invalid-api-key':
        return 'Firebase API key is invalid. Copy apiKey from Project settings → Your apps.';
      case 'app-not-authorized':
      case 'missing-client-identifier':
        return 'Add the Android app (com.bookitall.bookitall_mobile) and debug SHA-1 in Firebase.';
      default:
        return error.message?.trim().isNotEmpty == true ? error.message! : 'Could not verify OTP';
    }
  }
  return error.toString().replaceFirst('Exception: ', '');
}

class PhoneOtpResult {
  const PhoneOtpResult({this.verificationId, this.resendToken, this.idToken});

  final String? verificationId;
  final int? resendToken;
  final String? idToken;

  bool get autoVerified => idToken != null && idToken!.isNotEmpty;
}

Future<PhoneOtpResult> sendPhoneOtp(String phone, {int? resendToken}) async {
  if (Firebase.apps.isEmpty) {
    throw Exception('Add Firebase keys to mobile/.env, then hot restart the app.');
  }
  final completer = Completer<PhoneOtpResult>();
  await FirebaseAuth.instance.verifyPhoneNumber(
    phoneNumber: e164India(phone),
    timeout: const Duration(seconds: 60),
    forceResendingToken: resendToken,
    verificationCompleted: (credential) async {
      try {
        final idToken = await _tokenFromCredential(credential);
        if (!completer.isCompleted) {
          completer.complete(PhoneOtpResult(idToken: idToken));
        }
      } catch (error) {
        if (!completer.isCompleted) completer.completeError(error);
      }
    },
    verificationFailed: (error) {
      if (!completer.isCompleted) completer.completeError(error);
    },
    codeSent: (verificationId, token) {
      if (!completer.isCompleted) {
        completer.complete(PhoneOtpResult(verificationId: verificationId, resendToken: token));
      }
    },
    codeAutoRetrievalTimeout: (_) {},
  );
  return completer.future.timeout(
    const Duration(seconds: 70),
    onTimeout: () => throw Exception('Could not send OTP. Check your number and try again.'),
  );
}

Future<String> confirmPhoneOtp({required String verificationId, required String otp}) async {
  final credential = PhoneAuthProvider.credential(verificationId: verificationId, smsCode: otp);
  return _tokenFromCredential(credential);
}

Future<String> _tokenFromCredential(PhoneAuthCredential credential) async {
  final result = await FirebaseAuth.instance.signInWithCredential(credential);
  final token = await result.user?.getIdToken();
  await FirebaseAuth.instance.signOut();
  if (token == null || token.isEmpty) {
    throw Exception('Could not verify OTP');
  }
  return token;
}
