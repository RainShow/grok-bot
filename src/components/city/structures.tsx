import { Fragment, type ReactNode } from 'react';
import { dusk, faceLen, faceQuad, faceText, proj, pts, rotRect, shade, type Face, type Rect } from '../../game/iso';
import type { Building, Structure } from '../../game/world';

const INK = '#0c1014';
const GLASS = '#141a22';
const ICE = ['#f4fbff', '#e4f2ff', '#c5dff6', '#ffffff', '#b9d8f2', '#d7ebfb'];
const CONCRETE = '#4a525c';

function boxFaces(r: Rect, z0: number, h: number) {
  return {
    top: [proj(r.x0, r.y0, h), proj(r.x1, r.y0, h), proj(r.x1, r.y1, h), proj(r.x0, r.y1, h)],
    left: [proj(r.x0, r.y1, z0), proj(r.x1, r.y1, z0), proj(r.x1, r.y1, h), proj(r.x0, r.y1, h)],
    right: [proj(r.x1, r.y1, z0), proj(r.x1, r.y0, z0), proj(r.x1, r.y0, h), proj(r.x1, r.y1, h)],
  };
}

export function IsoBox({ r, z0 = 0, h, color, sw = 1.05, night = 0 }: { r: Rect; z0?: number; h: number; color: string; stroke?: string; sw?: number; night?: number }) {
  const f = boxFaces(r, z0, h);
  const c = dusk(color, night);
  return (
    <g strokeLinejoin="round">
      <polygon points={pts(f.left)} fill={shade(c, -0.08)} stroke={INK} strokeWidth={sw} />
      <polygon points={pts(f.right)} fill={shade(c, -0.24)} stroke={INK} strokeWidth={sw} />
      <polygon points={pts(f.top)} fill={shade(c, 0.3)} stroke="rgba(214,224,232,0.42)" strokeWidth={0.75} />
    </g>
  );
}

function inset(r: Rect, d: number): Rect {
  return { x0: r.x0 + d, y0: r.y0 + d, x1: r.x1 - d, y1: r.y1 - d };
}

