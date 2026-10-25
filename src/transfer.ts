// Moves progress between copies of the game that don't share storage, like Safari
// and the home screen app on an iPad. One copy turns its saved keys into a code,
// the other merges the code in, keeping the better of each.

export interface KeyStore {
  readonly length: number;
  key(i: number): string | null;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const PREFIX = 'push-pump-pop-';
const TAG = 'PUSHPUMPPOP:';
/** Per-device bookkeeping that shouldn't travel. */
const LOCAL = ['last-build', 'reload-tries'];

function saved(store: KeyStore): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    const name = k.slice(PREFIX.length);
    if (LOCAL.includes(name)) continue;
    const v = store.getItem(k);
    if (v !== null) out.set(name, v);
  }
  return out;
}

/** True once any track has been finished. */
export function hasProgress(store: KeyStore): boolean {
  return [...saved(store).keys()].some((k) => k.startsWith('done-') || k.startsWith('best-'));
}

export function exportCode(store: KeyStore): string {
  return TAG + btoa(JSON.stringify(Object.fromEntries(saved(store))));
}

/** Merges a code into `store`. Returns how many tracks it had, or -1 if it isn't a code. */
export function importCode(store: KeyStore, text: string): number {
  const at = text.indexOf(TAG);
  if (at < 0) return -1;
  let data: Record<string, unknown>;
  try { data = JSON.parse(atob(text.slice(at + TAG.length).trim().split(/\s/)[0])); } catch { return -1; }
  if (!data || typeof data !== 'object') return -1;
  let tracks = 0;
  for (const [name, v] of Object.entries(data)) {
    if (typeof v !== 'string' || LOCAL.includes(name)) continue;
    const k = PREFIX + name;
    const have = store.getItem(k);
    let next = v;
    if (name.startsWith('best-')) { tracks++; next = String(Math.max(Number(have) || 0, Number(v) || 0)); }
    else if (name.startsWith('ch-') && have) {
      // Challenges done in either copy stay done.
      next = Array.from({ length: Math.max(have.length, v.length) }, (_, i) => (have[i] === '1' || v[i] === '1' ? '1' : '0')).join('');
    } else if (have !== null && v !== '1') next = have; // flags only switch on; settings keep this copy's
    store.setItem(k, next);
  }
  return tracks;
}
