import type { AuthUser, ProfileStatus } from "@/features/auth/store";

export const PROFILE_FIELD_LABELS = {
  fullName: "Full Name",
  phone: "Mobile Number",
} as const;

export type ProfileFieldKey = keyof typeof PROFILE_FIELD_LABELS;

export const PROFILE_REQUIRED_FIELDS = Object.keys(PROFILE_FIELD_LABELS) as ProfileFieldKey[];

function filled(value?: string | null) {
  return Boolean(value && value.trim());
}

export function missingProfileFields(user: Partial<AuthUser> | null | undefined): ProfileFieldKey[] {
  if (!user) return [...PROFILE_REQUIRED_FIELDS];
  const missing: ProfileFieldKey[] = [];
  if (!filled(user.fullName)) missing.push("fullName");
  if (!filled(user.phone)) missing.push("phone");
  return missing;
}

export function profileStatusOf(user: Partial<AuthUser> | null | undefined): ProfileStatus {
  return missingProfileFields(user).length ? "PENDING" : "COMPLETE";
}

export function isProfilePending(user: Partial<AuthUser> | null | undefined) {
  return profileStatusOf(user) === "PENDING";
}
