import { Fragment, type ReactNode } from 'react';
import { dusk, faceLen, faceQuad, faceText, proj, pts, rotRect, shade, type Face, type Rect } from '../../game/iso';
import type { Building, Structure } from '../../game/world';

const INK = '#140e0a';
const VOID = '#0e0c0a';
const BRASS = '#c4a36a';
const LAMP = ['#ffe7a8', '#ffc14a', '#f0b85a', '#e8a04a', '#f6d48a', '#d4894a'];

function boxFaces(r: Rect, z0: number, h: number) {
  return {
    top: [proj(r.x0, r.y0, h), proj(r.x1, r.y0, h), proj(r.x1, r.y1, h), proj(r.x0, r.y1, h)],
    left: [proj(r.x0, r.y1, z0), proj(r.x1, r.y1, z0), proj(r.x1, r.y1, h), proj(r.x0, r.y1, h)],
    right: [proj(r.x1, r.y1, z0), proj(r.x1, r.y0, z0), proj(r.x1, r.y0, h), proj(r.x1, r.y1, h)],
  };
}

export function IsoBox({ r, z0 = 0, h, color, stroke = INK, sw = 1.4, night = 0 }: { r: Rect; z0?: number; h: number; color: string; stroke?: string; sw?: number; night?: number }) {
  const f = boxFaces(r, z0, h);
  const c = dusk(color, night);
  const front = `${f.top[1].x.toFixed(1)},${f.top[1].y.toFixed(1)} ${f.top[2].x.toFixed(1)},${f.top[2].y.toFixed(1)} ${f.top[3].x.toFixed(1)},${f.top[3].y.toFixed(1)}`;
  return (
    <g strokeLinejoin="round" stroke={stroke} strokeWidth={sw}>
      <polygon points={pts(f.left)} fill={shade(c, -0.08)} />
      <polygon points={pts(f.right)} fill={shade(c, -0.22)} />
      <polygon points={pts(f.top)} fill={shade(c, 0.16)} />
      <polyline points={front} fill="none" stroke={BRASS} strokeWidth={0.85} opacity={0.62} />
    </g>
  );
}

function inset(r: Rect, d: number): Rect {
  return { x0: r.x0 + d, y0: r.y0 + d, x1: r.x1 - d, y1: r.y1 - d };
}

function cavity(r: Rect, face: Face, z1: number, z2: number) {
  if (z2 - z1 < 10) return null;
  return <polygon points={pts(faceQuad(r, face, 0.08, 0.92, z1, z2))} fill={VOID} stroke="#6a5438" strokeWidth={0.55} />;
}

function hollowMouth(r: Rect, z: number) {
  const dx = (r.x1 - r.x0) * 0.22;
  const dy = (r.y1 - r.y0) * 0.22;
  const inner = { x0: r.x0 + dx, y0: r.y0 + dy, x1: r.x1 - dx, y1: r.y1 - dy };
  if (inner.x1 - inner.x0 < 0.28 || inner.y1 - inner.y0 < 0.28) return null;
  const top = [proj(inner.x0, inner.y0, z), proj(inner.x1, inner.y0, z), proj(inner.x1, inner.y1, z), proj(inner.x0, inner.y1, z)];
  const c = proj((inner.x0 + inner.x1) / 2, (inner.y0 + inner.y1) / 2, z);
  const rx = Math.max(5, Math.min(15, (inner.x1 - inner.x0) * 7.5));
  return (
    <g className="hollow">
      <polygon points={pts(top)} fill="#0c0a08" stroke="#8a7048" strokeWidth={0.7} />
      <g filter="url(#lamp)">
        <ellipse cx={c.x} cy={c.y} rx={rx} ry={rx * 0.42} fill="#ffb020" opacity={0.22} />
        <ellipse className="lamp-core" cx={c.x} cy={c.y} rx={rx * 0.32} ry={rx * 0.15} fill="#ffe7a8" />
      </g>
    </g>
  );
}

