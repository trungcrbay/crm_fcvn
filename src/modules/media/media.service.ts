import { Injectable } from '@nestjs/common';
import path from 'path';
import sharp from 'sharp';
import { PresignedUploadFileBodyType } from './media.model';
import { SynologyNasService } from 'src/shared/services/synology-nas.service';

@Injectable()
export class MediaService {
  constructor(private readonly synologyNasService: SynologyNasService) {}

  async optimizeImage(file: Express.Multer.File): Promise<Buffer> {
    try {
      if (
        !file.mimetype.startsWith('image/') ||
        file.mimetype === 'image/gif'
      ) {
        return file.buffer;
      }

      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      let pipeline = image;

      if (metadata.width && metadata.width > 1920) {
        pipeline = pipeline.resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      return await pipeline
        .webp({
          quality: 80,
          alphaQuality: 80,
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
          effort: 3,
          preset: 'photo',
        })
        .toBuffer();
    } catch {
      return file.buffer;
    }
  }

  generateFilename(
    file: Express.Multer.File,
    userId?: number | string,
    index = 0,
  ): string {
    let ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif') {
      ext = '.webp';
    }

    const baseName = path.basename(
      file.originalname,
      path.extname(file.originalname),
    );
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
    const userPrefix = userId ? `${userId}-` : '';

    return `${userPrefix}${Date.now()}-${index}-${safeBaseName}${ext}`;
  }

  async uploadFile(
    files: Array<Express.Multer.File>,
    userId?: number | string,
  ) {
    const result = await Promise.all(
      files.map(async (file, index) => {
        const isImage = file.mimetype.startsWith('image/');
        const isGif = file.mimetype === 'image/gif';

        const buffer = await this.optimizeImage(file);
        const contentType = isImage && !isGif ? 'image/webp' : file.mimetype;
        const fileName = this.generateFilename(file, userId, index);

        await this.synologyNasService.uploadFile({
          filename: fileName,
          buffer,
          contentType,
        });

        return {
          url: `/v1/media/static/${fileName}`,
          fileUrl: fileName,
          fileName,
        };
      }),
    );

    return {
      attachments: result,
    };
  }

  async getFileStream(rawFilename: string): Promise<{
    stream: ReadableStream<Uint8Array>;
    contentType: string | null;
  }> {
    const filename = path.basename(rawFilename);
    return this.synologyNasService.downloadFileStream(filename);
  }

  async deleteFiles(fileNames: string[]): Promise<boolean> {
    const results = await Promise.all(
      fileNames.map((name) => {
        const cleanName = path.basename(name);
        return this.synologyNasService.deleteFile(cleanName);
      }),
    );
    return results.every(Boolean);
  }

  async getPresignUrl(body: PresignedUploadFileBodyType) {
    const randomFilename = `${Date.now()}-${body.filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const url = `/v1/media/static/${randomFilename}`;
    const presignedUrl = `/v1/media/upload-direct/${randomFilename}`;

    return {
      presignedUrl,
      url,
    };
  }
}
