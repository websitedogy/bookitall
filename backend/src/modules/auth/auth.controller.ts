import { BadRequestException, Body, Controller, Get, Patch, Post, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, GoogleAuthDto, LoginDto, PhoneAuthDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { photoInterceptor } from '../../common/uploads/photos.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.continueWithGoogle(dto);
  }

  @Public()
  @Post('phone')
  phone(@Body() dto: PhoneAuthDto) {
    return this.auth.continueWithPhone(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { userId?: string; refreshToken?: string }) {
    if (!body.userId || !body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.auth.refresh(body.userId, body.refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.auth.logout(userId);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(photoInterceptor('avatars'))
  updateAvatar(@CurrentUser('id') userId: string, @UploadedFile() file?: { filename: string }) {
    if (!file?.filename) {
      throw new BadRequestException('Choose a profile photo');
    }
    return this.auth.updateAvatar(userId, file.filename);
  }

  @Post('seen')
  seen(@CurrentUser('id') userId: string) {
    return this.auth.seen(userId);
  }

  @Patch('password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
