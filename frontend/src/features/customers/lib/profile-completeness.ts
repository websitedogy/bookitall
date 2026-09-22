import type { AuthUser, ProfileStatus } from "@/features/auth/store";
import { publicEmail } from "@/shared/lib/email";

export const PROFILE_FIELD_LABELS = {
  fullName: "Full Name",
  phone: "Mobile Number",
  nickname: "Nick name",
  email: "Email Address",
  avatarUrl: "Profile Photo",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  personalAddress: "Personal Address",
  pincode: "Pincode",
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
  if (!filled(user.nickname)) missing.push("nickname");
  if (!filled(publicEmail(user.email))) missing.push("email");
  if (!filled(user.avatarUrl)) missing.push("avatarUrl");
  if (!filled(user.dateOfBirth)) missing.push("dateOfBirth");
  if (!user.gender) missing.push("gender");
  if (!filled(user.personalAddress)) missing.push("personalAddress");
  if (!/^\d{6}$/.test(String(user.pincode ?? "").replace(/\D/g, ""))) missing.push("pincode");
  return missing;
}

export function profileStatusOf(user: Partial<AuthUser> | null | undefined): ProfileStatus {
  return missingProfileFields(user).length ? "PENDING" : "COMPLETE";
}

export function isProfilePending(user: Partial<AuthUser> | null | undefined) {
  return profileStatusOf(user) === "PENDING";
}
