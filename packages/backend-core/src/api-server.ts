import express from 'express';
import cors from 'cors';
import { analyzeSentence } from './agents';

const app = express();
const PORT = 4000;
const REQUEST_TIMEOUT_MS = 25_000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Enforce request timeout to prevent hanging connections
app.use((_req, res, next) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

app.post('/api/flow/analyzeSentence', async (req, res) => {
  try {
    const result = await analyzeSentence(req.body);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[KotobaFlow] Flow error:', message);
    res.status(500).json({ error: message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`KotobaFlow API server running on http://localhost:${PORT}`);
    console.log('Flow: POST /api/flow/analyzeSentence');
  });
}

// Auto-start when run directly (not when imported as module)
if (require.main === module) {
  startServer();
}
