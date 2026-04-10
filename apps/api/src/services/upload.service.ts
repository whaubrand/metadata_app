import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { MultipartFile } from '@fastify/multipart';
import { prisma } from '../utils/prisma';
import { config } from '../utils/config';
import sharp from 'sharp';

export class UploadService {
  // Allowed image file extensions (more reliable than MIME types)
  private static readonly ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.heic',
    '.heif',
    '.avif',
    '.tiff',
    '.tif',
    '.bmp',
  ];

  // Extensions that need normalization to JPEG
  private static readonly NORMALIZE_EXTENSIONS = [
    '.heic',
    '.heif',
    '.avif',
    '.tiff',
    '.tif',
    '.bmp',
  ];

  // Validate file extension
  static isValidImageExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.ALLOWED_EXTENSIONS.includes(ext);
  }

  // Validate file is actually a readable image using sharp
  static async isValidImageFile(filepath: string, filename: string): Promise<boolean> {
    try {
      const metadata = await sharp(filepath).metadata();
      return metadata.format !== undefined;
    } catch (error) {
      // HEIC/HEIF might not be supported by sharp on Windows
      // Accept them based on extension only
      const ext = path.extname(filename).toLowerCase();
      if (['.heic', '.heif'].includes(ext)) {
        console.log(`⚠️  HEIC/HEIF format detected - sharp support not available, accepting based on extension`);
        return true;
      }
      return false;
    }
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
    filename: string
  ): Promise<{ path: string; mimetype: string }> {
    const ext = path.extname(filename).toLowerCase();

    // If format needs normalization, try to convert to JPEG
    if (this.NORMALIZE_EXTENSIONS.includes(ext)) {
      try {
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
      } catch (error) {
        // If normalization fails (e.g., HEIC not supported), keep original
        console.log(`⚠️  Could not normalize ${ext} format, keeping original file`);

        // Determine mimetype from extension
        let mimetype = 'image/jpeg';
        if (ext === '.heic') mimetype = 'image/heic';
        else if (ext === '.heif') mimetype = 'image/heif';
        else if (ext === '.avif') mimetype = 'image/avif';
        else if (ext === '.tiff' || ext === '.tif') mimetype = 'image/tiff';
        else if (ext === '.bmp') mimetype = 'image/bmp';

        return {
          path: inputPath,
          mimetype,
        };
      }
    }

    // Keep PNG, WebP, GIF, JPEG as-is (web-friendly formats)
    // Determine mimetype from extension
    let mimetype = 'image/jpeg';
    if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.webp') mimetype = 'image/webp';
    else if (ext === '.gif') mimetype = 'image/gif';

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
    // Validate file extension (more reliable than MIME type)
    if (!this.isValidImageExtension(file.filename)) {
      throw new Error(
        'Invalid file extension. Supported formats: JPEG, PNG, WebP, GIF, HEIC, HEIF, AVIF, TIFF, BMP'
      );
    }

    // Ensure upload directory exists
    await this.ensureUploadDir();

    // Generate unique filename (preserves original extension)
    const tempFilename = this.generateFilename(file.filename);
    const tempFilepath = path.join(config.uploadDir, tempFilename);

    // Save file temporarily
    await pipeline(file.file, createWriteStream(tempFilepath));

    // Validate file is actually a readable image
    const isValidImage = await this.isValidImageFile(tempFilepath, file.filename);
    if (!isValidImage) {
      // Clean up invalid file
      await fs.unlink(tempFilepath);
      throw new Error(
        'File is not a valid image or is corrupted. Please upload a valid image file.'
      );
    }

    // Normalize image format if needed
    const normalized = await this.normalizeImage(tempFilepath, file.filename);

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
