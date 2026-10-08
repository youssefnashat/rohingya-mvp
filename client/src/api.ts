import { useEffect, useState } from 'react';

export type Category = 'doctor' | 'pharmacy' | 'bus' | 'school' | 'housing' | 'emergency' | 'replies';

export interface Phrase {
  id: string;
  englishMeaning: string;
  category: Category;
  icon: string;
  audioUrl: string;
}

export interface EnToRohResult {
  exchangeId: string;
  englishText: string;
  phraseIds: string[];
  noMatch: boolean;
}

export interface RohToEnResult {
  exchangeId: string;
  audioUrl: string;
  englishText: string;
  confidence: number;
  lowConfidence: boolean;
}

export interface TeachRecording {
  id: string;
  promptId: string;
  audioUrl: string;
  createdAt: string;
  up: number;
  down: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return res.json();
}

const postJson = <T,>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const postAudio = <T,>(url: string, blob: Blob) =>
  request<T>(url, { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });

export const api = {
  phrases: () => request<Phrase[]>('/api/phrases'),
  sttEnglish: (blob: Blob) => postAudio<{ text: string }>('/api/stt/english', blob),
  enToRoh: (text: string) => postJson<EnToRohResult>('/api/translate/en-to-roh', { text }),
  rohToEn: (blob: Blob) => postAudio<RohToEnResult>('/api/translate/roh-to-en', blob),
  review: (exchange: unknown) => postJson<{ ok: true }>('/api/review', exchange),
  consent: (blob: Blob) => postAudio<{ consentId: string }>('/api/teach/consent', blob),
  teachSave: (blob: Blob, promptId: string, consentId: string) =>
    postAudio<TeachRecording>(`/api/teach/recordings?promptId=${promptId}&consentId=${consentId}`, blob),
  teachList: () => request<TeachRecording[]>('/api/teach/recordings'),
  vote: (id: string, vote: 'up' | 'down') => postJson<TeachRecording>(`/api/teach/recordings/${id}/vote`, { vote }),
};

let phraseCache: Promise<Phrase[]> | null = null;

export function usePhrases(): Phrase[] {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  useEffect(() => {
    phraseCache ??= api.phrases().catch((e) => {
      phraseCache = null;
      throw e;
    });
    phraseCache.then(setPhrases).catch(() => {});
  }, []);
  return phrases;
}
