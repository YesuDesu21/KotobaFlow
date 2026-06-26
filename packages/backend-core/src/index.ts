/**
 * KotobaFlow Backend Core — Entry Point
 *
 * Re-exports the Genkit flow and API server for external consumption.
 * Serves as the documented "Core API Gateway / Serverless entry point"
 * per the README architecture blueprint.
 */

export { analyzeSentence } from './agents';
export { queryDictionaryData, fetchMinimalPairs } from './mcp/server';
export { startServer } from './api-server';