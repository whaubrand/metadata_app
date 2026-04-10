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
        seoTitle: metadata.seoTitle,
        metaDescription: metadata.metaDescription,
        altText: metadata.altText,
        socialCaption: metadata.socialCaption,
        recommendedChannel: metadata.recommendedChannel,
        channelExplanation: metadata.channelExplanation,
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

    await prisma.metadataResult.delete({
      where: { id },
    });

    return { message: 'Result deleted successfully' };
  }
}