function roofLamp(r: Rect, h: number, rise: number) {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2 + (r.y1 - r.y0) * 0.08;
  const c = proj(cx, cy, h + rise * 0.46);
  return (
    <g className="hollow" filter="url(#lamp)">
      <ellipse cx={c.x} cy={c.y} rx={9} ry={4} fill="#ffb020" opacity={0.2} />
      <ellipse className="lamp-core" cx={c.x} cy={c.y} rx={3.1} ry={1.5} fill="#ffe7a8" />
    </g>
  );
}

function windows(r: Rect, face: Face, h: number, opts: { z1: number; z2?: number; rowH?: number; per?: number; lit: boolean; seed: number; night: number }) {
  const len = faceLen(r, face);
  const cols = Math.max(1, Math.round(len * (opts.per ?? 1.6)));
  const rowH = opts.rowH ?? 26;
  const top = opts.z2 ?? h - 12;
  const out: ReactNode[] = [];
  let row = 0;
  for (let z = opts.z1; z + rowH * 0.6 <= top; z += rowH, row++) {
    for (let c = 0; c < cols; c++) {
      const u1 = (c + 0.22) / cols;
      const u2 = (c + 0.78) / cols;
      const hash = Math.sin((opts.seed + row * 7.3 + c * 3.1 + (face === 'left' ? 0 : 11)) * 12.9898) * 43758.5;
      const lucky = hash - Math.floor(hash);
      const quad = faceQuad(r, face, u1, u2, z, z + rowH * 0.55);
      const key = `${face}-${row}-${c}`;
      if (opts.lit && lucky > 0.72) {
        const glow = LAMP[Math.floor(lucky * LAMP.length) % LAMP.length];
        out.push(<polygon key={`${key}-g`} points={pts(faceQuad(r, face, u1 - 0.02, u2 + 0.02, z - 1.5, z + rowH * 0.55 + 1.5))} fill="#ffb020" opacity={0.18} />);
        out.push(<polygon key={key} points={pts(quad)} fill={glow} stroke={INK} strokeWidth={0.8} />);
      } else if (opts.lit && lucky > 0.56) {
        out.push(<polygon key={key} points={pts(quad)} fill="#a86830" opacity={0.85} stroke={INK} strokeWidth={0.8} />);
      } else {
        out.push(<polygon key={key} points={pts(quad)} fill={VOID} stroke="#3a2c20" strokeWidth={0.7} />);
      }
    }
  }
  return out;
}

function pyramidRoof(r: Rect, h: number, rise: number, color: string) {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  const apex = proj(cx, cy, h + rise);
  const fl = [proj(r.x0, r.y1, h), proj(r.x1, r.y1, h), apex];
  const fr = [proj(r.x1, r.y1, h), proj(r.x1, r.y0, h), apex];
  const back = [proj(r.x0, r.y0, h), proj(r.x1, r.y0, h), apex, proj(r.x0, r.y1, h)];
  return (
    <g stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <polygon points={pts(back)} fill={shade(color, 0.1)} />
      <polygon points={pts(fl)} fill={color} />
      <polygon points={pts(fr)} fill={shade(color, -0.22)} />
    </g>
  );
}

function signWidth(sign: string) {
  const latin = /^[\x00-\x7F]+$/.test(sign);
  return sign.length * (latin ? 7.6 : 14) + 12;
}

function door(r: Rect, face: Face, u: number, w: number, hgt: number, color = '#4a3428') {
  return <polygon points={pts(faceQuad(r, face, u - w / 2, u + w / 2, 0, hgt))} fill={color} stroke={INK} strokeWidth={1.2} />;
}

function plaque(sign: string) {
  return (
    <>
      <rect x={0} y={0} width={signWidth(sign)} height={14} fill="#14110e" stroke={BRASS} strokeWidth={1} />
      <text x={5} y={10} className="iso-sign">{sign}</text>
    </>
  );
}

function shadow(r: Rect, night: number) {
  const s = [proj(r.x0 + 0.2, r.y1, 0), proj(r.x1, r.y1, 0), proj(r.x1, r.y0 + 0.2, 0), proj(r.x1 + 0.55, r.y0 + 0.55, 0), proj(r.x1 + 0.55, r.y1 + 0.55, 0), proj(r.x0 + 0.55, r.y1 + 0.55, 0)];
  return <polygon points={pts(s)} fill="#1a120c" opacity={0.28 + (1 - night) * 0.08} />;
}

