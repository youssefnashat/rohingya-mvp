# Rohingya Voice — MVP

A voice-first translation app for Rohingya newcomers in Canada. Rohingya has no
widely used written form, so **nothing in the app requires reading**: every
screen can be used from its icons, pictures and audio alone. Short English
labels sit under the icons as an extra, for the English speaker and for users
who are picking up some English.

This is a demo. **The Rohingya speech models are mocked.** Every AI step sits
behind a provider interface so real models can be swapped in without touching
the rest of the app.

## Run it

Requires Node.js 22+.

```bash
npm install
npm run dev
```

- App: <http://localhost:5173>
- Helper page (wizard mode): <http://localhost:5173/helper>
- API server: <http://localhost:3001>

Production-style (one server serves the API and the built app):

```bash
npm run build
npm start          # http://localhost:3001
```

### On a phone

`npm run dev` prints a Network URL (e.g. `http://192.168.x.x:5173`). The
screens load over that URL, but **browsers only allow the microphone on HTTPS or
localhost**. For mic features on a real phone, put the app behind HTTPS — the
quickest way is a tunnel to port 5173 (e.g. `cloudflared tunnel --url
http://localhost:5173` or `ngrok http 5173`). Then "Add to Home Screen" to
install it as a PWA.

## What is mocked, and what the real version would be

All providers live in [`server/providers`](server/providers) and are wired up in
[`server/providers/index.ts`](server/providers/index.ts) — that file is the one
place to change when swapping a mock for a real model.

| Provider | Current implementation | Real implementation |
| --- | --- | --- |
| **EnglishSTT** (audio → English text) | **Real**, in the browser: Web Speech API (`listenEnglish` in `client/src/audio.ts`). Browsers without it (e.g. Firefox) fall back to the server mock, which returns a canned sentence. | Groq Whisper on the server — sketch in `englishSTT.ts`. |
| **EnglishTTS** (English text → audio) | **Real**, in the browser: `speechSynthesis` (`speakEnglish` in `client/src/audio.ts`). | Optional server-side voice for devices with no usable voice — note in `englishTTS.ts`. |
| **RohingyaToEnglish** (Rohingya audio → `{ englishText, confidence }`) | **Mock**: ignores the audio, returns a random canned sentence with a random confidence between 0.3 and 1.0. **Wizard mode**: the request waits until a human on `/helper` types the translation. | A speech-translation model fine-tuned on Rohingya audio (the "Teach the app" recordings are the training data) — notes in `rohingyaToEnglish.ts`. |
| **EnglishToRohingya** (English text → phrase IDs) | **Mock**: keyword matching against each phrase's `keywords`. | An LLM (Groq) is given the phrase list and returns the best phrase IDs or `"no_match"` — full sketch in `englishToRohingya.ts`. |

Other things that are fake:

- **There is no Rohingya audio yet.** The real clips must be recorded by
  community speakers. Until a clip exists, the app **speaks the English meaning
  instead** wherever Rohingya should play (`playClip` in `client/src/audio.ts`).
  To add a real recording, put it at `server/public/audio/<id>.wav` (the path
  in the phrase's `audioUrl`) — it is picked up automatically. The same applies
  to the system clips: `please-repeat.wav`, `consent-prompt.wav` and the
  home-screen descriptions `home-talk.wav`, `home-phrases.wav`,
  `home-replies.wav`, `home-teach.wav`.

The app never *generates* Rohingya. English → Rohingya only ever selects
pre-recorded clips from the phrase bank, so a real model can fail to find a
match but cannot invent a wrong translation.

## Screens

| Route | Screen |
| --- | --- |
| `/` | **Home.** One large Talk button, with Pictures, Replies and Teach beneath it. Long-press any of them to hear what it does. |
| `/talk` | **Conversation.** Split screen; the top half is rotated 180° for the person opposite. One mic per half: tap to start, tap to stop. The bar in the middle is the confidence indicator. Under 0.6 confidence the app plays a "please repeat" clip instead of a translation. 👎 on either half sends the exchange to the review queue. 🧙 toggles wizard mode. |
| `/phrases` | **Phrase cards.** Picture cards by category. Tap = English spoken aloud, then the Rohingya clip. |
| `/replies` | **Reply cards** for the English speaker (Yes, No, Wait here, Come back tomorrow, Show your card, Please sign here) — plays the Rohingya clip. |
| `/teach` | **Teach the app.** Voice consent first (record "yes, I agree"), then picture prompts to record. The 👂 tab is the verify view: play a recording, thumbs up/down. |
| `/helper` | **Wizard mode helper.** A bilingual volunteer hears incoming Rohingya audio and types the English. |

### Trying wizard mode

1. Open `/helper` in one window.
2. Open `/talk` in another, tap 🧙 (it turns purple).
3. Record on the bottom half. The clip appears on the helper page; type a
   translation and send. The conversation screen speaks it. Human answers get
   confidence 1.0; no answer within 2 minutes counts as "please repeat".

## Data

No database — JSON files and audio under `server/data/runtime/` (git-ignored):

- `recordings/` — every uploaded clip
- `review-queue.json` — thumbs-downed exchanges (also at `GET /api/review`)
- `consents.json` — voice consent recordings
- `teach-recordings.json` — taught phrases with their vote counts

The phrase bank is [`server/data/phrases.json`](server/data/phrases.json): 42
phrases with `id`, `englishMeaning`, `category`, `icon`, `audioUrl`, and the
`keywords` used by the mock matcher.

## Known limits of this MVP

- No accounts or authentication. `/helper` and `GET /api/review` are open to
  anyone who can reach the server, and conversation recordings are stored
  unencrypted. Do not use it with real people's speech beyond a supervised demo.
- Voice consent is stored per device (`localStorage`) and there is no way to
  withdraw it or delete recordings yet.
- A verifier can vote more than once and can vote on their own recording.
- Wizard requests are held in memory and are lost if the server restarts.
- The icons are emoji and have not been tested with Rohingya speakers; some
  will not carry the intended meaning.
