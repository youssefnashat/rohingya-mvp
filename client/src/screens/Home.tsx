import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { playClip } from '../audio';

const LONG_PRESS_MS = 600;

// Long-press plays the tile's spoken description: the Rohingya recording at
// `audioUrl` once it exists, the English text until then.
const TALK = { to: '/talk', label: 'Talk', audioUrl: '/audio/home-talk.wav', englishMeaning: 'Talk. Two people speak, the phone translates.' };
const TILES = [
  { to: '/phrases', icon: '🖼️', label: 'Pictures', audioUrl: '/audio/home-phrases.wav', englishMeaning: 'Picture cards. Tap a picture to say it.', color: 'bg-emerald-700' },
  { to: '/replies', icon: '👍', label: 'Replies', audioUrl: '/audio/home-replies.wav', englishMeaning: 'Quick replies for the English speaker.', color: 'bg-sky-700' },
  { to: '/teach', icon: '🎙️', label: 'Teach', audioUrl: '/audio/home-teach.wav', englishMeaning: 'Teach the app. Record your voice.', color: 'bg-purple-700' },
];

type Tile = typeof TALK;

export default function Home() {
  const navigate = useNavigate();
  const timer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  const release = () => window.clearTimeout(timer.current);
  const pressHandlers = (tile: Tile) => ({
    'aria-label': tile.englishMeaning,
    onPointerDown: () => {
      longPressed.current = false;
      timer.current = window.setTimeout(() => {
        longPressed.current = true;
        navigator.vibrate?.(30);
        playClip(tile);
      }, LONG_PRESS_MS);
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => !longPressed.current && navigate(tile.to),
  });

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3 pt-2">
        <img src="/icon.svg" alt="" className="h-11 w-11 rounded-xl" />
        <h1 className="text-2xl font-bold">Rohingya Voice</h1>
      </header>

      {/* Speaking is the main thing: one big mic takes most of the screen. */}
      <button
        {...pressHandlers(TALK)}
        className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[2.5rem] bg-neutral-900 ring-2 ring-neutral-700 transition-transform active:scale-[0.98]"
      >
        <span className="relative flex h-48 w-48 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-yellow-400/20 [animation-duration:2.5s]" />
          <span className="relative flex h-44 w-44 items-center justify-center rounded-full bg-yellow-400 text-8xl shadow-[0_0_70px_rgba(250,204,21,0.45)]">
            🎤
          </span>
        </span>
        <span className="text-4xl font-black">{TALK.label}</span>
      </button>

      <nav className="grid grid-cols-3 gap-3">
        {TILES.map((tile) => (
          <button
            key={tile.to}
            {...pressHandlers(tile)}
            className={`flex h-32 flex-col items-center justify-center gap-1 rounded-3xl transition-transform active:scale-95 ${tile.color}`}
          >
            <span className="text-5xl">{tile.icon}</span>
            <span className="text-lg font-bold">{tile.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
