import { cn } from "@/shared/lib/cn";

export const stayInputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

export function StaySection({
  n,
  title,
  required,
  hint,
  children,
}: {
  n: number;
  title: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 border-t border-slate-100 pt-5 first:mt-3 first:border-0 first:pt-2">
      <h2 className="text-base font-bold text-slate-900">
        {n}. {title}
        {required ? <span className="text-red-500"> *</span> : null}
      </h2>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StayField({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-[11px] text-slate-500">{hint}</span> : null}
      {children}
    </label>
  );
}

export function StayCheckGrid({
  values,
  selected,
  onToggle,
}: {
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {values.map((value) => {
        const on = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm",
              on ? "border-slate-400 bg-slate-50" : "border-[#d7dde6] bg-white",
            )}
          >
            <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[3px] border", on ? "border-slate-800 bg-slate-800" : "border-slate-400")}>
              {on ? <span className="text-[10px] font-bold text-white">✓</span> : null}
            </span>
            {value}
          </button>
        );
      })}
    </div>
  );
}
