import {
  Body,
  Controller,
  Get,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Delete,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { LoginBodyDTO, LoginResDTO } from './auth.dto';
import { LoginResType } from './auth.model';
import { Public } from 'src/shared/decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyDTO): Promise<LoginResType> {
    return this.authService.login({ ...body });
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
