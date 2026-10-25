import { Lean } from './rider';

/** Degrees of tilt from level to start a lean, and back within this to stop. */
const ON_DEG = 9;
const OFF_DEG = 5;
/** Below this share of gravity in the screen's plane (device lying flat), roll is unreliable. */
const MIN_PLANE = 0.3;

type PermissionFn = () => Promise<'granted' | 'denied'>;

// Tilt the device like a steering wheel: right side up lifts the nose (manual on
// the ground, backflip in the air), right side down drops it (nose manual, frontflip).
// Level is whatever angle the device was held at when the run started.
export class Tilt {
  onLean: (l: Lean) => void = () => {};
  /** Has the device ever reported an orientation? */
  available = false;
  /** Roll of the screen in degrees, + is clockwise (right side down). */
  roll = 0;
  private flat = true;
  private level = 0;
  private lean: Lean = 0;
  private asked = false;

  constructor() {
    window.addEventListener('deviceorientation', (e) => this.read(e));
    // iOS only lets a page read motion after the player has tapped something.
    const ask = () => this.requestPermission();
    window.addEventListener('click', ask);
    window.addEventListener('touchend', ask);
  }

  requestPermission() {
    if (this.asked) return;
    this.asked = true;
    const req = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
    if (req) req.call(DeviceOrientationEvent).catch(() => {});
  }

  /** Take the current hold as level. */
  calibrate() {
    this.level = this.roll;
    this.set(0);
  }

  private read(e: DeviceOrientationEvent) {
    if (e.beta === null || e.gamma === null) return;
    this.available = true;
    const b = (e.beta * Math.PI) / 180, g = (e.gamma * Math.PI) / 180;
    // Gravity in the device's own axes (x right, y up the screen in portrait).
    const dx = Math.cos(b) * Math.sin(g), dy = -Math.sin(b);
    // Into the screen's axes, which turn with the orientation (angle is counter-clockwise).
    const a = (screenAngle() * Math.PI) / 180;
    const sx = dx * Math.cos(a) + dy * Math.sin(a);
    const sy = -dx * Math.sin(a) + dy * Math.cos(a);
    this.flat = Math.hypot(sx, sy) < MIN_PLANE;
    if (this.flat) { this.set(0); return; }
    this.roll = (Math.atan2(sx, -sy) * 180) / Math.PI;
    let d = this.roll - this.level;
    d = ((d + 540) % 360) - 180;
    const on = Math.abs(d) > (this.lean ? OFF_DEG : ON_DEG);
    this.set(on ? (d > 0 ? -1 : 1) : 0);
  }

  private set(l: Lean) {
    if (l === this.lean) return;
    this.lean = l;
    this.onLean(l);
  }
}

function screenAngle(): number {
  const so = screen.orientation as ScreenOrientation | undefined;
  if (so && typeof so.angle === 'number') return so.angle;
  const wo = (window as unknown as { orientation?: number }).orientation;
  return typeof wo === 'number' ? wo : 0;
}
