# Rohingya Voice — MVP

A voice-first translation app for Rohingya newcomers in Canada. Rohingya has no
widely used written form, so the app never requires reading: every screen works
from icons and audio, with short English labels as an extra.

**This is a demo.** There is no Rohingya audio or Rohingya speech model yet —
wherever Rohingya should play, the app speaks the English meaning instead.

## Features

- **Talk** — split-screen conversation, top half flipped for the person
  opposite. Each side has one mic. A confidence bar shows how sure the
  translation is; when it is unsure, the app asks the speaker to repeat instead
  of guessing.
- **Pictures** — 42 picture cards for the doctor, pharmacy, bus, school,
  housing and urgent situations. Tap a card to say it aloud.
- **Replies** — quick answers for the English speaker (Yes, No, Wait here,
  Come back tomorrow, Show your card, Please sign here).
- **Teach** — community speakers record phrases in Rohingya after giving
  spoken consent; other speakers listen and vote thumbs up or down.
- **Helper** (`/helper`) — a bilingual volunteer hears a Rohingya clip and
  types the English, so real conversations work before any model exists.
- **Thumbs-down** on any translation sends it to a review queue.

## How the technical side is planned to work

**English → Rohingya (buildable now)**

1. The phone records the English speaker.
2. A speech-to-text model turns it into English text.
3. An LLM picks the closest phrases from the phrase bank, or says "no match".
4. The phone plays those phrases, recorded by community speakers.

The app only ever plays human recordings; it never generates Rohingya. It can
fail to find a match, but it cannot invent a wrong translation.

**Rohingya → English (the hard part)**

No existing model understands spoken Rohingya, so this comes in stages:

1. **Human helpers** translate live through the Helper page.
2. **Every clip they translate, and every Teach recording, becomes training
   data.**
3. **A speech model is trained** on that data once there is enough of it.
4. **Hybrid:** the model answers when confident; unsure clips go to a human.

**Planned stack**

| Piece | Today (demo) | Planned |
| --- | --- | --- |
| App | React web app, installable on a phone | Same |
| Server | Node + Express | Same, plus live updates for helpers |
| Data | JSON files | Postgres + private audio storage |
| English speech-to-text | Browser built-in | Hosted Whisper |
| English → phrases | Keyword matching | LLM choosing from the phrase bank |
| Rohingya → English | Random canned sentence, or a human helper | Human helpers, then our own trained model |
| Rohingya audio | English voice as a stand-in | Recordings by community speakers |

Each AI step is a swappable module in `server/providers`, so a real model
replaces a mock without changing the rest of the app.

**Before real use:** accounts for helpers, encrypted storage in Canada, a way
to withdraw consent and delete recordings, and a community partner to supply
speakers and helpers.

## Run it

Requires Node.js 22+.

```bash
npm install
npm run dev
```

- App: <http://localhost:5173>
- Helper page: <http://localhost:5173/helper>

To try the helper flow, open `/helper` in one window, then on the Talk screen
tap 🧙 and record on the bottom half.

On a phone, the microphone only works over HTTPS, so use a tunnel such as
`ngrok http 5173`.
