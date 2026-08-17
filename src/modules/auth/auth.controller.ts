import { Body, Controller, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthService } from './auth.service';
import {
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
} from './auth.dto';
import { LoginResType } from './auth.model';
import { Public } from 'src/shared/decorator/public.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyDTO): Promise<LoginResType> {
    return this.authService.login({ ...body });
  }

  @Post('refresh-token')
  @ZodSerializerDto(LoginResDTO)
  refreshToken(@Body() body: RefreshTokenBodyDTO): Promise<LoginResType> {
    return this.authService.refreshToken({ ...body });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  logout(@Body() body: LogoutBodyDTO) {
    return this.authService.logout(body.refreshToken);
  }
}
