import { z } from 'zod';
import type { AIStatus } from './types';
import type { TaskType } from './rotation';

const GeminiResponseSchema = z.object({
  is_valid: z.boolean(),
  confidence: z.number().min(0).max(1),
  detected_items: z.array(z.string()),
  reason: z.string(),
});

export type GeminiAnalysisResult = {
  aiStatus: AIStatus;
  confidence: number | null;
  detectedItems: string[];
  reason: string;
};

export async function analyzeCleaningEvidence(
  imageBase64: string,
  mimeType: string,
  taskName: TaskType
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  if (!apiKey) {
    return {
      aiStatus: 'UNAVAILABLE',
      confidence: null,
      detectedItems: [],
      reason: 'Google Gemini API key belum dikonfigurasi di environment server. Menunggu verifikasi manual oleh administrator.',
    };
  }

  const prompt = `Analyze the submitted image as potential evidence of completing a classroom cleaning task in an Indonesian school (Kelas 10 SIJA B).

Assigned task: ${taskName}

Context of duties:
- "MBG": Distribution or preparation of Makanan Bergizi Gratis, clean desks, food boxes, meal prep or tidy eating area.
- "Nyapu & Pel": Sweeping and mopping classroom floor, broom, dustpan, mop bucket, clean and shiny tiles, neat desks.
- "Helper": Classroom coordination, wiping whiteboards, emptying trash bins, organizing classroom supplies.

Evaluate:
1. Whether the image plausibly depicts a school or classroom environment.
2. Whether relevant objects or visible results are present for the assigned task.
3. Whether the image appears irrelevant, blank, corrupted, an obvious selfie, or otherwise insufficient as evidence.
4. Whether the visible evidence supports the assigned task.

Return ONLY a valid JSON object matching this exact schema:
{
  "is_valid": boolean,
  "confidence": number between 0.0 and 1.0,
  "detected_items": ["item1", "item2", ...],
  "reason": "Penjelasan singkat dalam Bahasa Indonesia mengenai keabsahan bukti foto."
}

Do not include markdown code block syntax if possible, just the raw JSON object.
Do not claim to establish a person's identity or prove who physically completed the task.
If evidence is unclear, use a low confidence score and explain the uncertainty in Indonesian.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API returned error status:', response.status, errText);
      return {
        aiStatus: 'FAILED',
        confidence: null,
        detectedItems: [],
        reason: `Gagal menganalisis gambar dengan Gemini API (Status ${response.status}). Perlu verifikasi manual admin.`,
      };
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        aiStatus: 'FAILED',
        confidence: null,
        detectedItems: [],
        reason: 'Respons AI kosong atau tidak dapat diuraikan.',
      };
    }

    // Clean potential markdown quotes
    const cleanedJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsedJson = JSON.parse(cleanedJson);
    const validated = GeminiResponseSchema.parse(parsedJson);

    return {
      aiStatus: validated.is_valid ? 'VALID' : 'INVALID',
      confidence: Number(validated.confidence.toFixed(2)),
      detectedItems: validated.detected_items,
      reason: validated.reason,
    };
  } catch (error) {
    console.error('Error during Gemini Vision analysis:', error);
    return {
      aiStatus: 'FAILED',
      confidence: null,
      detectedItems: [],
      reason: 'Terjadi kesalahan teknis saat menghubungi layanan AI. Silakan verifikasi manual.',
    };
  }
}
