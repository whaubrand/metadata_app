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

  // Generate mock metadata (used when no OpenAI API key)
  private static generateMockMetadata(contextInput: string): MetadataResult {
    const cleanContext = contextInput.trim();
    const words = cleanContext.toLowerCase().replace(/[äöüõ]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', õ: 'o' }[c] ?? c));
    const slug = words.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);

    return {
      suggestedFilename: `${slug || 'pilt'}.jpg`,
      title: cleanContext.split(/\s+/).slice(0, 5).join(' '),
      altText: cleanContext.charAt(0).toUpperCase() + cleanContext.slice(1) + '.',
      caption: cleanContext.split(/[.!?]/)[0] + '.',
      description: cleanContext.charAt(0).toUpperCase() + cleanContext.slice(1) + '.',
      seoKeywords: '',
      clarifyingQuestions: '',
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

    const systemPrompt = `Sa oled 8Hertsi (Juhan Vahter) meediafailide metadata koostaja ja eesti keele toimetaja. Kirjutad faktitäpselt, minimalistlikult ja korrektses eesti keeles. Sa ei tohi teha oletusi ega loogikavigu.

Eesmärk: Luua iga pildi jaoks WordPressi meediateeki sobiv metadata.

KRIITILISED REEGLID (ära riku):
1) FAKTIKONTROLL: Ära eelda. Kui mõni fakt pole pildilt ja kontekstist 100% kindel (objektide arv, auto mudel/aasta, materjal, tarkvara, tööetapp), jäta see detail metadata'st välja.
2) KEEL: Kasuta korrektset eesti keelt. Kontrolli kokku-lahku kirjutamine, käänded, kirjavahemärgid.
3) MINIMALISM: Väldi ilukõnet ja turunduslikke ülivõrdeid. Kirjelda otse ja faktipõhiselt.
4) ALT-TEKST: 1 lause. Ütle, mis pildil on. Ära alusta "Pilt sellest…". Ära pane sinna müügijuttu.
5) PEALKIRI: 3–6 sõna. Kirjeldav, mitte reklaam.
6) PEALDIS: 1 lühike lause või fraas. Sobib pildi alla.
7) KIRJELDUS: 2–4 lauset. Ainult kinnitatud faktid: mis on objekt, eesmärk, tööetapp (kui teada), järgmine samm (kui teada).
8) FAILINIMI: väiketähed, sidekriipsud, ilma täpitähtedeta (ä→a, ö→o, ü→u, õ→o), ilma sulgudeta. Kirjeldav. Lõpeta .jpg-ga.
9) SEO MÄRKSÕNAD: 3–6 märksõna või fraasi, komadega eraldatud. Ainult asjakohased.
10) TÄPSUSTAVAD KÜSIMUSED: Kui pilt ja kontekst ei anna mõne olulise fakti kohta piisavat kindlust, lisa kuni 3 täpsustavat küsimust väljale "clarifyingQuestions" (1 string, küsimused eraldatud küsimärgiga). Kui kõik on selge, jäta tühjaks.

Vasta AINULT validse JSON-iga, ilma markdown-koodiplokita:
{
  "suggestedFilename": "kirjeldav-failinimi.jpg",
  "title": "3–6 sõna pealkiri",
  "altText": "Üks lause sellest, mis pildil on.",
  "caption": "Lühike pealdis.",
  "description": "2–4 lauset. Ainult kinnitatud faktid.",
  "seoKeywords": "märksõna1, märksõna2, märksõna3",
  "clarifyingQuestions": ""
}`;

    const userPrompt = contextInput.trim()
      ? `Kontekst kasutajalt: ${contextInput}`
      : 'Konteksti ei ole antud. Kirjelda ainult seda, mis pildilt on kindlalt näha.';

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
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
        max_tokens: 800,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Strip markdown code block if present
      const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      // Parse JSON response
      const metadata = JSON.parse(cleaned) as MetadataResult;

      // Validate required fields
      if (
        !metadata.suggestedFilename ||
        !metadata.title ||
        !metadata.altText ||
        !metadata.caption ||
        !metadata.description
      ) {
        throw new Error('Invalid metadata structure from OpenAI');
      }

      // Ensure optional fields exist
      metadata.seoKeywords = metadata.seoKeywords ?? '';
      metadata.clarifyingQuestions = metadata.clarifyingQuestions ?? '';

      return metadata;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate metadata: ${error.message}`);
      }
      throw new Error('Failed to generate metadata');
    }
  }
}
