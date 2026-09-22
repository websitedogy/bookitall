import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import 'homestay_registration_page.dart';
import 'hotel_registration_page.dart';

class StayRegistrationPage extends StatefulWidget {
  const StayRegistrationPage({super.key});

  @override
  State<StayRegistrationPage> createState() => _StayRegistrationPageState();
}

class _StayRegistrationPageState extends State<StayRegistrationPage> with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(_tabs.index == 0 ? 'Hotels' : 'Homestays'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: const Color(0xFF2563EB),
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: const Color(0xFF2563EB),
          tabs: const [
            Tab(text: 'Hotels'),
            Tab(text: 'Homestays'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          HotelRegistrationPage(embedded: true),
          HomestayRegistrationPage(embedded: true),
        ],
      ),
    );
  }
}
