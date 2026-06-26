/**
 * Sentence Analyzer Orchestrator
 * Combines the tokenizer and acoustic agents to provide a complete analysis pipeline.
 * Registered as a Genkit flow for Developer UI tracing and debugging.
 */

import { z } from 'zod';
import { ai } from '../../genkit.config';
import { tokenizer } from './tokenizer';
import { acoustic } from './acoustic';
import type { LexiconEntry } from '../mcp/tools';
import type { PitchAccentData } from '../../../shared-utils/src/pitch-parser';

const SentenceAnalysisInputSchema = z.object({
  sentence: z.string(),
});

const TokenSchema = z.object({
  surface: z.string(),
  reading: z.string(),
  partOfSpeech: z.string(),
  isParticle: z.boolean(),
  position: z.number(),
  pitchAccent: z.any().optional(),
  databaseEntry: z.any().optional(),
});

const SentenceAnalysisOutputSchema = z.object({
  tokens: z.array(TokenSchema),
  sentence: z.string(),
  /** @deprecated Debug timestamp — remove once stable */
  timestamp: z.number(),
});

export const analyzeSentence = ai.defineFlow(
  {
    name: 'analyzeSentence',
    inputSchema: SentenceAnalysisInputSchema,
    outputSchema: SentenceAnalysisOutputSchema,
  },
  async (input) => {
    const tokenizerResult = await tokenizer({ sentence: input.sentence });
    const acousticResult = await acoustic({ tokens: tokenizerResult.tokens });
    return acousticResult;
  }
);
