import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { GetUserProfileResDTO } from './profile.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('profile')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResDTO)
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ người dùng' })
  getProfile(@ActiveUser('userId') userId: number) {
    return this.profileService.getProfile(userId);
  }
}
