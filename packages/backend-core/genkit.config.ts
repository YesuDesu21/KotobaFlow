import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Centralized System Orchestrator Instance
export const ai = genkit({
  plugins: [
    googleAI() // Configures standard access to Gemini 1.5 Flash
  ],
});