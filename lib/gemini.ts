const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

export function geminiApiKeyMissing(): boolean {
  return !GEMINI_API_KEY;
}

interface GeminiOptions {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

export class GeminiError extends Error {
  status: number;
  details?: any;
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.details = details;
  }
}

async function attempt(body: any): Promise<any> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // keep raw text
    }
    const geminiMsg =
      parsed?.error?.message || text || `Gemini request failed with status ${res.status}`;
    throw new GeminiError(geminiMsg, res.status, parsed);
  }

  return res.json();
}

export async function generateWithGemini(opts: GeminiOptions): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new GeminiError(
      'Gemini API key is not configured. Set GEMINI_API_KEY in your environment (e.g. .env.local).',
      500
    );
  }

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  let lastErr: any;
  // Retry once after a short delay on transient 429 / 503 quota errors.
  for (let attemptNo = 0; attemptNo < 2; attemptNo++) {
    try {
      const data = await attempt(body);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiError('Gemini returned an empty response.', 502);
      }
      return text.trim();
    } catch (err: any) {
      lastErr = err;
      if (err instanceof GeminiError && (err.status === 429 || err.status === 503) && attemptNo === 0) {
        const retryDelayMs = err.details?.error?.details?.find(
          (d: any) => d['@type']?.includes('RetryInfo')
        )?.retryDelay;
        const ms = retryDelayMs ? parseInt(retryDelayMs.replace('s', ''), 10) * 1000 : 5000;
        await new Promise((r) => setTimeout(r, Math.min(ms, 10000)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export { MODEL as GEMINI_MODEL };
