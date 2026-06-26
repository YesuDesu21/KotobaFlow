/**
 * KotobaFlow Pitch Parser
 * 
 * Core utility for transforming Japanese pitch accent data into standardized schemas
 * and SVG-renderable coordinates. Serves both Chrome Extension (AI outputs) and
 * Web Companion (database queries).
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Raw database row from lexicon table
 */
export interface LexiconRow {
  id: number;
  kanji: string | null;
  reading: string;
  english_definition: string;
  part_of_speech: string;
  mora_count: number;
}

/**
 * Raw database row from pitch_accent table
 */
export interface PitchAccentRow {
  id: number;
  lexicon_id: number;
  base_pattern_type: 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka';
  downstep_index: number;
}

/**
 * Standardized pitch accent schema used across the application
 */
export interface PitchAccentData {
  kanji: string | null;
  reading: string;
  englishDefinition: string;
  partOfSpeech: string;
  moraCount: number;
  pitchPattern: PitchPattern;
}

/**
 * Binary pitch sequence (High/Low per mora)
 */
export interface PitchPattern {
  type: 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka';
  downstepIndex: number;
  sequence: ('H' | 'L')[];
}

/**
 * SVG coordinate data for rendering pitch contours
 */
export interface SVGCoordinates {
  path: string;
  points: Array<{ x: number; y: number }>;
  viewBox: string;
  width: number;
  height: number;
}

// Shared visual constants for SVG pitch contour rendering
export const HIGH_Y = 10;
export const LOW_Y = 40;
export const SPACING = 50;
export const START_X = 20;

// ============================================================================
// Pattern Type to H/L Sequence Conversion
// ============================================================================

/**
 * Converts abstract pitch pattern types into binary H/L sequences
 * 
 * Pitch accent rules for Standard Japanese:
 * - Heiban (平板): L H H H... (flat after initial rise)
 * - Atamadaka (頭高): H L L L... (high first mora, then drop)
 * - Nakadaka (中高): L H H L L... (rise, sustain, drop at downstep)
 * - Odaka (尾高): L H H H... (rise, sustain, drop at final mora)
 */
export function patternToSequence(
  type: 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka',
  downstepIndex: number,
  moraCount: number
): ('H' | 'L')[] {
  const sequence: ('H' | 'L')[] = [];

  switch (type) {
    case 'Heiban':
      // L H H H... (flat after initial rise)
      sequence.push('L');
      for (let i = 1; i < moraCount; i++) {
        sequence.push('H');
      }
      break;

    case 'Atamadaka':
      // H L L L... (high first mora, then drop)
      sequence.push('H');
      for (let i = 1; i < moraCount; i++) {
        sequence.push('L');
      }
      break;

    case 'Nakadaka':
      // L H H L L... (rise, sustain, drop at downstepIndex)
      sequence.push('L');
      for (let i = 1; i < moraCount; i++) {
        if (i < downstepIndex) {
          sequence.push('H');
        } else {
          sequence.push('L');
        }
      }
      break;

    case 'Odaka':
      // L H H H... (rise, sustain, drop at final mora)
      sequence.push('L');
      for (let i = 1; i < moraCount; i++) {
        sequence.push('H');
      }
      // Odaka drops after the final mora (not represented in sequence)
      break;

    default:
      throw new Error(`Unknown pitch pattern type: ${type}`);
  }

  return sequence;
}

// ============================================================================
// Database Row to Standardized Schema
// ============================================================================

/**
 * Transforms raw database rows into the unified PitchAccentData schema
 */
export function databaseToPitchAccentData(
  lexiconRow: LexiconRow,
  pitchRow: PitchAccentRow
): PitchAccentData {
  const sequence = patternToSequence(
    pitchRow.base_pattern_type,
    pitchRow.downstep_index,
    lexiconRow.mora_count
  );

  return {
    kanji: lexiconRow.kanji,
    reading: lexiconRow.reading,
    englishDefinition: lexiconRow.english_definition,
    partOfSpeech: lexiconRow.part_of_speech,
    moraCount: lexiconRow.mora_count,
    pitchPattern: {
      type: pitchRow.base_pattern_type,
      downstepIndex: pitchRow.downstep_index,
      sequence,
    },
  };
}

// ============================================================================
// AI String to Pitch Pattern
// ============================================================================

/**
 * Parses AI-generated H/L string arrays into PitchPattern
 * 
 * Expected format: "HLLH" or ['H', 'L', 'L', 'H']
 */
