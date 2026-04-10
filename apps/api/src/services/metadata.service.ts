import { prisma } from '../utils/prisma';
import { MetadataResult } from '../types';

export class MetadataService {
  // Save generated metadata to database
  static async saveMetadata(
    userId: string,
    imageUrl: string,
    contextInput: string,
    metadata: MetadataResult
  ) {
    const result = await prisma.metadataResult.create({
      data: {
        userId,
        imageUrl,
        contextInput,
        suggestedFilename: metadata.suggestedFilename,
        title: metadata.title,
        altText: metadata.altText,
        caption: metadata.caption,
        description: metadata.description,
        seoKeywords: metadata.seoKeywords,
        clarifyingQuestions: metadata.clarifyingQuestions,
      },
    });

    return result;
  }

  // Get all metadata results for a user
  static async getUserResults(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      prisma.metadataResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.metadataResult.count({
        where: { userId },
      }),
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single metadata result
  static async getResultById(id: string, userId: string) {
    const result = await prisma.metadataResult.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!result) {
      throw new Error('Result not found');
    }

    return result;
  }

  // Delete metadata result
  static async deleteResult(id: string, userId: string) {
    const result = await prisma.metadataResult.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!result) {
      throw new Error('Result not found');
    }

    await prisma.metadataResult.deleteMany({
      where: { id, userId },
    });

    return { message: 'Result deleted successfully' };
  }
}
