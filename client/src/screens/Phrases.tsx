import { useState } from 'react';
import { usePhrases, type Category, type Phrase } from '../api';
import { playPhrase } from '../audio';
import { Screen } from '../components';

const CATEGORIES: { id: Category; icon: string; label: string }[] = [
  { id: 'doctor', icon: '🩺', label: 'Doctor' },
  { id: 'pharmacy', icon: '💊', label: 'Pharmacy' },
  { id: 'bus', icon: '🚌', label: 'Bus' },
  { id: 'school', icon: '🏫', label: 'School' },
  { id: 'housing', icon: '🏠', label: 'Housing' },
  { id: 'emergency', icon: '🚨', label: 'Urgent' },
  { id: 'replies', icon: '💬', label: 'Replies' },
];

function PhraseCard({ phrase }: { phrase: Phrase }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      onClick={async () => {
        setPlaying(true);
        await playPhrase(phrase);
        setPlaying(false);
      }}
      className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border-4 p-2 transition-transform active:scale-95 ${
        playing ? 'border-yellow-400 bg-neutral-700' : 'border-transparent bg-neutral-800'
      }`}
    >
      <span className="text-7xl">{phrase.icon}</span>
      <span className="text-center text-lg font-semibold leading-tight">{phrase.englishMeaning}</span>
    </button>
  );
}

export default function Phrases() {
  const phrases = usePhrases();
  const [category, setCategory] = useState<Category>('doctor');

  return (
    <Screen icon="🖼️" title="Pictures">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl ${
              category === c.id ? 'bg-yellow-400 text-black' : 'bg-neutral-800'
            }`}
          >
            <span className="text-4xl">{c.icon}</span>
            <span className="text-sm font-bold">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {phrases
          .filter((p) => p.category === category)
          .map((p) => (
            <PhraseCard key={p.id} phrase={p} />
          ))}
      </div>
    </Screen>
  );
}
