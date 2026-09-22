import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/category_art.dart';

class ListingWizardScaffold extends StatelessWidget {
  const ListingWizardScaffold({
    super.key,
    required this.categoryId,
    required this.categoryTitle,
    required this.step,
    required this.body,
    required this.primaryLabel,
    required this.onPrimary,
    this.error = '',
    this.primaryEnabled = true,
    this.primaryBusy = false,
    this.stepCount = 3,
    this.steps = const [],
    this.onSelectStep,
    this.onBack,
  });

  final String categoryId;
  final String categoryTitle;
  final int step;
  final Widget body;
  final String primaryLabel;
  final VoidCallback? onPrimary;
  final String error;
  final bool primaryEnabled;
  final bool primaryBusy;
  final int stepCount;
  final List<String> steps;
  final ValueChanged<int>? onSelectStep;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
              child: Row(
                children: [
                  IconButton.outlined(
                    onPressed: onBack ?? () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    style: IconButton.styleFrom(
                      foregroundColor: AppColors.text,
                      side: const BorderSide(color: AppColors.border),
                      minimumSize: const Size(36, 36),
                      maximumSize: const Size(36, 36),
                      padding: EdgeInsets.zero,
                    ),
                  ),
                  const SizedBox(width: 10),
                  CategoryArt(id: categoryId, size: 36),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      categoryTitle,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    '$step/$stepCount',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            if (steps.isNotEmpty)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                child: Row(
                  children: [
                    for (var index = 0; index < steps.length; index++)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text('${index + 1}  ${steps[index]}'),
                          selected: step == index + 1,
                          onSelected: (_) => onSelectStep?.call(index + 1),
                          selectedColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: step == index + 1 ? Colors.white : AppColors.text,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                          side: BorderSide(color: step == index + 1 ? AppColors.primary : AppColors.border),
                        ),
                      ),
                  ],
                ),
              )
            else
              LinearProgressIndicator(
                value: step / stepCount,
                minHeight: 4,
                backgroundColor: const Color(0xFFE8EEF4),
                color: AppColors.primary,
              ),
            Expanded(child: body),
            if (error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Text(error, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  if (step > 1 && onBack != null) ...[
                    SizedBox(
                      height: 48,
                      width: 104,
                      child: OutlinedButton(
                        onPressed: onBack,
                        style: OutlinedButton.styleFrom(shape: const StadiumBorder(), foregroundColor: AppColors.primary),
                        child: const Text('Back'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: FilledButton(
                        onPressed: primaryEnabled && !primaryBusy ? onPrimary : null,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.45),
                          shape: const StadiumBorder(),
                          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                        child: Text(primaryBusy ? 'Saving…' : primaryLabel),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
