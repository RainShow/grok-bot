import { SERIES } from '../game/data';
import { POSTS_PER_DAY, weatherAt } from '../game/sim';
import { useSim } from '../game/useSim';
import { formatClock, formatElapsed } from '../format';
import { seriesName, seriesVerse } from '../i18n/copy';
import { useI18n } from '../i18n/lang';

const SPEEDS = [1, 2, 4];

export function Header() {
  const sim = useSim();
  const { lang, t, toggle } = useI18n();
  const s = sim.state;
  const needs = s.prompts.length;
  const verse = SERIES[Math.floor(s.real / 7) % SERIES.length];
  return (
    <header className="header">
      <div className="brand">
        <button className="pause-mark" onClick={() => sim.togglePause()} aria-label={s.paused ? t.resume : t.pause}>
          {s.paused ? '▶' : '❚❚'}
        </button>
        <div>
          <h1>
            不可思议之城
            <span className="shift">{t.night}</span>
          </h1>
          {t.gloss && <div className="gloss">{t.gloss}</div>}
          <div className="verse">
            <span style={{ color: verse.color }}>{seriesName(lang, verse.id)}</span>
            <span>{lang === 'zh' ? `「${seriesVerse(lang, verse.id)}」` : `“${seriesVerse(lang, verse.id)}”`}</span>
          </div>
        </div>
      </div>
      <div className="header-pills">
        <div className="pill">
          <span className="pill-l">{t.online}</span>
          <b>6/6</b>
        </div>
        <div className="pill">
          <span className="pill-l">{t.done}</span>
          <b>
            {s.metrics.posts}/{POSTS_PER_DAY}
          </b>
        </div>
        <div className={`pill ${needs ? 'hot' : ''}`}>
          <span className="pill-l">{t.needs}</span>
          <b>{needs}</b>
        </div>
        <div className="pill">
          <span className="pill-l">{t.uptime}</span>
          <b className="mono-num">{formatElapsed(s.real)}</b>
        </div>
      </div>
      <div className="header-controls">
        <div className="seg" role="group" aria-label={t.speed}>
          {SPEEDS.map((v) => (
            <button key={v} data-testid={`speed-${v}`} className={!s.paused && s.speed === v ? 'on' : ''} onClick={() => sim.setSpeed(v)}>
              {v}x
            </button>
          ))}
        </div>
        <button className="ghost-btn" data-testid="wrap" onClick={() => (s.ended ? sim.restart() : sim.wrapDay())}>
          {s.ended ? t.newNight : t.wrap}
        </button>
        <ClockWidget />
        <div className="user-chip">
          <span className="avatar">{t.you}</span>
          <span>
            {t.duty}
            <small>
              <i /> {t.onlineDot}
            </small>
          </span>
        </div>
        <button type="button" className="lang-toggle" data-testid="lang-toggle" onClick={toggle} aria-label={t.langSwitch} title={t.langSwitch}>
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <ellipse cx="8" cy="8" rx="2.6" ry="6.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M2.2 8h11.6M3.2 5.2h9.6M3.2 10.8h9.6" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>{t.langLabel}</span>
        </button>
      </div>
    </header>
  );
}

export function ClockWidget() {
  const sim = useSim();
  const { t } = useI18n();
  const { temp } = weatherAt(sim.state.clock);
  const ended = sim.state.ended;
  return (
    <div className="clock-widget">
      <div className="clock-time">{formatClock(sim.state.clock)}</div>
      <div className="clock-meta">
        {ended ? t.wrapped : t.clear} {temp}°
        <br />
        {t.pumpkinLit}
      </div>
    </div>
  );
}
