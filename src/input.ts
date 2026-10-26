import { Swipe, Lean } from './rider';

const SWIPE_DIST = 28;
const SWIPE_TIME = 450;
/** Swipes starting in this bottom share of the screen are spins (the band drawn as #spinzone). */
const SPIN_ZONE = 0.4;
/** A spin swipe this long (share of screen width) becomes a 360. */
const SPIN_360 = 0.2;
/** Swipes starting in this left share of the screen are grabs. */
const GRAB_ZONE = 0.5;
/** A flip swipe down and to the side, between these slopes (about 30 to 60 degrees), is a 360 flip or hardflip. */
const COMBO_MIN = 0.6, COMBO_MAX = 1.7;
/** Kayak: dragging a thumb the full width of the screen turns the boat this far (radians). */
const TURN_PER_WIDTH = Math.PI * 2.4;

const GRAB_KEYS: Record<string, Swipe> = { KeyI: 'up', KeyK: 'down', KeyJ: 'left', KeyL: 'right' };
const COMBO_KEYS: Record<string, 'left' | 'right'> = { KeyC: 'left', KeyV: 'right' };

interface Touch { x: number; y: number; t: number; done: boolean; swiped: boolean; spin: boolean; turning?: boolean; moved?: boolean; lx?: number }

// Tap anywhere to pump. Swipe on the right to flip; swipe on the left and hold to grab.
// Swipe sideways along the bottom of the screen to spin; a longer swipe spins further.
// Swipe down-left or down-right on the right for a 360 flip or hardflip.
// Keyboard: space to pump, arrows to flip, C/V for a 360 flip/hardflip, hold I/J/K/L to grab, Z/X to spin
// (press again for a 360), Q/E to tilt (manuals on the ground, flips in the air).
// In a kayak it's simpler: tap to paddle, drag a thumb sideways to turn the boat (it follows
// the thumb), and nothing else; Z/X turn it half round.
export class Input {
  /** Kayak controls: a tap paddles when the finger lifts, and a sideways drag turns the boat. */
  kayak = false;
  /** Kayak: turn the boat by this much (radians), as the thumb drags. */
  onTurn: (d: number) => void = () => {};
  onTurnEnd: () => void = () => {};
  onPump: () => void = () => {};
  onSwipe: (d: Swipe) => void = () => {};
  /** Diagonal flip swipe, down and to this side. */
  onCombo: (d: 'left' | 'right') => void = () => {};
  onGrab: (d: Swipe) => void = () => {};
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
      // In a kayak the stroke waits for the finger to lift, so a drag to turn isn't a stroke too.
      if (!this.kayak) this.onPump();
    });
    el.addEventListener('pointermove', (e) => {
      const t = this.touches.get(e.pointerId);
      if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (this.kayak) {
        if (Math.hypot(dx, dy) >= SWIPE_DIST) t.moved = true;
        if (!t.turning && Math.abs(dx) >= SWIPE_DIST && Math.abs(dx) > Math.abs(dy)) { t.turning = true; t.lx = t.x; }
        if (t.turning) {
          this.onTurn(((e.clientX - (t.lx ?? t.x)) / window.innerWidth) * TURN_PER_WIDTH);
          t.lx = e.clientX;
        }
        return;
      }
      if (t.spin && Math.abs(dx) > window.innerWidth * SPIN_360) { t.spin = false; this.onSpinMore(); }
      if (t.done) return;
      if (performance.now() - t.t > SWIPE_TIME) { t.done = true; return; }
      if (Math.hypot(dx, dy) < SWIPE_DIST) return;
      t.done = true;
      const right = t.x >= window.innerWidth * GRAB_ZONE;
      const slope = Math.abs(dy) / Math.max(1e-3, Math.abs(dx));
      if (right && dy > 0 && slope > COMBO_MIN && slope < COMBO_MAX) { this.onCombo(dx < 0 ? 'left' : 'right'); return; }
      if (Math.abs(dx) > Math.abs(dy) && t.y > window.innerHeight * (1 - SPIN_ZONE)) {
        t.spin = true;
        this.onSpin(dx > 0 ? 'right' : 'left');
        return;
      }
      const dir: Swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (!right) { t.swiped = true; this.onGrab(dir); }
      else this.onSwipe(dir);
    });
    const end = (e: PointerEvent) => {
      const t = this.touches.get(e.pointerId);
      this.touches.delete(e.pointerId);
      if (t && this.kayak) {
        if (t.turning) this.onTurnEnd();
        else if (e.type === 'pointerup') this.onPump();
        return;
      }
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
      else if (this.kayak && (e.code === 'KeyZ' || e.code === 'KeyX')) {
        this.onAny(); this.onTurn(e.code === 'KeyX' ? Math.PI : -Math.PI); this.onTurnEnd();
      } else if (this.kayak && map[e.code]) { e.preventDefault(); }
      else if (e.code === 'KeyZ' || e.code === 'KeyX') {
        // Second press while spinning makes it a 360.
        this.onAny(); this.onSpinMore(); this.onSpin(e.code === 'KeyX' ? 'right' : 'left');
      } else if (e.code === 'KeyQ' || e.code === 'KeyE') {
        this.keyLean[e.code === 'KeyQ' ? 'q' : 'e'] = true;
        this.emitLean();
      }
      else if (map[e.code]) { e.preventDefault(); this.onAny(); this.onSwipe(map[e.code]); }
      else if (COMBO_KEYS[e.code]) { this.onAny(); this.onCombo(COMBO_KEYS[e.code]); }
      else if (GRAB_KEYS[e.code]) { this.onAny(); this.onGrab(GRAB_KEYS[e.code]); }
    });
    window.addEventListener('keyup', (e) => {
      if (GRAB_KEYS[e.code]) this.onRelease();
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
