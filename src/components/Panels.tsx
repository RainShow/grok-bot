import { AGENT_BY_ID, STAGES } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact, formatMoney } from '../format';
import { POSTS_PER_DAY, type Prompt } from '../game/sim';

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
        needs you {prompts.length > 0 && <span className="badge">{prompts.length}</span>}
      </h2>
      {prompts.length === 0 ? (
        <div className="empty">all clear — the city runs itself.</div>
      ) : (
        prompts.map((p) => <PromptCard key={p.id} p={p} onPick={(i) => sim.resolvePrompt(p.id, i)} />)
      )}
    </section>
  );
}

function PromptCard({ p, onPick }: { p: Prompt; onPick: (i: number) => void }) {
  const agent = p.kind === 'hook' ? AGENT_BY_ID.hook : AGENT_BY_ID.reply;
  return (
    <div className="prompt-card">
      <div className="prompt-head">
        <span className="dot" style={{ background: agent.color }} />
        <span className="prompt-from">{agent.name}</span>
        <span className="prompt-ttl">{Math.ceil(p.ttl)}s</span>
      </div>
      <div className="prompt-title">{p.title}</div>
      {p.text && <blockquote className="prompt-quote">“{p.text}”</blockquote>}
      {p.kind === 'hook' ? (
        <div className="hook-options">
          {p.options.map((o, i) => (
            <button key={i} className="hook-btn" onClick={() => onPick(i)} title={o}>
              <span className="hook-letter">hook {'ABC'[i]}</span>
              <span className="hook-text">{o}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="take-options">
          <button className="btn-approve" onClick={() => onPick(0)}>approve</button>
          <button className="btn-skip" onClick={() => onPick(1)}>skip</button>
        </div>
      )}
      <div className="ttl-bar">
        <div style={{ width: `${(p.ttl / p.total) * 100}%` }} />
      </div>
    </div>
  );
}

function Activity() {
  const sim = useSim();
  return (
    <section className="section activity">
      <h2>activity</h2>
      <ol className="log">
        {sim.state.log.map((e) => {
          const color = e.who === 'you' ? '#2b2833' : e.who === 'city' ? '#b9b3a6' : AGENT_BY_ID[e.who].color;
          return (
            <li key={e.id} className={`log-item who-${e.who}`}>
              <span className="log-time">{formatClock(e.clock)}</span>
              <span className="dot" style={{ background: color }} />
              <span className="log-text">
                <b>{e.who}</b> {e.text}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Pipeline() {
  const sim = useSim();
  const s = sim.state;
  const story = s.story;
  return (
    <section className="section pipeline">
      <h2>content pipeline</h2>
      <div className="story-now">
        {story ? (
          <>
            <span className="tag">#{story.tag}</span> {story.title}
          </>
        ) : s.metrics.posts >= POSTS_PER_DAY ? (
          'quota hit — six posts shipped'
        ) : (
          'waiting for the next story…'
        )}
      </div>
      <div className="dots-row" aria-hidden>
        {STAGES.map((st, i) => {
          const state = !story ? 'todo' : i < s.stageIdx ? 'done' : i === s.stageIdx ? (s.stagePhase === 'gate' ? 'gate' : 'active') : 'todo';
          return <span key={st.key} className={`pdot ${state}`} />;
        })}
      </div>
      <ol className="stages">
        {STAGES.map((st, i) => {
          const state = !story ? 'todo' : i < s.stageIdx ? 'done' : i === s.stageIdx ? (s.stagePhase === 'gate' ? 'gate' : 'active') : 'todo';
          const a = AGENT_BY_ID[st.agent];
          return (
            <li key={st.key} className={`stage ${state}`}>
              <span className={`pdot ${state}`} />
              <span className="stage-label">{st.label}</span>
              <span className="chip">
                <span className="dot" style={{ background: a.color }} />
                {a.name}
              </span>
              <span className="stage-count">{s.stageCounts[i]}</span>
            </li>
          );
        })}
      </ol>
      <div className="queue-line">
        queued next: {s.queue.length ? s.queue.map((q) => q.title).join(' · ') : 'nothing yet — scout is reading'}
      </div>
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
      <polyline points={pts} fill="none" stroke="#d0453a" strokeWidth={1.6} />
    </svg>
  );
}

function Today() {
  const sim = useSim();
  const m = sim.state.metrics;
  return (
    <section className="section today">
      <h2>today</h2>
      <div className="metric big">
        <div>
          <div className="metric-l">views</div>
          <div className="metric-n">{formatCompact(m.views)}</div>
        </div>
        <Sparkline data={sim.state.history} />
      </div>
      <div className="metric-row">
        <div className="metric">
          <div className="metric-l">followers</div>
          <div className="metric-n">+{formatCompact(m.followers)}</div>
        </div>
        <div className="metric">
          <div className="metric-l">revenue</div>
          <div className="metric-n">{formatMoney(m.revenue)}</div>
        </div>
      </div>
      <div className="posts-bar">
        <span>posts</span>
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
