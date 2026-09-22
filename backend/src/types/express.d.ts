import { UserRole } from '../common/enums/user-role.enum';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole | string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
