// Takes the home screen icon from the game itself: the skater pinned mid-Indy-grab
// over the desert-mega track. `npx vite --port 5199`, then `node art/icon/shoot.cjs`.
// Writes art/icon/frame.png (1640 square); icon.png is the 1360 crop at +280+180
// and icon-maskable.png the whole frame, both scaled to 1024, then to public/.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 820, height: 820 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:5199/');
  await p.waitForFunction(() => window.__game, null, { timeout: 60000 });
  await p.evaluate(() => {
    const g = window.__game; g.start(g.TRACKS.find(t => t.id === 'desert-mega'));
    const x = g.track.length * 0.3, y = g.track.height(x);
    const pin = () => { const r = g.rider; r.x = x; r.y = y + 2.2; r.vy = 0.5; r.vx = 9; r.grounded = false; r.airTime = 0.5; r.grab = 'Indy'; r.angle = 0.2; };
    pin(); setInterval(pin, 5);
    g.setCamera([x - 1.6, y + 1.2, 3.4], [x, y + 2.9, 0]);
  });
  await p.addStyleTag({ content: 'body > *:not(canvas){display:none!important}' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: __dirname + '/frame.png' });
  await b.close();
})();
