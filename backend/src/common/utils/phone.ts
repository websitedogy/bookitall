export function normalizeMobile(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}
