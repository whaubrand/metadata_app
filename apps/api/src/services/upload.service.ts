import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { MultipartFile } from '@fastify/multipart';
import { prisma } from '../utils/prisma';
import { config } from '../utils/config';
import sharp from 'sharp';

export class UploadService {
  // Allowed image MIME types (broad support)
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/tiff',
    'image/bmp',
  ];

  // Formats that need normalization to JPEG
  private static readonly NORMALIZE_TO_JPEG = [
    'image/heic',
    'image/heif',
    'image/avif',
    'image/tiff',
    'image/bmp',
  ];

  // Validate file type
  static isValidImageType(mimetype: string): boolean {
    return this.ALLOWED_TYPES.includes(mimetype);
  }

  // Generate unique filename
  static generateFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(originalFilename);
    return `${timestamp}-${random}${ext}`;
  }

  // Ensure upload directory exists
  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(config.uploadDir);
    } catch {
      await fs.mkdir(config.uploadDir, { recursive: true });
    }
  }

  // Normalize image format (convert complex formats to JPEG/PNG)
  static async normalizeImage(
    inputPath: string,
    mimetype: string
  ): Promise<{ path: string; mimetype: string }> {
    // If format needs normalization, convert to JPEG
    if (this.NORMALIZE_TO_JPEG.includes(mimetype)) {
      const outputPath = inputPath.replace(path.extname(inputPath), '.jpg');

      await sharp(inputPath)
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outputPath);

      // Delete original file
      await fs.unlink(inputPath);

      return {
        path: outputPath,
        mimetype: 'image/jpeg',
      };
    }

    // Keep PNG, WebP, GIF, JPEG as-is (web-friendly formats)
    return {
      path: inputPath,
      mimetype,
    };
  }

  // Save file to disk
  static async saveFile(file: MultipartFile, userId: string): Promise<{
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
  }> {
    // Validate file type
    if (!this.isValidImageType(file.mimetype)) {
      throw new Error(
        'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, HEIC, HEIF, AVIF, TIFF, BMP'
      );
    }

    // Ensure upload directory exists
    await this.ensureUploadDir();

    // Generate unique filename
    const tempFilename = this.generateFilename(file.filename);
    const tempFilepath = path.join(config.uploadDir, tempFilename);

    // Save file temporarily
    await pipeline(file.file, createWriteStream(tempFilepath));

    // Normalize image format if needed
    const normalized = await this.normalizeImage(tempFilepath, file.mimetype);

    // Get final filename from normalized path
    const finalFilename = path.basename(normalized.path);
    const finalFilepath = normalized.path;

    // Get file size
    const stats = await fs.stat(finalFilepath);

    // Save to database
    await prisma.image.create({
      data: {
        userId,
        filename: finalFilename,
        filepath: finalFilepath,
        mimetype: normalized.mimetype,
        size: stats.size,
      },
    });

    return {
      filename: finalFilename,
      filepath: finalFilepath,
      mimetype: normalized.mimetype,
      size: stats.size,
    };
  }

  // Get image URL
  static getImageUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}/uploads/${filename}`;
  }
}
