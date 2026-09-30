import { Loader2 } from "lucide-react";

export function ServiceSubmitButton({
  saving,
  className,
  onClick,
  type = "button",
  disabled,
}: {
  saving: boolean;
  className: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} disabled={saving || disabled} onClick={onClick} className={className}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {saving ? "Submitting" : "Submit"}
    </button>
  );
}
