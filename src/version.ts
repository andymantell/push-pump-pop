// Spots a newer deploy and offers a reload, listing what's new. The build writes
// version.json next to index.html with the same ID and changelog that are baked
// into this bundle, so any changelog line we don't have is news.
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;
declare const __CHANGELOG__: { date: string; items: string[] }[];

const POLL_MS = 60_000;
const MAX_NOTES = 4;
/** sessionStorage key holding how many reloads we've tried to reach the latest build. */
const TRIES_KEY = 'push-pump-pop-reload-tries';
const MAX_TRIES = 3;
/** A new build must stay the newest this long before we offer it, so a burst of deploys prompts once. */
const SETTLE_MS = 90_000;

async function fetchVersion(): Promise<{ id?: unknown; changelog?: unknown } | null> {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch { return null; } // offline or mid-deploy: try again later
}

/** Reloads onto `id`, clearing anything that could hand back the old page first. */
async function reloadTo(id: string, tries: number) {
  try { sessionStorage.setItem(TRIES_KEY, String(tries)); } catch { /* storage unavailable */ }
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch { /* nothing to clear */ }
  // A fresh query string makes iOS Safari and the GitHub Pages CDN fetch a new
  // index.html instead of a cached one that points at the old bundle.
  const next = new URL(location.href);
  next.searchParams.set('v', `${id}-${tries}-${Date.now().toString(36)}`);
  location.replace(next);
}

/** Which build a fresh copy of index.html would give us right now (from its build-id meta tag). */
async function servedBuild(): Promise<string | null> {
  try {
    const res = await fetch(`./?v=probe-${Date.now().toString(36)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.text()).match(/<meta name="build-id" content="([^"]+)"/)?.[1] ?? null;
  } catch { return null; }
}

function readTries(): number {
  try { return Number(sessionStorage.getItem(TRIES_KEY)) || 0; } catch { return 0; }
}

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

  // Small version label on the title screen, so you can tell which build you have.
  const label = document.createElement('div');
  label.id = 'buildinfo';
  const built = new Date(__BUILD_TIME__);
  label.textContent = `Version ${__BUILD_ID__.slice(0, 7)} \u00b7 ${built.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
  const title = document.getElementById('title');

  // "What's new" on the title screen always lists the latest release notes.
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const news = document.createElement('div');
  news.id = 'whatsnew';
  news.className = 'panel hidden';
  news.innerHTML = '<h2>WHAT\u2019S NEW</h2><div class="guide">'
    + __CHANGELOG__.slice(0, 5).map((e) => `<section><h3>${esc(new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }))}</h3><ul>${e.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')
    + '</div><button class="small">BACK</button>';
  news.querySelector('button')!.addEventListener('click', () => { news.classList.add('hidden'); title?.classList.remove('hidden'); });
  document.body.appendChild(news);
  const newsBtn = document.createElement('button');
  newsBtn.className = 'small alt';
  newsBtn.textContent = 'WHAT\u2019S NEW';
  newsBtn.addEventListener('click', () => { news.classList.remove('hidden'); title?.classList.add('hidden'); });
  title?.append(newsBtn, label);
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
    box.innerHTML = '<b>Reloading\u2026</b>';
    reloadTo(latest ?? 'latest', 1);
  });
  document.body.appendChild(box);

  let candidate: string | null = null;
  let candidateSince = 0;
  const check = async () => {
    const v = await fetchVersion();
    if (!v || typeof v.id !== 'string' || v.id === __BUILD_ID__ || v.id === latest) return;
    // Wait for the deploy to settle, then only offer it once a reload would really
    // load it, so the button never shows for a build we can't get yet.
    if (v.id !== candidate) { candidate = v.id; candidateSince = Date.now(); }
    if (Date.now() - candidateSince < SETTLE_MS) { setTimeout(check, SETTLE_MS); return; }
    if (await servedBuild() !== v.id) return;
    latest = v.id;
    if (Array.isArray(v.changelog)) {
      notes = v.changelog.flatMap((e: { items?: unknown }) => (Array.isArray(e.items) ? e.items : []))
        .filter((s: unknown): s is string => typeof s === 'string' && !known.has(s));
    }
  };

  // Just reloaded for an update: make sure it took. If we still have an old build,
  // try again with a new URL; if it worked, say so.
  const tries = readTries();
  if (tries > 0) {
    fetchVersion().then((v) => {
      const id = typeof v?.id === 'string' ? v.id : null;
      if (id && id !== __BUILD_ID__ && tries < MAX_TRIES) { reloadTo(id, tries + 1); return; }
      try { sessionStorage.removeItem(TRIES_KEY); } catch { /* storage unavailable */ }
      if (id === __BUILD_ID__) {
        const done = document.createElement('div');
        done.id = 'updated';
        done.textContent = '\u2713 Updated to the latest version';
        document.body.appendChild(done);
        setTimeout(() => done.remove(), 4000);
      }
    });
  }
  check();
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });

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
