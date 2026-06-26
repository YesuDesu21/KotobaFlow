/**
 * Pitch Accent Static Dataset
 *
 * Provides sample Japanese words with pitch accent data for the
 * Programmatic SEO pages. This is a static stand-in until the
 * production build pipeline connects to linguistics.db.
 *
 * To expand: add more entries or replace with a build-time
 * SQLite query that generates this array automatically.
 */

export interface PitchAccentEntry {
  /** Kanji/reading surface form */
  word: string;
  /** Hiragana reading */
  reading: string;
  /** English gloss */
  definition: string;
  /** Grammatical category — Noun, Verb, Adjective */
  partOfSpeech: string;
  /** Number of morae in the word */
  moraCount: number;
  /** Pitch pattern type name */
  pitchPattern: string;
  /** H/L sequence — one entry per mora */
  sequence: ('H' | 'L')[];
}

export const pitchAccentData: PitchAccentEntry[] = [
  { word: '日本', reading: 'にほん', definition: 'Japan', partOfSpeech: 'Noun', moraCount: 3, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L'] },
  { word: '東京', reading: 'とうきょう', definition: 'Tokyo', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '日本語', reading: 'にほんご', definition: 'Japanese language', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '勉強', reading: 'べんきょう', definition: 'study', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '食べる', reading: 'たべる', definition: 'to eat', partOfSpeech: 'Verb', moraCount: 3, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L'] },
  { word: '飲む', reading: 'のむ', definition: 'to drink', partOfSpeech: 'Verb', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '書く', reading: 'かく', definition: 'to write', partOfSpeech: 'Verb', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '話す', reading: 'はなす', definition: 'to speak', partOfSpeech: 'Verb', moraCount: 3, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L'] },
  { word: '読む', reading: 'よむ', definition: 'to read', partOfSpeech: 'Verb', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '見る', reading: 'みる', definition: 'to see', partOfSpeech: 'Verb', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '美味しい', reading: 'おいしい', definition: 'delicious', partOfSpeech: 'Adjective', moraCount: 4, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L', 'L'] },
  { word: '楽しい', reading: 'たのしい', definition: 'fun', partOfSpeech: 'Adjective', moraCount: 4, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L', 'L'] },
  { word: '大きい', reading: 'おおきい', definition: 'big', partOfSpeech: 'Adjective', moraCount: 4, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L', 'L'] },
  { word: '小さい', reading: 'ちいさい', definition: 'small', partOfSpeech: 'Adjective', moraCount: 4, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L', 'L'] },
  { word: '新しい', reading: 'あたらしい', definition: 'new', partOfSpeech: 'Adjective', moraCount: 5, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L', 'L', 'L'] },
  { word: '先生', reading: 'せんせい', definition: 'teacher', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '学生', reading: 'がくせい', definition: 'student', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '学校', reading: 'がっこう', definition: 'school', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Nakadaka', sequence: ['L', 'H', 'L', 'L'] },
  { word: '天気', reading: 'てんき', definition: 'weather', partOfSpeech: 'Noun', moraCount: 3, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L'] },
  { word: '天気予報', reading: 'てんきよほう', definition: 'weather forecast', partOfSpeech: 'Noun', moraCount: 6, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L', 'L', 'L'] },
  { word: '猫', reading: 'ねこ', definition: 'cat', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '犬', reading: 'いぬ', definition: 'dog', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '魚', reading: 'さかな', definition: 'fish', partOfSpeech: 'Noun', moraCount: 3, pitchPattern: 'Atamadaka', sequence: ['H', 'L', 'L'] },
  { word: '花', reading: 'はな', definition: 'flower', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '山', reading: 'やま', definition: 'mountain', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '川', reading: 'かわ', definition: 'river', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '海', reading: 'うみ', definition: 'sea', partOfSpeech: 'Noun', moraCount: 2, pitchPattern: 'Atamadaka', sequence: ['H', 'L'] },
  { word: '会社', reading: 'かいしゃ', definition: 'company', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '病院', reading: 'びょういん', definition: 'hospital', partOfSpeech: 'Noun', moraCount: 4, pitchPattern: 'Heiban', sequence: ['H', 'L', 'L', 'L'] },
  { word: '図書館', reading: 'としょかん', definition: 'library', partOfSpeech: 'Noun', moraCount: 5, pitchPattern: 'Nakadaka', sequence: ['L', 'H', 'H', 'L', 'L'] },
];

/**
 * Look up a word in the static pitch accent dataset.
 * Used by the [word] ISR page to render per-word data.
 */
export function getWordData(word: string): PitchAccentEntry | undefined {
  return pitchAccentData.find(e => e.word === word);
}

/**
 * Return up to 4 related words of the same part of speech.
 * Used in the "Related Words" section of the word detail page
 * for internal linking / SEO.
 */
export function getRelatedWords(word: string): PitchAccentEntry[] {
  const entry = getWordData(word);
  if (!entry) return [];
  return pitchAccentData
    .filter(e => e.word !== word && e.partOfSpeech === entry.partOfSpeech)
    .slice(0, 4);
}
