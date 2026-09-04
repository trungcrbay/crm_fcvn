import { Module } from '@nestjs/common';
import { ProfileController } from './presentation';
import { GetProfileUseCase } from './application';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ProfileController],
  providers: [GetProfileUseCase],
  exports: [GetProfileUseCase],
})
export class ProfileModule {}
