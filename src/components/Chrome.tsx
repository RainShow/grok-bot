import { AGENTS } from '../game/data';
import { agentMode, weatherAt, POSTS_PER_DAY, type Weather } from '../game/sim';
import { useSim } from '../game/useSim';
import { formatClock, formatElapsed } from '../format';

const SPEEDS = [1, 2, 4];

export function Header() {
  const sim = useSim();
  const s = sim.state;
  return (
    <header className="header">
      <div className="brand">
        <div className="crumbs">
          field notes <span className="sep">&gt;</span> a content machine
        </div>
        <h1>
          Grok City <span className="subtitle">/ from a trending post to your timeline</span>
        </h1>
      </div>
      <div className="header-controls">
        <div className="live">
          <span className={`live-dot ${s.paused || s.ended ? 'off' : ''}`} />
          {s.ended ? 'wrapped' : s.paused ? 'paused' : 'live'} <span className="mono-num">{formatElapsed(s.real)}</span>
        </div>
        <div className="seg" role="group" aria-label="simulation speed">
          <button className={s.paused ? 'on' : ''} onClick={() => sim.togglePause()} aria-label="pause">
            {s.paused ? '▶' : '❚❚'}
          </button>
          {SPEEDS.map((v) => (
            <button key={v} className={!s.paused && s.speed === v ? 'on' : ''} onClick={() => sim.setSpeed(v)}>
              {v}x
            </button>
          ))}
        </div>
        <button className="ghost-btn" onClick={() => (s.ended ? sim.restart() : sim.wrapDay())}>
          {s.ended ? 'new day' : 'wrap day'}
        </button>
      </div>
      <ClockWidget />
    </header>
  );
}

function WeatherIcon({ w }: { w: Weather }) {
  const stroke = { stroke: '#2b2833', strokeWidth: 1.3 };
  return (
    <svg width={14} height={14} viewBox="-8 -8 16 16" className="wx-icon" aria-label={w}>
      {w === 'sunny' && (
        <g {...stroke}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1={0} y1={-5.5} x2={0} y2={-7.5} transform={`rotate(${a})`} />
          ))}
          <circle r={3.6} fill="#f2c14e" />
        </g>
      )}
      {(w === 'cloudy' || w === 'rain') && (
        <g {...stroke}>
          <path d="M-6,2 a3,3 0 0 1 1,-5.5 a4,4 0 0 1 7.5,0.5 a2.6,2.6 0 0 1 3,5 z" fill="#fbf7ee" />
          {w === 'rain' && <path d="M-3,4 l-1,3 M1,4 l-1,3 M5,4 l-1,3" stroke="#2f6fe0" />}
        </g>
      )}
      {w === 'clear' && <path d="M2,-6 a6,6 0 1 0 4,9 a5,5 0 0 1 -4,-9 z" fill="#ffd76a" {...stroke} />}
    </svg>
  );
}

export function ClockWidget() {
  const sim = useSim();
  const { weather, temp } = weatherAt(sim.state.clock);
  return (
    <div className="clock-widget">
      <div className="clock-time">{formatClock(sim.state.clock)}</div>
      <div className="clock-meta">
        day one · sun
        <br />
        <WeatherIcon w={weather} /> grok city · {weather} {temp}°
      </div>
    </div>
  );
}

export function StatsStrip() {
  const sim = useSim();
  const s = sim.state;
  const running = AGENTS.filter((a) => {
    const m = agentMode(s.agents[a.id]);
    return m === 'working' || m === 'moving';
  }).length;
  const stats = [
    { n: running, label: 'running', tone: 'green' },
    { n: s.queue.length, label: 'queued', tone: 'blue' },
    { n: s.prompts.length, label: 'needs you', tone: s.prompts.length ? 'amber' : 'muted' },
    { n: `${s.metrics.posts}/${POSTS_PER_DAY}`, label: 'posted today', tone: 'ink' },
  ];
  return (
    <div className="stats-strip glass">
      {stats.map((x) => (
        <div key={x.label} className={`stat tone-${x.tone}`}>
          <div className="stat-n">{x.n}</div>
          <div className="stat-l">{x.label}</div>
        </div>
      ))}
    </div>
  );
}
