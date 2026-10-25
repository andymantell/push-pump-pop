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
