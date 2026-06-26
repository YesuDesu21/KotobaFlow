import 'dotenv/config';
import { genkit } from 'genkit';

// Centralized System Orchestrator Instance
// Note: LLM provider is temporarily switched to Groq (llama3-70b-8192)
// due to Google AI Studio free tier quota exhaustion. The tokenizer
// calls Groq's API directly. When switching back to Gemini, re-enable
// the googleAI plugin and revert tokenizer.ts to use ai.generate().
export const ai = genkit({
  plugins: [],
});
