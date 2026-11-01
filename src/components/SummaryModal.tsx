import { AGENTS } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact, formatMoney } from '../format';
import { BotIcon } from './BotIcon';

export function SummaryModal() {
  const sim = useSim();
  const s = sim.state;
  if (!s.summaryOpen) return null;
  const m = s.metrics;
  const mvp = AGENTS.reduce((best, d) => (s.agents[d.id].doneToday > s.agents[best.id].doneToday ? d : best), AGENTS[0]);
  return (
    <div className="modal-backdrop" onClick={() => sim.closeSummary()}>
      <div className="modal" role="dialog" aria-label="day one summary" onClick={(e) => e.stopPropagation()}>
        <div className="crumbs">field notes &gt; grok city &gt; day one</div>
        <h2>day one, wrapped {s.ended ? `at ${formatClock(s.clock)}` : '(so far)'}</h2>
        <div className="modal-stats">
          <div><span>views</span><b>{formatCompact(m.views)}</b></div>
          <div><span>followers</span><b>+{formatCompact(m.followers)}</b></div>
          <div><span>revenue</span><b>{formatMoney(m.revenue)}</b></div>
          <div><span>posts</span><b>{m.posts}</b></div>
        </div>
        <ul className="modal-list">
          <li>hooks picked by you: <b>{m.hooksByYou} of {m.hooksPicked}</b></li>
          <li>hot takes approved: <b>{m.takesApproved}</b> · skipped: <b>{m.takesSkipped}</b></li>
          <li>sponsors who dropped by: <b>{m.sponsors}</b></li>
          <li>decisions the city made without you: <b>{m.autoDecisions}</b></li>
        </ul>
        <div className="modal-agents">
          {AGENTS.map((d) => (
            <div key={d.id} className={d.id === mvp.id ? 'mvp' : ''}>
              <BotIcon def={d} size={22} />
              <span>{d.name}</span>
              <b>{s.agents[d.id].doneToday}</b>
            </div>
          ))}
        </div>
        <p className="modal-note">mvp: {mvp.name}. the city sleeps; scout keeps reading.</p>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => sim.closeSummary()}>keep watching</button>
          <button className="btn-approve" onClick={() => sim.restart()}>start day two</button>
        </div>
      </div>
    </div>
  );
}
