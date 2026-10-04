// Every AI step in the app sits behind one of these interfaces.
// To swap in a real model: write a class implementing the interface and
// change the wiring in ./index.ts. Nothing else in the app needs to change.

export type Category =
  | 'doctor'
  | 'pharmacy'
  | 'bus'
  | 'school'
  | 'housing'
  | 'emergency'
  | 'replies';

export interface Phrase {
  id: string;
  englishMeaning: string;
  category: Category;
  icon: string;
  audioUrl: string;
  /** Only used by the mock keyword matcher. */
  keywords: string[];
}

/** English audio -> English text. */
export interface EnglishSTT {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string): Promise<{ text: string }>;
}

/** English text -> audio. `audioUrl: null` means "let the browser speak it". */
export interface EnglishTTS {
  readonly name: string;
  synthesize(text: string): Promise<{ audioUrl: string | null }>;
}

export interface RohingyaAudio {
  audio: Buffer;
  mimeType: string;
  /** Where the saved clip can be fetched from (used by the wizard helper page). */
  audioUrl: string;
}

/** Rohingya audio -> English text with a confidence in [0, 1]. */
export interface RohingyaToEnglish {
  readonly name: string;
  translate(input: RohingyaAudio): Promise<{ englishText: string; confidence: number }>;
}

/** English text -> phrase IDs from the phrase bank. Empty list + noMatch when nothing fits. */
export interface EnglishToRohingya {
  readonly name: string;
  translate(text: string, phrases: Phrase[]): Promise<{ phraseIds: string[]; noMatch: boolean }>;
}
