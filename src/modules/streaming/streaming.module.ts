// src/modules/streaming/streaming.module.ts
import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { PipeStreamingService } from './pipe-streaming.service';
import { CompressionService } from './compression.service';

@Module({
  imports: [],
  controllers: [StreamingController],
  providers: [StreamingService, PipeStreamingService, CompressionService],
  exports: [StreamingService, PipeStreamingService, CompressionService],
})
export class StreamingModule {}
