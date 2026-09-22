import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';

class CatalogImage extends StatelessWidget {
  const CatalogImage({super.key, required this.src, this.fit = BoxFit.cover});

  final String src;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    if (_isHttp(src)) {
      return Image.network(
        src,
        fit: fit,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, _, _) => const _Fallback(),
      );
    }

    if (src.contains('{') || src.contains('"') || src.trim().isEmpty) {
      return const _Fallback();
    }

    final asset = src.startsWith('/') ? 'assets$src' : src;
    if (asset.endsWith('.svg')) {
      return SvgPicture.asset(
        asset,
        fit: fit,
        width: double.infinity,
        height: double.infinity,
      );
    }
    return Image.asset(
      asset,
      fit: fit,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (_, _, _) => const _Fallback(),
    );
  }
}

bool _isHttp(String src) {
  if (src.contains('{') || src.contains('"')) return false;
  try {
    final uri = Uri.parse(src);
    return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https');
  } catch (_) {
    return false;
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: AppColors.primarySoft,
      child: Icon(Icons.image_outlined, color: AppColors.textMuted),
    );
  }
}
