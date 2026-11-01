import { AGENTS } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact } from '../format';
import { BotIcon } from './BotIcon';

export function SummaryModal() {
  const sim = useSim();
  const s = sim.state;
  if (!s.summaryOpen) return null;
  const m = s.metrics;
  const mvp = AGENTS.reduce((best, d) => (s.agents[d.id].doneToday > s.agents[best.id].doneToday ? d : best), AGENTS[0]);
  return (
    <div className="modal-backdrop" onClick={() => sim.closeSummary()}>
      <div className="modal" role="dialog" aria-label="夜班汇总" onClick={(e) => e.stopPropagation()}>
        <div className="crumbs">不可思议空间 · 夜班 · 第一夜</div>
        <h2>夜班汇总 {s.ended ? `· ${formatClock(s.clock)} 收工` : '· 还在走'}</h2>
        <div className="modal-stats">
          <div><span>浏览</span><b>{formatCompact(m.views)}</b></div>
          <div><span>关注</span><b>+{formatCompact(m.followers)}</b></div>
          <div><span>分享</span><b>{formatCompact(m.shares)}</b></div>
          <div><span>已发</span><b>{m.posts}</b></div>
        </div>
        <ul className="modal-list">
          <li>你选的门：<b>{m.hooksByYou}</b> / 一共 <b>{m.hooksPicked}</b></li>
          <li>借腹南瓜城钩子：<b>{m.pumpkinPicked}</b></li>
          <li>门卫：批准 <b>{m.approved}</b> · 改过 <b>{m.edited}</b> · 拒绝 <b>{m.declined}</b></li>
          <li>城自己拿的主意：<b>{m.autoDecisions}</b>。没有一条真的发出去。</li>
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
        <p className="modal-note">今晚最忙的是{mvp.name}。灯还亮着，拆镜还在翻。</p>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => sim.closeSummary()}>继续看</button>
          <button className="btn-approve" onClick={() => sim.restart()}>再开一夜</button>
        </div>
      </div>
    </div>
  );
}
