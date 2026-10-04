import { randomUUID } from 'node:crypto';
import type { RohingyaAudio, RohingyaToEnglish } from './types';

const CANNED = [
  'I need to see a doctor.',
  'My child has a fever.',
  'Where is the bus stop?',
  'I do not understand.',
  'I need this medicine.',
  'The heating in my apartment is not working.',
  'I want to register my child for school.',
  'Thank you.',
  'I have pain in my stomach.',
  'How much does it cost?',
];

/**
 * MOCK. Ignores the audio. Returns a random canned sentence with a random
 * confidence in [0.3, 1.0], so roughly 4 in 10 attempts fall under the 0.6
 * threshold and trigger the "please repeat" path.
 */
export class MockRohingyaToEnglish implements RohingyaToEnglish {
  readonly name = 'mock';
  async translate(): Promise<{ englishText: string; confidence: number }> {
    await new Promise((r) => setTimeout(r, 600)); // feel like a model call
    return {
      englishText: CANNED[Math.floor(Math.random() * CANNED.length)],
      confidence: Math.round((0.3 + Math.random() * 0.7) * 100) / 100,
    };
  }
}

export interface WizardRequest {
  id: string;
  audioUrl: string;
  createdAt: string;
}

/**
 * WIZARD MODE ("Wizard of Oz"). The request is parked until a bilingual human
 * on the /helper page types the English translation. A human answer is
 * returned with confidence 1; a timeout returns confidence 0, which the app
 * treats as "please repeat".
 */
export class WizardRohingyaToEnglish implements RohingyaToEnglish {
  readonly name = 'wizard';
  private pending = new Map<
    string,
    { request: WizardRequest; resolve: (r: { englishText: string; confidence: number }) => void }
  >();

  constructor(private timeoutMs = 120_000) {}

  translate(input: RohingyaAudio): Promise<{ englishText: string; confidence: number }> {
    const id = randomUUID();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ englishText: '', confidence: 0 });
      }, this.timeoutMs);
      this.pending.set(id, {
        request: { id, audioUrl: input.audioUrl, createdAt: new Date().toISOString() },
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
      });
    });
  }

  listPending(): WizardRequest[] {
    return [...this.pending.values()].map((p) => p.request);
  }

  /** Returns false if the request is unknown (already answered or timed out). */
  answer(id: string, englishText: string): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    this.pending.delete(id);
    entry.resolve({ englishText, confidence: 1 });
    return true;
  }
}

// TODO(real): a Rohingya speech model. There is no off-the-shelf Rohingya ASR,
// so the realistic path is a fine-tuned speech-translation model (e.g. Whisper
// or MMS fine-tuned on the recordings collected by the "Teach the app" screen,
// with the English prompt as the target text). It would:
//   1. take `input.audio`,
//   2. return the decoded English text,
//   3. return a real confidence (e.g. exp(mean token log-prob)).
// Until that exists, wizard mode is how real conversations get through.
