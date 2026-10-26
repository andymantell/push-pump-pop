// Printed patterns for clothes and pictures for the bottom of the deck, drawn on a canvas.
// A pattern is one square tile that repeats (about 12 cm across on the rider); a deck picture
// covers the whole underside, nose to the right.

export const PATTERNS = ['none', 'stripes', 'stars', 'hearts', 'spots', 'checks', 'zigzag', 'flowers', 'lightning', 'rainbow', 'camo', 'flames'] as const;
export type PatternName = (typeof PATTERNS)[number];
export const DECK_ARTS = ['none', 'flames', 'stars', 'hearts', 'rainbow', 'lightning', 'checks', 'dino', 'shark', 'unicorn', 'galaxy', 'smiley', 'paws', 'flowers'] as const;
export type DeckArt = (typeof DECK_ARTS)[number];

const css = (c: number) => '#' + c.toString(16).padStart(6, '0');
const RAINBOW = ['#ff4b4b', '#ff9a2e', '#ffd84a', '#5bd068', '#4aa8ff', '#9b6bff'];

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

function heart(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.45);
  g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  g.fill();
}

function bolt(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.beginPath();
  const pts = [[0.1, -1], [-0.45, 0.1], [-0.05, 0.1], [-0.2, 1], [0.45, -0.2], [0.05, -0.2], [0.25, -1]];
  pts.forEach(([px, py]) => g.lineTo(x + px * s, y + py * s));
  g.closePath();
  g.fill();
}

function flower(g: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string, middle: string) {
  g.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    g.beginPath();
    g.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = middle;
  g.beginPath();
  g.arc(x, y, r * 0.38, 0, Math.PI * 2);
  g.fill();
}

function flames(g: CanvasRenderingContext2D, w: number, h: number, base: number, n: number, cols: string[]) {
  // Tongues of flame licking up from the bottom edge, in layers.
  cols.forEach((c, layer) => {
    const k = 1 - layer * 0.28;
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(0, h);
    for (let i = 0; i <= n; i++) {
      const x0 = (i / n) * w, x1 = ((i + 0.5) / n) * w, x2 = ((i + 1) / n) * w;
      const tip = h - base * k * (0.75 + 0.25 * Math.sin(i * 2.3));
      g.quadraticCurveTo(x0 + (x1 - x0) * 0.2, h - base * k * 0.3, x1 + w / n * 0.15, tip);
      g.quadraticCurveTo(x1 - w / n * 0.05, h - base * k * 0.35, x2, h - base * k * 0.15);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fill();
  });
}

/** One repeating tile of a pattern in the given colours. */
export function drawPattern(cv: HTMLCanvasElement, p: PatternName, base: number, fg: number) {
  const g = cv.getContext('2d')!;
  const W = cv.width, H = cv.height;
  g.fillStyle = css(base);
  g.fillRect(0, 0, W, H);
  g.fillStyle = css(fg);
  const s = W / 128;
  switch (p) {
    case 'stripes':
      g.fillRect(0, H * 0.25, W, H * 0.25);
      g.fillRect(0, H * 0.75, W, H * 0.25);
      break;
    case 'stars':
      star(g, 32 * s, 36 * s, 22 * s, 0.2);
      star(g, 96 * s, 96 * s, 22 * s, -0.15);
      break;
    case 'hearts':
      heart(g, 32 * s, 36 * s, 20 * s);
      heart(g, 96 * s, 96 * s, 20 * s);
      break;
    case 'spots':
      for (const [x, y] of [[32, 32], [96, 96], [96, 32], [32, 96]].slice(0, 2)) {
        g.beginPath();
        g.arc(x * s, y * s, 18 * s, 0, Math.PI * 2);
        g.fill();
      }
      for (const [x, y] of [[96, 32], [32, 96]]) {
        g.beginPath();
        g.arc(x * s, y * s, 9 * s, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 'checks':
      g.fillRect(0, 0, W / 2, H / 2);
      g.fillRect(W / 2, H / 2, W / 2, H / 2);
      break;
    case 'zigzag':
      g.lineWidth = 16 * s;
      g.strokeStyle = css(fg);
      for (const y of [32, 96]) {
        g.beginPath();
        g.moveTo(-8 * s, (y + 16) * s);
        for (let i = 0; i <= 4; i++) g.lineTo(i * 32 * s, (y + (i % 2 ? -16 : 16)) * s);
        g.stroke();
      }
      break;
    case 'flowers':
      flower(g, 32 * s, 36 * s, 24 * s, css(fg), '#ffd84a');
      flower(g, 96 * s, 96 * s, 24 * s, css(fg), '#ffd84a');
      break;
    case 'lightning':
      bolt(g, 32 * s, 40 * s, 30 * s);
      bolt(g, 96 * s, 100 * s, 30 * s);
      break;
    case 'rainbow':
      // Bands round the body, red at the top.
      RAINBOW.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * H) / 6, W, H / 6 + 1); });
      break;
    case 'camo': {
      const blob = (x: number, y: number, r: number) => {
        // Drawn again a tile over wherever it crosses an edge, so the tile repeats seamlessly.
        for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) {
          g.beginPath();
          g.ellipse(x * s + dx, y * s + dy, r * s, r * 0.6 * s, 0.6, 0, Math.PI * 2);
          g.fill();
        }
      };
      blob(20, 30, 30); blob(90, 70, 34); blob(60, 115, 22);
      g.fillStyle = css(new THREEColor(fg).mix(base, 0.5));
      blob(110, 15, 20); blob(40, 80, 18);
      break;
    }
    case 'flames':
      flames(g, W, H, H * 0.9, 2, [css(fg), '#ffd84a']);
      break;
    default:
      break;
  }
}

