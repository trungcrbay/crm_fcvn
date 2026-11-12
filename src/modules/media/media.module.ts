import { BadRequestException, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';

const allowedExtensions = [
  '.png',
  '.jpg',
  '.gif',
  '.jpeg',
  '.webp', // images
  '.doc',
  '.docx',
  '.pdf',
  '.csv',
  '.xlsx', // documents
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `Định dạng tệp ${ext} không được hỗ trợ. Các định dạng cho phép: ${allowedExtensions.join(', ')}`,
      ),
      false,
    );
  }
};

@Module({
  providers: [MediaService],
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
      fileFilter,
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB giống crm-backend
      },
    }),
  ],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
