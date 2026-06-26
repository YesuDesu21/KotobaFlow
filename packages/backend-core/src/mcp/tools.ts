/**
 * Custom database search tools for KotobaFlow
 * Provides MCP tools for LLM to query the local SQLite database.
 *
 * Performance note: the database is loaded once via a lazy singleton
 * and reused across all lookups within the same process lifetime.
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

// Database path
const dbPath = path.join(__dirname, '../../data/linguistics.db');

/**
 * Database lookup result interface
 */
export interface LexiconEntry {
  id: number;
  kanji: string | null;
  reading: string;
  english_definition: string;
  part_of_speech: string;
  mora_count: number;
  base_pattern_type: string;
  downstep_index: number;
}

// Lazy singleton — resolves once, reuses for all subsequent lookups
let dbSingleton: Promise<any> | null = null;

async function getDatabase(): Promise<any> {
  if (dbSingleton) return dbSingleton;

  dbSingleton = (async () => {
    const SQL = await initSqlJs();

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database not found at ${dbPath}`);
    }

    const fileBuffer = fs.readFileSync(dbPath);
    return new SQL.Database(fileBuffer);
  })();

  return dbSingleton;
}

const LOOKUP_COLS = [
  'l.id', 'l.kanji', 'l.reading', 'l.english_definition',
  'l.part_of_speech', 'l.mora_count',
  'p.base_pattern_type', 'p.downstep_index',
];

/**
 * Executes a parameterized SELECT using sql.js prepared statements.
 * db.exec() does not support bind params — this is the canonical pattern.
 */
async function query(sql: string, params: unknown[]): Promise<LexiconEntry[]> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: LexiconEntry[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as LexiconEntry);
  }
  stmt.free();
  return results;
}

/**
 * Look up a word by its reading (kana)
 */
export async function lookupByReading(reading: string): Promise<LexiconEntry[]> {
  return query(`
    SELECT ${LOOKUP_COLS.join(', ')}
    FROM lexicon l
    JOIN pitch_accent p ON l.id = p.lexicon_id
    WHERE l.reading = ?
  `, [reading]);
}

/**
 * Look up a word by its kanji
 */
export async function lookupByKanji(kanji: string): Promise<LexiconEntry[]> {
  return query(`
    SELECT ${LOOKUP_COLS.join(', ')}
    FROM lexicon l
    JOIN pitch_accent p ON l.id = p.lexicon_id
    WHERE l.kanji = ?
  `, [kanji]);
}

/**
 * Search for words by partial reading match (fuzzy search)
 */
export async function searchByReading(partial: string): Promise<LexiconEntry[]> {
  return query(`
    SELECT ${LOOKUP_COLS.join(', ')}
    FROM lexicon l
    JOIN pitch_accent p ON l.id = p.lexicon_id
    WHERE l.reading LIKE ?
    LIMIT 10
  `, [`%${partial}%`]);
}

/**
 * Get all words with a specific pitch pattern type
 */
export async function lookupByPitchPattern(patternType: string): Promise<LexiconEntry[]> {
  return query(`
    SELECT ${LOOKUP_COLS.join(', ')}
    FROM lexicon l
    JOIN pitch_accent p ON l.id = p.lexicon_id
    WHERE p.base_pattern_type = ?
    LIMIT 20
  `, [patternType]);
}
