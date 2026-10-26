import { Lean } from './rider';

/** Degrees of tilt from level to start a lean, and back within this to stop. */
const ON_DEG = 14;
const OFF_DEG = 8;
/** A kayak reads tilt as an amount: nothing inside DEAD_DEG of level, all the way at FULL_DEG. */
const DEAD_DEG = 5;
const FULL_DEG = 32;
/** Below this share of gravity in the screen's plane (device lying flat), roll is unreliable. */
const MIN_PLANE = 0.3;

type PermissionFn = () => Promise<'granted' | 'denied'>;

// Tilt the device like a steering wheel: right side up lifts the nose (manual on
// the ground, backflip in the air), right side down drops it (nose manual, frontflip).
// Level is whatever angle the device was held at when the run started.
export class Tilt {
  onLean: (l: Lean) => void = () => {};
  /** How far the device is tipped, -1 to 1 (+ lifts the nose), for controls that follow it smoothly. */
  onAmount: (a: number) => void = () => {};
  amount = 0;
  /** Has the device ever reported an orientation? */
  available = false;
  /** Roll of the screen in degrees, + is clockwise (right side down). */
  roll = 0;
  private flat = true;
  private level = 0;
  private lean: Lean = 0;
  private asking = false;
  private granted = false;
  private lastRead = -Infinity;

  constructor() {
    window.addEventListener('deviceorientation', (e) => this.read(e));
    // iOS only lets a page read motion after the player has tapped something.
    const ask = () => this.requestPermission();
    window.addEventListener('click', ask);
    window.addEventListener('touchend', ask);
  }

  // Keep asking on later taps until it's granted: iOS can forget the permission,
  // and a prompt that was dismissed or failed shouldn't leave tilt off for good.
  requestPermission() {
    if (this.asking || this.granted) return;
    const req = permissionFn();
    if (!req) { this.granted = true; return; }
    this.asking = true;
    req.call(DeviceOrientationEvent)
      .then((r) => { this.granted = r === 'granted'; })
      .catch(() => {})
      .finally(() => { this.asking = false; });
  }

  /** A touch device whose tilt isn't reaching the game (no permission, or it was lost). */
  get missing(): boolean {
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    return touch && 'DeviceOrientationEvent' in window && performance.now() - this.lastRead > 1500;
  }

  /** Take the current hold as level. */
  calibrate() {
    this.level = this.roll;
    this.set(0);
    this.setAmount(0);
  }

  private read(e: DeviceOrientationEvent) {
    if (e.beta === null || e.gamma === null) return;
    this.available = true;
    this.lastRead = performance.now();
    const b = (e.beta * Math.PI) / 180, g = (e.gamma * Math.PI) / 180;
    // Gravity in the device's own axes (x right, y up the screen in portrait).
    const dx = Math.cos(b) * Math.sin(g), dy = -Math.sin(b);
    // Into the screen's axes, which turn with the orientation (angle is counter-clockwise).
    const a = (screenAngle() * Math.PI) / 180;
    const sx = dx * Math.cos(a) + dy * Math.sin(a);
    const sy = -dx * Math.sin(a) + dy * Math.cos(a);
    this.flat = Math.hypot(sx, sy) < MIN_PLANE;
    if (this.flat) { this.set(0); this.setAmount(0); return; }
    this.roll = (Math.atan2(sx, -sy) * 180) / Math.PI;
    let d = this.roll - this.level;
    d = ((d + 540) % 360) - 180;
    this.setAmount(-Math.sign(d) * Math.max(0, Math.min(1, (Math.abs(d) - DEAD_DEG) / (FULL_DEG - DEAD_DEG))));
    const on = Math.abs(d) > (this.lean ? OFF_DEG : ON_DEG);
    this.set(on ? (d > 0 ? -1 : 1) : 0);
  }

  private setAmount(a: number) {
    if (a === this.amount) return;
    this.amount = a;
    this.onAmount(a);
  }

  private set(l: Lean) {
    if (l === this.lean) return;
    this.lean = l;
    this.onLean(l);
  }
}

function permissionFn(): PermissionFn | undefined {
  if (!('DeviceOrientationEvent' in window)) return undefined;
  return (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
}

function screenAngle(): number {
  const so = screen.orientation as ScreenOrientation | undefined;
  if (so && typeof so.angle === 'number') return so.angle;
  const wo = (window as unknown as { orientation?: number }).orientation;
  return typeof wo === 'number' ? wo : 0;
}
