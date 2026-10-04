// Provider wiring. This is the one place to change when swapping a mock for a
// real model.
import { MockEnglishSTT } from './englishSTT';
import { BrowserEnglishTTS } from './englishTTS';
import { KeywordEnglishToRohingya } from './englishToRohingya';
import { MockRohingyaToEnglish, WizardRohingyaToEnglish } from './rohingyaToEnglish';
import type { EnglishSTT, EnglishTTS, EnglishToRohingya, RohingyaToEnglish } from './types';

export type RohingyaMode = 'mock' | 'wizard';

export const wizard = new WizardRohingyaToEnglish();

export const providers: {
  englishSTT: EnglishSTT;
  englishTTS: EnglishTTS;
  englishToRohingya: EnglishToRohingya;
  rohingyaToEnglish: Record<RohingyaMode, RohingyaToEnglish>;
} = {
  englishSTT: new MockEnglishSTT(),
  englishTTS: new BrowserEnglishTTS(),
  englishToRohingya: new KeywordEnglishToRohingya(),
  rohingyaToEnglish: {
    mock: new MockRohingyaToEnglish(),
    wizard,
  },
};

export * from './types';