/** Mixes colours without needing three.js here. */
class THREEColor {
  constructor(private c: number) {}
  mix(o: number, k: number) {
    const ch = (v: number, sh: number) => (v >> sh) & 255;
    const m = (sh: number) => Math.round(ch(this.c, sh) * (1 - k) + ch(o, sh) * k) << sh;
    return m(16) | m(8) | m(0);
  }
}

/** The picture on the bottom of the deck: x along the board (nose at the right), y across it. */
export function drawDeck(cv: HTMLCanvasElement, art: DeckArt, bg: number, fg: number) {
  const g = cv.getContext('2d')!;
  const W = cv.width, H = cv.height;
  g.fillStyle = css(bg);
  g.fillRect(0, 0, W, H);
  g.fillStyle = css(fg);
  const cx = W / 2, cy = H / 2;
  switch (art) {
    case 'flames':
      // Flames up from the tail.
      g.save();
      g.translate(0, H);
      g.rotate(-Math.PI / 2);
      flames(g, H, W, W * 0.7, 3, [css(fg), '#ffd84a', '#fff4c0']);
      g.restore();
      break;
    case 'stars':
      for (const [x, y, r] of [[0.2, 0.5, 34], [0.42, 0.3, 18], [0.5, 0.68, 26], [0.68, 0.38, 30], [0.85, 0.66, 16], [0.33, 0.78, 12]]) star(g, x * W, y * H, r, x * 3);
      break;
    case 'hearts':
      for (const [x, y, r] of [[0.22, 0.5, 30], [0.42, 0.3, 16], [0.5, 0.66, 22], [0.7, 0.42, 28], [0.86, 0.66, 14]]) heart(g, x * W, y * H, r);
      break;
    case 'rainbow':
      RAINBOW.forEach((c, i) => {
        g.strokeStyle = c;
        g.lineWidth = 9;
        g.beginPath();
        g.arc(cx, H * 1.05, 110 - i * 9, Math.PI, 0);
        g.stroke();
      });
      g.fillStyle = '#ffffff';
      for (const x of [cx - 108, cx + 108]) {
        for (const [dx, dy, r] of [[-14, 0, 14], [0, -8, 17], [16, 0, 13]]) { g.beginPath(); g.arc(x + dx, H * 0.86 + dy, r, 0, Math.PI * 2); g.fill(); }
      }
      break;
    case 'lightning':
      g.save();
      g.translate(cx, cy);
      g.rotate(Math.PI / 2);
      bolt(g, 0, 0, 150);
      g.restore();
      break;
    case 'checks': {
      const n = 4, sq = H / n;
      for (let i = 0; i * sq < W; i++) for (let j = 0; j < n; j++) if ((i + j) % 2 === 0) g.fillRect(i * sq, j * sq, sq, sq);
      break;
    }
    case 'dino': {
      // A friendly long-necked dinosaur walking towards the nose.
      g.save();
      g.translate(cx, cy);
      g.scale(0.78, 0.78);
      g.translate(-cx + 10, -cy + 8);
      g.beginPath();
      g.ellipse(cx - 20, cy + 14, 95, 34, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(cx - 100, cy + 10);
      g.quadraticCurveTo(cx - 190, cy + 20, cx - 230, cy - 8);
      g.quadraticCurveTo(cx - 180, cy + 40, cx - 90, cy + 40);
      g.fill();
      g.lineWidth = 26;
      g.lineCap = 'round';
      g.strokeStyle = css(fg);
      g.beginPath();
      g.moveTo(cx + 50, cy);
      g.quadraticCurveTo(cx + 110, cy - 10, cx + 140, cy - 42);
      g.stroke();
      g.beginPath();
      g.ellipse(cx + 158, cy - 46, 30, 18, -0.2, 0, Math.PI * 2);
      g.fill();
      for (const x of [-80, -40, 20, 50]) g.fillRect(cx + x, cy + 30, 18, 30);
      g.fillStyle = css(bg);
      g.beginPath();
      g.arc(cx + 166, cy - 52, 5, 0, Math.PI * 2);
      g.fill();
      for (const x of [-90, -60, -30, 0, 30]) { g.beginPath(); g.arc(cx + x, cy + 8, 7, 0, Math.PI * 2); g.fill(); }
      g.restore();
      break;
    }
    case 'shark': {
      g.beginPath();
      g.moveTo(cx + 170, cy + 6);
      g.quadraticCurveTo(cx + 110, cy - 38, cx - 20, cy - 30);
      g.quadraticCurveTo(cx - 120, cy - 24, cx - 170, cy + 4);
      g.quadraticCurveTo(cx - 100, cy + 38, cx + 10, cy + 34);
      g.quadraticCurveTo(cx + 120, cy + 32, cx + 170, cy + 6);
      g.fill();
      // Fins: dorsal, tail and a side fin.
      g.beginPath(); g.moveTo(cx + 10, cy - 28); g.lineTo(cx - 30, cy - 62); g.lineTo(cx - 40, cy - 26); g.fill();
      g.beginPath(); g.moveTo(cx - 160, cy + 4); g.lineTo(cx - 220, cy - 44); g.lineTo(cx - 200, cy + 6); g.lineTo(cx - 222, cy + 48); g.fill();
      g.beginPath(); g.moveTo(cx + 30, cy + 26); g.lineTo(cx - 10, cy + 58); g.lineTo(cx - 6, cy + 26); g.fill();
      g.fillStyle = css(bg);
      g.beginPath(); g.arc(cx + 120, cy - 6, 6, 0, Math.PI * 2); g.fill();
      g.lineWidth = 4;
      g.strokeStyle = css(bg);
      for (const x of [70, 80, 90]) { g.beginPath(); g.moveTo(cx + x, cy - 12); g.lineTo(cx + x - 6, cy + 12); g.stroke(); }
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx + 130 + i * 6, cy + 16 - i); g.lineTo(cx + 133 + i * 6, cy + 24 - i); g.lineTo(cx + 136 + i * 6, cy + 15 - i); g.fill(); }
      break;
    }
    case 'unicorn': {
      // A unicorn's head looking towards the nose, with a rainbow mane.
      RAINBOW.forEach((c, i) => {
        g.fillStyle = c;
        g.beginPath();
        g.ellipse(cx - 40 - i * 16, cy - 20 + i * 8, 30, 22, 0.5, 0, Math.PI * 2);
        g.fill();
      });
      g.fillStyle = css(fg);
      g.beginPath();
      g.ellipse(cx, cy, 58, 44, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(cx + 62, cy + 18, 48, 30, 0.25, 0, Math.PI * 2);
      g.fill();
      g.beginPath(); g.moveTo(cx - 20, cy - 36); g.lineTo(cx - 8, cy - 64); g.lineTo(cx + 6, cy - 38); g.fill();
      g.fillStyle = '#ffd84a';
      g.beginPath(); g.moveTo(cx + 14, cy - 40); g.lineTo(cx + 60, cy - 62); g.lineTo(cx + 30, cy - 28); g.fill();
      g.fillStyle = '#2a2a30';
      g.beginPath(); g.arc(cx + 20, cy - 4, 7, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + 92, cy + 22, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff8fb8';
      g.beginPath(); g.arc(cx + 30, cy + 16, 9, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'galaxy': {
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, '#120a2e');
      gr.addColorStop(0.5, css(bg));
      gr.addColorStop(1, '#120a2e');
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % W, y = (i * 53) % H;
        g.beginPath(); g.arc(x, y, i % 5 === 0 ? 2.5 : 1.3, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = css(fg);
      g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 5;
      g.beginPath(); g.ellipse(cx, cy, 58, 14, -0.25, 0, Math.PI * 2); g.stroke();
      star(g, cx + 150, cy - 20, 14);
      star(g, cx - 140, cy + 24, 10);
      break;
    }
    case 'smiley':
      g.beginPath(); g.arc(cx, cy, 52, 0, Math.PI * 2); g.fill();
      g.fillStyle = css(bg);
      g.beginPath(); g.ellipse(cx - 18, cy - 16, 7, 12, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + 18, cy - 16, 7, 12, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 8;
      g.strokeStyle = css(bg);
      g.beginPath(); g.arc(cx, cy + 2, 30, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
      break;
    case 'paws':
      for (const [x, y, a] of [[0.15, 0.62, 0.3], [0.32, 0.38, 0.1], [0.5, 0.64, 0.3], [0.68, 0.38, 0.1], [0.86, 0.62, 0.3]]) {
        g.save();
        g.translate(x * W, y * H);
        g.rotate(Math.PI / 2 + a);
        g.beginPath(); g.ellipse(0, 6, 14, 11, 0, 0, Math.PI * 2); g.fill();
        for (const [dx, dy] of [[-15, -9], [-5, -17], [7, -17], [16, -9]]) { g.beginPath(); g.ellipse(dx, dy, 5, 6.5, 0, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
      break;
    case 'flowers':
      for (const [x, y, r] of [[0.18, 0.5, 30], [0.38, 0.3, 20], [0.52, 0.66, 26], [0.7, 0.4, 30], [0.87, 0.65, 18]]) flower(g, x * W, y * H, r, css(fg), '#ffd84a');
      break;
    default:
      break;
  }
}
