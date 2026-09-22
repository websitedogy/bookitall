import { cn } from "@/shared/lib/cn";

export function WizardStepBar({
  steps,
  step,
  onSelect,
}: {
  steps: readonly { id: number; label: string }[];
  step: number;
  onSelect: (next: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 md:px-0">
      {steps.map((item) => {
        const active = step === item.id;
        const done = step > item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
              active
                ? "bg-[var(--primary)] text-white ring-[var(--primary)]"
                : done
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/25"
                  : "bg-white text-slate-500 ring-slate-200",
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                active ? "bg-white/20 text-white" : done ? "bg-white text-[var(--primary)]" : "bg-[#eef2f7] text-slate-500",
              )}
            >
              {item.id}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function WizardFooter({
  step,
  lastStep,
  saving,
  nextLabel,
  submitLabel,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  lastStep: number;
  saving?: boolean;
  nextLabel?: string;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 border-t border-[var(--border)] bg-white px-4 py-3 md:static md:mt-5 md:border-0 md:bg-transparent md:px-0">
      <div className="flex gap-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-12 min-w-[6.5rem] items-center justify-center rounded-full text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--border)]"
          >
            Back
          </button>
        ) : null}
        {step < lastStep ? (
          <button type="button" onClick={onNext} className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            {nextLabel ?? "Next"}
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={onSubmit}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
