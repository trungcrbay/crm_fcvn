// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { PipeStreamingService } from './pipe-streaming.service';
import { CompressionService } from './compression.service';

@Module({
  imports: [],
  controllers: [StreamingController],
  providers: [StreamingService, PipeStreamingService, CompressionService],
})
export class StreamingModule {}
