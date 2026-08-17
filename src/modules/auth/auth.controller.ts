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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ZodSerializerDto(LoginResDTO)
  @ApiBody({ type: LoginBodyDTO })
  @ApiOperation({
    summary: 'Đăng nhập hệ thống bằng email hoặc số điện thoại',
    description: `API cho phép người dùng đăng nhập bằng email hoặc số điện thoại.

- Người dùng có thể sử dụng email hoặc số điện thoại để đăng nhập.
- Đăng nhập thành công sẽ trả về thông tin người dùng cùng với accessToken và refreshToken.
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công.',
    type: LoginResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Thông tin đăng nhập không hợp lệ.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được phân quyền.',
  })
  login(@Body() body: LoginBodyDTO): Promise<LoginResType> {
    return this.authService.login({ ...body });
  }

  @Post('refresh-token')
  @ZodSerializerDto(LoginResDTO)
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'API cho phép làm mới token khi token cũ đã hết hạn.',
  })
  @ApiBody({ type: RefreshTokenBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công.',
    type: LoginResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Refresh token không hợp lệ hoặc thiếu dữ liệu.',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token không hợp lệ hoặc đã hết hạn.',
  })
  refreshToken(@Body() body: RefreshTokenBodyDTO): Promise<LoginResType> {
    return this.authService.refreshToken({ ...body });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({
    summary: 'Đăng xuất khỏi hệ thống',
    description: 'API cho phép người dùng đăng xuất khỏi hệ thống.',
  })
  @ApiBody({ type: LogoutBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công.',
    type: MessageResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token không hợp lệ.',
  })
  logout(@Body() body: LogoutBodyDTO) {
    return this.authService.logout(body.refreshToken);
  }
}
