import { Swipe } from './rider';

const SWIPE_DIST = 28;
const SWIPE_TIME = 450;

interface Touch { x: number; y: number; t: number; done: boolean; swiped: boolean; }

// Tap anywhere to pump; swipe to trick, and keep holding to grab.
// Keyboard: space to pump, arrows to trick (hold the key to grab).
export class Input {
  onPump: () => void = () => {};
  onSwipe: (d: Swipe) => void = () => {};
  onRelease: () => void = () => {};
  onAny: () => void = () => {};
  private touches = new Map<number, Touch>();

  constructor(el: HTMLElement) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), done: false, swiped: false });
      this.onAny();
      this.onPump();
    });
    el.addEventListener('pointermove', (e) => {
      const t = this.touches.get(e.pointerId);
      if (!t || t.done) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (performance.now() - t.t > SWIPE_TIME) { t.done = true; return; }
      if (Math.hypot(dx, dy) < SWIPE_DIST) return;
      t.done = true;
      t.swiped = true;
      if (Math.abs(dx) > Math.abs(dy)) this.onSwipe(dx > 0 ? 'right' : 'left');
      else this.onSwipe(dy > 0 ? 'down' : 'up');
    });
    const end = (e: PointerEvent) => {
      const t = this.touches.get(e.pointerId);
      this.touches.delete(e.pointerId);
      if (t?.swiped) this.onRelease();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const map: Record<string, Swipe> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
      };
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.onAny(); this.onPump(); }
      else if (map[e.code]) { e.preventDefault(); this.onAny(); this.onSwipe(map[e.code]); }
    });
    window.addEventListener('keyup', (e) => {
      if (/^(Arrow|Key[WASD])/.test(e.code)) this.onRelease();
    });
  }
}
