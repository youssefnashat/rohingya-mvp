import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Phrase } from './providers/types';

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const RUNTIME_DIR = path.join(SERVER_DIR, 'data', 'runtime');
export const RECORDINGS_DIR = path.join(RUNTIME_DIR, 'recordings');
export const AUDIO_DIR = path.join(SERVER_DIR, 'public', 'audio');

fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });

export function loadPhrases(): Phrase[] {
  return JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'data', 'phrases.json'), 'utf8'));
}

// Tiny JSON-file "database": one array per file under data/runtime.
export function readList<T>(name: string): T[] {
  const file = path.join(RUNTIME_DIR, `${name}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
}

export function writeList<T>(name: string, items: T[]): void {
  fs.writeFileSync(path.join(RUNTIME_DIR, `${name}.json`), JSON.stringify(items, null, 2));
}

export function appendToList<T>(name: string, item: T): void {
  writeList(name, [...readList<T>(name), item]);
}

const EXTENSIONS: Record<string, string> = { webm: 'webm', mp4: 'm4a', ogg: 'ogg', wav: 'wav', mpeg: 'mp3' };

/** Saves an uploaded clip and returns its public URL. */
export function saveRecording(audio: Buffer, mimeType: string, prefix: string): string {
  const subtype = mimeType.split('/')[1]?.split(';')[0] ?? '';
  const filename = `${prefix}-${randomUUID()}.${EXTENSIONS[subtype] ?? 'webm'}`;
  fs.writeFileSync(path.join(RECORDINGS_DIR, filename), audio);
  return `/recordings/${filename}`;
}