function windows(r: Rect, face: Face, h: number, opts: { z1: number; z2?: number; rowH?: number; per?: number; lit: boolean; seed: number; fill?: string; night: number }) {
  const len = faceLen(r, face);
  const cols = Math.max(1, Math.round(len * (opts.per ?? 1.6)));
  const rowH = opts.rowH ?? 26;
  const top = opts.z2 ?? h - 12;
  const out: ReactNode[] = [];
  let row = 0;
  for (let z = opts.z1; z + rowH * 0.6 <= top; z += rowH, row++) {
    for (let c = 0; c < cols; c++) {
      const u1 = (c + 0.25) / cols;
      const u2 = (c + 0.75) / cols;
      const hash = Math.sin((opts.seed + row * 7.3 + c * 3.1 + (face === 'left' ? 0 : 11)) * 12.9898) * 43758.5;
      const lucky = hash - Math.floor(hash);
      const glow = ICE[Math.floor(lucky * ICE.length) % ICE.length];
      const on = opts.lit && lucky > 0.18;
      const fill = on ? glow : dusk(opts.fill ?? GLASS, opts.night * 0.35);
      out.push(
        <polygon
          key={`${face}-${row}-${c}`}
          points={pts(faceQuad(r, face, u1, u2, z, z + rowH * 0.6))}
          className={on ? 'win-on' : undefined}
          fill={fill}
          stroke={on ? 'rgba(214,232,248,0.7)' : '#0c1218'}
          strokeWidth={0.55}
        />,
      );
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
    <g stroke={INK} strokeWidth={1} strokeLinejoin="round">
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

function door(r: Rect, face: Face, u: number, w: number, hgt: number, color = '#2a3138') {
  return <polygon points={pts(faceQuad(r, face, u - w / 2, u + w / 2, 0, hgt))} fill={color} stroke={INK} strokeWidth={1.2} />;
}

function shadow(r: Rect, night: number) {
  const s = [proj(r.x0 + 0.2, r.y1, 0), proj(r.x1, r.y1, 0), proj(r.x1, r.y0 + 0.2, 0), proj(r.x1 + 0.55, r.y0 + 0.55, 0), proj(r.x1 + 0.55, r.y1 + 0.55, 0), proj(r.x0 + 0.55, r.y1 + 0.55, 0)];
  return <polygon points={pts(s)} fill="#05070a" opacity={0.42 * (1 - night * 0.35)} />;
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
      parts.push(...windows(r, 'left', h, { z1: 14, lit, night, seed, per: 2 }));
      parts.push(...windows(r, 'right', h, { z1: 14, lit, night, seed, per: 2 }));
      parts.push(<IsoBox night={night} key="cap" r={inset(r, 0.5)} z0={h} h={h + 10} color={shade(s.color, -0.1)} />);
      const c = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, h + 10);
      parts.push(<line key="ant" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 34} stroke={INK} strokeWidth={2} />);
      parts.push(<circle key="ant2" cx={c.x} cy={c.y - 36} r={3.2} fill="#c4f93e" stroke={INK} strokeWidth={0.8} className="blink" />);
      if (sign) {
        parts.push(
          <g key="sign" transform={faceText(r, 'left', 0.1, h - 2)}>
            <rect x={0} y={0} width={signWidth(sign)} height={14} fill="#0e1216" stroke="#c5d8ea" strokeWidth={0.8} />
            <text x={5} y={10} className="iso-sign">{sign}</text>
          </g>,
        );
      }
      parts.push(door(r, 'left', 0.5, 0.18, 16, '#1c2833'));
      break;
    }
    case 'studio': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      const len = faceLen(r, 'left');
      parts.push(<polygon key="film" points={pts(faceQuad(r, 'left', 0.06, 0.94, 34, 70))} fill="#1a1f26" stroke={INK} strokeWidth={0.9} />);
      const frames = Math.max(3, Math.round(len * 1.5));
      for (let i = 0; i < frames; i++) {
        const u1 = 0.08 + (0.84 * (i + 0.12)) / frames;
        const u2 = 0.08 + (0.84 * (i + 0.88)) / frames;
        parts.push(<polygon key={`fr${i}`} points={pts(faceQuad(r, 'left', u1, u2, 40, 64))} fill={lit ? ICE[i % ICE.length] : T('#1a2026')} stroke="#0c1218" strokeWidth={0.6} />);
      }
      parts.push(<polygon key="garage" points={pts(faceQuad(r, 'right', 0.25, 0.75, 0, 34))} fill="#14181d" stroke={INK} strokeWidth={0.9} />);
      for (let z = 6; z < 34; z += 6) {
        const a = faceQuad(r, 'right', 0.25, 0.75, z, z);
        parts.push(<line key={`g${z}`} x1={a[0].x} y1={a[0].y} x2={a[1].x} y2={a[1].y} stroke={INK} strokeWidth={0.7} opacity={0.6} />);
      }
      parts.push(door(r, 'left', 0.15, 0.1, 22));
      if (sign) {
        const sr: Rect = { x0: r.x0 + (r.x1 - r.x0) * 0.55, x1: r.x1 - 0.2, y0: r.y1 - 0.25, y1: r.y1 - 0.1 };
        parts.push(<IsoBox night={night} key="sb" r={sr} z0={h} h={h + 22} color="#1c2228" sw={1.2} />);
        parts.push(<text key="st" transform={faceText(sr, 'left', 0.1, h + 6)} className="iso-sign">{sign}</text>);
      }
      break;
    }
    case 'house': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(...windows(r, 'left', h, { z1: 12, lit, night, seed, per: 1.3, rowH: 24 }));
      parts.push(...windows(r, 'right', h, { z1: 12, lit, night, seed, per: 1.3, rowH: 24 }));
      const ch = { x0: r.x0 + 0.4, x1: r.x0 + 0.75, y0: r.y0 + 0.4, y1: r.y0 + 0.75 };
      parts.push(<IsoBox night={night} key="ch" r={ch} z0={h} h={h + 50} color="#5a626c" />);
      parts.push(pyramidRoof(r, h, 46, T(s.roof ?? CONCRETE)));
      parts.push(<circle key="smoke1" className="smoke" cx={proj(ch.x0, ch.y0, h + 60).x} cy={proj(ch.x0, ch.y0, h + 60).y} r={6} />);
      parts.push(<circle key="smoke2" className="smoke smoke-b" cx={proj(ch.x0, ch.y0, h + 60).x + 4} cy={proj(ch.x0, ch.y0, h + 60).y - 6} r={5} />);
      parts.push(door(r, 'left', 0.5, 0.16, 20, '#2a3138'));
      break;
    }
    case 'postoffice': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(...windows(r, 'left', h, { z1: 10, z2: h - 24, lit, night, seed, per: 1.4, rowH: 30 }));
      parts.push(...windows(r, 'right', h, { z1: 10, lit, night, seed, per: 1.4, rowH: 30 }));
      if (sign) {
        parts.push(
          <g key="sign" transform={faceText(r, 'left', 0.12, h - 6)}>
            <rect x={0} y={0} width={signWidth(sign)} height={14} fill="#0e1216" stroke="#c5d8ea" strokeWidth={0.8} />
            <text x={5} y={10} className="iso-sign">{sign}</text>
          </g>,
        );
      }
      const c = proj(r.x1 - 0.5, r.y0 + 0.5, h);
      parts.push(<line key="pole" x1={c.x} y1={c.y} x2={c.x} y2={c.y - 46} stroke={INK} strokeWidth={2} />);
      parts.push(<path key="flag" className="flag" d={`M${c.x},${c.y - 46} l22,5 -22,7 z`} fill="#d5dee6" stroke={INK} strokeWidth={0.8} />);
      const mb = proj(r.x0 + 0.3, r.y1 + 0.35, 0);
      parts.push(
        <g key="mail" transform={`translate(${mb.x} ${mb.y})`}>
          <rect x={-5} y={-18} width={10} height={16} rx={1} fill="#2a3138" stroke="#c5d0da" strokeWidth={0.8} />
          <rect x={-2} y={-2} width={4} height={3} fill="#c4f93e" />
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
          parts.push(<polygon key={`${face}c${i}`} points={pts(faceQuad(r, face, u - 0.035, u + 0.035, 4, h - 10))} fill="#d5e2ee" stroke="#8ea4b6" strokeWidth={0.5} />);
        }
      }
      parts.push(<IsoBox night={night} key="steps" r={{ x0: r.x0 - 0.15, x1: r.x1 + 0.15, y0: r.y0 - 0.15, y1: r.y1 + 0.15 }} h={4} color="#1c2228" sw={0.8} />);
      parts.push(pyramidRoof({ x0: r.x0 - 0.1, x1: r.x1 + 0.1, y0: r.y0 - 0.1, y1: r.y1 + 0.1 }, h, 30, T(s.roof ?? '#5c656e')));
      const coin = faceQuad(r, 'right', 0.4, 0.6, 22, 42);
      const cc = { x: (coin[0].x + coin[2].x) / 2, y: (coin[0].y + coin[2].y) / 2 };
      parts.push(<ellipse key="coin" cx={cc.x} cy={cc.y} rx={9} ry={11} fill="#cfc6b4" stroke={INK} strokeWidth={0.8} />);
      parts.push(<text key="coin$" x={cc.x} y={cc.y + 4} textAnchor="middle" className="iso-sign">$</text>);
      if (sign) parts.push(<text key="st" transform={faceText(r, 'left', 0.36, h - 1)} className="iso-sign">{sign}</text>);
      break;
    }
    case 'cafe': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(...windows(r, 'left', h, { z1: 30, lit, night, seed, per: 1.4, rowH: 30 }));
      for (const face of ['left', 'right'] as Face[]) {
        const n = Math.round(faceLen(r, face) * 5);
        for (let i = 0; i < n; i++) {
          parts.push(
            <polygon key={`${face}aw${i}`} points={pts(faceQuad(r, face, i / n, (i + 1) / n, 18, 28))} fill={i % 2 ? '#1a2026' : '#3c444d'} stroke={INK} strokeWidth={0.45} />,
          );
        }
      }
      parts.push(door(r, 'right', 0.5, 0.18, 17, '#2a3138'));
      if (sign) {
        const sr: Rect = { x0: r.x0 + 0.3, x1: r.x0 + 1.3, y0: r.y1 - 0.2, y1: r.y1 - 0.08 };
        parts.push(<IsoBox night={night} key="sb" r={sr} z0={h} h={h + 18} color="#1c2228" sw={1.1} />);
        parts.push(<text key="st" transform={faceText(sr, 'left', 0.18, h + 5)} className="iso-sign">{sign}</text>);
      }
      const t = proj(r.x0 + 0.5, r.y1 + 0.45, 0);
      parts.push(
        <g key="table" transform={`translate(${t.x} ${t.y})`}>
          <line x1={0} y1={0} x2={0} y2={-10} stroke={INK} strokeWidth={1.4} />
          <ellipse cx={0} cy={-10} rx={7} ry={3.5} fill="#1c2228" stroke="#c5d0da" strokeWidth={0.7} />
          <path d="M-9,-14 L0,-26 L9,-14 Z" fill="#d5dee6" stroke={INK} strokeWidth={0.7} />
        </g>,
      );
      break;
    }
    case 'apt': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(...windows(r, 'left', h, { z1: 12, lit, night, seed, per: 1.7 }));
      parts.push(...windows(r, 'right', h, { z1: 12, lit, night, seed, per: 1.7 }));
      parts.push(<IsoBox night={night} key="cap" r={inset(r, 0.35)} z0={h} h={h + 8} color={shade(s.color, -0.12)} />);
      break;
    }
    case 'cottage': {
      parts.push(<IsoBox night={night} key="b" r={r} h={h} color={s.color} />);
      parts.push(...windows(r, 'left', h, { z1: 8, lit, night, seed, per: 1.2, rowH: 22 }));
      parts.push(pyramidRoof(r, h, 26, T(s.roof ?? CONCRETE)));
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
  const c = dusk(tone ? '#24302a' : '#1c2822', night * 0.25);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="tree">
      <ellipse cx={4} cy={1} rx={13} ry={5} fill="#05070a" opacity={0.4} />
      <line x1={0} y1={0} x2={0} y2={-14} stroke="#3a4240" strokeWidth={2.4} />
      <g className="sway">
        <circle cx={0} cy={-24} r={12} fill={c} stroke={INK} strokeWidth={1.3} />
        <circle cx={-4} cy={-28} r={4} fill={shade(c, 0.3)} />
      </g>
    </g>
  );
}

export function Lamp({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  const p = proj(x, y, 0);
  const glow = '#d7e6f4';
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      {lit && <ellipse cx={0} cy={0} rx={18} ry={8} fill={glow} opacity={0.16} />}
      <line x1={0} y1={0} x2={0} y2={-32} stroke="#c5ccd4" strokeWidth={1.6} />
      <circle cx={0} cy={-34} r={3.2} fill={lit ? glow : '#2a3138'} stroke={INK} strokeWidth={0.8} />
      {lit && <circle cx={0} cy={-34} r={9} fill={glow} opacity={0.22} />}
    </g>
  );
}
