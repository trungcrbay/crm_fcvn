import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import mime from 'mime-types';
import type { Response } from 'express';
import { MediaService } from './media.service';
import {
  DeleteMediaBodyDTO,
  PresignedUploadFileBodyDTO,
  PresignedUploadFileResDTO,
  UploadFilesResDTO,
} from './media.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { Public } from 'src/shared/decorator/public.decorator';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';

@SkipThrottle()
@ApiTags('Media')
@Controller(['media', 'files'])
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tải lên nhiều tệp hình ảnh/tài liệu lên hệ thống lưu trữ NAS',
    description:
      'Hỗ trợ tải lên nhiều tệp (ảnh jpg/png/webp, tài liệu pdf/doc/xlsx), dung lượng tối đa 25MB mỗi tệp. Ảnh được tự động tối ưu sang WebP.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách các tệp hình ảnh/tài liệu cần tải lên',
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'Tải lên danh sách hình ảnh/tài liệu thành công.',
    type: UploadFilesResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Tệp không hợp lệ hoặc vượt quá dung lượng cho phép (25MB).',
  })
  @ZodSerializerDto(UploadFilesResDTO)
  @UseInterceptors(FilesInterceptor('files', 100))
  uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @ActiveUser('userId') userId?: number,
  ) {
    return this.mediaService.uploadFile(files, userId);
  }

  @Get('static/:filename')
  @Public()
  @ApiOperation({
    summary: 'Xem/Tải tệp tĩnh trực tiếp từ NAS (Public)',
    description:
      'Trả về nội dung nhị phân (binary stream) của tệp lấy trực tiếp từ NAS, không lưu trên đĩa server.',
  })
  @ApiParam({
    name: 'filename',
    description: 'Tên tệp đã được lưu trên NAS',
    example: '1-1791446188-0-avatar.webp',
  })
  @ApiProduces('application/octet-stream', 'image/*')
  @ApiOkResponse({
    description: 'Tải/Xem tệp thành công.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy tệp yêu cầu.',
  })
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const { stream, contentType } =
        await this.mediaService.getFileStream(filename);

      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      const resolvedContentType =
        mime.lookup(filename) || contentType || 'application/octet-stream';
      res.setHeader('Content-Type', resolvedContentType);

      const nodeStream = Readable.fromWeb(stream as any);
      return nodeStream.pipe(res);
    } catch {
      if (!res.headersSent) {
        const notfound = new NotFoundException('File not found');
        return res.status(notfound.getStatus()).json(notfound.getResponse());
      }
    }
  }

  @Get(':filename')
  @Public()
  @ApiOperation({
    summary: 'Alias route để xem tệp tĩnh trực tiếp từ NAS (Public)',
  })
  @ApiParam({
    name: 'filename',
    description: 'Tên tệp đã được lưu trên NAS',
  })
  serveFileAlias(@Param('filename') filename: string, @Res() res: Response) {
    return this.serveFile(filename, res);
  }

  @Post('delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tệp khỏi hệ thống lưu trữ NAS' })
  @ApiBody({ type: DeleteMediaBodyDTO })
  async deleteFiles(@Body() body: DeleteMediaBodyDTO) {
    const success = await this.mediaService.deleteFiles(body.fileNames);
    return {
      success,
      message: success ? 'Xóa tệp thành công' : 'Không thể xóa một số tệp',
    };
  }

  @Post('upload/presigned-url')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo Presigned URL để tải tệp (tương thích ngược)',
  })
  @ApiBody({ type: PresignedUploadFileBodyDTO })
  @ApiOkResponse({
    type: PresignedUploadFileResDTO,
  })
  @ZodSerializerDto(PresignedUploadFileResDTO)
  async createPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignUrl(body);
  }
}
