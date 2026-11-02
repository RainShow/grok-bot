import { AGENTS, STAGES } from '../game/data';
import { agentMode, type AgentMode } from '../game/sim';
import { useSim } from '../game/useSim';
import { agentName, agentRole, buildingName, say } from '../i18n/copy';
import { useI18n } from '../i18n/lang';
import { BotIcon } from './BotIcon';

export function AgentCards() {
  const sim = useSim();
  const { lang, t } = useI18n();
  const s = sim.state;
  const busy = s.story ? STAGES[s.stageIdx].agent : null;
  const modeLabel: Record<AgentMode, string> = {
    moving: t.modeMoving,
    working: t.modeWorking,
    waiting: t.modeWaiting,
    idle: t.modeIdle,
  };
  return (
    <div className="agent-cards">
      {AGENTS.map((d) => {
        const a = s.agents[d.id];
        const mode = agentMode(a);
        const progress =
          mode === 'moving' && a.path
            ? a.pos / Math.max(1, a.path.length - 1)
            : mode === 'working' && a.task
              ? 1 - a.task.left / a.task.work
              : mode === 'waiting'
                ? 1
                : 0;
        const where = a.at ? buildingName(lang, a.at) : a.task ? t.toward(buildingName(lang, a.task.building)) : t.onStreet;
        return (
          <div key={d.id} className={`agent-card mode-${mode} ${busy === d.id ? 'on-story' : ''}`} style={{ ['--c' as string]: d.color }}>
            <div className="ac-top">
              <span className="ac-pip" />
              <BotIcon def={d} />
              <div className="ac-name">
                <b>{agentName(lang, d.id)}</b>
                <span>{agentRole(lang, d.id)}</span>
              </div>
              <span className={`ac-mode ${mode}`}>{modeLabel[mode]}</span>
            </div>
            <div className="ac-status">{say(lang, a.status)}</div>
            <div className="ac-bar">
              <div style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
            <div className="ac-foot">
              <span>{where}</span>
              <span>{t.pieces(a.doneToday)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
