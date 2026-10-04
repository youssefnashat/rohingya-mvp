import { usePhrases } from '../api';
import { playClip } from '../audio';
import { Screen } from '../components';

// For the English speaker, so text labels are fine here. Order matters: the
// most common replies come first.
const REPLY_IDS = ['rep-yes', 'rep-no', 'rep-wait', 'rep-tomorrow', 'rep-card', 'rep-sign'];

export default function Replies() {
  const phrases = usePhrases();
  const replies = REPLY_IDS.map((id) => phrases.find((p) => p.id === id)).filter((p) => !!p);

  return (
    <Screen icon="👍" title="Replies">
      <div className="grid grid-cols-2 gap-3">
        {replies.map((p) => (
          // The English speaker already knows what they tapped: play only the Rohingya clip.
          <button
            key={p.id}
            onClick={() => playClip(p)}
            className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl bg-neutral-800 p-3 transition-transform active:scale-95 active:bg-neutral-600"
          >
            <span className="text-6xl">{p.icon}</span>
            <span className="text-center text-xl font-bold leading-tight">{p.englishMeaning}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
