import { cn } from "@/shared/lib/cn";
import { priceUnitWord } from "@/shared/lib/format";

function parsePriceLabel(label: string) {
  const text = String(label ?? "");
  if (text.includes(" / ")) {
    const [amount, ...rest] = text.split(" / ");
    return { amount: amount.trim(), unit: priceUnitWord(rest.join(" ")) };
  }
  const match = text.match(/^(₹[\d,]+)\s+(.+)$/);
  if (match) return { amount: match[1], unit: priceUnitWord(match[2]) };
  return { amount: text, unit: "" };
}

export function PriceLabel({
  label,
  className,
  amountClassName,
  unitClassName,
}: {
  label: string;
  className?: string;
  amountClassName?: string;
  unitClassName?: string;
}) {
  if (!label) return null;
  const { amount, unit } = parsePriceLabel(label);

  return (
    <span className={cn("inline-flex items-baseline justify-end gap-1 text-right tabular-nums text-[var(--primary)]", className)}>
      <span className={cn("text-[13px] font-semibold leading-none", amountClassName)}>{amount}</span>
      {unit ? (
        <span className={cn("text-[10px] font-medium leading-none text-[var(--primary)]/65", unitClassName)}>{unit}</span>
      ) : null}
    </span>
  );
}
