import { AGENTS, AGENT_BY_ID, STAGES, makeSponsor, makeStory, type AgentId, type Story } from './data';
import { BUILDINGS, BUILDING_BY_ID, findPath, type BuildingId, type Tile } from './world';

export type TaskKind = 'stage' | 'scan' | 'count' | 'wander' | 'handoff';

export interface Task {
  kind: TaskKind;
  building: BuildingId;
  work: number;
  left: number;
  status: string;
  storyId?: number;
}

export interface AgentState {
  id: AgentId;
  at: BuildingId | null;
  tile: Tile;
  path: Tile[] | null;
  pos: number;
  task: Task | null;
  waiting: boolean;
  status: string;
  idleFor: number;
  doneToday: number;
  carrying: string | null;
}

export type AgentMode = 'moving' | 'working' | 'waiting' | 'idle';

export interface Prompt {
  id: number;
  kind: 'hook' | 'hottake';
  storyId: number;
  title: string;
  options: string[];
  text?: string;
  ttl: number;
  total: number;
}

export interface LogEntry {
  id: number;
  clock: number;
  who: AgentId | 'you' | 'city';
  text: string;
}

export interface Metrics {
  views: number;
  followers: number;
  revenue: number;
  viewRate: number;
  posts: number;
  hooksPicked: number;
  hooksByYou: number;
  takesApproved: number;
  takesSkipped: number;
  autoDecisions: number;
  sponsors: number;
}

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'clear';

export interface SimState {
  t: number;
  real: number;
  clock: number;
  speed: number;
  paused: boolean;
  agents: Record<AgentId, AgentState>;
  story: Story | null;
  queue: Story[];
  nextStoryId: number;
  stageIdx: number;
  stagePhase: 'travel' | 'work' | 'gate';
  stageCounts: number[];
  prompts: Prompt[];
  log: LogEntry[];
  metrics: Metrics;
  history: number[];
  ended: boolean;
  summaryOpen: boolean;
  activeBubble: { building: BuildingId; text: string; agent: AgentId } | null;
  pendingRevenue: number;
  storyFromQueue: boolean;
  wrapIn: number;
}

const START_CLOCK = 7 * 60;
const END_CLOCK = 23 * 60 + 30;
const CLOCK_RATE = 2.5;
const WALK_SPEED = 2.6;
const PROMPT_TTL = 25;
export const POSTS_PER_DAY = 6;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function agentMode(a: AgentState): AgentMode {
  if (a.path) return 'moving';
  if (a.waiting) return 'waiting';
  if (a.task && a.at === a.task.building) return 'working';
  return 'idle';
}

export function weatherAt(clock: number): { weather: Weather; temp: number } {
  const h = clock / 60;
  const temp = Math.round(16 + 9 * Math.sin(((h - 8) / 14) * Math.PI));
  if (h < 11) return { weather: 'sunny', temp };
  if (h < 14) return { weather: 'cloudy', temp };
  if (h < 15.5) return { weather: 'rain', temp: temp - 3 };
  return { weather: h < 19 ? 'sunny' : 'clear', temp };
}

export function nightAt(clock: number) {
  const h = clock / 60;
  if (h < 8) return 0.35 * (8 - h);
  if (h < 18) return 0;
  return Math.min(1, (h - 18) / 2.5);
}

export class Sim {
  state: SimState;
  version = 0;
  frame = 0;
  private listeners = new Set<() => void>();
  private frameListeners = new Set<() => void>();
  private publishIn = 0;
  private logId = 0;
  private promptId = 0;
  private historyIn = 0;

  private startClock: number;

  constructor(opts: { startHour?: number } = {}) {
    const h = opts.startHour;
    this.startClock = h !== undefined && h >= 0 && h < 23.5 ? h * 60 : START_CLOCK;
    this.state = this.initial();
    this.log('city', 'grok city wakes up. day one begins.');
  }

