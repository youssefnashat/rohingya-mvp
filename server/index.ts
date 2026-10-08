import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { providers } from './providers';
import { AUDIO_DIR, RECORDINGS_DIR, SERVER_DIR, appendToList, loadPhrases, readList, saveRecording, writeList } from './storage';

const PORT = Number(process.env.PORT ?? 3001);
/** Below this, the app plays "please repeat" instead of a translation. */
const CONFIDENCE_THRESHOLD = 0.6;

const phrases = loadPhrases();

const app = express();
app.use(express.json());
// Audio uploads arrive as the raw request body (MediaRecorder blobs).
app.use(express.raw({ type: ['audio/*', 'video/*', 'application/octet-stream'], limit: '25mb' }));
// Rohingya clips recorded by community speakers go in server/public/audio/<id>.wav.
// A missing clip is a 404; the client then speaks the English meaning instead.
app.use('/audio', express.static(AUDIO_DIR), (_req, res) => void res.sendStatus(404));
app.use('/recordings', express.static(RECORDINGS_DIR), (_req, res) => void res.sendStatus(404));

function audioBody(req: express.Request, res: express.Response): { audio: Buffer; mimeType: string } | null {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ error: 'Expected an audio request body' });
    return null;
  }
  return { audio: req.body, mimeType: req.get('content-type') ?? 'audio/webm' };
}

// ---- Phrase bank ----------------------------------------------------------

app.get('/api/phrases', (_req, res) => {
  res.json(phrases.map(({ keywords, ...p }) => p));
});

// ---- Translation ----------------------------------------------------------

app.post('/api/stt/english', async (req, res) => {
  const body = audioBody(req, res);
  if (!body) return;
  res.json(await providers.englishSTT.transcribe(body.audio, body.mimeType));
});

app.post('/api/tts/english', async (req, res) => {
  res.json(await providers.englishTTS.synthesize(String(req.body?.text ?? '')));
});

app.post('/api/translate/en-to-roh', async (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  const result = text ? await providers.englishToRohingya.translate(text, phrases) : { phraseIds: [], noMatch: true };
  res.json({ exchangeId: randomUUID(), englishText: text, ...result });
});

app.post('/api/translate/roh-to-en', async (req, res) => {
  const body = audioBody(req, res);
  if (!body) return;
  const audioUrl = saveRecording(body.audio, body.mimeType, 'talk');
  const result = await providers.rohingyaToEnglish.translate({ ...body, audioUrl });
  res.json({
    exchangeId: randomUUID(),
    audioUrl,
    ...result,
    lowConfidence: result.confidence < CONFIDENCE_THRESHOLD,
  });
});

// ---- Review queue (thumbs-down on any translation) ------------------------

app.post('/api/review', (req, res) => {
  const item = { id: randomUUID(), createdAt: new Date().toISOString(), ...req.body };
  appendToList('review-queue', item);
  res.json({ ok: true, id: item.id });
});

app.get('/api/review', (_req, res) => {
  res.json(readList('review-queue'));
});

// ---- Teach the app --------------------------------------------------------

interface Consent {
  id: string;
  audioUrl: string;
  createdAt: string;
}

interface TeachRecording {
  id: string;
  promptId: string;
  consentId: string;
  audioUrl: string;
  createdAt: string;
  up: number;
  down: number;
}

app.post('/api/teach/consent', (req, res) => {
  const body = audioBody(req, res);
  if (!body) return;
  const consent: Consent = {
    id: randomUUID(),
    audioUrl: saveRecording(body.audio, body.mimeType, 'consent'),
    createdAt: new Date().toISOString(),
  };
  appendToList('consents', consent);
  res.json({ consentId: consent.id });
});

app.post('/api/teach/recordings', (req, res) => {
  const promptId = String(req.query.promptId ?? '');
  const consentId = String(req.query.consentId ?? '');
  // Nothing is saved without a recorded voice consent on file.
  if (!readList<Consent>('consents').some((c) => c.id === consentId)) {
    return res.status(403).json({ error: 'Voice consent is required before saving recordings' });
  }
  if (!phrases.some((p) => p.id === promptId)) return res.status(400).json({ error: 'Unknown promptId' });
  const body = audioBody(req, res);
  if (!body) return;
  const recording: TeachRecording = {
    id: randomUUID(),
    promptId,
    consentId,
    audioUrl: saveRecording(body.audio, body.mimeType, `teach-${promptId}`),
    createdAt: new Date().toISOString(),
    up: 0,
    down: 0,
  };
  appendToList('teach-recordings', recording);
  res.json(recording);
});

app.get('/api/teach/recordings', (_req, res) => {
  res.json(readList<TeachRecording>('teach-recordings').map(({ consentId, ...r }) => r));
});

app.post('/api/teach/recordings/:id/vote', (req, res) => {
  const recordings = readList<TeachRecording>('teach-recordings');
  const recording = recordings.find((r) => r.id === req.params.id);
  if (!recording) return res.status(404).json({ error: 'Recording not found' });
  if (req.body?.vote === 'up') recording.up++;
  else if (req.body?.vote === 'down') recording.down++;
  else return res.status(400).json({ error: 'vote must be "up" or "down"' });
  writeList('teach-recordings', recordings);
  const { consentId, ...publicRecording } = recording;
  res.json(publicRecording);
});

// ---- Built client (production) --------------------------------------------

const clientDist = path.join(SERVER_DIR, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
