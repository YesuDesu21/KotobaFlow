/**
 * Custom database search tools for KotobaFlow
 * Provides MCP tools for LLM to query the local SQLite database
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

/**
 * Loads the SQLite database
 */
async function loadDatabase(): Promise<any> {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    return new SQL.Database(fileBuffer);
  } else {
    throw new Error(`Database not found at ${dbPath}`);
  }
}

/**
 * Look up a word by its reading (kana)
 */
export async function lookupByReading(reading: string): Promise<LexiconEntry[]> {
  const db = await loadDatabase();
  
  try {
    const results = db.exec(`
      SELECT l.*, p.base_pattern_type, p.downstep_index
      FROM lexicon l
      JOIN pitch_accent p ON l.id = p.lexicon_id
      WHERE l.reading = ?
    `, [reading]);
    
    if (results.length === 0) {
      return [];
    }
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map((row: any[]) => {
      const entry: any = {};
      columns.forEach((col: string, i: number) => {
        entry[col] = row[i];
      });
      return entry as LexiconEntry;
    });
  } finally {
    db.close();
  }
}

/**
 * Look up a word by its kanji
 */
export async function lookupByKanji(kanji: string): Promise<LexiconEntry[]> {
  const db = await loadDatabase();
  
  try {
    const results = db.exec(`
      SELECT l.*, p.base_pattern_type, p.downstep_index
      FROM lexicon l
      JOIN pitch_accent p ON l.id = p.lexicon_id
      WHERE l.kanji = ?
    `, [kanji]);
    
    if (results.length === 0) {
      return [];
    }
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map((row: any[]) => {
      const entry: any = {};
      columns.forEach((col: string, i: number) => {
        entry[col] = row[i];
      });
      return entry as LexiconEntry;
    });
  } finally {
    db.close();
  }
}

/**
 * Search for words by partial reading match (fuzzy search)
 */
export async function searchByReading(partial: string): Promise<LexiconEntry[]> {
  const db = await loadDatabase();
  
  try {
    const results = db.exec(`
      SELECT l.*, p.base_pattern_type, p.downstep_index
      FROM lexicon l
      JOIN pitch_accent p ON l.id = p.lexicon_id
      WHERE l.reading LIKE ?
      LIMIT 10
    `, [`%${partial}%`]);
    
    if (results.length === 0) {
      return [];
    }
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map((row: any[]) => {
      const entry: any = {};
      columns.forEach((col: string, i: number) => {
        entry[col] = row[i];
      });
      return entry as LexiconEntry;
    });
  } finally {
    db.close();
  }
}

/**
 * Get all words with a specific pitch pattern type
 */
export async function lookupByPitchPattern(patternType: string): Promise<LexiconEntry[]> {
  const db = await loadDatabase();
  
  try {
    const results = db.exec(`
      SELECT l.*, p.base_pattern_type, p.downstep_index
      FROM lexicon l
      JOIN pitch_accent p ON l.id = p.lexicon_id
      WHERE p.base_pattern_type = ?
      LIMIT 20
    `, [patternType]);
    
    if (results.length === 0) {
      return [];
    }
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map((row: any[]) => {
      const entry: any = {};
      columns.forEach((col: string, i: number) => {
        entry[col] = row[i];
      });
      return entry as LexiconEntry;
    });
  } finally {
    db.close();
  }
}
