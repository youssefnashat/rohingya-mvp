import { useRef, useState } from 'react';
import { api, usePhrases } from '../api';
import { PLEASE_REPEAT, browserSttAvailable, listenEnglish, playClip, speakEnglish, useRecorder } from '../audio';
import { BackButton, MicButton } from '../components';

type Status = 'idle' | 'listening-en' | 'recording-roh' | 'busy' | 'error';

interface Exchange {
  exchangeId: string;
  direction: 'en-to-roh' | 'roh-to-en';
  englishText: string;
  /** null for en-to-roh: phrase matching has no confidence score. */
  confidence: number | null;
  /** True when "please repeat" was played instead of a translation. */
  askedToRepeat: boolean;
  phraseIds: string[];
  audioUrl?: string;
}

function ConfidenceBar({ exchange }: { exchange: Exchange | null }) {
  const confidence = exchange?.confidence ?? null;
  const level = confidence === null ? 0 : confidence < 0.6 ? 1 : confidence < 0.8 ? 2 : 3;
  const color = ['bg-neutral-700', 'bg-red-500', 'bg-yellow-400', 'bg-green-500'][level];
  return (
    <div
      className="flex flex-1 items-center gap-1.5"
      role="meter"
      aria-label="Confidence"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={confidence ?? undefined}
    >
      {[1, 2, 3].map((bar) => (
        <div key={bar} className={`h-5 flex-1 rounded-full ${bar <= level ? color : 'bg-neutral-700'}`} />
      ))}
      <span className="w-10 text-right text-2xl">{['', '🔁', '👌', '✅'][level]}</span>
    </div>
  );
}

