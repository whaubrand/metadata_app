import OpenAI from 'openai';
import { config } from '../utils/config';
import { MetadataResult } from '../types';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export class OpenAIService {
  // Generate metadata from image and context
  static async generateMetadata(
    imageUrl: string,
    contextInput: string
  ): Promise<MetadataResult> {
    const prompt = `You are an expert SEO and social media marketing specialist.

Analyze the provided image and context to generate comprehensive, high-quality metadata.

Context: ${contextInput}

Generate the following in JSON format:
1. seoTitle: A compelling SEO-optimized title (50-60 characters)
2. metaDescription: An engaging meta description (150-160 characters)
3. altText: Descriptive alt text for accessibility (100-125 characters)
4. socialCaption: An engaging social media caption with relevant hashtags (150-200 characters)
5. recommendedChannel: The best platform to use this content (e.g., "Instagram", "LinkedIn", "Blog post", "Facebook", "Pinterest")
6. channelExplanation: A brief explanation (50-100 characters) of why this channel is recommended

Respond ONLY with valid JSON matching this structure:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "altText": "...",
  "socialCaption": "...",
  "recommendedChannel": "...",
  "channelExplanation": "..."
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const metadata = JSON.parse(content) as MetadataResult;

      // Validate response structure
      if (
        !metadata.seoTitle ||
        !metadata.metaDescription ||
        !metadata.altText ||
        !metadata.socialCaption ||
        !metadata.recommendedChannel ||
        !metadata.channelExplanation
      ) {
        throw new Error('Invalid metadata structure from OpenAI');
      }

      return metadata;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate metadata: ${error.message}`);
      }
      throw new Error('Failed to generate metadata');
    }
  }
}
