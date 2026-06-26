/**
 * Linguistic Tokenizer Agent
 * Uses llama3-70b-8192 via Groq API to perform morphological analysis
 * on Japanese sentences, returning structured word-level tokens.
 *
 * TEMPORARY: Replaced Gemini due to free tier quota exhaustion.
 * To switch back: restore ai.generate() call with Gemini model.
 */

import { z } from 'zod';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Token interface representing a parsed Japanese word/token
 */
export interface Token {
  surface: string;
  reading: string;
  partOfSpeech: string;
  isParticle: boolean;
  position: number;
}

/**
 * Tokenizer input schema
 */
export interface TokenizerInput {
  sentence: string;
}

/**
 * Tokenizer output schema
 */
export interface TokenizerOutput {
  tokens: Token[];
  sentence: string;
  /** @deprecated Debug timestamp — remove once stable */
  timestamp: number;
}

/**
 * Zod schema for LLM structured output validation
 */
const TokenSchema = z.object({
  surface: z.string().describe('The word as it appears in the sentence'),
  reading: z.string().describe('Kana reading of the word'),
  partOfSpeech: z.string().describe('Grammatical category (Noun, Verb, Particle, etc.)'),
  isParticle: z.boolean().describe('True if this is a grammatical particle'),
});

const TokenizerResponseSchema = z.object({
  tokens: z.array(TokenSchema),
});

/**
 * Attempts to parse a string as JSON, with fallback for markdown-fenced code blocks.
 * Groq may wrap JSON in ```json ... ``` fences despite the response_format hint.
 */
function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting content from markdown code fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }
    throw new Error(`Tokenizer: Groq returned invalid JSON. Response preview: ${raw.slice(0, 200)}`);
  }
}

/**
 * Calls Groq API for structured JSON output.
 */
async function callGroq(prompt: string): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Tokenizer: GROQ_API_KEY not set in environment');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a Japanese morphological analyzer. Always respond with valid JSON only, no other text.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tokenizer: Groq API error ${response.status}: ${text}`);
  }

  const body = await response.json();
  const content: string = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Tokenizer: Groq returned empty response');
  }

  return safeParseJson(content);
}

/**
 * Linguistic Tokenizer Function
 * Sends the sentence to llama3-70b-8192 for morphological analysis
 * and returns structured word-level tokens with readings and POS tags.
 */
export async function tokenizer(input: TokenizerInput): Promise<TokenizerOutput> {
  const { sentence } = input;

  const prompt = `Split the following Japanese sentence into words/tokens.

For each token, provide:
- surface: the exact text as it appears
- reading: the kana reading
- partOfSpeech: the grammatical category (Noun, Verb, Adjective, Particle, Auxiliary, Adverb, etc.)
- isParticle: true only for grammatical particles (を, が, は, に, で, と, や, から, まで, へ, の, も, ね, よ, か, ぞ, ぜ, わ, etc.)

Return ONLY valid JSON matching: { "tokens": [{ "surface": string, "reading": string, "partOfSpeech": string, "isParticle": boolean }] }

Sentence: ${sentence}`;

  const raw = await callGroq(prompt);
  const parsed = TokenizerResponseSchema.parse(raw);

  const tokens: Token[] = parsed.tokens.map((t, i) => ({
    surface: t.surface,
    reading: t.reading,
    partOfSpeech: t.partOfSpeech,
    isParticle: t.isParticle,
    position: i,
  }));

  return {
    tokens,
    sentence,
    timestamp: Date.now(),
  };
}
