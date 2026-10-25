// Installs the service worker (public/sw.js) so the game can go on the home
// screen and start offline. Built games only: in dev it would cache stale code.
declare const __BUILD_ID__: string;

export function registerOffline() {
  if (__BUILD_ID__ === 'dev' || !('serviceWorker' in navigator)) return;
  const go = () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => { /* not installable here */ });
  // After the page has loaded, so it doesn't compete with the first download.
  if (document.readyState === 'complete') go();
  else addEventListener('load', go);
}

/**
 * Asks the browser not to clear saved progress on its own. Safari and Chrome
 * mostly grant this to installed home screen apps, so only ask there (other
 * browsers may pop up a question).
 */
export function keepSaves() {
  const installed = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed) navigator.storage?.persist?.().catch(() => { /* best effort */ });
}
