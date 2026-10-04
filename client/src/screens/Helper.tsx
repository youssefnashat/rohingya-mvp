import { useEffect, useState } from 'react';
import { api, type HelperRequest } from '../api';

const POLL_MS = 1500;

// Wizard mode: a bilingual volunteer sits on this page (laptop is fine — this
// is the one screen that is text-first) and types the English for each clip.
export default function Helper() {
  const [requests, setRequests] = useState<HelperRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const poll = () =>
      api
        .helperPending()
        .then((list) => {
          setRequests(list);
          setConnected(true);
        })
        .catch(() => setConnected(false));
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const send = async (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    await api.helperAnswer(id, text).catch(() => {}); // 404 = it timed out; the poll will drop it
    setRequests((list) => list.filter((r) => r.id !== id));
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl select-text p-4">
      <h1 className="text-3xl font-bold">Helper</h1>
      <p className="mt-1 text-lg text-neutral-300">
        Listen to each Rohingya clip and type what it means in English. The speaker is waiting.
      </p>
      {!connected && <p className="mt-3 rounded-lg bg-red-800 p-3 text-lg">Cannot reach the server. Retrying…</p>}

      {requests.length === 0 ? (
        <p className="mt-10 text-center text-xl text-neutral-400">No one is waiting. New clips appear here automatically.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {requests.map((r, i) => (
            <li key={r.id} className="rounded-2xl bg-neutral-800 p-4">
              <div className="mb-2 text-sm text-neutral-400">Received {new Date(r.createdAt).toLocaleTimeString()}</div>
              <audio controls autoPlay={i === 0} src={r.audioUrl} className="w-full" />
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(r.id);
                }}
              >
                <input
                  autoFocus={i === 0}
                  value={drafts[r.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="English translation"
                  className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-xl text-black"
                />
                <button className="rounded-xl bg-yellow-400 px-6 py-3 text-xl font-bold text-black disabled:opacity-40" disabled={!drafts[r.id]?.trim()}>
                  Send
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
