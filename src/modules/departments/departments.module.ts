import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './department.entity';
import { DepartmentsController } from './departments.controller';
import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentsController],
  providers: [DepartmentsRepository, DepartmentsService],
  exports: [DepartmentsService, DepartmentsRepository],
})
export class DepartmentsModule {}
