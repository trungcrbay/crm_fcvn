import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import path from 'path';
import type { Response } from 'express';
import { MediaService } from './media.service';
import {
  PresignedUploadFileBodyDTO,
  PresignedUploadFileResDTO,
  UploadFilesResDTO,
} from './media.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { UPLOAD_DIR } from 'src/shared/constant/other.constant';
import { Public } from 'src/shared/decorator/public.decorator';
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
import { ParseFilePipeWithUnlink } from './parse-file-pipe-with-unlink.pipe';

@SkipThrottle()
@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tải lên nhiều tệp hình ảnh trực tiếp lên S3',
    description:
      'Hỗ trợ tải lên nhiều tệp (multipart/form-data), dung lượng tối đa mỗi tệp là 5MB.',
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
          description: 'Danh sách các tệp hình ảnh cần tải lên',
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'Tải lên danh sách hình ảnh thành công.',
    type: UploadFilesResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Tệp không hợp lệ hoặc vượt quá dung lượng cho phép (5MB).',
  })
  @ZodSerializerDto(UploadFilesResDTO)
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(
    @UploadedFiles(
      new ParseFilePipeWithUnlink({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    // return files.map((file) => ({
    //   url: `${envConfig.PREFIX_STATIC_ENPOINT}/${file.filename}`,
    // }))
    return this.mediaService.uploadFile(files);
  }

  @Get('static/:filename')
  @Public()
  @ApiOperation({
    summary: 'Xem/Tải tệp tĩnh từ thư mục cục bộ',
    description:
      'Trả về nội dung nhị phân (binary stream) của tệp đã lưu trong thư mục upload.',
  })
  @ApiParam({
    name: 'filename',
    description: 'Tên tệp đã được lưu (ví dụ: a1b2c3d4-....jpg)',
    example: 'example-image.jpg',
  })
  @ApiProduces('application/octet-stream', 'image/*')
  @ApiOkResponse({
    description: 'Tải/Xem tệp thành công.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy tệp yêu cầu.',
  })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      if (error) {
        const notfound = new NotFoundException('File not found');
        res.status(notfound.getStatus()).json(notfound.getResponse());
      }
    });
  }

  @Post('upload/presigned-url')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo Presigned URL để tải tệp trực tiếp lên S3 từ client',
    description:
      'Nhận thông tin tệp (tên và kích thước <= 20MB) và trả về Presigned URL có thời hạn để client upload thẳng lên S3.',
  })
  @ApiBody({ type: PresignedUploadFileBodyDTO })
  @ApiOkResponse({
    description: 'Khởi tạo Presigned URL thành công.',
    type: PresignedUploadFileResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ hoặc kích thước vượt quá 20MB.',
  })
  @ZodSerializerDto(PresignedUploadFileResDTO)
  async createPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignUrl(body);
  }
}
