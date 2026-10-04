import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function BackButton({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Back"
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-800 active:bg-neutral-600 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 12H5M11 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}

/** Screen frame: back arrow + a large icon and title identifying the screen. */
export function Screen({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col">
      <header className="flex items-center gap-4 p-3">
        <BackButton />
        <span className="text-5xl" aria-hidden>
          {icon}
        </span>
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-3 pt-0">{children}</main>
    </div>
  );
}

export function MicButton({
  recording,
  busy = false,
  onClick,
  label,
  className = '',
}: {
  recording: boolean;
  busy?: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-white text-6xl transition-transform active:scale-95 ${
        recording ? 'animate-pulse bg-red-600' : busy ? 'bg-neutral-700 opacity-60' : 'bg-yellow-400'
      } ${className}`}
    >
      {recording ? '⏹️' : busy ? '⏳' : '🎤'}
    </button>
  );
}
