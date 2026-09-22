import 'package:flutter/material.dart';

class LocationMapPin extends StatelessWidget {
  const LocationMapPin({super.key, this.label = 'Your location'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        DecoratedBox(
          decoration: const BoxDecoration(
            color: Color(0xFF1B8A4A),
            borderRadius: BorderRadius.all(Radius.circular(99)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: 36,
          height: 36,
          decoration: const BoxDecoration(
            color: Color(0xFF2B7CFF),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: Colors.white, spreadRadius: 4),
              BoxShadow(color: Color(0x662B7CFF), blurRadius: 12, offset: Offset(0, 4)),
            ],
          ),
          child: const Center(
            child: DecoratedBox(
              decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: SizedBox(width: 10, height: 10),
            ),
          ),
        ),
        const SizedBox(height: 0),
        const CustomPaint(size: Size(14, 11), painter: _PinStemPainter()),
      ],
    );
  }
}

class _PinStemPainter extends CustomPainter {
  const _PinStemPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, Paint()..color = const Color(0xFF2B7CFF));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
