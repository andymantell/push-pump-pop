// Spots a newer deploy and offers a reload. The build writes version.json next to
// index.html with the same ID that's baked into this bundle as __BUILD_ID__.
declare const __BUILD_ID__: string;

const POLL_MS = 60_000;

/** Starts polling. `canShow` says whether the prompt may appear now (not mid-run). */
export function watchForUpdates(canShow: () => boolean) {
  // Drop the cache-busting ?v= left by a previous reload so the URL stays clean.
  const url = new URL(location.href);
  if (url.searchParams.has('v')) {
    url.searchParams.delete('v');
    history.replaceState(null, '', url);
  }
  if (__BUILD_ID__ === 'dev') return;

  let latest: string | null = null;
  const chip = document.createElement('button');
  chip.id = 'update';
  chip.className = 'hidden';
  chip.textContent = 'New version! Tap to reload';
  chip.addEventListener('click', () => {
    // A query string makes iOS Safari and the GitHub Pages CDN fetch a fresh
    // index.html instead of the cached one that points at the old bundle.
    const next = new URL(location.href);
    next.searchParams.set('v', latest ?? String(Date.now()));
    location.replace(next);
  });
  document.body.appendChild(chip);

  const check = async () => {
    try {
      const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { id } = await res.json();
      if (typeof id === 'string' && id !== __BUILD_ID__) latest = id;
    } catch { /* offline or mid-deploy: try again later */ }
  };
  check();
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  // Cheap check so the chip appears as soon as a run ends, and hides when one starts.
  setInterval(() => chip.classList.toggle('hidden', !latest || !canShow()), 500);
}