export function StructureView({ s, rot, night }: { s: Structure | Building; rot: number; night: number }) {
  const lit = night > 0.2;
  const T = (c: string) => dusk(c, night);
  const r = rotRect(s.x0, s.y0, s.x1, s.y1, rot);
  const h = s.h;
  const seed = s.x0 * 13 + s.y0 * 7;
  const sign = 'sign' in s ? s.sign : undefined;
  const parts: ReactNode[] = [shadow(r, night)];

  switch (s.kind) {
    case 'tower': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 16, h - 18));
      parts.push(cavity(r, 'right', 16, h - 18));
      parts.push(...windows(r, 'left', h, { z1: 18, lit, night, seed, per: 2 }));
      parts.push(...windows(r, 'right', h, { z1: 18, lit, night, seed, per: 2 }));
      const cap = inset(r, 0.5);
      parts.push(<IsoBox night={night} key="cap" r={cap} z0={h} h={h + 10} color={shade(s.color, -0.08)} />);
      parts.push(hollowMouth(cap, h + 10));
      const c = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, h + 10);
      parts.push(<line key="ant" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 34} stroke="#a89070" strokeWidth={2} />);
      parts.push(<circle key="ant2" cx={c.x} cy={c.y - 36} r={3.5} fill="#ffc14a" stroke={INK} strokeWidth={1.2} className="blink" />);
      if (sign) {
        parts.push(
          <g key="sign" transform={faceText(r, 'left', 0.1, h - 2)}>
            {plaque(sign)}
          </g>,
        );
      }
      parts.push(door(r, 'left', 0.5, 0.18, 16, '#3a2e24'));
      break;
    }
    case 'studio': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      const len = faceLen(r, 'left');
      parts.push(<polygon key="film" points={pts(faceQuad(r, 'left', 0.06, 0.94, 34, 70))} fill="#100e0c" stroke="#6a5438" strokeWidth={1.2} />);
      const frames = Math.max(3, Math.round(len * 1.5));
      for (let i = 0; i < frames; i++) {
        const u1 = 0.08 + (0.84 * (i + 0.12)) / frames;
        const u2 = 0.08 + (0.84 * (i + 0.88)) / frames;
        const on = lit && i % 2 === 0;
        parts.push(<polygon key={`fr${i}`} points={pts(faceQuad(r, 'left', u1, u2, 40, 64))} fill={on ? LAMP[i % LAMP.length] : VOID} stroke={INK} strokeWidth={0.8} />);
      }
      parts.push(<polygon key="garage" points={pts(faceQuad(r, 'right', 0.25, 0.75, 0, 34))} fill="#14110c" stroke={INK} strokeWidth={1.2} />);
      for (let z = 6; z < 34; z += 6) {
        const a = faceQuad(r, 'right', 0.25, 0.75, z, z);
        parts.push(<line key={`g${z}`} x1={a[0].x} y1={a[0].y} x2={a[1].x} y2={a[1].y} stroke="#8a7048" strokeWidth={0.7} opacity={0.55} />);
      }
      parts.push(door(r, 'left', 0.15, 0.1, 22));
      parts.push(hollowMouth(r, h));
      if (sign) {
        const sr: Rect = { x0: r.x0 + (r.x1 - r.x0) * 0.55, x1: r.x1 - 0.2, y0: r.y1 - 0.25, y1: r.y1 - 0.1 };
        parts.push(<IsoBox night={night} key="sb" r={sr} z0={h} h={h + 22} color="#241c16" sw={1.2} />);
        parts.push(<text key="st" transform={faceText(sr, 'left', 0.1, h + 6)} className="iso-sign">{sign}</text>);
      }
      break;
    }
    case 'house': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 14, h - 8));
      parts.push(cavity(r, 'right', 14, h - 8));
      parts.push(...windows(r, 'left', h, { z1: 16, lit, night, seed, per: 1.3, rowH: 24 }));
      parts.push(...windows(r, 'right', h, { z1: 16, lit, night, seed, per: 1.3, rowH: 24 }));
      const ch = { x0: r.x0 + 0.4, x1: r.x0 + 0.75, y0: r.y0 + 0.4, y1: r.y0 + 0.75 };
      parts.push(<IsoBox night={night} key="ch" r={ch} z0={h} h={h + 50} color="#6a4034" />);
      parts.push(pyramidRoof(r, h, 46, T(s.roof ?? '#c46a3a')));
      parts.push(roofLamp(r, h, 46));
      const smokeAt = proj(ch.x0, ch.y0, h + 60);
      parts.push(<circle key="smoke1" className="smoke" cx={smokeAt.x} cy={smokeAt.y} r={6} />);
      parts.push(<circle key="smoke2" className="smoke smoke-b" cx={smokeAt.x + 4} cy={smokeAt.y - 6} r={5} />);
      parts.push(door(r, 'left', 0.5, 0.16, 20, '#5a3c2c'));
      break;
    }
    case 'postoffice': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 12, h - 22));
      parts.push(cavity(r, 'right', 12, h - 16));
      parts.push(...windows(r, 'left', h, { z1: 14, z2: h - 24, lit, night, seed, per: 1.4, rowH: 30 }));
      parts.push(...windows(r, 'right', h, { z1: 14, lit, night, seed, per: 1.4, rowH: 30 }));
      parts.push(hollowMouth(r, h));
      if (sign) {
        parts.push(
          <g key="sign" transform={faceText(r, 'left', 0.12, h - 6)}>
            {plaque(sign)}
          </g>,
        );
      }
      const c = proj(r.x1 - 0.5, r.y0 + 0.5, h);
      parts.push(<line key="pole" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 46} stroke="#a89070" strokeWidth={2} />);
      parts.push(<path key="flag" className="flag" d={`M${c.x},${c.y - 46} l22,5 -22,7 z`} fill="#c46a3a" stroke={INK} strokeWidth={1.2} />);
      const mb = proj(r.x0 + 0.3, r.y1 + 0.35, 0);
      parts.push(
        <g key="mail" transform={`translate(${mb.x} ${mb.y})`}>
          <rect x={-5} y={-18} width={10} height={16} rx={2} fill="#a86b45" stroke={INK} strokeWidth={1.2} />
          <rect x={-2} y={-2} width={4} height={4} fill={INK} />
        </g>,
      );
      break;
    }
    case 'bank': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      for (const face of ['left', 'right'] as Face[]) {
        const n = Math.round(faceLen(r, face) * 2);
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          parts.push(<polygon key={`${face}c${i}`} points={pts(faceQuad(r, face, u - 0.035, u + 0.035, 4, h - 10))} fill="#c4b49a" stroke={INK} strokeWidth={0.9} />);
        }
      }
      parts.push(<IsoBox night={night} key="steps" r={{ x0: r.x0 - 0.15, x1: r.x1 + 0.15, y0: r.y0 - 0.15, y1: r.y1 + 0.15 }} h={4} color="#2a241c" sw={1} />);
      const roofR = { x0: r.x0 - 0.1, x1: r.x1 + 0.1, y0: r.y0 - 0.1, y1: r.y1 + 0.1 };
      parts.push(pyramidRoof(roofR, h, 30, T(s.roof ?? '#d4b483')));
      parts.push(roofLamp(r, h, 30));
      const coin = faceQuad(r, 'right', 0.4, 0.6, 22, 42);
      const cc = { x: (coin[0].x + coin[2].x) / 2, y: (coin[0].y + coin[2].y) / 2 };
      parts.push(<ellipse key="coin" cx={cc.x} cy={cc.y} rx={9} ry={11} fill="#e6c36a" stroke={INK} strokeWidth={1.2} />);
      parts.push(<text key="coin$" x={cc.x} y={cc.y + 4} textAnchor="middle" className="iso-sign">$</text>);
      if (sign) parts.push(<text key="st" transform={faceText(r, 'left', 0.36, h - 1)} className="iso-sign">{sign}</text>);
      break;
    }
    case 'cafe': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 30, h - 8));
      parts.push(...windows(r, 'left', h, { z1: 32, lit, night, seed, per: 1.4, rowH: 28 }));
      for (const face of ['left', 'right'] as Face[]) {
        const n = Math.round(faceLen(r, face) * 5);
        for (let i = 0; i < n; i++) {
          parts.push(
            <polygon key={`${face}aw${i}`} points={pts(faceQuad(r, face, i / n, (i + 1) / n, 18, 28))} fill={i % 2 ? '#1a1612' : '#9a7048'} stroke={INK} strokeWidth={0.6} />,
          );
        }
      }
      parts.push(hollowMouth(r, h));
      parts.push(door(r, 'right', 0.5, 0.18, 17, '#5a3c2c'));
      if (sign) {
        const sr: Rect = { x0: r.x0 + 0.3, x1: r.x0 + 1.3, y0: r.y1 - 0.2, y1: r.y1 - 0.08 };
        parts.push(<IsoBox night={night} key="sb" r={sr} z0={h} h={h + 18} color="#241c16" sw={1.1} />);
        parts.push(<text key="st" transform={faceText(sr, 'left', 0.18, h + 5)} className="iso-sign">{sign}</text>);
      }
      const t = proj(r.x0 + 0.5, r.y1 + 0.45, 0);
      parts.push(
        <g key="table" transform={`translate(${t.x} ${t.y})`}>
          <line x1={0} y1={0} x2={0} y2={-10} stroke="#a89070" strokeWidth={1.4} />
          <ellipse cx={0} cy={-10} rx={7} ry={3.5} fill="#2a241c" stroke={INK} strokeWidth={1} />
          <path d="M-9,-14 L0,-26 L9,-14 Z" fill="#c46a3a" stroke={INK} strokeWidth={1} />
        </g>,
      );
      break;
    }
    case 'apt': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 14, h - 12));
      parts.push(cavity(r, 'right', 14, h - 12));
      parts.push(...windows(r, 'left', h, { z1: 16, lit, night, seed, per: 1.7 }));
      parts.push(...windows(r, 'right', h, { z1: 16, lit, night, seed, per: 1.7 }));
      const cap = inset(r, 0.35);
      parts.push(<IsoBox night={night} key="cap" r={cap} z0={h} h={h + 8} color={shade(s.color, -0.1)} />);
      parts.push(hollowMouth(cap, h + 8));
      break;
    }
    case 'cottage': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(cavity(r, 'left', 10, h - 6));
      parts.push(...windows(r, 'left', h, { z1: 12, lit, night, seed, per: 1.2, rowH: 22 }));
      parts.push(pyramidRoof(r, h, 26, T(s.roof ?? '#c46a3a')));
      parts.push(roofLamp(r, h, 26));
      break;
    }
  }
  return (
    <g className={`structure kind-${s.kind}`}>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </g>
  );
}

