import { cn } from "@/shared/lib/cn";
import type { ProfileStatus } from "@/features/auth/store";

export function ProfileStatusBadge({
  status,
  variant = "dot",
  className,
}: {
  status: ProfileStatus;
  variant?: "dot" | "label";
  size?: "sm" | "md";
  className?: string;
}) {
  const pending = status === "PENDING";

  if (variant === "label") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
          pending ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
          className,
        )}
      >
        {pending ? "Pending" : "Complete"}
      </span>
    );
  }

  if (!pending) return null;
  return (
    <span
      className={cn("pending-dot inline-block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white", className)}
      aria-label="Profile pending"
    />
  );
}
