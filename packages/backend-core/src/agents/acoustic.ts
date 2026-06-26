/**
 * Acoustic Context & Downstepping Agent
 * Uses database lookups and pitch-parser to add pitch accent data to tokens
 */

import { lookupByReading, lookupByKanji, LexiconEntry } from '../mcp/tools';
import {
  databaseToPitchAccentData,
  PitchAccentData,
  LexiconRow,
  PitchAccentRow,
} from '../../../shared-utils/src/pitch-parser';

/**
 * Enhanced token with pitch accent data
 */
export interface EnhancedToken {
  surface: string;
  reading: string;
  partOfSpeech: string;
  isParticle: boolean;
  position: number;
  pitchAccent?: PitchAccentData;
  databaseEntry?: LexiconEntry;
}

/**
 * Acoustic agent input schema
 */
export interface AcousticInput {
  tokens: Array<{
    surface: string;
    reading: string;
    partOfSpeech: string;
    isParticle: boolean;
    position: number;
  }>;
}

/**
 * Acoustic agent output schema
 */
export interface AcousticOutput {
  tokens: EnhancedToken[];
  sentence: string;
  timestamp: number;
}

/**
 * Acoustic Context & Downstepping Function
 * Takes tokenized input and enriches it with pitch accent data from the database
 * Uses the pitch-parser to convert database data into standardized schemas and SVG coordinates
 */
export async function acoustic(input: AcousticInput): Promise<AcousticOutput> {
  const { tokens } = input;

  // Enrich each token with pitch accent data
  const enhancedTokens: EnhancedToken[] = await Promise.all(
    tokens.map(async (token) => {
      let databaseEntry: LexiconEntry | undefined;
      let pitchAccent: PitchAccentData | undefined;

      // Skip particles for pitch accent lookup (they typically don't have pitch patterns)
      if (!token.isParticle) {
        try {
          // Try to lookup by reading first
          const byReading = await lookupByReading(token.reading);
          if (byReading.length > 0) {
            databaseEntry = byReading[0];
          } else if (token.surface) {
            // Fallback to lookup by kanji/surface
            const byKanji = await lookupByKanji(token.surface);
            if (byKanji.length > 0) {
              databaseEntry = byKanji[0];
            }
          }

          // Convert database entry to pitch accent schema
          if (databaseEntry) {
            const lexiconRow: LexiconRow = {
              id: databaseEntry.id,
              kanji: databaseEntry.kanji,
              reading: databaseEntry.reading,
              english_definition: databaseEntry.english_definition,
              part_of_speech: databaseEntry.part_of_speech,
              mora_count: databaseEntry.mora_count,
            };
            const pitchRow: PitchAccentRow = {
              id: databaseEntry.id,
              lexicon_id: databaseEntry.id,
              base_pattern_type: databaseEntry.base_pattern_type as 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka',
              downstep_index: databaseEntry.downstep_index,
            };
            pitchAccent = databaseToPitchAccentData(lexiconRow, pitchRow);
          }
        } catch (error) {
          console.error(`Failed to lookup pitch accent for ${token.reading}:`, error);
        }
      }

      return {
        ...token,
        pitchAccent,
        databaseEntry,
      };
    })
  );

  // Reconstruct sentence from tokens
  const sentence = enhancedTokens.map(t => t.surface).join('');

  return {
    tokens: enhancedTokens,
    sentence,
    timestamp: Date.now(),
  };
}
