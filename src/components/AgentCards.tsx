import { useEffect, useRef, useState } from 'react';
import { orderRoster, type FleetBot, type FleetStatus } from '../game/fleet';
import { useFleet } from '../game/useFleet';
import { useI18n } from '../i18n/lang';

function statusLabel(status: FleetStatus, t: ReturnType<typeof useI18n>['t']) {
  switch (status) {
    case 'idle':
      return t.statusIdle;
    case 'busy':
      return t.statusBusy;
    case 'needs_you':
      return t.statusNeeds;
    case 'offline':
      return t.statusOffline;
  }
}

export function AgentCards({
  selectedId: controlledId,
  onSelect,
  hideDetail = false,
}: {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  hideDetail?: boolean;
} = {}) {
  const fleet = useFleet();
  const { t } = useI18n();
  const bots = orderRoster(fleet.bots);
  const [localId, setLocalId] = useState<string | null>(null);
  const selectedId = onSelect ? (controlledId ?? null) : localId;
  const setSelectedId = (id: string | null) => {
    if (onSelect) onSelect(id);
    else setLocalId(id);
  };
  const selected = bots.find((bot) => bot.id === selectedId) ?? null;
  const note = fleet.source === 'sample' ? t.fleetSample : t.fleetSource(fleet.source);

  useEffect(() => {
    if (!selectedId) return;
    const detail = document.querySelector('[data-testid="bot-detail"]');
    if (detail && window.matchMedia('(max-width: 900px)').matches) {
      const header = document.querySelector('.header');
      const offset = (header?.getBoundingClientRect().height ?? 0) + 8;
      const top = detail.getBoundingClientRect().top - offset;
      window.scrollBy({ top });
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    document.querySelector('.agent-card.is-selected')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [selectedId]);

  return (
    <footer className="roster">
      {!hideDetail && selected && <BotDetail key={selected.id} bot={selected} note={note} />}
      <div className="agent-cards" aria-label={t.roster}>
        {bots.map((bot) => {
          const on = bot.id === selectedId;
          const label = statusLabel(bot.status, t);
          return (
            <button
              key={bot.id}
              type="button"
              className={`agent-card status-${bot.status} ${on ? 'is-selected' : ''}`}
              style={{ ['--c' as string]: bot.color ?? '#8b959e' }}
              aria-pressed={on}
              aria-expanded={on}
              data-testid={`bot-${bot.name.replace(/\s+/g, '-')}`}
              onClick={() => setSelectedId(bot.id === selectedId ? null : bot.id)}
            >
              <span className="ac-top">
                <span className="ac-pip" />
                <span className="ac-name">
                  <b>{bot.name}</b>
                  <span>{bot.role}</span>
                </span>
                <span className={`ac-mode ${bot.status}`}>{label}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="roster-foot" data-testid="fleet-source">
        <span>{note}</span>
      </div>
    </footer>
  );
}

export function BotDetail({ bot, note, className }: { bot: FleetBot; note: string; className?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const label = statusLabel(bot.status, t);
  const heading = bot.title ?? bot.name;
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyId = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(bot.id);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = bot.id;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand('copy');
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`roster-detail status-${bot.status}${className ? ` ${className}` : ''}`} role="region" aria-label={`${heading} · ${bot.role}`} data-testid="bot-detail">
      <div className="roster-line">
        <span className="ac-pip" style={{ background: bot.color ?? '#8b959e' }} />
        <b>{heading}</b>
        <span className="roster-role"> · {bot.role}</span>
        <span className={`ac-mode ${bot.status}`}>{label}</span>
      </div>
      <div className="roster-idline">
        <code className="roster-id" data-testid="bot-id">
          {bot.id}
        </code>
        <code className="roster-link">{bot.deepLink}</code>
        <div className="roster-actions">
          <a className="btn-approve" href={bot.deepLink} data-testid="open-chat">
            {t.openChat}
          </a>
          <button type="button" className={`ghost-btn ${copied ? 'is-copied' : ''}`} data-testid="copy-id" onClick={copyId}>
            {copied ? t.copiedId : t.copyId}
          </button>
          {bot.webLink && (
            <a className="ghost-btn" href={bot.webLink} target="_blank" rel="noreferrer">
              {t.webOpen}
            </a>
          )}
        </div>
      </div>
      <div className="roster-note">{note}</div>
    </div>
  );
}