  private initial(): SimState {
    const agents = {} as Record<AgentId, AgentState>;
    for (const a of AGENTS) {
      const door = BUILDING_BY_ID[a.home].door;
      agents[a.id] = {
        id: a.id, at: a.home, tile: door, path: null, pos: 0, task: null, waiting: false,
        status: 'clocking in', idleFor: rand(1, 4), doneToday: 0, carrying: null,
      };
    }
    return {
      t: 0, real: 0, clock: this.startClock, speed: 1, paused: false, agents,
      story: null, queue: [], nextStoryId: 1, stageIdx: 0, stagePhase: 'travel',
      stageCounts: STAGES.map(() => 0), prompts: [], log: [],
      metrics: {
        views: 0, followers: 0, revenue: 0, viewRate: 1.5, posts: 0, hooksPicked: 0, hooksByYou: 0,
        takesApproved: 0, takesSkipped: 0, autoDecisions: 0, sponsors: 0,
      },
      history: [0], ended: false, summaryOpen: false, activeBubble: null, pendingRevenue: 0,
      storyFromQueue: false, wrapIn: -1,
    };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  subscribeFrame = (fn: () => void) => {
    this.frameListeners.add(fn);
    return () => this.frameListeners.delete(fn);
  };
  getVersion = () => this.version;
  getFrame = () => this.frame;

  private publish() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  private changed() {
    this.publishIn = 0;
  }

  // ---------- public controls ----------
  setSpeed(s: number) {
    this.state.speed = s;
    this.state.paused = false;
    this.publish();
  }
  togglePause() {
    this.state.paused = !this.state.paused;
    this.publish();
  }
  wrapDay() {
    this.state.ended = true;
    this.state.summaryOpen = true;
    this.log('city', 'day one wrapped — summary ready');
    this.publish();
  }
  openSummary() {
    this.state.summaryOpen = true;
    this.publish();
  }
  closeSummary() {
    this.state.summaryOpen = false;
    this.publish();
  }
  restart() {
    this.state = this.initial();
    this.log('city', 'grok city wakes up. day one begins.');
    this.publish();
  }

  resolvePrompt(id: number, choice: number, auto = false) {
    const s = this.state;
    const p = s.prompts.find((x) => x.id === id);
    if (!p) return;
    s.prompts = s.prompts.filter((x) => x.id !== id);
    const story = s.story;
    if (!story || story.id !== p.storyId) return;
    if (auto) s.metrics.autoDecisions++;
    if (p.kind === 'hook') {
      story.hookPick = choice;
      s.metrics.hooksPicked++;
      if (!auto) s.metrics.hooksByYou++;
      const letter = 'ABC'[choice];
      this.log(auto ? 'city' : 'you', auto ? `no answer — hook ${letter} auto-picked` : `picked hook ${letter}: “${story.hooks[choice]}”`);
    } else {
      story.takeApproved = choice === 0;
      if (choice === 0) {
        s.metrics.takesApproved++;
        s.metrics.followers += Math.round(rand(20, 60));
        s.metrics.viewRate += rand(40, 90);
        this.log('you', 'approved the hot take. reply posts it.');
      } else {
        s.metrics.takesSkipped++;
        this.log(auto ? 'city' : 'you', auto ? 'no answer — hot take held for later' : 'skipped the hot take');
      }
    }
    const agent = s.agents[STAGES[s.stageIdx].agent];
    agent.waiting = false;
    this.advanceStage();
    this.publish();
  }

  // ---------- main loop ----------
  tick(dtReal: number) {
    const s = this.state;
    s.real += dtReal;
    if (!s.paused && !s.ended) {
      const dt = dtReal * s.speed;
      s.t += dt;
      s.clock = Math.min(END_CLOCK, s.clock + dt * CLOCK_RATE);
      this.stepPrompts(dtReal);
      this.stepStory();
      for (const a of AGENTS) this.stepAgent(s.agents[a.id], dt);
      this.stepMetrics(dt);
      if (s.wrapIn > 0) {
        s.wrapIn -= dt;
        if (s.wrapIn <= 0) this.wrapDay();
      }
      if (s.clock >= END_CLOCK && !s.ended) this.wrapDay();
    }
    this.frame++;
    this.frameListeners.forEach((l) => l());
    this.publishIn -= dtReal;
    if (this.publishIn <= 0) {
      this.publishIn = 0.2;
      this.publish();
    }
  }

  private log(who: LogEntry['who'], text: string) {
    const s = this.state;
    s.log.unshift({ id: ++this.logId, clock: s.clock, who, text });
    if (s.log.length > 80) s.log.length = 80;
    this.changed();
  }

  private stepPrompts(dtReal: number) {
    for (const p of [...this.state.prompts]) {
      p.ttl -= dtReal;
      if (p.ttl <= 0) this.resolvePrompt(p.id, p.kind === 'hook' ? 0 : 1, true);
    }
  }

  private stepMetrics(dt: number) {
    const m = this.state.metrics;
    const before = m.views;
    m.viewRate = 1.5 + (m.viewRate - 1.5) * Math.exp(-dt / 70);
    m.views += m.viewRate * dt * rand(0.7, 1.3);
    const dv = m.views - before;
    m.followers += dv * 0.0065;
    m.revenue += dv * 0.0011;
    this.historyIn -= dt;
    if (this.historyIn <= 0) {
      this.historyIn = 6;
      this.state.history.push(m.views);
      if (this.state.history.length > 60) this.state.history.shift();
    }
  }

  // ---------- story / pipeline ----------
  private stepStory() {
    const s = this.state;
    if (!s.story) {
      if (s.metrics.posts >= POSTS_PER_DAY) return;
      const queued = s.queue.shift();
      s.storyFromQueue = !!queued;
      s.story = queued ?? makeStory(s.nextStoryId++);
      s.stageIdx = 0;
      s.stagePhase = 'travel';
      this.changed();
    }
    const stage = STAGES[s.stageIdx];
    const agent = s.agents[stage.agent];
    if (s.stagePhase === 'travel') {
      if (agent.task?.kind !== 'stage') {
        const work = stage.key === 'found' && s.storyFromQueue ? 2 : stage.work;
        this.assign(agent, { kind: 'stage', building: stage.building, work, left: work, status: stage.bubble, storyId: s.story.id });
      }
      if (agent.at === stage.building && !agent.path) {
        s.stagePhase = 'work';
        s.activeBubble = { building: stage.building, text: stage.bubble, agent: stage.agent };
        if (stage.key === 'sponsored') s.story.sponsor = makeSponsor();
        this.changed();
      }
    }
  }

  private completeStage() {
    const s = this.state;
    const story = s.story!;
    const stage = STAGES[s.stageIdx];
    const agent = s.agents[stage.agent];
    s.stageCounts[s.stageIdx]++;
    agent.doneToday++;
    switch (stage.key) {
      case 'found':
        this.log('scout', `found “${story.title}” trending (${Math.round(story.likes / 1000)}k likes)`);
        break;
      case 'written':
        this.log('hook', `wrote three hooks for “${story.title}”`);
        break;
      case 'edited':
        this.log('reel', 'rough cut done, 42 seconds');
        break;
      case 'sponsored':
        s.metrics.sponsors++;
        s.pendingRevenue += story.sponsor?.fee ?? 0;
        this.log('reply', `${story.sponsor?.name} sponsored it for $${story.sponsor?.fee}`);
        break;
      case 'rendered':
        this.log('reel', 'rendered at 1080p (eventually)');
        break;
      case 'reviewed':
        this.log('ledger', 'numbers check out. ship it.');
        break;
      case 'published':
        s.metrics.posts++;
        s.metrics.viewRate += rand(140, 260);
        this.log('post', `published post #${s.metrics.posts} to the timeline`);
        break;
      case 'crosspost':
        s.metrics.viewRate += rand(50, 110);
        this.log('post', 'cross-posted to 3 more feeds');
        break;
      case 'hottake':
        this.log('reply', 'drafted a hot take — waiting for you');
        break;
    }
    if (stage.gate) {
      agent.waiting = true;
      agent.status = 'waiting on you';
      s.stagePhase = 'gate';
      s.activeBubble = { building: stage.building, text: 'needs you', agent: stage.agent };
      const p: Prompt =
        stage.gate === 'hook'
          ? { id: ++this.promptId, kind: 'hook', storyId: story.id, title: `pick a hook for “${story.title}”`, options: story.hooks, ttl: PROMPT_TTL, total: PROMPT_TTL }
          : { id: ++this.promptId, kind: 'hottake', storyId: story.id, title: 'reply wants to post a hot take', text: story.take, options: ['approve', 'skip'], ttl: PROMPT_TTL, total: PROMPT_TTL };
      s.prompts.push(p);
    } else {
      this.advanceStage();
    }
    this.changed();
  }

  private advanceStage() {
    const s = this.state;
    const prev = STAGES[s.stageIdx];
    s.stageIdx++;
    if (s.stageIdx >= STAGES.length) {
      this.finishStory();
      return;
    }
    const next = STAGES[s.stageIdx];
    s.stagePhase = 'travel';
    s.activeBubble = null;
    if (prev.agent !== next.agent && prev.building !== next.building) {
      const carrier = s.agents[prev.agent];
      carrier.carrying = next.agent;
      this.assign(carrier, { kind: 'handoff', building: next.building, work: 1, left: 1, status: `bringing the story to ${next.agent}` });
      s.activeBubble = { building: next.building, text: `bringing the story to ${next.agent}`, agent: prev.agent };
    }
  }

  private finishStory() {
    const s = this.state;
    const story = s.story!;
    this.log('city', `“${story.title}” made it through the whole pipeline`);
    s.story = null;
    s.activeBubble = null;
    const ledger = s.agents.ledger;
    this.assign(ledger, { kind: 'count', building: 'bank', work: 3, left: 3, status: 'counting today’s money' });
    if (s.metrics.posts >= POSTS_PER_DAY) {
      this.log('city', 'six posts a day — quota hit. wrapping up.');
      s.wrapIn = 5;
    }
  }

  // ---------- agents ----------
  private assign(a: AgentState, task: Task) {
    a.task = task;
    if (task.kind !== 'handoff') a.carrying = null;
    a.status = task.kind === 'stage' && a.at !== task.building ? `heading to ${BUILDING_BY_ID[task.building].name}` : task.status;
    if (a.at !== task.building) this.walk(a, task.building);
    this.changed();
  }

  private walk(a: AgentState, to: BuildingId) {
    const from = a.path ? a.path[Math.min(a.path.length - 1, Math.round(a.pos))] : a.tile;
    a.path = findPath(from, BUILDING_BY_ID[to].door);
    a.pos = 0;
    a.at = null;
  }

  private stepAgent(a: AgentState, dt: number) {
    const s = this.state;
    if (a.path) {
      a.pos += dt * WALK_SPEED;
      const last = a.path.length - 1;
      if (a.pos >= last) {
        a.tile = a.path[last];
        a.path = null;
        a.pos = 0;
        a.at = a.task?.building ?? BUILDINGS.find((b) => b.door[0] === a.tile[0] && b.door[1] === a.tile[1])?.id ?? null;
        if (a.task) a.status = a.task.status;
        this.changed();
      } else {
        a.tile = a.path[Math.floor(a.pos)];
      }
      return;
    }
    if (a.waiting) return;
    if (a.task) {
      if (a.task.kind === 'stage' && s.stagePhase !== 'work') return;
      a.task.left -= dt;
      if (a.task.left <= 0) {
        const t = a.task;
        a.task = null;
        a.idleFor = rand(2, 6);
        a.status = 'idle';
        this.finishTask(a, t);
      }
      return;
    }
    const busyAgent = s.story ? STAGES[s.stageIdx].agent : null;
    if (busyAgent === a.id) return;
    a.idleFor -= dt;
    if (a.idleFor > 0) return;
    this.pickIdleTask(a);
  }

  private finishTask(a: AgentState, t: Task) {
    const s = this.state;
    switch (t.kind) {
      case 'stage':
        this.completeStage();
        break;
      case 'scan': {
        if (s.queue.length < 3 && s.metrics.posts + s.queue.length < POSTS_PER_DAY) {
          const story = makeStory(s.nextStoryId++);
          s.queue.push(story);
          this.log('scout', `bookmarked “${story.title}” for later`);
        }
        break;
      }
      case 'count': {
        const fee = s.pendingRevenue;
        s.pendingRevenue = 0;
        s.metrics.revenue += fee;
        this.log('ledger', fee > 0 ? `counted $${fee} in sponsor money` : 'counted views. nothing new to bank.');
        break;
      }
      case 'handoff':
        a.carrying = null;
        break;
      case 'wander':
        break;
    }
    this.changed();
  }

  private pickIdleTask(a: AgentState) {
    const s = this.state;
    if (a.id === 'scout' && s.queue.length < 2 && s.metrics.posts + s.queue.length < POSTS_PER_DAY) {
      this.assign(a, { kind: 'scan', building: 'newsroom', work: 7, left: 7, status: 'scrolling the timeline' });
      return;
    }
    const options: { b: BuildingId; status: string }[] = [
      { b: 'cafe', status: 'coffee at the café' },
      { b: AGENT_BY_ID[a.id].home, status: 'back at the desk' },
      { b: 'newsroom', status: 'peeking at trends' },
      { b: 'studio', status: 'watching dailies' },
      { b: 'bank', status: 'checking the balance' },
      { b: 'writers', status: 'stealing a hook idea' },
      { b: 'post', status: 'reading replies' },
    ];
    const choice = Math.random() < 0.5 ? options[Math.floor(Math.random() * 2)] : options[Math.floor(Math.random() * options.length)];
    const work = rand(3, 7);
    this.assign(a, { kind: 'wander', building: choice.b, work, left: work, status: choice.status });
  }
}
