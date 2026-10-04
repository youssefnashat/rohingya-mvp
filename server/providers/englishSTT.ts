import type { EnglishSTT } from './types';

const CANNED = [
  'Do you have your health card?',
  'Please wait here.',
  'Where is the pain?',
  'Come back tomorrow.',
  'Which bus do you need?',
];

/**
 * MOCK. Ignores the audio and returns a canned English sentence.
 *
 * The app normally does NOT hit this: the client uses the browser Web Speech
 * API (client/src/audio.ts -> listenEnglish) which is a real implementation.
 * This mock is only the fallback for browsers without SpeechRecognition
 * (Firefox, some in-app browsers).
 */
export class MockEnglishSTT implements EnglishSTT {
  readonly name = 'mock';
  async transcribe(): Promise<{ text: string }> {
    return { text: CANNED[Math.floor(Math.random() * CANNED.length)] };
  }
}

// TODO(real): Groq Whisper. Roughly:
//
// export class GroqWhisperSTT implements EnglishSTT {
//   readonly name = 'groq-whisper';
//   async transcribe(audio: Buffer, mimeType: string) {
//     const form = new FormData();
//     form.append('file', new Blob([audio], { type: mimeType }), 'audio.webm');
//     form.append('model', 'whisper-large-v3-turbo');
//     form.append('language', 'en');
//     const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
//       body: form,
//     });
//     const json = await res.json();
//     return { text: json.text };
//   }
// }
