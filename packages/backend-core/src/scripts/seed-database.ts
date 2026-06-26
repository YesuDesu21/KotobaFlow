/**
 * KotobaFlow Database Seeding Script
 * 
 * Clears existing data and seeds the SQLite database with sample Japanese vocabulary
 * for testing the pitch accent pipeline.
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

// Database path (now relative to scripts folder)
const dbPath = path.join(__dirname, '../../data/linguistics.db');

// Sample vocabulary data (minimal pairs + common words)
const sampleData = [
  // The famous "hashi" triplet
  {
    kanji: '箸',
    reading: 'はし',
    english_definition: 'Chopsticks',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Atamadaka',
    downstep_index: 0,
  },
  {
    kanji: '橋',
    reading: 'はし',
    english_definition: 'Bridge',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Odaka',
    downstep_index: 2,
  },
  {
    kanji: '端',
    reading: 'はし',
    english_definition: 'Edge, corner, end',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  
  // The "ame" pair
  {
    kanji: '雨',
    reading: 'あめ',
    english_definition: 'Rain',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Atamadaka',
    downstep_index: 0,
  },
  {
    kanji: '飴',
    reading: 'あめ',
    english_definition: 'Candy',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  
  // The "kaki" triplet
  {
    kanji: '牡蠣',
    reading: 'かき',
    english_definition: 'Oyster',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Atamadaka',
    downstep_index: 0,
  },
  {
    kanji: '柿',
    reading: 'かき',
    english_definition: 'Persimmon',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Odaka',
    downstep_index: 2,
  },
  {
    kanji: '垣',
    reading: 'かき',
    english_definition: 'Fence',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  
  // Common words
  {
    kanji: '水',
    reading: 'みず',
    english_definition: 'Water',
    part_of_speech: 'Noun',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '心',
    reading: 'こころ',
    english_definition: 'Heart, mind',
    part_of_speech: 'Noun',
    mora_count: 3,
    pitch_type: 'Atamadaka',
    downstep_index: 0,
  },
  {
    kanji: '男',
    reading: 'おとこ',
    english_definition: 'Man',
    part_of_speech: 'Noun',
    mora_count: 3,
    pitch_type: 'Odaka',
    downstep_index: 3,
  },
  {
    kanji: '心臓',
    reading: 'しんぞう',
    english_definition: 'Heart (organ)',
    part_of_speech: 'Noun',
    mora_count: 4,
    pitch_type: 'Nakadaka',
    downstep_index: 3,
  },
  {
    kanji: '日本',
    reading: 'にほん',
    english_definition: 'Japan',
    part_of_speech: 'Noun',
    mora_count: 3,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '日本語',
    reading: 'にほんご',
    english_definition: 'Japanese language',
    part_of_speech: 'Noun',
    mora_count: 4,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '勉強',
    reading: 'べんきょう',
    english_definition: 'Study',
    part_of_speech: 'Noun',
    mora_count: 4,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '食べる',
    reading: 'たべる',
    english_definition: 'To eat',
    part_of_speech: 'Verb-Godan',
    mora_count: 3,
    pitch_type: 'Nakadaka',
    downstep_index: 2,
  },
  {
    kanji: '飲む',
    reading: 'のむ',
    english_definition: 'To drink',
    part_of_speech: 'Verb-Godan',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '行く',
    reading: 'いく',
    english_definition: 'To go',
    part_of_speech: 'Verb-Godan',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: '来る',
    reading: 'くる',
    english_definition: 'To come',
    part_of_speech: 'Verb-Irregular',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
  {
    kanji: 'する',
    reading: 'する',
    english_definition: 'To do',
    part_of_speech: 'Verb-Irregular',
    mora_count: 2,
    pitch_type: 'Heiban',
    downstep_index: -1,
  },
];

/**
 * Generates a URL-safe slug from Japanese reading and kanji
 */
function generateSlug(reading: string, kanji: string | null): string {
  // Include kanji to make slug unique for words with same reading
  const identifier = kanji || reading;
  return `${identifier}-pitch-accent`;
}

/**
 * Seeds the database with sample data
 */
async function seedDatabase(): Promise<void> {
  console.log('Seeding KotobaFlow database...');
  console.log(`Database path: ${dbPath}`);
  
  // Initialize SQL.js
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  try {
    // Clear existing data (in reverse order of foreign key dependencies)
    console.log('🧹 Clearing existing data...');
    db.run('DELETE FROM seo_metadata');
    db.run('DELETE FROM pitch_accent');
    db.run('DELETE FROM lexicon');
    
    // Insert data
    let insertedCount = 0;
    for (const word of sampleData) {
      // Insert into lexicon
      db.run(
        `INSERT INTO lexicon (kanji, reading, english_definition, part_of_speech, mora_count)
         VALUES (?, ?, ?, ?, ?)`,
        [word.kanji, word.reading, word.english_definition, word.part_of_speech, word.mora_count]
      );
      const lexiconId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
      
      // Insert into pitch_accent
      db.run(
        `INSERT INTO pitch_accent (lexicon_id, base_pattern_type, downstep_index)
         VALUES (?, ?, ?)`,
        [lexiconId, word.pitch_type, word.downstep_index]
      );
      
      // Insert into seo_metadata
      const slug = generateSlug(word.reading, word.kanji);
      db.run(
        `INSERT INTO seo_metadata (lexicon_id, slug, search_volume_weight)
         VALUES (?, ?, ?)`,
        [lexiconId, slug, 0]
      );
      
      insertedCount++;
    }
    
    console.log(`Successfully seeded ${insertedCount} words`);
    
    // Verify the seeded data
    const lexiconCount = db.exec('SELECT COUNT(*) as count FROM lexicon')[0].values[0][0] as number;
    const pitchCount = db.exec('SELECT COUNT(*) as count FROM pitch_accent')[0].values[0][0] as number;
    const seoCount = db.exec('SELECT COUNT(*) as count FROM seo_metadata')[0].values[0][0] as number;
    
    console.log(`Database statistics:`);
    console.log(`- Lexicon entries: ${lexiconCount}`);
    console.log(`- Pitch accent entries: ${pitchCount}`);
    console.log(`- SEO metadata entries: ${seoCount}`);
    
    // Show sample query
    console.log(`\nSample query:`);
    const sample = db.exec(`
      SELECT l.*, p.base_pattern_type, p.downstep_index
      FROM lexicon l
      JOIN pitch_accent p ON l.id = p.lexicon_id
      LIMIT 1
    `);
    console.log(JSON.stringify(sample, null, 2));
    
    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`Database saved to ${dbPath}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the seeding
seedDatabase().catch(console.error);
