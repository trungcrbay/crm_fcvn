import { z } from 'zod';

export const PresignedUploadFileBodySchema = z
  .object({
    filename: z.string(),
    filesize: z.number().max(25 * 1024 * 1024), // 25MB
  })
  .strict();

export const UploadFilesResSchema = z.object({
  attachments: z.array(
    z.object({
      url: z.string(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
    }),
  ),
});

export const DeleteMediaBodySchema = z.object({
  fileNames: z.array(z.string()).min(1),
});

export const PresignedUploadFileResSchema = z.object({
  presignedUrl: z.string(),
  url: z.string(),
});

export type PresignedUploadFileBodyType = z.infer<
  typeof PresignedUploadFileBodySchema
>;

export type DeleteMediaBodyType = z.infer<typeof DeleteMediaBodySchema>;
