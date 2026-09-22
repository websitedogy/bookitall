export function isPlaceholderEmail(email?: string | null) {
  if (!email?.trim()) return true;
  const value = email.trim().toLowerCase();
  return value.endsWith('@phone.bookitall.local') || value.endsWith('@merged.bookitall.local');
}

export function publicEmail(email?: string | null) {
  if (isPlaceholderEmail(email)) return '';
  return email!.trim();
}
