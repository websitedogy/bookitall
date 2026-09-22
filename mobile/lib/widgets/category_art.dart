import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class CategoryArt extends StatelessWidget {
  const CategoryArt({super.key, required this.id, this.size = 72, this.expand = false});

  final String id;
  final double size;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final width = expand ? double.infinity : size;
    final height = expand ? double.infinity : size;
    final image = Image.asset(
      'assets/categories/$id.png',
      width: width,
      height: height,
      fit: BoxFit.cover,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, _, _) => SvgPicture.asset(
        'assets/categories/$id.svg',
        width: width,
        height: height,
        fit: BoxFit.contain,
      ),
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: expand ? SizedBox.expand(child: image) : image,
    );
  }
}
