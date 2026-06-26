/**
 * KotobaFlow Genkit Server
 * Entry point for Genkit Developer UI
 */

import { analyzeSentence } from './agents';
import { queryDictionaryData, fetchMinimalPairs } from './mcp/server';

// Export flows for Genkit to discover
export { analyzeSentence };

// Export MCP tools for Genkit to discover
export { queryDictionaryData, fetchMinimalPairs };

console.log('KotobaFlow Genkit Server loaded');
console.log('Flow registered: analyzeSentence');
console.log('Tools registered: query_dictionary_data, fetch_minimal_pairs');
