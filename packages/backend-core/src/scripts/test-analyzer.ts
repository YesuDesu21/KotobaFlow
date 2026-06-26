/**
 * Test script for the sentence analyzer
 * Runs the analyzeSentence function with sample Japanese text
 */

import { analyzeSentence } from '../agents';

async function testAnalyzer() {
  console.log('Testing KotobaFlow Sentence Analyzer...');
  console.log('=========================================\n');

  const testSentence = '日本語を勉強します';
  console.log(`Input sentence: ${testSentence}\n`);

  try {
    const result = await analyzeSentence({ sentence: testSentence });
    
    console.log('Analysis Result:');
    console.log('================\n');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAnalyzer();
