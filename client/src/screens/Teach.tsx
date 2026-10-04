import { useEffect, useState } from 'react';
import { api, usePhrases, type TeachRecording } from '../api';
import { playClip, playUrl, speakEnglish, useRecorder } from '../audio';
import { MicButton, Screen } from '../components';

const CONSENT_KEY = 'teach-consent-id';
const iconButton =
  'flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-800 text-5xl active:bg-neutral-600 disabled:opacity-30';

/** Step 0: the speaker records "yes, I agree" before anything can be saved. */
function Consent({ onConsent }: { onConsent: (id: string) => void }) {
  const recorder = useRecorder();
  const [busy, setBusy] = useState(false);

  // TODO(real): consent-prompt.wav must be a Rohingya recording explaining what
  // is recorded, who hears it, and that saying "yes, I agree" gives permission.
  // Until it exists the English text is spoken instead.
  const explain = () =>
    playClip({
      audioUrl: '/audio/consent-prompt.wav',
      englishMeaning: 'Your voice will be saved to help teach this app. To agree, press the microphone and say: yes, I agree.',
    });

  const toggle = async () => {
    if (!recorder.recording) return recorder.start().catch(() => {});
    setBusy(true);
    try {
      const { consentId } = await api.consent(await recorder.stop());
      localStorage.setItem(CONSENT_KEY, consentId);
      onConsent(consentId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-9xl">🤝</div>
      <p className="text-center text-xl font-semibold">Say “Yes, I agree” to share your voice</p>
      <button aria-label="Hear the consent explanation" onClick={explain} className={iconButton}>
        🔊
      </button>
      <MicButton label="Record: yes, I agree" recording={recorder.recording} busy={busy} onClick={toggle} />
    </div>
  );
}

function Record({ consentId }: { consentId: string }) {
  const phrases = usePhrases();
  const recorder = useRecorder();
  const [index, setIndex] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string } | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const prompt = phrases[index % Math.max(phrases.length, 1)];

  const discard = () => {
    if (take) URL.revokeObjectURL(take.url);
    setTake(null);
    setState('idle');
  };

  const toggle = async () => {
    if (!recorder.recording) {
      discard();
      return recorder.start().catch(() => {});
    }
    const blob = await recorder.stop();
    setTake({ blob, url: URL.createObjectURL(blob) });
  };

  const save = async () => {
    if (!take) return;
    setState('saving');
    try {
      await api.teachSave(take.blob, prompt.id, consentId);
      setState('saved');
    } catch {
      setState('idle');
    }
  };

  if (!prompt) return null;
  return (
    <div className="flex h-full flex-col items-center justify-around gap-4">
      {/* The picture prompt; tap to hear what it means. */}
      <button
        aria-label={`Prompt: ${prompt.englishMeaning}`}
        onClick={() => speakEnglish(prompt.englishMeaning)}
        className="flex aspect-square w-3/5 flex-col items-center justify-center rounded-3xl bg-neutral-800 active:bg-neutral-700"
      >
        <span className="text-9xl">{prompt.icon}</span>
        <span className="mt-2 px-2 text-center text-xl font-semibold leading-tight">{prompt.englishMeaning}</span>
        <span className="mt-1 text-2xl">🔊</span>
      </button>

      <MicButton label="Record this phrase in Rohingya" recording={recorder.recording} busy={state === 'saving'} onClick={toggle} />

      <div className="flex gap-4">
        <button aria-label="Listen to your recording" disabled={!take} onClick={() => take && playUrl(take.url)} className={iconButton}>
          ▶️
        </button>
        <button
          aria-label="Save recording"
          disabled={!take || state !== 'idle'}
          onClick={save}
          className={`${iconButton} ${state === 'saved' ? '!bg-green-700' : ''}`}
        >
          {state === 'saved' ? '✅' : '💾'}
        </button>
        <button
          aria-label="Next picture"
          disabled={recorder.recording}
          onClick={() => {
            discard();
            setIndex((i) => i + 1);
          }}
          className={iconButton}
        >
          ➡️
        </button>
      </div>
    </div>
  );
}

/** Another speaker listens to saved recordings and votes on them. */
function Verify() {
  const phrases = usePhrases();
  const [recordings, setRecordings] = useState<TeachRecording[]>([]);

  useEffect(() => {
    api.teachList().then(setRecordings).catch(() => {});
  }, []);

  const vote = async (id: string, value: 'up' | 'down') => {
    const updated = await api.vote(id, value);
    setRecordings((list) => list.map((r) => (r.id === id ? updated : r)));
  };

  if (recordings.length === 0) {
    return <div className="flex h-full items-center justify-center text-9xl opacity-30">📭</div>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {recordings.map((r) => {
        const prompt = phrases.find((p) => p.id === r.promptId);
        return (
          <li key={r.id} className="flex items-center gap-2 rounded-3xl bg-neutral-800 p-3">
            <button
              aria-label={`Prompt: ${prompt?.englishMeaning ?? r.promptId}`}
              onClick={() => prompt && speakEnglish(prompt.englishMeaning)}
              className="w-16 text-6xl"
            >
              {prompt?.icon ?? '❔'}
            </button>
            <button aria-label="Play recording" onClick={() => playUrl(r.audioUrl)} className={`${iconButton} !bg-yellow-400`}>
              ▶️
            </button>
            <div className="flex-1" />
            <button aria-label="Good recording" onClick={() => vote(r.id, 'up')} className={`${iconButton} relative`}>
              👍<span className="absolute -top-2 -right-2 rounded-full bg-green-600 px-2 text-lg font-bold">{r.up}</span>
            </button>
            <button aria-label="Bad recording" onClick={() => vote(r.id, 'down')} className={`${iconButton} relative`}>
              👎<span className="absolute -top-2 -right-2 rounded-full bg-red-600 px-2 text-lg font-bold">{r.down}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Teach() {
  const [consentId, setConsentId] = useState(() => localStorage.getItem(CONSENT_KEY));
  const [tab, setTab] = useState<'record' | 'verify'>('record');

  return (
    <Screen icon="🎙️" title="Teach">
      <div className="flex h-full flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {(['record', 'verify'] as const).map((t) => (
            <button
              key={t}
              aria-label={t === 'record' ? 'Record' : 'Verify recordings'}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`h-16 rounded-2xl text-4xl ${tab === t ? 'bg-yellow-400' : 'bg-neutral-800'}`}
            >
              {t === 'record' ? '🎤' : '👂'}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {tab === 'verify' ? <Verify /> : consentId ? <Record consentId={consentId} /> : <Consent onConsent={setConsentId} />}
        </div>
      </div>
    </Screen>
  );
}
