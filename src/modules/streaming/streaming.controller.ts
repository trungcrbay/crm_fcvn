// src/modules/streaming/streaming.controller.ts
import { Controller, Get, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamingService } from './streaming.service';
import { PipeStreamingService } from './pipe-streaming.service';
import { CompressionService } from './compression.service';
import { Public } from 'src/shared/decorator/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@SkipThrottle()
@Public()
@ApiTags('Streaming')
@Controller('streaming')
export class StreamingController {
  constructor(
    private readonly streamingService: StreamingService,
    private readonly pipeStreamingService: PipeStreamingService,
    private readonly compressionService: CompressionService,
  ) {}

  @Get('large-dataset')
  @ApiOperation({
    summary:
      'Stream mảng JSON chuẩn [ {...}, {...} ] bằng pipeline (tự quản lý backpressure)',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu được stream dạng chunk mảng JSON chuẩn.',
  })
  async streamLargeDataset(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const dataStream = this.streamingService.getDataStream(
      10000,
      1000,
      abortController.signal,
    );

    await this.pipeStreamingService.streamJsonArray(response, dataStream);
  }

  @Get('ndjson')
  @ApiOperation({
    summary:
      'Stream dữ liệu dạng NDJSON (Newline Delimited JSON) qua PipeStreamingService',
  })
  @ApiProduces('application/x-ndjson')
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu stream từng dòng JSON riêng biệt, cực tiết kiệm RAM.',
  })
  async streamNdjson(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const dataStream = this.streamingService.getDataStream(
      10000,
      1000,
      abortController.signal,
    );

    await this.pipeStreamingService.streamNdjson(response, dataStream);
  }

  @Get('compressed')
  @ApiOperation({
    summary:
      'Stream dữ liệu NDJSON có nén trực tiếp Gzip qua CompressionService',
  })
  @ApiProduces('application/x-ndjson')
  @ApiResponse({
    status: 200,
    description:
      'Dữ liệu được nén Gzip on-the-fly, giảm 70-90% băng thông truyền tải.',
  })
  async streamCompressed(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const dataStream = this.streamingService.getDataStream(
      10000,
      1000,
      abortController.signal,
    );

    await this.compressionService.streamCompressedNdjson(response, dataStream);
  }

  @Get('manual-batch')
  @ApiOperation({
    summary:
      'Stream thủ công gom batch theo chunk (đáp ứng tương thích ngược & benchmark)',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Stream mảng JSON thủ công với event drain.',
  })
  async streamManualBatch(@Res() response: Response): Promise<void> {
    this.pipeStreamingService.setStreamingHeaders(
      response,
      'application/json; charset=utf-8',
    );

    response.write('[');
    try {
      await this.streamingService.streamData(response);
      response.write(']');
      response.end();
    } catch (error) {
      response.destroy(error as Error);
    }
  }
}
