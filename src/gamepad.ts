import type { Input } from './input';
import { Swipe, Lean } from './rider';

// Standard Gamepad API layout (Xbox names).
const A = 0, B = 1, X = 2, LB = 4, RB = 5, VIEW = 8, MENU = 9, UP = 12, DOWN = 13, LEFT = 14, RIGHT = 15;
/** Stick push to count as a direction, and back within this to count as centred again. */
const PUSH = 0.6, CENTRE = 0.35;
/** Left stick lean: on past this, off again within LEAN_OFF (like tilt's 14 and 8 degrees). */
const LEAN_ON = 0.5, LEAN_OFF = 0.3;
/** A right-stick flip down and to the side, between these slopes, is a 360 flip or hardflip (as in input.ts). */
const COMBO_MIN = 0.6, COMBO_MAX = 1.7;
/** Menu moves: first repeat after this long holding a direction, then every REPEAT. */
const DELAY = 400, REPEAT = 140;
/** The visible button B presses to go back, first match wins. */
const BACK = '#rp-close, .rd-done, #resume, #guideback, #cardback, #moveback, #back, #news button';

type Dir = 'up' | 'down' | 'left' | 'right';

// An Xbox (or any standard) controller.
// Riding: A pumps, the left stick leans like tilting the iPad (left or back for a manual or backflip,
// right or forwards for a nose manual or frontflip). Hold X and push the right stick to grab
// (let go of either to drop it); hold B and flick the right stick to flip, diagonals down for a
// 360 flip or hardflip. LB / RB spin, and holding keeps spinning (360, 540...). Menu pauses.
// Menus: d-pad or left stick moves between buttons, A presses, B goes back.
export class Gamepad {
  onLean: (l: Lean) => void = () => {};
  /** Menu (start) button: pause or resume. */
  onMenu: () => void = () => {};
  /** View button: watch the replay. */
  onView: () => void = () => {};
  /** Is a run being ridden (sticks and buttons do tricks rather than move round menus)? */
  riding: () => boolean = () => false;
  /** In the air with the last spin finished, so a held spin button can carry on round. */
  canSpinOn: () => boolean = () => false;
  /** Has a controller been used? */
  connected = false;
  private prev: boolean[] = [];
  private lean: Lean = 0;
  private stickFired = false;
  private grabbing = false;
  private focus: HTMLElement | null = null;
  private held: Dir | null = null;
  private repeatAt = 0;

