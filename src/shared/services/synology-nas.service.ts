import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import envConfig from 'src/shared/config';

interface SynologyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    errors?: any;
  };
}

@Injectable()
export class SynologyNasService {
  private readonly logger = new Logger(SynologyNasService.name);
  private sid: string | null = null;
  private readonly baseUrl = envConfig.NAS_BASE_URL.replace(/\/+$/, '');
  private readonly destFolder = envConfig.NAS_DEST_FOLDER.replace(
    /^\/volume\d+/,
    '',
  ).replace(/\/+$/, '');

  private async login(): Promise<string> {
    const params = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: envConfig.NAS_USERNAME,
      passwd: envConfig.NAS_PASSWORD,
      session: 'FileStation',
      format: 'sid',
    });

    const loginUrl = `${this.baseUrl}/webapi/entry.cgi?${params.toString()}`;

    try {
      const response = await fetch(loginUrl);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const resJson = (await response.json()) as SynologyResponse<{
        sid: string;
      }>;

      if (!resJson.success || !resJson.data?.sid) {
        this.logger.error(
          `Failed to authenticate with Synology NAS. Code: ${resJson.error?.code}`,
        );
        throw new InternalServerErrorException(
          'Không thể kết nối đến hệ thống lưu trữ NAS',
        );
      }

      this.sid = resJson.data.sid;
      return this.sid;
    } catch (error) {
      this.logger.error('Error during Synology NAS login', error);
      throw new InternalServerErrorException(
        'Lỗi xác thực hệ thống lưu trữ NAS',
      );
    }
  }

  private async getValidSid(): Promise<string> {
    if (this.sid) {
      return this.sid;
    }
    return this.login();
  }

  private async executeWithRetry<T>(
    operation: (sid: string) => Promise<SynologyResponse<T>>,
  ): Promise<T> {
    let currentSid = await this.getValidSid();
    let result = await operation(currentSid);

    // Error code 119 indicates session timeout or invalid session
    if (!result.success && result.error?.code === 119) {
      this.logger.warn(
        'Synology session expired (code 119). Re-authenticating...',
      );
      this.sid = null;
      currentSid = await this.login();
      result = await operation(currentSid);
    }

    if (!result.success) {
      throw new Error(
        `Synology API operation failed with error code: ${result.error?.code}`,
      );
    }

    return result.data as T;
  }

  async uploadFile({
    filename,
    filepath,
    buffer,
    contentType,
  }: {
    filename: string;
    filepath?: string;
    buffer?: Buffer;
    contentType: string;
  }): Promise<{ filename: string; path: string }> {
    try {
      const fileBuffer = buffer ?? (filepath ? await readFile(filepath) : null);
      if (!fileBuffer) {
        throw new Error('Cần cung cấp buffer hoặc filepath');
      }
      const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
        type: contentType,
      });

      const targetPath = `${this.destFolder}/${filename}`;

      await this.executeWithRetry(async (sid) => {
        const formData = new FormData();
        formData.append('api', 'SYNO.FileStation.Upload');
        formData.append('version', '2');
        formData.append('method', 'upload');
        formData.append('path', this.destFolder);
        formData.append('create_parents', 'true');
        formData.append('overwrite', 'true');
        formData.append('file', fileBlob, filename);

        const uploadUrl = `${this.baseUrl}/webapi/entry.cgi?_sid=${encodeURIComponent(sid)}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Cookie: `id=${sid}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP upload failed with status ${response.status}`);
        }

        return (await response.json()) as SynologyResponse;
      });

      return {
        filename,
        path: targetPath,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${filename} to NAS`, error);
      throw new InternalServerErrorException(
        'Tải tệp lên hệ thống NAS thất bại',
      );
    }
  }

  async downloadFileStream(filename: string): Promise<{
    stream: ReadableStream<Uint8Array>;
    contentType: string | null;
  }> {
    const targetPath = `${this.destFolder}/${filename}`;

    try {
      const sid = await this.getValidSid();
      const params = new URLSearchParams({
        api: 'SYNO.FileStation.Download',
        version: '2',
        method: 'download',
        path: targetPath,
        mode: 'open',
        _sid: sid,
      });

      const downloadUrl = `${this.baseUrl}/webapi/entry.cgi?${params.toString()}`;
      let response = await fetch(downloadUrl, {
        headers: {
          Cookie: `id=${sid}`,
        },
      });

      // Check if session expired
      if (response.headers.get('content-type')?.includes('application/json')) {
        const json = (await response.clone().json()) as SynologyResponse;
        if (!json.success && json.error?.code === 119) {
          this.logger.warn(
            'Session expired during download. Re-authenticating...',
          );
          this.sid = null;
          const newSid = await this.login();
          params.set('_sid', newSid);
          response = await fetch(
            `${this.baseUrl}/webapi/entry.cgi?${params.toString()}`,
            {
              headers: {
                Cookie: `id=${newSid}`,
              },
            },
          );
        } else if (!json.success && json.error?.code === 408) {
          throw new NotFoundException(
            `File ${filename} không tồn tại trên NAS`,
          );
        }
      }

      if (!response.ok || !response.body) {
        throw new NotFoundException(`File ${filename} không tìm thấy`);
      }

      return {
        stream: response.body,
        contentType: response.headers.get('content-type'),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to download file ${filename} from NAS`, error);
      throw new NotFoundException(`Không tìm thấy file ${filename}`);
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    const targetPath = `${this.destFolder}/${filename}`;

    try {
      await this.executeWithRetry(async (sid) => {
        const params = new URLSearchParams({
          api: 'SYNO.FileStation.Delete',
          version: '2',
          method: 'start',
          path: targetPath,
          _sid: sid,
        });

        const deleteUrl = `${this.baseUrl}/webapi/entry.cgi?${params.toString()}`;
        const response = await fetch(deleteUrl, {
          headers: {
            Cookie: `id=${sid}`,
          },
        });

        return (await response.json()) as SynologyResponse;
      });

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to delete file ${filename} from NAS: ${errorMsg}`,
      );
      return false;
    }
  }
}
