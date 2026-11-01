import { AGENTS, STAGES } from '../game/data';
import { agentMode } from '../game/sim';
import { useSim } from '../game/useSim';
import { BUILDING_BY_ID } from '../game/world';
import { BotIcon } from './BotIcon';

export function AgentCards() {
  const sim = useSim();
  const s = sim.state;
  const busy = s.story ? STAGES[s.stageIdx].agent : null;
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
        const where = a.at ? BUILDING_BY_ID[a.at].name : a.task ? `→ ${BUILDING_BY_ID[a.task.building].name}` : 'on the street';
        return (
          <div key={d.id} className={`agent-card mode-${mode} ${busy === d.id ? 'on-story' : ''}`} style={{ ['--c' as string]: d.color }}>
            <div className="ac-top">
              <BotIcon def={d} />
              <div className="ac-name">
                <b>{d.name}</b>
                <span>{d.role}</span>
              </div>
              <span className={`ac-mode ${mode}`}>{mode === 'waiting' ? 'needs you' : mode}</span>
            </div>
            <div className="ac-status">{a.status}</div>
            <div className="ac-bar">
              <div style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
            <div className="ac-foot">
              <span>{where}</span>
              <span>{a.doneToday} done</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