export function Tree({ x, y, night }: { x: number; y: number; night: number }) {
  const p = proj(x, y, 0);
  const tone = Math.sin(x * 3 + y * 5) > 0;
  const c = dusk(tone ? '#3a4a32' : '#2a3824', night * 0.35);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="tree">
      <ellipse cx={4} cy={1} rx={13} ry={5} fill="#1a120c" opacity={0.28} />
      <line x1={0} y1={0} x2={0} y2={-14} stroke="#6a4a32" strokeWidth={3} />
      <g className="sway">
        <circle cx={0} cy={-24} r={12} fill={c} stroke={INK} strokeWidth={1.3} />
        <circle cx={-4} cy={-28} r={4} fill={shade(c, 0.28)} />
      </g>
    </g>
  );
}

export function Lamp({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  const p = proj(x, y, 0);
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      {lit && <ellipse cx={0} cy={2} rx={26} ry={10} fill="#ffc14a" opacity={0.14} />}
      <line x1={0} y1={0} x2={0} y2={-32} stroke="#a89070" strokeWidth={1.8} />
      <circle cx={0} cy={-34} r={3.8} fill={lit ? '#ffe7a8' : '#2a241c'} stroke={INK} strokeWidth={1.2} />
      {lit && (
        <g filter="url(#lamp)">
          <circle className="lamp-core" cx={0} cy={-34} r={10} fill="#ffc14a" opacity={0.32} />
        </g>
      )}
    </g>
  );
}
