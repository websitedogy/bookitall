import { ProfileStatus } from '../../common/enums/user-role.enum';
import { isPlaceholderEmail, publicEmail } from '../../common/utils/email';
import { User } from './entities/user.entity';

export const PROFILE_REQUIRED_FIELDS = [
  'fullName',
  'phone',
  'nickname',
  'email',
  'avatarUrl',
  'dateOfBirth',
  'gender',
  'personalAddress',
  'pincode',
] as const;

export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

function filled(value?: string | null) {
  return Boolean(value && String(value).trim());
}

function dateOnly(value?: string | Date | null) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function missingProfileFields(user: User): ProfileRequiredField[] {
  const missing: ProfileRequiredField[] = [];
  if (!filled(user.fullName)) missing.push('fullName');
  if (!filled(user.phone)) missing.push('phone');
  if (!filled(user.nickname)) missing.push('nickname');
  if (!filled(publicEmail(user.email)) || isPlaceholderEmail(user.email)) missing.push('email');
  if (!filled(user.avatarUrl)) missing.push('avatarUrl');
  if (!dateOnly(user.dateOfBirth)) missing.push('dateOfBirth');
  if (!user.gender) missing.push('gender');
  if (!filled(user.personalAddress)) missing.push('personalAddress');
  if (!/^\d{6}$/.test(String(user.pincode ?? '').replace(/\D/g, ''))) missing.push('pincode');
  return missing;
}

export function profileStatusOf(user: User) {
  const missingFields = missingProfileFields(user);
  return {
    profileStatus: missingFields.length ? ProfileStatus.PENDING : ProfileStatus.COMPLETE,
    missingFields,
  };
}
