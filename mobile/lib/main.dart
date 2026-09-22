import 'package:flutter/material.dart';
import 'data/firebase.dart';
import 'features/auth/auth_gate.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initFirebase();
  runApp(const BookItAllApp());
}

class BookItAllApp extends StatelessWidget {
  const BookItAllApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Book It All',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AuthGate(),
    );
  }
}
