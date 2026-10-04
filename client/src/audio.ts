import { useCallback, useRef, useState } from 'react';
import type { Phrase } from './api';

/** A Rohingya recording plus the English it means. */
export interface Clip {
  audioUrl: string;
  englishMeaning: string;
}

export const PLEASE_REPEAT: Clip = { audioUrl: '/audio/please-repeat.wav', englishMeaning: 'Please say that again.' };

// ---- Playback -------------------------------------------------------------

let current: HTMLAudioElement | null = null;

/** Plays a clip. Resolves true when it finishes, false if it is missing or cannot play. */
export function playUrl(url: string): Promise<boolean> {
  current?.pause();
  return new Promise((resolve) => {
    const audio = new Audio(url);
    current = audio;
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

/**
 * Plays the Rohingya recording. PLACEHOLDER: until community speakers have
 * recorded it, the English meaning is spoken instead.
 */
export async function playClip(clip: Clip): Promise<void> {
  if (!(await playUrl(clip.audioUrl))) await speakEnglish(clip.englishMeaning);
}

// ---- EnglishTTS: real implementation, browser speechSynthesis ---------------

export function speakEnglish(text: string): Promise<void> {
  if (!('speechSynthesis' in window) || !text) return Promise.resolve();
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-CA';
    utterance.rate = 0.9;
    utterance.onend = utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

/** Tap on a phrase card: say the English aloud, then play the Rohingya clip. */
export async function playPhrase(phrase: Phrase): Promise<void> {
  await speakEnglish(phrase.englishMeaning);
  await playUrl(phrase.audioUrl);
}

// ---- EnglishSTT: real implementation, browser Web Speech API ----------------

function recognitionCtor(): (new () => any) | undefined {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const browserSttAvailable = () => !!recognitionCtor();

/** One utterance of English. Resolves with '' if nothing was recognised. */
export function listenEnglish(): { result: Promise<string>; stop: () => void } {
  const recognition = new (recognitionCtor()!)();
  recognition.lang = 'en-CA';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  const result = new Promise<string>((resolve) => {
    let text = '';
    recognition.onresult = (event: any) => {
      text = event.results[0][0].transcript;
    };
    recognition.onerror = () => resolve(text);
    recognition.onend = () => resolve(text);
  });
  recognition.start();
  return { result, stop: () => recognition.stop() };
}

// ---- Recording (MediaRecorder) --------------------------------------------

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const session = useRef<{ recorder: MediaRecorder; chunks: Blob[]; stream: MediaStream } | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.start();
    session.current = { recorder, chunks, stream };
    setRecording(true);
  }, []);

  const stop = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        const s = session.current;
        if (!s) return reject(new Error('Not recording'));
        s.recorder.onstop = () => {
          s.stream.getTracks().forEach((t) => t.stop());
          session.current = null;
          setRecording(false);
          resolve(new Blob(s.chunks, { type: s.recorder.mimeType || 'audio/webm' }));
        };
        s.recorder.stop();
      }),
    [],
  );

  return { recording, start, stop };
}
