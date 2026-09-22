import { BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i;

function isImageUpload(file: { mimetype?: string; originalname?: string }) {
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (mime && mime !== 'application/octet-stream') return false;
  const name = file.originalname || '';
  if (!name.includes('.')) return true;
  return IMAGE_EXT.test(name);
}

function isPdfUpload(file: { mimetype?: string; originalname?: string }) {
  const mime = (file.mimetype || '').toLowerCase();
  const name = file.originalname || '';
  return mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
}

function uploadStorage(folder: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', folder);
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const fromName = extname(file.originalname || '').toLowerCase();
      if (fromName === '.pdf') {
        cb(null, `${randomUUID()}.pdf`);
        return;
      }
      const ext = IMAGE_EXT.test(fromName) ? fromName : '.jpg';
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

export function photoInterceptor(folder: string, field = 'photo') {
  return FileInterceptor(field, {
    storage: uploadStorage(folder),
    fileFilter: (_req, file, cb) => {
      if (!isImageUpload(file)) {
        cb(new BadRequestException('Please upload photo files (jpg, png, or webp)'), false);
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: 6 * 1024 * 1024 },
  });
}

export function photosInterceptor(folder: string) {
  return FilesInterceptor('photos', 10, {
    storage: uploadStorage(folder),
    fileFilter: (_req, file, cb) => {
      if (!isImageUpload(file)) {
        cb(new BadRequestException('Please upload photo files (jpg, png, or webp)'), false);
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: 6 * 1024 * 1024 },
  });
}

export function listingFilesInterceptor(folder: string) {
  return FileFieldsInterceptor(
    [
      { name: 'photos', maxCount: 40 },
      { name: 'license', maxCount: 1 },
      { name: 'rc', maxCount: 1 },
      { name: 'insurance', maxCount: 1 },
      { name: 'puc', maxCount: 1 },
      { name: 'permit', maxCount: 1 },
    ],
    {
      storage: uploadStorage(folder),
      fileFilter: (_req, file, cb) => {
        if (file.fieldname === 'license' || file.fieldname === 'rc' || file.fieldname === 'insurance' || file.fieldname === 'puc' || file.fieldname === 'permit') {
          if (isImageUpload(file) || isPdfUpload(file)) {
            cb(null, true);
            return;
          }
          cb(new BadRequestException('Upload an image or PDF'), false);
          return;
        }
        if (!isImageUpload(file)) {
          cb(new BadRequestException('Please upload photo files (jpg, png, or webp)'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 6 * 1024 * 1024 },
    },
  );
}
