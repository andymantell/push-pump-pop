// Spots a newer deploy and offers a reload, listing what's new. The build writes
// version.json next to index.html with the same ID and changelog that are baked
// into this bundle, so any changelog line we don't have is news.
declare const __BUILD_ID__: string;
declare const __CHANGELOG__: { date: string; items: string[] }[];

const POLL_MS = 60_000;
const MAX_NOTES = 4;

/**
 * Starts polling. `inRun` says whether a run is on: then the prompt is a small chip,
 * and tapping it calls `leaveRun` so the notes show on the menu before reloading.
 */
export function watchForUpdates(inRun: () => boolean, leaveRun: () => void) {
  // Drop the cache-busting ?v= left by a previous reload so the URL stays clean.
  const url = new URL(location.href);
  if (url.searchParams.has('v')) {
    url.searchParams.delete('v');
    history.replaceState(null, '', url);
  }
  if (__BUILD_ID__ === 'dev') return;

  const known = new Set(__CHANGELOG__.flatMap((e) => e.items));
  let latest: string | null = null;
  let notes: string[] = [];
  let shown = '';
  let collapsed = false;
  let render = () => {};

  const box = document.createElement('div');
  box.id = 'update';
  box.className = 'hidden';
  box.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest('[data-act]')?.getAttribute('data-act');
    if (inRun()) { collapsed = false; leaveRun(); render(); return; }
    if (action === 'later') { collapsed = true; render(); return; }
    if (action !== 'reload') { collapsed = false; render(); return; }
    // A query string makes iOS Safari and the GitHub Pages CDN fetch a fresh
    // index.html instead of the cached one that points at the old bundle.
    const next = new URL(location.href);
    next.searchParams.set('v', latest ?? String(Date.now()));
    location.replace(next);
  });
  document.body.appendChild(box);

  const check = async () => {
    try {
      const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { id, changelog } = await res.json();
      if (typeof id !== 'string' || id === __BUILD_ID__) return;
      latest = id;
      if (Array.isArray(changelog)) {
        notes = changelog.flatMap((e: { items?: unknown }) => (Array.isArray(e.items) ? e.items : []))
          .filter((s: unknown): s is string => typeof s === 'string' && !known.has(s));
      }
    } catch { /* offline or mid-deploy: try again later */ }
  };
  check();
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  // In a run: a small chip up top. On menus: the notes with Reload and Later, or
  // after Later, a small pill at the bottom that opens them again.
  render = () => {
    box.classList.toggle('hidden', !latest);
    const compact = inRun();
    const key = `${compact}|${collapsed}|${notes.join('\n')}`;
    if (key === shown) return;
    shown = key;
    box.classList.toggle('compact', compact);
    box.classList.toggle('pill', !compact && collapsed);
    if (compact || collapsed) { box.innerHTML = `<b>↻ ${notes.length ? 'What’s new?' : 'Update'}</b>`; return; }
    const more = notes.length - MAX_NOTES;
    box.innerHTML = '<b>New version!</b>'
      + (notes.length ? `<ul>${notes.slice(0, MAX_NOTES).map((n) => `<li>${esc(n)}</li>`).join('')}${more > 0 ? `<li class="more">and ${more} more</li>` : ''}</ul>` : '')
      + '<div class="acts"><button data-act="reload">RELOAD</button><button data-act="later" class="alt">LATER</button></div>';
  };
  // Cheap check so the prompt follows runs starting and ending.
  setInterval(render, 500);
}