export default function Conversation() {
  const phrases = usePhrases();
  const recorder = useRecorder();
  const [status, setStatus] = useState<Status>('idle');
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [flagged, setFlagged] = useState(false);
  const stopEnglish = useRef<(() => void) | null>(null);

  const finish = (next: Exchange) => {
    setExchange(next);
    setFlagged(false);
  };

  async function captureEnglish(): Promise<string> {
    if (browserSttAvailable()) {
      const listener = listenEnglish();
      stopEnglish.current = listener.stop;
      return listener.result;
    }
    // No Web Speech API: record and use the server's (mock) EnglishSTT.
    await recorder.start();
    return new Promise((resolve, reject) => {
      stopEnglish.current = () =>
        recorder
          .stop()
          .then((blob) => api.sttEnglish(blob))
          .then((r) => resolve(r.text), reject);
    });
  }

  async function onEnglishMic() {
    if (status === 'listening-en') return stopEnglish.current?.();
    if (status !== 'idle' && status !== 'error') return;
    try {
      setStatus('listening-en');
      const text = await captureEnglish();
      setStatus('busy');
      const result = await api.enToRoh(text);
      finish({ ...result, direction: 'en-to-roh', confidence: null, askedToRepeat: result.noMatch });
      if (result.noMatch) {
        await speakEnglish('Sorry, please say that again in simple words.');
      } else {
        for (const id of result.phraseIds) {
          const phrase = phrases.find((p) => p.id === id);
          if (phrase) await playClip(phrase);
        }
      }
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  async function onRohingyaMic() {
    try {
      if (status === 'recording-roh') {
        const blob = await recorder.stop();
        setStatus('busy');
        const result = await api.rohToEn(blob);
        finish({ ...result, direction: 'roh-to-en', askedToRepeat: result.lowConfidence, phraseIds: [] });
        if (result.lowConfidence) await playClip(PLEASE_REPEAT);
        else await speakEnglish(result.englishText);
        setStatus('idle');
      } else if (status === 'idle' || status === 'error') {
        await recorder.start();
        setStatus('recording-roh');
      }
    } catch {
      setStatus('error');
    }
  }

  async function replay() {
    if (!exchange || status !== 'idle') return;
    setStatus('busy');
    if (exchange.askedToRepeat) await playClip(PLEASE_REPEAT);
    else if (exchange.direction === 'roh-to-en') await speakEnglish(exchange.englishText);
    else for (const phrase of playedPhrases) await playClip(phrase);
    setStatus('idle');
  }

  async function flag() {
    if (!exchange || flagged) return;
    setFlagged(true);
    await api.review(exchange).catch(() => setFlagged(false));
  }

  const thumbsDown = (
    <button
      aria-label="Bad translation"
      disabled={!exchange}
      onClick={flag}
      className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl disabled:opacity-30 ${
        flagged ? 'bg-red-700' : 'bg-neutral-800 active:bg-neutral-600'
      }`}
    >
      {flagged ? '🚩' : '👎'}
    </button>
  );

  const playedPhrases = exchange?.phraseIds.map((id) => phrases.find((p) => p.id === id)).filter((p) => !!p) ?? [];
  const working = status === 'busy';

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col">
      {/* TOP HALF — rotated 180° for the English speaker sitting opposite. Text is fine here. */}
      <section className="flex flex-1 rotate-180 flex-col items-center justify-between gap-2 bg-sky-950 p-4">
        <div className="flex min-h-20 w-full flex-1 items-center justify-center text-center text-2xl font-semibold">
          {status === 'listening-en' ? (
            <span className="text-sky-300">Listening… tap to stop</span>
          ) : working ? (
            <span className="text-sky-300">Translating…</span>
          ) : status === 'error' ? (
            <span className="text-yellow-300">Something went wrong. Check the microphone and try again.</span>
          ) : !exchange ? (
            <span className="text-sky-300">Tap the mic and speak English</span>
          ) : exchange.direction === 'roh-to-en' ? (
            exchange.askedToRepeat ? (
              <span className="text-yellow-300">Not sure — they were asked to repeat</span>
            ) : (
              <span>“{exchange.englishText}”</span>
            )
          ) : exchange.askedToRepeat ? (
            <span className="text-yellow-300">
              No matching phrase for “{exchange.englishText}”. Try simpler words.
            </span>
          ) : (
            <span className="text-sky-200">
              Played: {playedPhrases.map((p) => `${p.icon} ${p.englishMeaning}`).join(' + ')}
            </span>
          )}
        </div>
        <div className="flex w-full items-center justify-between">
          {thumbsDown}
          <MicButton
            label="Speak English"
            recording={status === 'listening-en'}
            busy={working || status === 'recording-roh'}
            onClick={onEnglishMic}
          />
          <span className="w-16 text-center text-lg font-bold text-sky-300">EN</span>
        </div>
      </section>

      {/* DIVIDER — confidence indicator, plus the "call a translator" fallback. */}
      <div className="flex items-center gap-3 bg-black px-3 py-2">
        <ConfidenceBar exchange={exchange} />
        {/* ponytail: no real translator line wired up yet — placeholder until there's a number/service to call. */}
        <button
          aria-label="Call a translator"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-2xl opacity-60"
        >
          📞
        </button>
      </div>

      {/* BOTTOM HALF — the Rohingya speaker. Icons only, nothing to read. */}
      <section className="flex flex-1 flex-col items-center justify-between gap-2 bg-emerald-950 p-4">
        <div className="flex min-h-20 w-full flex-1 items-center justify-center gap-3 text-7xl">
          {status === 'error' ? (
            '⚠️'
          ) : status === 'recording-roh' ? (
            <span className="animate-pulse">👂</span>
          ) : working ? (
            <span className="animate-pulse">💭</span>
          ) : !exchange ? (
            <span className="opacity-40">🗣️</span>
          ) : exchange.direction === 'en-to-roh' ? (
            exchange.askedToRepeat ? (
              '❔'
            ) : (
              playedPhrases.map((p) => (
                <span key={p.id} className="flex flex-col items-center gap-1">
                  {p.icon}
                  <span className="text-center text-lg font-semibold leading-tight">{p.englishMeaning}</span>
                </span>
              ))
            )
          ) : exchange.askedToRepeat ? (
            '🔁'
          ) : (
            '✅'
          )}
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-2">
            <BackButton />
            {thumbsDown}
          </div>
          <MicButton
            label="Speak Rohingya"
            recording={status === 'recording-roh'}
            busy={working || status === 'listening-en'}
            onClick={onRohingyaMic}
          />
          <button
            aria-label="Play again"
            disabled={!exchange || status !== 'idle'}
            onClick={replay}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800 text-4xl active:bg-neutral-600 disabled:opacity-30"
          >
            🔊
          </button>
        </div>
      </section>
    </div>
  );
}
