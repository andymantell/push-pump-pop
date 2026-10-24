import { Swipe, Lean } from './rider';

const SWIPE_DIST = 28;
const SWIPE_TIME = 450;
/** Swipes starting in this bottom share of the screen are spins. */
const SPIN_ZONE = 0.35;
/** A spin swipe this long (share of screen width) becomes a 360. */
const SPIN_360 = 0.2;

interface Touch { x: number; y: number; t: number; done: boolean; swiped: boolean; spin: boolean; }

// Tap anywhere to pump; swipe to trick, and keep holding to grab.
// Swipe sideways along the bottom of the screen to spin; a longer swipe spins further.
// Keyboard: space to pump, arrows to trick (hold the key to grab), Z/X to spin
// (press again for a 360), Q/E to tilt (manuals on the ground, flips in the air).
export class Input {
  onPump: () => void = () => {};
  onSwipe: (d: Swipe) => void = () => {};
  onRelease: () => void = () => {};
  onSpin: (d: 'left' | 'right') => void = () => {};
  onSpinMore: () => void = () => {};
  onLean: (l: Lean) => void = () => {};
  private keyLean = { q: false, e: false };
  onAny: () => void = () => {};
  private touches = new Map<number, Touch>();

  constructor(el: HTMLElement) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), done: false, swiped: false, spin: false });
      this.onAny();
      this.onPump();
    });
    el.addEventListener('pointermove', (e) => {
      const t = this.touches.get(e.pointerId);
      if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (t.spin && Math.abs(dx) > window.innerWidth * SPIN_360) { t.spin = false; this.onSpinMore(); }
      if (t.done) return;
      if (performance.now() - t.t > SWIPE_TIME) { t.done = true; return; }
      if (Math.hypot(dx, dy) < SWIPE_DIST) return;
      t.done = true;
      if (Math.abs(dx) > Math.abs(dy) && t.y > window.innerHeight * (1 - SPIN_ZONE)) {
        t.spin = true;
        this.onSpin(dx > 0 ? 'right' : 'left');
        return;
      }
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
      else if (e.code === 'KeyZ' || e.code === 'KeyX') {
        // Second press while spinning makes it a 360.
        this.onAny(); this.onSpinMore(); this.onSpin(e.code === 'KeyX' ? 'right' : 'left');
      } else if (e.code === 'KeyQ' || e.code === 'KeyE') {
        this.keyLean[e.code === 'KeyQ' ? 'q' : 'e'] = true;
        this.emitLean();
      }
      else if (map[e.code]) { e.preventDefault(); this.onAny(); this.onSwipe(map[e.code]); }
    });
    window.addEventListener('keyup', (e) => {
      if (/^(Arrow|Key[WASD]$)/.test(e.code)) this.onRelease();
      if (e.code === 'KeyQ' || e.code === 'KeyE') {
        this.keyLean[e.code === 'KeyQ' ? 'q' : 'e'] = false;
        this.emitLean();
      }
    });
  }

  private emitLean() {
    const { q, e } = this.keyLean;
    this.onLean(q === e ? 0 : q ? 1 : -1);
  }
}
