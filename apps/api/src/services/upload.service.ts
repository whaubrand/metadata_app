import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { MultipartFile } from '@fastify/multipart';
import { prisma } from '../utils/prisma';
import { config } from '../utils/config';

export class UploadService {
  // Allowed image MIME types
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
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

  // Save file to disk
  static async saveFile(file: MultipartFile, userId: string): Promise<{
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
  }> {
    // Validate file type
    if (!this.isValidImageType(file.mimetype)) {
      throw new Error('Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)');
    }

    // Ensure upload directory exists
    await this.ensureUploadDir();

    // Generate unique filename
    const filename = this.generateFilename(file.filename);
    const filepath = path.join(config.uploadDir, filename);

    // Save file
    await pipeline(file.file, createWriteStream(filepath));

    // Get file size
    const stats = await fs.stat(filepath);

    // Save to database
    await prisma.image.create({
      data: {
        userId,
        filename,
        filepath,
        mimetype: file.mimetype,
        size: stats.size,
      },
    });

    return {
      filename,
      filepath,
      mimetype: file.mimetype,
      size: stats.size,
    };
  }

  // Get image URL
  static getImageUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}/uploads/${filename}`;
  }
}
