import OpenAI from 'openai';
import { config } from '../utils/config';
import { MetadataResult } from '../types';
import fs from 'fs/promises';
import path from 'path';

// Initialize OpenAI only if API key is available
const openai = config.openaiApiKey
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

export class OpenAIService {
  // Convert image file to base64 data URL
  private static async convertImageToBase64(filepath: string): Promise<string> {
    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString('base64');

    // Detect mimetype from file extension
    const ext = path.extname(filepath).toLowerCase();
    let mimetype = 'image/jpeg';

    if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.webp') mimetype = 'image/webp';
    else if (ext === '.gif') mimetype = 'image/gif';

    return `data:${mimetype};base64,${base64Image}`;
  }

  // Detect language from context (improved)
  private static detectLanguage(text: string): string {
    const estonianPatterns = [
      /\b(ja|on|et|see|või|kui|saab|ning|pilt|toode|juures|koos|ilma|üle|alla|välja|sisse)\b/gi,
      /[õäöü]/i, // Estonian special characters
    ];

    let estonianScore = 0;
    for (const pattern of estonianPatterns) {
      const matches = text.match(pattern);
      if (matches) estonianScore += matches.length;
    }

    // If significant Estonian indicators, assume Estonian
    return estonianScore > 2 ? 'et' : 'en';
  }

  // Generate natural mock metadata (used when no OpenAI API key)
  private static generateMockMetadata(contextInput: string): MetadataResult {
    const lang = this.detectLanguage(contextInput);
    const cleanContext = contextInput.trim();

    // Capitalize first letter
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    if (lang === 'et') {
      // Extract main subject from context
      const firstSentence = cleanContext.split(/[.!?]/)[0];
      const shortContext = firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence;

      return {
        altText: capitalize(cleanContext),
        seoTitle: `${capitalize(shortContext)} | Kvaliteetne pilt`,
        socialCaption: `${capitalize(cleanContext)} ✨\n\n#kvaliteet #toode #eesti`,
        metaDescription: `${capitalize(cleanContext)}. Professionaalne pildistus ja kvaliteetne visuaal teie vajadusteks.`,
        recommendedChannel: 'Instagram',
        channelExplanation: 'Visuaalne sisu sobib hästi Instagrami',
      };
    }

    // English version
    const firstSentence = cleanContext.split(/[.!?]/)[0];
    const shortContext = firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence;

    return {
      altText: capitalize(cleanContext),
      seoTitle: `${capitalize(shortContext)} | Professional Quality`,
      socialCaption: `${capitalize(cleanContext)} ✨\n\n#quality #product #professional`,
      metaDescription: `${capitalize(cleanContext)}. Professional photography and quality visuals for your needs.`,
      recommendedChannel: 'Instagram',
      channelExplanation: 'Visual content performs well on Instagram',
    };
  }

  // Generate metadata from image file and context
  static async generateMetadata(
    filename: string,
    contextInput: string
  ): Promise<MetadataResult> {
    // If no OpenAI API key, use mock metadata
    if (!openai) {
      console.log('ℹ️  Using MOCK metadata generation (no OpenAI API key)');
      return this.generateMockMetadata(contextInput);
    }

    console.log('✓ Using OpenAI API for metadata generation');

    // Build file path
    const filepath = path.join(config.uploadDir, filename);

    // Convert image to base64
    const base64Image = await this.convertImageToBase64(filepath);

    const prompt = `You are an expert SEO and social media marketing specialist.

Analyze the provided image and context to generate comprehensive, high-quality metadata.

Context: ${contextInput}

IMPORTANT: Generate ALL metadata in the SAME LANGUAGE as the context provided above. If the context is in Estonian, respond in Estonian. If in English, respond in English. Match the language exactly.

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
                  url: base64Image,
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