export function aiStringToPitchPattern(
  aiOutput: string | string[]
): PitchPattern {
  const sequence = typeof aiOutput === 'string'
    ? (aiOutput.split('') as ('H' | 'L')[])
    : aiOutput as ('H' | 'L')[];

  // Validate sequence
  if (sequence.some(s => s !== 'H' && s !== 'L')) {
    throw new Error('Invalid pitch sequence: must contain only H or L');
  }

  // Infer pattern type from sequence
  const type = inferPatternType(sequence);
  const downstepIndex = findDownstepIndex(sequence);

  return {
    type,
    downstepIndex,
    sequence,
  };
}

/**
 * Infers pattern type from H/L sequence
 *
 * Note: Heiban and Odaka produce identical sequences in isolation
 * (both L H H...). The distinction only manifests with particle attachment.
 * 1-mora words are classified as Heiban (accentless default).
 */
function inferPatternType(sequence: ('H' | 'L')[]): 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka' {
  // Single-mora: all patterns look identical in isolation; default to Heiban
  if (sequence.length <= 1) {
    return 'Heiban';
  }

  if (sequence[0] === 'H') {
    return 'Atamadaka';
  }

  const firstL = sequence.indexOf('L', 1);
  if (firstL === -1) {
    return 'Heiban';
  }

  if (firstL === sequence.length - 1) {
    return 'Odaka';
  }

  return 'Nakadaka';
}

/**
 * Finds the index where pitch drops from H to L
 */
function findDownstepIndex(sequence: ('H' | 'L')[]): number {
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i - 1] === 'H' && sequence[i] === 'L') {
      return i;
    }
  }
  return -1; // No downstep found (Heiban)
}

// ============================================================================
// H/L Sequence to SVG Coordinates
// ============================================================================

/**
 * Converts H/L sequence into SVG path data and coordinates
 * 
 * Visual representation:
 * - High pitch: y = 10 (upper line)
 * - Low pitch: y = 40 (lower line)
 * - Horizontal spacing: 60px per mora
 */
export function sequenceToSVG(sequence: ('H' | 'L')[]): SVGCoordinates {
  const points: Array<{ x: number; y: number }> = [];

  // Generate points for each mora
  sequence.forEach((pitch, index) => {
    const x = START_X + (index * SPACING);
    const y = pitch === 'H' ? HIGH_Y : LOW_Y;
    points.push({ x, y });
  });

  // Build SVG path
  if (points.length === 0) {
    return {
      path: '',
      points: [],
      viewBox: '0 0 0 0',
      width: 0,
      height: 0,
    };
  }

  // Start at first point
  const pathCommands: string[] = [`M ${points[0].x} ${points[0].y}`];

  // Draw lines to subsequent points
  for (let i = 1; i < points.length; i++) {
    pathCommands.push(`L ${points[i].x} ${points[i].y}`);
  }

  // Extend the line slightly beyond the last point for visual continuity
  const lastPoint = points[points.length - 1];
  const finalX = lastPoint.x + (SPACING / 2);
  pathCommands.push(`L ${finalX} ${lastPoint.y}`);

  const width = finalX + 20;
  const height = 50;

  return {
    path: pathCommands.join(' '),
    points,
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
  };
}

/**
 * Complete transformation from PitchAccentData to SVG
 */
export function pitchAccentDataToSVG(data: PitchAccentData): SVGCoordinates {
  return sequenceToSVG(data.pitchPattern.sequence);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Counts mora in a Japanese kana string
 * Handles long vowels (ー) and small kana (ゃ, ゅ, ょ)
 */
export function countMora(kana: string): number {
  let count = 0;
  const longVowel = 'ー';
  const smallKana = ['ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];

  for (let i = 0; i < kana.length; i++) {
    const char = kana[i];
    
    // Long vowels extend the previous mora
    if (char === longVowel) {
      continue;
    }
    
    // Small kana combine with previous character
    if (smallKana.includes(char)) {
      continue;
    }
    
    count++;
  }

  return count;
}

/**
 * Validates pitch accent data structure.
 * Returns `true` if valid, or a descriptive error string if invalid.
 */
export function validatePitchAccentData(data: PitchAccentData): true | string {
  if (!data.reading) {
    return 'Missing reading';
  }

  if (data.moraCount <= 0) {
    return `Invalid moraCount: ${data.moraCount}`;
  }

  if (data.pitchPattern.sequence.length !== data.moraCount) {
    return `Sequence length (${data.pitchPattern.sequence.length}) does not match moraCount (${data.moraCount})`;
  }

  const validTypes = ['Heiban', 'Atamadaka', 'Nakadaka', 'Odaka'];
  if (!validTypes.includes(data.pitchPattern.type)) {
    return `Invalid pitch pattern type: ${data.pitchPattern.type}`;
  }

  return true;
}