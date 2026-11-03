import { useEffect, useState } from 'react';
import { BotDetail } from '../AgentCards';
import type { FleetBot } from '../../game/fleet';
import { useSim } from '../../game/useSim';
import { useI18n } from '../../i18n/lang';
import {
  ACTIVITIES,
  CLASSIFIED_LINE,
  CLASSIFIED_NAMES,
  FLOOR_BLURB,
  floorKicker,
  floorOf,
  floorTitle,
  presenceCounts,
  taskFor,
  type FloorId,
} from './model';

const TONE: Record<Exclude<FloorId, 'overview'>, { bg: string; fg: string }> = {
  night: { bg: '#243044', fg: '#f4f7fb' },
  content: { bg: '#e7a15a', fg: '#2a2118' },
  research: { bg: '#efe6d4', fg: '#2a241c' },
  lobby: { bg: '#3f9a62', fg: '#f4fff7' },
  classified: { bg: '#6e1c2a', fg: '#fff5f6' },
};

function peopleHere(floor: FloorId, bots: readonly FleetBot[]) {
  if (floor === 'classified') {
    return CLASSIFIED_NAMES.map((name) => bots.find((bot) => bot.name.toLowerCase() === name)).filter((bot): bot is FleetBot => Boolean(bot));
  }
  if (floor === 'overview') return [];
  return bots.filter((bot) => floorOf(bot) === floor);
}

const MENU: FloorId[] = ['overview', 'night', 'content', 'research', 'lobby', 'classified'];

export function OfficeChrome({
  floor,
  onFloor,
  selectedId,
  onClear,
  bots,
  sourceNote,
  opsOpen,
  onToggleOps,
}: {
  floor: FloorId;
  onFloor: (floor: FloorId) => void;
  selectedId: string | null;
  onClear: () => void;
  bots: readonly FleetBot[];
  sourceNote: string;
  opsOpen: boolean;
  onToggleOps: () => void;
}) {
  const { lang, t, toggle } = useI18n();
  const sim = useSim();
  const zh = lang === 'zh';
  const { working, waiting } = presenceCounts(bots);
  const selected = bots.find((bot) => bot.id === selectedId) ?? null;
  const [tick, setTick] = useState(0);
  const [access, setAccess] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 4800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (floor !== 'classified') {
      setAccess(false);
      return;
    }
    setAccess(true);
    const id = window.setTimeout(() => setAccess(false), 3200);
    return () => window.clearTimeout(id);
  }, [floor]);

  const event = ACTIVITIES[tick % ACTIVITIES.length];
  const bubble = floor === 'classified' ? CLASSIFIED_LINE[lang] : event[lang];
  const bubbleBot = bots.find((bot) => bot.name.toLowerCase() === (floor === 'classified' ? 'grok' : event.name.toLowerCase()));
  const here = peopleHere(floor, bots);
  const note = sourceNote === 'sample' ? t.fleetSample : t.fleetSource(sourceNote);

  return (
    <div className="office-chrome">
      <div className="brand-pill">
        <span className="brand-mark" aria-hidden />
        <span className="brand-copy">
          <b>{zh ? '不可思议空间' : 'Incredible Space'}</b>
          <small>
            <i /> {t.live}
          </small>
        </span>
      </div>

      <div className="status-pill" data-testid="fleet-status">
        <span>
          <i className="dot-green" /> {working} {zh ? '工作中' : 'working'}
        </span>
        <span>
          <i className="dot-amber" /> {waiting} {zh ? '等待' : 'waiting'}
        </span>
        {floor === 'classified' && (
          <span>
            <i className="dot-red" /> {here.length} {zh ? '机密' : 'classified'}
          </span>
        )}
      </div>

      <nav className="floor-menu" aria-label={zh ? '楼层' : 'Floors'} data-testid="floor-menu">
        {MENU.map((id) => {
          const label = id === 'overview' ? (zh ? '总览' : 'Overview') : floorTitle(lang, id);
          return (
            <span key={id} className="menu-slot">
              {id === 'classified' && <span className="menu-label">{zh ? '机密' : 'CLASSIFIED'}</span>}
              <button type="button" aria-pressed={floor === id} data-testid={`floor-${id}`} onClick={() => onFloor(id)}>
                <em>{floorKicker(id)}</em>
                {label}
              </button>
            </span>
          );
        })}
        <div className="menu-tools">
          <button type="button" onClick={toggle} aria-label={t.langSwitch}>
            {zh ? 'EN' : '中'}
          </button>
          <button type="button" data-testid="ops-toggle" aria-pressed={opsOpen} onClick={onToggleOps}>
            {opsOpen ? (zh ? '收起' : 'Hide') : zh ? '夜班' : 'Shift'}
          </button>
          <button type="button" data-testid="summary" onClick={() => sim.openSummary()}>
            {t.camSummary}
          </button>
        </div>
      </nav>

      {selected ? (
        <aside className="pin-card" style={{ ['--bot' as string]: selected.color ?? '#c5ced6' }}>
          <button type="button" className="pin-x" onClick={onClear} aria-label={zh ? '关闭' : 'Close'}>
            ×
          </button>
          <p className="pin-task">{taskFor(lang, selected.name, floor === 'classified')}</p>
          <BotDetail bot={selected} note={note} className="is-pin" />
        </aside>
      ) : floor === 'overview' ? (
        <aside className="hq-card" data-testid="hq-card">
          <b>{zh ? '不可思议空间' : 'Incredible Space'}</b>
          <span>{zh ? '总部' : 'Headquarters'}</span>
          <small>{zh ? '样例夜班，不会真的发出去' : 'Sample night shift. Nothing is actually sent'}</small>
        </aside>
      ) : (
        <aside className="floor-card" data-testid="floor-card" style={{ background: TONE[floor].bg, color: TONE[floor].fg }}>
          <span className="floor-kicker">{floorKicker(floor)}</span>
          <b>{floorTitle(lang, floor)}</b>
          <p>{FLOOR_BLURB[floor][lang]}</p>
          <div className="floor-dots">
            {here.map((bot) => (
              <i key={bot.id} style={{ background: bot.color ?? '#fff' }} title={bot.name} />
            ))}
            <span>
              {here.length} {zh ? '人' : 'here'}
              {floor === 'lobby' ? (zh ? ' · 前台' : ' · desk') : ''}
            </span>
          </div>
        </aside>
      )}

      <div className="activity-bubble" data-testid="activity-bubble" key={floor === 'classified' ? 'classified' : tick}>
        <i style={{ background: bubbleBot?.color ?? '#c4f93e' }} />
        <span>{bubble}</span>
      </div>

      {access && (
        <div className="access-toast" data-testid="access-toast" role="status">
          {zh ? '准入通过' : 'Access granted'}
        </div>
      )}
    </div>
  );
}
