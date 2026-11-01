import { memo, useMemo, type ReactNode } from 'react';
import { AGENTS, AGENT_BY_ID, type AgentDef } from '../../game/data';
import { N, P, dusk, proj, pts, rotPt, rotRect, shade, type Pt } from '../../game/iso';
import { agentMode, nightAt, type AgentState } from '../../game/sim';
import { useSim, useSimFrame } from '../../game/useSim';
import {
  BILLBOARD, BUILDINGS, CONVEYORS, FILLERS, HUB, LAMPS, TREES, isPlaza, isRoad, type Building,
} from '../../game/world';
import { Lamp, StructureView, Tree } from './structures';
import { formatCompact } from '../../format';

const INK = '#2b2833';

export interface CityProps {
  rot: number;
  zoom: number;
  pan: Pt;
  labels: boolean;
}

export function City({ rot, zoom, pan, labels }: CityProps) {
  const sim = useSim();
  const night = Math.round(nightAt(sim.state.clock) * 10) / 10;
  return (
    <svg className="city-svg" viewBox="-560 -228 1120 745" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff9ea" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff9ea" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="camera" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <ellipse cx={0} cy={200} rx={560} ry={300} fill="url(#glow)" />
        <StaticCity rot={rot} night={night} />
        <Billboard rot={rot} />
        <Dynamic rot={rot} labels={labels} />
      </g>
    </svg>
  );
}

