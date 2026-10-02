import { ProfileStatus } from '../../common/enums/user-role.enum';
import { User } from './entities/user.entity';

export const PROFILE_REQUIRED_FIELDS = ['fullName', 'phone'] as const;

export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

function filled(value?: string | null) {
  return Boolean(value && String(value).trim());
}

export function missingProfileFields(user: User): ProfileRequiredField[] {
  const missing: ProfileRequiredField[] = [];
  if (!filled(user.fullName)) missing.push('fullName');
  if (!filled(user.phone)) missing.push('phone');
  return missing;
}

export function profileStatusOf(user: User) {
  const missingFields = missingProfileFields(user);
  return {
    profileStatus: missingFields.length ? ProfileStatus.PENDING : ProfileStatus.COMPLETE,
    missingFields,
  };
}
