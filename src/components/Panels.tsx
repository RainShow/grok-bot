import { useState } from 'react';
import { AGENT_BY_ID, SERIES, STAGES } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact } from '../format';
import { POSTS_PER_DAY, type Prompt, type SimState } from '../game/sim';

export function LeftPanel() {
  return (
    <aside className="panel panel-left glass">
      <NeedsYou />
      <Activity />
    </aside>
  );
}

export function RightPanel() {
  return (
    <aside className="panel panel-right glass">
      <Pipeline />
      <Today />
    </aside>
  );
}

function NeedsYou() {
  const sim = useSim();
  const prompts = sim.state.prompts;
  return (
    <section className="section needs">
      <h2>
        审批
        {prompts.length > 0 && <span className="badge">{prompts.length}</span>}
        <span className="section-aside">你的决定</span>
      </h2>
      {prompts.length === 0 ? (
        <div className="empty">夜班安静，城自己在跑。</div>
      ) : (
        prompts.map((p) => (
          <PromptCard key={p.id} p={p} onPick={(i, note) => sim.resolvePrompt(p.id, i, false, note)} />
        ))
      )}
    </section>
  );
}

function PromptCard({ p, onPick }: { p: Prompt; onPick: (i: number, note?: string) => void }) {
  const agent = p.kind === 'hook' ? AGENT_BY_ID.hook : AGENT_BY_ID.gate;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.quote ?? '');
  return (
    <div className={`prompt-card kind-${p.kind}`}>
      <div className="prompt-head">
        <span className="dot" style={{ background: agent.color }} />
        <span className="prompt-from">{agent.name}</span>
        <span className="prompt-role">{p.kind === 'hook' ? '七道门' : '过门'}</span>
        {p.ttl > 0 && <span className="prompt-ttl">{Math.ceil(p.ttl)}s</span>}
      </div>
      <div className="prompt-title">{p.title}</div>
      {p.detail && <div className="prompt-detail">{p.detail}</div>}
      {p.quote && !editing && <blockquote className="prompt-quote">「{p.quote}」</blockquote>}
      {p.kind === 'hook' ? (
        <>
          <div className="series-grid">
            {SERIES.map((s, i) => (
              <button key={s.key} className="series-btn" data-testid={`series-${s.key}`} title={s.verse} onClick={() => onPick(i)}>
                <i style={{ background: s.color }} />
                {s.key}
              </button>
            ))}
          </div>
          <button className="pumpkin-btn" data-testid="pumpkin-hook" onClick={() => onPick(SERIES.length)}>
            借腹南瓜城 · 天亮前谁也别走
          </button>
        </>
      ) : editing ? (
        <div className="edit-box">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label="改一句" />
          <div className="take-options">
            <button className="btn-approve" data-testid="edit-confirm" onClick={() => onPick(1, draft)}>
              确认修改
            </button>
            <button className="btn-skip" onClick={() => setEditing(false)}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="take-options">
          <button className="btn-approve" data-testid="approve" onClick={() => onPick(0)}>
            批准
          </button>
          <button className="btn-edit" data-testid="edit" onClick={() => setEditing(true)}>
            编辑
          </button>
          <button className="btn-decline" data-testid="decline" onClick={() => onPick(2)}>
            拒绝
          </button>
        </div>
      )}
      {p.note && <div className="prompt-note">{p.note}</div>}
      {p.ttl > 0 && (
        <div className="ttl-bar">
          <div style={{ width: `${(p.ttl / p.total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function Activity() {
  const sim = useSim();
  return (
    <section className="section activity">
      <h2>
        city.log
        <span className="live-dot tiny" />
        <span className="section-aside">直播</span>
      </h2>
      <ol className="log">
        {sim.state.log.map((e) => {
          const color = e.who === 'you' ? '#ffe14a' : e.who === 'city' ? '#9b94b8' : AGENT_BY_ID[e.who].color;
          const name = e.who === 'you' ? '你' : e.who === 'city' ? '城' : AGENT_BY_ID[e.who].name;
          return (
            <li key={e.id} className={`log-item who-${e.who}`}>
              <span className="log-time">{formatClock(e.clock)}</span>
              <span className="dot" style={{ background: color }} />
              <span className="log-text">
                <b style={{ color }}>{name}</b> {e.text}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function stageRows(s: SimState) {
  return STAGES.map((st, i) => {
    const state = !s.story ? 'todo' : i < s.stageIdx ? 'done' : i === s.stageIdx ? (s.stagePhase === 'gate' ? 'gate' : 'active') : 'todo';
    const a = AGENT_BY_ID[st.agent];
    return { key: st.key, label: st.label, state, color: a.color, name: a.name, count: s.stageCounts[i] };
  });
}

function Pipeline() {
  const sim = useSim();
  const s = sim.state;
  const story = s.story;
  const rows = stageRows(s);
  const done = s.stageCounts.reduce((n, c) => n + c, 0);
  return (
    <section className="section pipeline">
      <h2>
        任务板
        <span className="section-aside">
          {s.metrics.posts}/{POSTS_PER_DAY} 已发
        </span>
      </h2>
      <div className="story-now">
        {story ? (
          <>
            <span className="tag">#{story.tag}</span> {story.title}
          </>
        ) : s.metrics.posts >= POSTS_PER_DAY ? (
          '六条夜班额度满了'
        ) : (
          '等下一条从南瓜城里走出来…'
        )}
      </div>
      <div className="dots-row" aria-hidden>
        {rows.map((st) => (
          <span key={st.key} className={`pdot ${st.state}`} />
        ))}
      </div>
      <ol className="stages">
        {rows.map((row) => (
          <li key={row.key} className={`stage ${row.state}`}>
            <span className={`pdot ${row.state}`} />
            <span className="stage-label">{row.label}</span>
            <span className="chip">
              <span className="dot" style={{ background: row.color }} />
              {row.name}
            </span>
            <span className="stage-count">{row.count}</span>
          </li>
        ))}
      </ol>
      <div className="queue-line">排队：{s.queue.length ? s.queue.map((q) => q.title).join(' · ') : '还没有。拆镜在翻时间线。'}</div>
      <div className="queue-line dim">这条街今晚走过 {done} 段工序。发出去的都是模拟。</div>
    </section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 120;
  const h = 28;
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 -2 ${w} ${h + 4}`}>
      <polyline points={pts} fill="none" stroke="#3ee0ff" strokeWidth={1.6} />
    </svg>
  );
}

function Today() {
  const sim = useSim();
  const m = sim.state.metrics;
  return (
    <section className="section today">
      <h2>
        城市数据
        <span className="section-aside">示意数字</span>
      </h2>
      <div className="metric big">
        <div>
          <div className="metric-l">浏览</div>
          <div className="metric-n">{formatCompact(m.views)}</div>
        </div>
        <Sparkline data={sim.state.history} />
      </div>
      <div className="metric-row">
        <div className="metric">
          <div className="metric-l">关注</div>
          <div className="metric-n accent-mint">+{formatCompact(m.followers)}</div>
        </div>
        <div className="metric">
          <div className="metric-l">分享</div>
          <div className="metric-n accent-amber">{formatCompact(m.shares)}</div>
        </div>
      </div>
      <div className="posts-bar">
        <span>已发</span>
        <div className="bar">
          {Array.from({ length: POSTS_PER_DAY }, (_, i) => (
            <span key={i} className={i < m.posts ? 'on' : ''} />
          ))}
        </div>
        <span className="mono-num">
          {m.posts}/{POSTS_PER_DAY}
        </span>
      </div>
    </section>
  );
}
