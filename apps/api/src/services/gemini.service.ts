import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../utils/config';
import { MetadataResult } from '../types';
import fs from 'fs/promises';
import path from 'path';

const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

const SYSTEM_PROMPT = `Sa oled 8Hertsi (Juhan Vahter) meediafailide metadata koostaja ja eesti keele toimetaja. Kirjutad faktitäpselt, minimalistlikult ja korrektses eesti keeles. Sa ei tohi teha oletusi ega loogikavigu.

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
10) TÄPSUSTAVAD KÜSIMUSED: Kui pilt ja kontekst ei anna mõne olulise fakti kohta piisavat kindlust, lisa kuni 3 täpsustavat küsimust väljale "clarifyingQuestions" (1 string, küsimused eraldatud " / " eraldajaga). Kui kõik on selge, jäta tühjaks.
11) KUI KONTEKST PUUDUB: Analüüsi pilti ise. Kirjelda ainult seda, mis on pildilt kindlalt näha.

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

export class GeminiService {
  private static async imageToBase64(filename: string): Promise<{ data: string; mimeType: string }> {
    const filepath = path.join(config.uploadDir, filename);
    const buffer = await fs.readFile(filepath);
    const ext = path.extname(filename).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    return {
      data: buffer.toString('base64'),
      mimeType: mimeMap[ext] ?? 'image/jpeg',
    };
  }

  private static generateMockMetadata(contextInput: string): MetadataResult {
    const clean = contextInput.trim();
    const slug = clean
      .toLowerCase()
      .replace(/[äöüõ]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', õ: 'o' }[c] ?? c))
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 60);

    return {
      suggestedFilename: `${slug || 'pilt'}.jpg`,
      title: clean.split(/\s+/).slice(0, 5).join(' ') || 'Pealkiri puudub',
      altText: clean ? clean.charAt(0).toUpperCase() + clean.slice(1) + '.' : 'Pilt.',
      caption: clean.split(/[.!?]/)[0] + '.',
      description: clean ? clean.charAt(0).toUpperCase() + clean.slice(1) + '.' : 'Kirjeldus puudub.',
      seoKeywords: '',
      clarifyingQuestions: '',
    };
  }

  static async generateMetadata(filename: string, contextInput: string): Promise<MetadataResult> {
    if (!genAI) {
      console.log('ℹ️  Using MOCK metadata generation (no GEMINI_API_KEY)');
      return this.generateMockMetadata(contextInput);
    }

    console.log('✓ Using Gemini API for metadata generation');

    const image = await this.imageToBase64(filename);

    const userText = contextInput.trim()
      ? `Kasutaja kontekst: ${contextInput.trim()}`
      : 'Konteksti ei ole antud. Analüüsi pilti ise ja kirjelda ainult seda, mis on pildilt kindlalt näha.';

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: userText },
            { inlineData: { mimeType: image.mimeType, data: image.data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    });

    const raw = result.response.text();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const metadata = JSON.parse(cleaned) as MetadataResult;

    if (!metadata.suggestedFilename || !metadata.title || !metadata.altText || !metadata.caption || !metadata.description) {
      throw new Error('Invalid metadata structure from Gemini');
    }

    metadata.seoKeywords = metadata.seoKeywords ?? '';
    metadata.clarifyingQuestions = metadata.clarifyingQuestions ?? '';

    return metadata;
  }
}
