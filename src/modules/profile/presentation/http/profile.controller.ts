import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { GetUserProfileResDTO } from './profile.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { GetProfileUseCase } from '../../application';
import {
  ProfileResponseMapper,
  UserProfileResponse,
} from '../mappers/profile-response.mapper';

@SkipThrottle()
@Controller('profile')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly getProfileUseCase: GetProfileUseCase) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResDTO)
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ người dùng' })
  async getProfile(
    @ActiveUser('userId') userId: number,
  ): Promise<UserProfileResponse> {
    const user = await this.getProfileUseCase.execute(userId);
    return ProfileResponseMapper.toResponse(user);
  }
}
