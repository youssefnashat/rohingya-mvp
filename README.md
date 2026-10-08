# Rohingya Voice MVP

A voice-first translation app for Rohingya newcomers in Canada.

**This is a demo.** There is no Rohingya audio or Rohingya speech model yet.
Wherever Rohingya should play, the app speaks the English meaning instead.

## Features

- **Talk**: split-screen conversation, top half flipped for the person
  opposite. Each side has one mic. A confidence bar shows how sure the
  translation is. When it is unsure, the app asks the speaker to repeat instead
  of guessing. If the app is not working at all, pressing the phone icon calls
  a translator.
- **Pictures**: 42 picture cards for the doctor, pharmacy, bus, school,
  housing and urgent situations. Tap a card to say it aloud.
- **Replies**: quick answers for the English speaker (Yes, No, Wait here,
  Come back tomorrow, Show your card, Please sign here).
- **Teach**: community speakers record phrases in Rohingya after giving
  spoken consent; other speakers listen and vote thumbs up or down. This is
  how the app collects data to improve its translations.
- **Thumbs-down**: on any translation sends it to a review queue.

Various other features could be added to this app later on.

## How the technical side is planned to work

**English → Rohingya**

1. The phone records the English speaker.
2. A speech-to-text model (such as Whisper) turns it into English text.
3. An LLM matches it to a phrase in the phrase bank.
   - **Match:** the phone plays the human recording.
   - **No match:** it converts the Rohingya spelling to sounds and plays a
     phonetic TTS voice.

Important phrases (medical, emergency, legal) are always played from human
recordings. For anything else, the app can fall back to a phonetic voice,
which may be less accurate and is marked as such.

**Rohingya → English**

No existing model understands spoken Rohingya, so this comes in stages:

1. **Picture cards first.** Until a model exists, the Rohingya speaker taps
   picture cards instead of speaking.
2. **Teach recordings become training data.** Each recording is labelled in
   the book's spelling plus English. Prompts start with the book's words and
   sentences.
3. **Two models are trained** once there is enough data. A speech model turns
   the audio into Rohingya spelling, then a translation model turns that into
   English.
4. **Confidence check:** the models answer when confident; when unsure, the
   app asks the speaker to repeat or shows picture cards.

## Rohingya spelling

Rohingya has a Latin writing system called **Rohingyalish**. Most of the
community can't read it, but it spells words the way they sound.

Reference: [Rohingya Language Book 2](https://www.rohingyalanguage.com/wp-content/uploads/2018/10/Rohingya-Language-Book-2-V1.00-High.pdf)

- Users never see it. The app stays voice and picture only.
- It's the middle step from Rohingya voice → Rohingyalish → English text →
  English voice.

## Planned stack

| Piece | Today (demo) | Planned |
| --- | --- | --- |
| App | React web app, installable on a phone | Same |
| Server | Node + Express | Same |
| Data | JSON files | Postgres + private audio storage |
| English speech-to-text | Browser built-in | Hosted Whisper |
| English → phrases | Keyword matching | LLM choosing from the phrase bank |
| Rohingya → English | Random canned sentence | Our own trained models |
| Rohingya audio | English voice as a stand-in | Recordings by community speakers |


## Run it
Currently runs on web browser.
Requires Node.js 22+.

```bash
npm install
npm run dev
```

App: <http://localhost:5173>
