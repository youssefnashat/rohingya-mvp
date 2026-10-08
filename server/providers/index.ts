// Provider wiring. This is the one place to change when swapping a mock for a
// real model.
import { MockEnglishSTT } from './englishSTT';
import { BrowserEnglishTTS } from './englishTTS';
import { KeywordEnglishToRohingya } from './englishToRohingya';
import { MockRohingyaToEnglish } from './rohingyaToEnglish';
import type { EnglishSTT, EnglishTTS, EnglishToRohingya, RohingyaToEnglish } from './types';

export const providers: {
  englishSTT: EnglishSTT;
  englishTTS: EnglishTTS;
  englishToRohingya: EnglishToRohingya;
  rohingyaToEnglish: RohingyaToEnglish;
} = {
  englishSTT: new MockEnglishSTT(),
  englishTTS: new BrowserEnglishTTS(),
  englishToRohingya: new KeywordEnglishToRohingya(),
  rohingyaToEnglish: new MockRohingyaToEnglish(),
};

export * from './types';
