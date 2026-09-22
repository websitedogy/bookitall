import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{
          id?: string;
          sub?: string;
          email?: string;
          role?: string;
        }>(token, {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
        const userId = payload.id ?? payload.sub;
        if (!userId) {
          if (!isPublic) throw new UnauthorizedException('Invalid or expired token');
          return true;
        }
        if (!(await this.users.findById(userId))) {
          if (!isPublic) throw new UnauthorizedException('Sign in again');
          return true;
        }
        request.user = { id: userId, email: payload.email ?? "", role: payload.role ?? "" };
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        if (!isPublic) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      }
      return true;
    }

    if (isPublic) return true;
    throw new UnauthorizedException('Authentication required');
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return request.cookies?.access_token as string | undefined;
  }
}
