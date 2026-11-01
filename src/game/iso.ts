export const N = 13;
export const TW = 64;
export const TH = 32;

export type Pt = { x: number; y: number };
export type Rot = 0 | 1 | 2 | 3;

export function rotPt(x: number, y: number, r: number): [number, number] {
  let a = x;
  let b = y;
  for (let i = 0; i < r; i++) {
    const nx = N - b;
    b = a;
    a = nx;
  }
  return [a, b];
}

export function proj(x: number, y: number, z = 0): Pt {
  return { x: ((x - y) * TW) / 2, y: ((x + y) * TH) / 2 - z };
}

export function P(x: number, y: number, z: number, r: number): Pt {
  const [a, b] = rotPt(x, y, r);
  return proj(a, b, z);
}

export type Rect = { x0: number; y0: number; x1: number; y1: number };

export function rotRect(x0: number, y0: number, x1: number, y1: number, r: number): Rect {
  const c = [rotPt(x0, y0, r), rotPt(x1, y0, r), rotPt(x1, y1, r), rotPt(x0, y1, r)];
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

export const pts = (arr: Pt[]) => arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export type Face = 'left' | 'right';

export function facePoint(r: Rect, face: Face, u: number, z: number): Pt {
  if (face === 'left') return proj(r.x0 + (r.x1 - r.x0) * u, r.y1, z);
  return proj(r.x1, r.y1 + (r.y0 - r.y1) * u, z);
}

export function faceQuad(r: Rect, face: Face, u1: number, u2: number, z1: number, z2: number): Pt[] {
  return [facePoint(r, face, u1, z1), facePoint(r, face, u2, z1), facePoint(r, face, u2, z2), facePoint(r, face, u1, z2)];
}

export function faceLen(r: Rect, face: Face) {
  return face === 'left' ? r.x1 - r.x0 : r.y1 - r.y0;
}

/** SVG transform that lays text flat on a building face. */
export function faceText(r: Rect, face: Face, u: number, z: number) {
  const p = facePoint(r, face, u, z);
  const k = face === 'left' ? 0.5 : -0.5;
  return `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) matrix(1 ${k} 0 1 0 0)`;
}

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Moonlight on a surface. n in 0..1 cools the hue and keeps pale stone light. */
export function dusk(hex: string, n: number) {
  if (n <= 0) return hex;
  const a = parseInt(hex.slice(1), 16);
  const t = 0.16 * Math.min(1, n);
  const mix = (v: number, to: number) => Math.round(v + (to - v) * t);
  const r = mix((a >> 16) & 255, 0xc5);
  const g = mix((a >> 8) & 255, 0xce);
  const b = mix(a & 255, 0xdc);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
