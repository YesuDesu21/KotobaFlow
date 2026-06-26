/**
 * KotobaFlow MCP Server
 * Defines Genkit-compatible tools for querying the local SQLite database.
 * These tools are discoverable by Genkit flows and the Developer UI.
 */
import { z } from 'zod';
import { ai } from '../../genkit.config';
import {
  lookupByReading,
  lookupByKanji,
  searchByReading,
  lookupByPitchPattern,
} from './tools';

/**
 * Tool: query_dictionary_data
 * Looks up a Japanese word by reading or kanji and returns its
 * dictionary entry with pitch accent information.
 */
export const queryDictionaryData = ai.defineTool(
  {
    name: 'query_dictionary_data',
    description:
      'Queries the local Japanese linguistics database for a word by reading (kana) or kanji form. Returns dictionary definitions, part of speech, mora count, and pitch accent pattern.',
    inputSchema: z.object({
      surfaceForm: z.string().describe('The Japanese word to look up (kanji or kana)'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      entries: z.array(
        z.object({
          id: z.number(),
          kanji: z.string().nullable(),
          reading: z.string(),
          english_definition: z.string(),
          part_of_speech: z.string(),
          mora_count: z.number(),
          base_pattern_type: z.string(),
          downstep_index: z.number(),
        })
      ),
    }),
  },
  async (input) => {
    const byReading = await lookupByReading(input.surfaceForm);
    if (byReading.length > 0) {
      return { found: true, entries: byReading };
    }
    const byKanji = await lookupByKanji(input.surfaceForm);
    return { found: byKanji.length > 0, entries: byKanji };
  }
);

/**
 * Tool: fetch_minimal_pairs
 * Returns phonetically similar words with differing pitch configurations
 * for educational purposes and SEO content generation.
 */
export const fetchMinimalPairs = ai.defineTool(
  {
    name: 'fetch_minimal_pairs',
    description:
      'Returns phonetically parallel words (same reading, different pitch pattern). Useful for demonstrating pitch accent minimal pairs.',
    inputSchema: z.object({
      baseMoraCount: z.number().optional().describe('Filter by mora count (optional)'),
    }),
    outputSchema: z.object({
      pairs: z.array(
        z.object({
          kanji: z.string().nullable(),
          reading: z.string(),
          english_definition: z.string(),
          base_pattern_type: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    const pairs: Array<{
      kanji: string | null;
      reading: string;
      english_definition: string;
      base_pattern_type: string;
    }> = [];

    for (const pattern of ['Atamadaka', 'Odaka', 'Heiban', 'Nakadaka'] as const) {
      const entries = await lookupByPitchPattern(pattern);
      pairs.push(
        ...entries
          .filter((e) => !input.baseMoraCount || e.mora_count === input.baseMoraCount)
          .map((e) => ({
            kanji: e.kanji,
            reading: e.reading,
            english_definition: e.english_definition,
            base_pattern_type: e.base_pattern_type,
          }))
      );
    }
    return { pairs };
  }
);