import type { EnglishTTS } from './types';

/**
 * REAL (in the browser). The server returns no audio; the client speaks the
 * text with window.speechSynthesis (client/src/audio.ts -> speakEnglish).
 */
export class BrowserEnglishTTS implements EnglishTTS {
  readonly name = 'browser-speechSynthesis';
  async synthesize(): Promise<{ audioUrl: string | null }> {
    return { audioUrl: null };
  }
}

// TODO(real, optional): a server-side voice (e.g. Groq / any TTS API) for
// devices with no usable speechSynthesis voice. Synthesize to a file under
// server/public/audio/tts/ and return its URL as `audioUrl`; the client
// already plays `audioUrl` when it is non-null.
