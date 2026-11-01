import { SERIES } from '../game/data';
import { POSTS_PER_DAY, weatherAt } from '../game/sim';
import { useSim } from '../game/useSim';
import { formatClock, formatElapsed } from '../format';

const SPEEDS = [1, 2, 4];

export function Header() {
  const sim = useSim();
  const s = sim.state;
  const needs = s.prompts.length;
  const verse = SERIES[Math.floor(s.real / 7) % SERIES.length];
  return (
    <header className="header">
      <div className="brand">
        <button className="pause-mark" onClick={() => sim.togglePause()} aria-label={s.paused ? '继续' : '暂停'}>
          {s.paused ? '▶' : '❚❚'}
        </button>
        <div>
          <h1>
            不可思议之城
            <span className="shift">夜班</span>
          </h1>
          <div className="verse">
            <span style={{ color: verse.color }}>{verse.key}</span>
            <span>「{verse.verse}」</span>
          </div>
        </div>
      </div>
      <div className="header-pills">
        <div className="pill">
          <span className="pill-l">在线</span>
          <b>6/6</b>
        </div>
        <div className="pill">
          <span className="pill-l">完成</span>
          <b>
            {s.metrics.posts}/{POSTS_PER_DAY}
          </b>
        </div>
        <div className={`pill ${needs ? 'hot' : ''}`}>
          <span className="pill-l">需要你</span>
          <b>{needs}</b>
        </div>
        <div className="pill">
          <span className="pill-l">在线时长</span>
          <b className="mono-num">{formatElapsed(s.real)}</b>
        </div>
      </div>
      <div className="header-controls">
        <div className="seg" role="group" aria-label="速度">
          {SPEEDS.map((v) => (
            <button key={v} data-testid={`speed-${v}`} className={!s.paused && s.speed === v ? 'on' : ''} onClick={() => sim.setSpeed(v)}>
              {v}x
            </button>
          ))}
        </div>
        <button className="ghost-btn" data-testid="wrap" onClick={() => (s.ended ? sim.restart() : sim.wrapDay())}>
          {s.ended ? '再开一夜' : '收班'}
        </button>
        <ClockWidget />
        <div className="user-chip">
          <span className="avatar">你</span>
          <span>
            值班
            <small>
              <i /> 在线
            </small>
          </span>
        </div>
      </div>
    </header>
  );
}

export function ClockWidget() {
  const sim = useSim();
  const { temp } = weatherAt(sim.state.clock);
  const ended = sim.state.ended;
  return (
    <div className="clock-widget">
      <div className="clock-time">{formatClock(sim.state.clock)}</div>
      <div className="clock-meta">
        {ended ? '夜班收工' : '夜班 · 晴'} {temp}°
        <br />
        借腹南瓜城亮着
      </div>
    </div>
  );
}
