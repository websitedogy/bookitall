export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  DRIVER = 'DRIVER',
  TECHNICIAN = 'TECHNICIAN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUB_EDITOR = 'SUB_EDITOR',
}

export const PANEL_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUB_EDITOR] as const;

export function isPanelRole(role?: string | null): role is UserRole.SUPER_ADMIN | UserRole.SUB_EDITOR {
  return role === UserRole.SUPER_ADMIN || role === UserRole.SUB_EDITOR;
}

export function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum PartnerType {
  HOTEL = 'HOTEL',
  TOUR = 'TOUR',
  CAB = 'CAB',
  HOME_SERVICE = 'HOME_SERVICE',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum ProfileStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}
