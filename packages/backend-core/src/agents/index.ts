/**
 * Sentence Analyzer Orchestrator
 * Combines the tokenizer and acoustic agents to provide a complete analysis pipeline.
 * Registered as a Genkit flow for Developer UI tracing and debugging.
 */

import { z } from 'zod';
import { ai } from '../../genkit.config';
import { tokenizer } from './tokenizer';
import { acoustic } from './acoustic';

const SentenceAnalysisInputSchema = z.object({
  sentence: z.string(),
  seq: z.number().optional(),
});

const PitchPatternSchema = z.object({
  type: z.enum(['Heiban', 'Atamadaka', 'Nakadaka', 'Odaka']),
  downstepIndex: z.number(),
  sequence: z.array(z.enum(['H', 'L'])),
});

const PitchAccentDataSchema = z.object({
  kanji: z.string().nullable(),
  reading: z.string(),
  englishDefinition: z.string(),
  partOfSpeech: z.string(),
  moraCount: z.number(),
  pitchPattern: PitchPatternSchema,
});

const LexiconEntrySchema = z.object({
  id: z.number(),
  kanji: z.string().nullable(),
  reading: z.string(),
  english_definition: z.string(),
  part_of_speech: z.string(),
  mora_count: z.number(),
  base_pattern_type: z.string(),
  downstep_index: z.number(),
});

const TokenSchema = z.object({
  surface: z.string(),
  reading: z.string(),
  partOfSpeech: z.string(),
  isParticle: z.boolean(),
  position: z.number(),
  pitchAccent: PitchAccentDataSchema.optional(),
  databaseEntry: LexiconEntrySchema.optional(),
});

const SentenceAnalysisOutputSchema = z.object({
  tokens: z.array(TokenSchema),
  sentence: z.string(),
  timestamp: z.number(),
  seq: z.number().optional(),
});

export const analyzeSentence = ai.defineFlow(
  {
    name: 'analyzeSentence',
    inputSchema: SentenceAnalysisInputSchema,
    outputSchema: SentenceAnalysisOutputSchema,
  },
  async (input) => {
    const tokenizerResult = await tokenizer({ sentence: input.sentence });
    const acousticResult = await acoustic({ sentence: input.sentence, tokens: tokenizerResult.tokens });
    return { ...acousticResult, seq: input.seq };
  }
);
