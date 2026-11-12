import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './guest.entity';
import { GuestRepository } from './repositories/guest.repository';
import { CommandHandlers } from './command/handlers';
import { QueryHandlers } from './queries/handlers';
import { EventHandlers } from './events/handlers';
import { GuestController } from './guests.controller';
import { GuestsService } from './guests.service';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Guest])],
  controllers: [GuestController],
  providers: [
    GuestRepository,
    GuestsService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [GuestRepository, GuestsService],
})
export class GuestsModule {}
