import 'package:flutter/material.dart';
import 'catalog_image.dart';

class PhotoCarousel extends StatefulWidget {
  const PhotoCarousel({
    super.key,
    required this.photos,
    required this.fallback,
    this.height,
    this.aspectRatio = 4 / 5,
    this.fit = BoxFit.contain,
  });

  final List<String> photos;
  final String fallback;
  final double? height;
  final double aspectRatio;
  final BoxFit fit;

  @override
  State<PhotoCarousel> createState() => _PhotoCarouselState();
}

class _PhotoCarouselState extends State<PhotoCarousel> {
  int _index = 0;

  List<String> get _slides {
    if (widget.photos.isNotEmpty) return widget.photos;
    if (widget.fallback.isNotEmpty) return [widget.fallback];
    return const [];
  }

  void _openViewer(int initialIndex) {
    setState(() => _index = initialIndex);
    final controller = PageController(initialPage: initialIndex);
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          return Dialog(
            backgroundColor: Colors.transparent,
            insetPadding: const EdgeInsets.all(12),
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.72,
                  child: PageView.builder(
                    controller: controller,
                    itemCount: _slides.length,
                    onPageChanged: (value) {
                      setDialogState(() => _index = value);
                      setState(() => _index = value);
                    },
                    itemBuilder: (_, i) =>
                        CatalogImage(src: _slides[i], fit: widget.fit),
                  ),
                ),
                Positioned(
                  right: 0,
                  top: 0,
                  child: IconButton(
                    onPressed: () => Navigator.of(dialogContext).pop(),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ),
                if (_slides.length > 1)
                  Positioned(
                    left: 0,
                    child: IconButton(
                      onPressed: () => controller.previousPage(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOut,
                      ),
                      icon: const Icon(
                        Icons.chevron_left,
                        color: Colors.white,
                        size: 36,
                      ),
                    ),
                  ),
                if (_slides.length > 1)
                  Positioned(
                    right: 0,
                    child: IconButton(
                      onPressed: () => controller.nextPage(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOut,
                      ),
                      icon: const Icon(
                        Icons.chevron_right,
                        color: Colors.white,
                        size: 36,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    ).whenComplete(controller.dispose);
  }

  @override
  Widget build(BuildContext context) {
    final slides = _slides;
    final child = Column(
      children: [
        if (slides.length > 1)
          Container(
            height: 96,
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: slides.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (_, i) => InkWell(
                onTap: () {
                  _openViewer(i);
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: 80,
                  height: 80,
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: i == _index
                          ? const Color(0xFF0F766E)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CatalogImage(src: slides[i], fit: BoxFit.cover),
                  ),
                ),
              ),
            ),
          ),
      ],
    );

    if (widget.height != null) {
      return SizedBox(
        height: widget.height,
        width: double.infinity,
        child: child,
      );
    }
    return AspectRatio(aspectRatio: widget.aspectRatio, child: child);
  }
}