const StaticCity = memo(function StaticCity({ rot, night }: { rot: number; night: number }) {
  const ground = useMemo(() => {
    const T = (c: string) => dusk(c, night);
    const out: ReactNode[] = [];
    const corners = [P(0, 0, 0, rot), P(N, 0, 0, rot), P(N, N, 0, rot), P(0, N, 0, rot)];
    const r = rotRect(0, 0, N, N, rot);
    const fl = [proj(r.x0, r.y1, 0), proj(r.x1, r.y1, 0), proj(r.x1, r.y1, -26), proj(r.x0, r.y1, -26)];
    const fr = [proj(r.x1, r.y1, 0), proj(r.x1, r.y0, 0), proj(r.x1, r.y0, -26), proj(r.x1, r.y1, -26)];
    out.push(<polygon key="slab-l" points={pts(fl)} fill={T('#c98f5c')} stroke={INK} strokeWidth={1.5} />);
    out.push(<polygon key="slab-r" points={pts(fr)} fill={T('#a8723f')} stroke={INK} strokeWidth={1.5} />);
    out.push(<polygon key="slab-t" points={pts(corners)} fill={T('#a9d08a')} stroke={INK} strokeWidth={1.5} />);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const road = isRoad(i, j);
        const plaza = isPlaza(i, j);
        const tone = (i * 7 + j * 3) % 5 === 0;
        const fill = road ? '#b6b2d4' : plaza ? '#efe6d2' : tone ? '#b3d793' : '#aad18a';
        const d = [P(i, j, 0, rot), P(i + 1, j, 0, rot), P(i + 1, j + 1, 0, rot), P(i, j + 1, 0, rot)];
        out.push(<polygon key={`t${i}-${j}`} points={pts(d)} fill={T(fill)} stroke={T(road ? '#a19dc4' : plaza ? '#e0d6bf' : '#9fc77f')} strokeWidth={0.6} />);
        if (road) {
          const colRoad = i === 4 || i === 8;
          const rowRoad = j === 4 || j === 8;
          if (colRoad && !rowRoad) {
            const zebra = j === 3 || j === 5 || j === 7 || j === 9;
            if (zebra) {
              const top = j === 3 || j === 7 ? j + 0.55 : j + 0.05;
              for (let k = 0; k < 5; k++) {
                const x = i + 0.14 + k * 0.18;
                const a = P(x, top, 0, rot);
                const b = P(x, top + 0.4, 0, rot);
                out.push(<line key={`z${i}-${j}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fbf7ee" strokeWidth={3} />);
              }
            } else {
              const a = P(i + 0.5, j + 0.25, 0, rot);
              const b = P(i + 0.5, j + 0.75, 0, rot);
              out.push(<line key={`d${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fbf7ee" strokeWidth={2} />);
            }
          } else if (rowRoad && !colRoad) {
            const zebra = i === 3 || i === 5 || i === 7 || i === 9;
            if (zebra) {
              const left = i === 3 || i === 7 ? i + 0.55 : i + 0.05;
              for (let k = 0; k < 5; k++) {
                const y = j + 0.14 + k * 0.18;
                const a = P(left, y, 0, rot);
                const b = P(left + 0.4, y, 0, rot);
                out.push(<line key={`z${i}-${j}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fbf7ee" strokeWidth={3} />);
              }
            } else {
              const a = P(i + 0.25, j + 0.5, 0, rot);
              const b = P(i + 0.75, j + 0.5, 0, rot);
              out.push(<line key={`d${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fbf7ee" strokeWidth={2} />);
            }
          }
        }
      }
    }
    const f = P(6.5, 6.5, 0, rot);
    out.push(
      <g key="fountain" transform={`translate(${f.x} ${f.y + 6})`}>
        <ellipse rx={30} ry={15} fill="#d8cdb4" stroke={INK} strokeWidth={1.3} />
        <ellipse rx={23} ry={11} fill="#9fd0e6" stroke={INK} strokeWidth={1} />
        <ellipse className="ripple" rx={10} ry={5} fill="none" stroke="#fbf7ee" strokeWidth={1.5} />
      </g>,
    );
    return out;
  }, [rot, night]);

  const sorted = useMemo(() => {
    const lit = night > 0.45;
    const items: { d: number; el: ReactNode }[] = [];
    for (const s of [...BUILDINGS, ...FILLERS]) {
      const r = rotRect(s.x0, s.y0, s.x1, s.y1, rot);
      items.push({ d: (r.x0 + r.x1 + r.y0 + r.y1) / 2, el: <StructureView key={s.id} s={s} rot={rot} night={night} /> });
    }
    TREES.forEach(([x, y], i) => {
      const [a, b] = rotPt(x, y, rot);
      items.push({ d: a + b, el: <Tree key={`tr${i}`} x={a} y={b} night={night} /> });
    });
    LAMPS.forEach(([x, y], i) => {
      const [a, b] = rotPt(x, y, rot);
      items.push({ d: a + b, el: <Lamp key={`l${i}`} x={a} y={b} lit={lit} /> });
    });
    const [hx, hy] = rotPt(HUB.x, HUB.y, rot);
    items.push({ d: hx + hy, el: <Hub key="hub" x={hx} y={hy} /> });
    return items.sort((a, b) => a.d - b.d).map((i) => i.el);
  }, [rot, night]);

  return (
    <g>
      {ground}
      <g style={{ filter: `brightness(${1 - night * 0.4})` }}>
        <Conveyors rot={rot} />
      </g>
      {sorted}
    </g>
  );
});

function Hub({ x, y }: { x: number; y: number }) {
  const p = proj(x, y, 0);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="hub">
      <ellipse rx={30} ry={15} fill="#c9c3e6" stroke={INK} strokeWidth={1.3} />
      <path d="M-20,0 V-22 A20,10 0 0 0 20,-22 V0 A20,10 0 0 1 -20,0 Z" fill="#8c84c9" stroke={INK} strokeWidth={1.3} />
      <ellipse cy={-22} rx={20} ry={10} fill="#b2abe0" stroke={INK} strokeWidth={1.3} />
      <path d="M-14,-24 A14,16 0 0 1 14,-24" fill="#e8f4fb" fillOpacity={0.7} stroke={INK} strokeWidth={1.1} />
      <circle className="hub-light" cy={-40} r={3.5} fill="#5fe0a0" stroke={INK} strokeWidth={1} />
    </g>
  );
}

function Conveyors({ rot }: { rot: number }) {
  return (
    <g className="conveyors">
      {CONVEYORS.map((line, li) => {
        const top = line.map(([x, y]) => P(x, y, 22, rot));
        const d = `M${top.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
        const posts: ReactNode[] = [];
        for (let k = 0; k < line.length - 1; k++) {
          const [ax, ay] = line[k];
          const [bx, by] = line[k + 1];
          const len = Math.hypot(bx - ax, by - ay);
          for (let s = 0.5; s < len; s += 1) {
            const t = s / len;
            const g = P(ax + (bx - ax) * t, ay + (by - ay) * t, 0, rot);
            posts.push(<line key={`${k}-${s}`} x1={g.x} y1={g.y} x2={g.x} y2={g.y - 22} stroke={INK} strokeWidth={1.6} />);
          }
        }
        const pkgs = [0, 1, 2, 3].map((k) => (
          <g key={k}>
            <g>
              <rect x={-6} y={-12} width={12} height={9} rx={1.5} fill="#e2b77c" stroke={INK} strokeWidth={1} />
              <line x1={0} y1={-12} x2={0} y2={-3} stroke="#b07a49" strokeWidth={1.2} />
              <animateMotion dur={li === 0 ? '9s' : '6s'} repeatCount="indefinite" begin={`${-k * (li === 0 ? 2.25 : 1.5)}s`} path={d} />
            </g>
          </g>
        ));
        return (
          <g key={li}>
            {posts}
            <path d={d} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#7b76a3" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} className="belt" fill="none" stroke="#d9d5ee" strokeWidth={2} strokeDasharray="4 6" />
            {pkgs}
          </g>
        );
      })}
    </g>
  );
}

function Billboard({ rot }: { rot: number }) {
  const sim = useSim();
  let a = P(BILLBOARD.x0, BILLBOARD.y, 0, rot);
  let b = P(BILLBOARD.x1, BILLBOARD.y, 0, rot);
  if (b.x < a.x) [a, b] = [b, a];
  const k = (b.y - a.y) / (b.x - a.x);
  const w = b.x - a.x;
  const z0 = 34;
  const hgt = 56;
  const panel = [
    { x: a.x, y: a.y - z0 }, { x: b.x, y: b.y - z0 }, { x: b.x, y: b.y - z0 - hgt }, { x: a.x, y: a.y - z0 - hgt },
  ];
  return (
    <g className="billboard">
      <line x1={a.x + 8} y1={a.y} x2={a.x + 8} y2={a.y - z0} stroke={INK} strokeWidth={2.5} />
      <line x1={b.x - 8} y1={b.y} x2={b.x - 8} y2={b.y - z0} stroke={INK} strokeWidth={2.5} />
      <polygon points={pts(panel)} fill="#2a2d3a" stroke={INK} strokeWidth={2} />
      <g transform={`translate(${a.x} ${a.y - z0 - hgt}) matrix(1 ${k} 0 1 0 0)`}>
        <text x={w / 2} y={20} textAnchor="middle" className="bb-label">VIEWS</text>
        <text x={w / 2} y={45} textAnchor="middle" className="bb-value">{formatCompact(sim.state.metrics.views)}</text>
      </g>
    </g>
  );
}

function agentScreen(a: AgentState, rot: number, t: number, idx: number) {
  let x: number;
  let y: number;
  let hop = 0;
  if (a.path) {
    const k = Math.min(a.path.length - 1, Math.floor(a.pos));
    const n = Math.min(a.path.length - 1, k + 1);
    const f = a.pos - k;
    x = a.path[k][0] + (a.path[n][0] - a.path[k][0]) * f + 0.5;
    y = a.path[k][1] + (a.path[n][1] - a.path[k][1]) * f + 0.5;
    hop = Math.abs(Math.sin(a.pos * Math.PI)) * 11;
  } else {
    x = a.tile[0] + 0.5;
    y = a.tile[1] + 0.5;
    hop = Math.abs(Math.sin(t * 2.2 + idx)) * (agentMode(a) === 'working' ? 4 : 1.5);
  }
  const off = [[-0.22, -0.2], [0.22, -0.18], [-0.2, 0.22], [0.2, 0.2], [0, -0.3], [0, 0.3]][idx];
  const p = P(x + off[0], y + off[1], 0, rot);
  return { x: p.x, y: p.y, hop };
}

function Bot({ def, mode }: { def: AgentDef; mode: string }) {
  const c = def.color;
  const body =
    def.shape === 'pill' ? (
      <rect x={-11} y={-27} width={22} height={25} rx={10} fill={c} stroke={INK} strokeWidth={1.6} />
    ) : def.shape === 'ghost' ? (
      <path d="M-11,-3 V-16 a11,11 0 0 1 22,0 V-3 l-3.7,3 -3.7,-3 -3.6,3 -3.7,-3 -3.6,3 z" fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    ) : (
      <path d="M0,-29 L13,-2 H-13 Z" fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    );
  const eyesY = def.shape === 'tri' ? -12 : -17;
  return (
    <g>
      <ellipse cx={0} cy={1} rx={11} ry={4} fill="#4b437e" opacity={0.25} />
      {body}
      <ellipse cx={-6} cy={-21} rx={3} ry={2} fill={shade(c, 0.45)} opacity={0.7} />
      {mode === 'waiting' ? (
        <g stroke="#fff" strokeWidth={2} strokeLinecap="round">
          <line x1={-6} y1={eyesY + 2} x2={-2} y2={eyesY + 2} />
          <line x1={2} y1={eyesY + 2} x2={6} y2={eyesY + 2} />
        </g>
      ) : (
        <g fill="#fff">
          <rect className="eye" x={-5.5} y={eyesY - 1} width={3.4} height={7} rx={1.7} />
          <rect className="eye" x={2.1} y={eyesY - 1} width={3.4} height={7} rx={1.7} />
        </g>
      )}
    </g>
  );
}

function Dynamic({ rot, labels }: { rot: number; labels: boolean }) {
  const sim = useSimFrame();
  const s = sim.state;
  const t = s.real;
  const positions = AGENTS.map((d, i) => ({ d, a: s.agents[d.id], ...agentScreen(s.agents[d.id], rot, t, i) }));

  const paths = positions
    .filter((p) => p.a.path)
    .map(({ d, a, x, y }) => {
      const rest = a.path!.slice(Math.floor(a.pos) + 1).map(([i, j]) => P(i + 0.5, j + 0.5, 0, rot));
      const all = [{ x, y }, ...rest];
      const end = all[all.length - 1];
      return (
        <g key={`p-${d.id}`}>
          <polyline points={pts(all)} fill="none" stroke={d.color} strokeWidth={2.6} strokeDasharray="0.1 7" strokeLinecap="round" opacity={0.85} />
          <ellipse cx={end.x} cy={end.y} rx={12} ry={6} fill="none" stroke={d.color} strokeWidth={1.5} strokeDasharray="3 3" />
        </g>
      );
    });

  const bubble = s.activeBubble;
  let bubbleEl: ReactNode = null;
  if (bubble) {
    const b = BUILDINGS.find((x) => x.id === bubble.building)!;
    const dp = P(b.door[0] + 0.5, b.door[1] + 0.5, 0, rot);
    const needs = bubble.text === 'needs you';
    const w = bubble.text.length * 7.3 + 22;
    bubbleEl = (
      <g transform={`translate(${dp.x} ${dp.y - 70})`} className={needs ? 'bubble pulse' : 'bubble'}>
        <rect x={-w / 2} y={-14} width={w} height={24} fill={needs ? '#ffe16b' : '#fbf7ee'} stroke={INK} strokeWidth={1.5} />
        <path d="M-6,10 L0,18 L6,10" fill={needs ? '#ffe16b' : '#fbf7ee'} stroke={INK} strokeWidth={1.5} />
        <line x1={-5} y1={10} x2={5} y2={10} stroke={needs ? '#ffe16b' : '#fbf7ee'} strokeWidth={2} />
        <text x={0} y={2} textAnchor="middle" className="bubble-text">{bubble.text}</text>
      </g>
    );
  }

  return (
    <g>
      {paths}
      {positions
        .slice()
        .sort((a, b) => a.y - b.y)
        .map(({ d, a, x, y, hop }) => {
          const mode = agentMode(a);
          const w = d.name.length * 7 + 22;
          return (
            <g key={d.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} className={`agent agent-${mode}`}>
              <g transform={`translate(0 ${-hop})`}>
                <Bot def={d} mode={mode} />
                {a.carrying && (
                  <g transform="translate(0 -36)">
                    <rect x={-7} y={-8} width={14} height={10} rx={1.5} fill="#e2b77c" stroke={INK} strokeWidth={1.1} />
                    <line x1={0} y1={-8} x2={0} y2={2} stroke="#b07a49" strokeWidth={1.2} />
                  </g>
                )}
                {mode === 'working' && (
                  <g className="typing" transform="translate(14 -30)">
                    <circle cx={0} cy={0} r={1.8} fill={INK} />
                    <circle cx={5} cy={0} r={1.8} fill={INK} />
                    <circle cx={10} cy={0} r={1.8} fill={INK} />
                  </g>
                )}
              </g>
              {labels && (
                <g transform={`translate(0 ${a.carrying ? -66 : -50})`}>
                  <rect x={-w / 2} y={-9} width={w} height={17} fill="#fbf7ee" stroke={INK} strokeWidth={1.2} />
                  <circle cx={-w / 2 + 9} cy={-0.5} r={3.5} fill={d.color} />
                  <text x={-w / 2 + 17} y={3.5} className="nametag">{d.name}</text>
                </g>
              )}
            </g>
          );
        })}
      {labels && BUILDINGS.map((b) => <Callout key={b.id} b={b} rot={rot} />)}
      {bubbleEl}
    </g>
  );
}

function Callout({ b, rot }: { b: Building; rot: number }) {
  const sim = useSim();
  const s = sim.state;
  const r = rotRect(b.x0, b.y0, b.x1, b.y1, rot);
  const extra = b.kind === 'house' ? 44 : b.kind === 'bank' ? 28 : 10;
  const anchor = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, b.h + extra);
  const ground = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0);
  const w = 150;
  const ang = Math.atan2((ground.y - 208) * 2, ground.x);
  const c = Math.cos(ang);
  let bx: number;
  let by: number;
  if (Math.abs(c) < 0.35) {
    bx = anchor.x + 46;
    by = Math.sin(ang) < 0 ? anchor.y - 13 : ground.y;
  } else {
    bx = c * 420 - w / 2;
    by = 208 + Math.sin(ang) * 250 - 33;
  }
  bx = Math.max(-420, Math.min(420 - w, bx));
  by = Math.max(-245, Math.min(400, by));
  const here = AGENTS.filter((d) => s.agents[d.id].at === b.id && !s.agents[d.id].path);
  const working = here.find((d) => agentMode(s.agents[d.id]) === 'working');
  const waiting = here.find((d) => agentMode(s.agents[d.id]) === 'waiting');
  const statusAgent = waiting ?? working;
  const status = waiting ? 'needs you' : working ? s.agents[working.id].status : here.length ? `${here.length} inside` : 'quiet';
  const dot = waiting ? '#f0a020' : working ? '#2fbf71' : '#b9b3a6';
  const elbowX = anchor.x < bx ? bx : anchor.x > bx + w ? bx + w : anchor.x;
  const elbowY = anchor.x >= bx && anchor.x <= bx + w ? by + 66 : by + 13;
  const pillText = `${statusAgent ? AGENT_BY_ID[statusAgent.id].name + ' · ' : ''}${status}`.slice(0, 30);
  const pw = pillText.length * 6.1 + 22;
  return (
    <g className="callout">
      <polyline points={`${anchor.x},${anchor.y} ${anchor.x},${elbowY} ${elbowX},${elbowY}`} fill="none" stroke="#d0453a" strokeWidth={1.4} />
      <circle cx={anchor.x} cy={anchor.y} r={3} fill="#d0453a" />
      <g transform={`translate(${bx} ${by})`}>
        <rect x={0} y={0} width={w} height={26} fill="#fbf7ee" stroke={INK} strokeWidth={1.3} />
        <circle cx={w / 2} cy={0} r={4.5} fill="#fbf7ee" stroke={INK} strokeWidth={1.3} />
        <text x={5} y={8} className="callout-no">no. {b.no}</text>
        <text x={w / 2} y={20} textAnchor="middle" className="callout-name">{b.name}</text>
        <text x={w / 2} y={40} textAnchor="middle" className="callout-tag">{b.tagline}</text>
        <g transform={`translate(${(w - pw) / 2} 48)`} className={waiting ? 'pulse' : undefined}>
          <rect width={pw} height={16} rx={8} fill="#ffffffd9" stroke="#2b283355" strokeWidth={1} />
          <circle cx={9} cy={8} r={3.2} fill={dot} />
          <text x={16} y={11.5} className="callout-pill">{pillText}</text>
        </g>
      </g>
    </g>
  );
}