  constructor(private input: Input) {
    window.addEventListener('gamepadconnected', () => { this.connected = true; });
    // A touch or click hides the focus ring until the controller moves round a menu again.
    window.addEventListener('pointerdown', () => this.setFocus(null));
    const loop = () => { this.poll(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  private poll() {
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    if (!pad) return;
    const down = pad.buttons.map((b) => b.pressed);
    const pressed = (i: number) => !!down[i] && !this.prev[i];
    if (down.some((d) => d)) this.connected = true;
    const [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes;

    if (pressed(MENU)) this.onMenu();
    if (pressed(VIEW)) this.onView();
    if (this.riding()) {
      this.setFocus(null);
      this.ride(pressed, down, lx, ly, rx, ry);
    } else {
      this.release();
      this.setLean(0);
      this.menu(pressed, down, lx, ly);
    }
    this.prev = down;
  }

  private ride(pressed: (i: number) => boolean, down: boolean[], lx: number, ly: number, rx: number, ry: number) {
    const inp = this.input;
    if (pressed(A)) { inp.onAny(); inp.onPump(); }
    if (pressed(LB) || pressed(RB)) { inp.onAny(); inp.onSpinMore(); inp.onSpin(pressed(RB) ? 'right' : 'left'); }
    // Still holding it when that 180 comes round: another one the same way, which adds up to a 360, 540...
    else if ((down[LB] !== down[RB]) && this.canSpinOn()) inp.onSpin(down[RB] ? 'right' : 'left');

    // Left stick: whichever way it's pushed most. Back (down) lifts the nose like left does.
    const lean = Math.abs(lx) >= Math.abs(ly) ? -lx : ly;
    const on = Math.abs(lean) > (this.lean ? LEAN_OFF : LEAN_ON);
    this.setLean(on ? (lean > 0 ? 1 : -1) : 0);

    // Right stick: one trick per push, then back to the middle for the next.
    const mag = Math.hypot(rx, ry);
    if (mag < CENTRE) { this.stickFired = false; this.release(); }
    if (this.grabbing && !down[X]) this.release();
    if (this.stickFired || mag < PUSH) return;
    const dir = toDir(rx, ry);
    if (down[X]) {
      this.stickFired = true;
      this.grabbing = true;
      inp.onAny(); inp.onGrab(dir);
    } else if (down[B]) {
      this.stickFired = true;
      inp.onAny();
      const slope = Math.abs(ry) / Math.max(1e-3, Math.abs(rx));
      if (ry > 0 && slope > COMBO_MIN && slope < COMBO_MAX) inp.onCombo(rx < 0 ? 'left' : 'right');
      else inp.onSwipe(dir);
    }
  }

  private release() {
    if (!this.grabbing) return;
    this.grabbing = false;
    this.input.onRelease();
  }

  private setLean(l: Lean) {
    if (l === this.lean) return;
    this.lean = l;
    this.onLean(l);
  }

  // Move a highlight round the buttons on screen, like a TV menu.
  private menu(pressed: (i: number) => boolean, down: boolean[], lx: number, ly: number) {
    if (pressed(A)) { const f = this.current(); if (f) f.click(); return; }
    if (pressed(B)) { const b = visible(document.querySelectorAll<HTMLElement>(BACK))[0]; if (b) b.click(); return; }
    let dir: Dir | null = down[UP] ? 'up' : down[DOWN] ? 'down' : down[LEFT] ? 'left' : down[RIGHT] ? 'right' : null;
    if (!dir && Math.hypot(lx, ly) > PUSH) dir = toDir(lx, ly) as Dir;
    const now = performance.now();
    if (dir !== this.held) { this.held = dir; this.repeatAt = now + DELAY; if (dir) this.move(dir); }
    else if (dir && now >= this.repeatAt) { this.repeatAt = now + REPEAT; this.move(dir); }
  }

  /** The highlighted button, if it's still on screen. */
  private current(): HTMLElement | null {
    if (this.focus && isVisible(this.focus)) return this.focus;
    this.setFocus(null);
    return null;
  }

  private move(dir: Dir) {
    const buttons = visible(document.querySelectorAll<HTMLElement>('button'));
    if (!buttons.length) return;
    const from = this.current();
    if (!from) { this.setFocus(buttons[0]); return; }
    const a = centre(from);
    let best: HTMLElement | null = null, bestScore = Infinity;
    for (const b of buttons) {
      if (b === from) continue;
      const c = centre(b);
      const dx = c.x - a.x, dy = c.y - a.y;
      const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
      const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (along <= 2) continue;
      const score = along + across * 2.5;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    if (best) this.setFocus(best);
  }

  private setFocus(el: HTMLElement | null) {
    if (el === this.focus) return;
    this.focus?.classList.remove('padfocus');
    this.focus = el;
    if (!el) return;
    el.classList.add('padfocus');
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function toDir(x: number, y: number): Swipe {
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}

function isVisible(el: HTMLElement): boolean {
  if ((el as HTMLButtonElement).disabled) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = getComputedStyle(el);
  if (s.visibility === 'hidden' || s.pointerEvents === 'none' || Number(s.opacity) < 0.05) return false;
  // Skip buttons under something else (a menu opened over the title). Ones scrolled out of view still count.
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return true;
  const top = document.elementFromPoint(x, y);
  return !top || el.contains(top) || top.contains(el);
}

function visible(list: NodeListOf<HTMLElement>): HTMLElement[] {
  return [...list].filter(isVisible);
}

function centre(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
