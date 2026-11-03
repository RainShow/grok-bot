import type { Phrase } from '../i18n/copy';
import { AGENTS, AGENT_BY_ID, SERIES, STAGES, makeStory, type AgentId, type Story } from './data';
import { BUILDINGS, BUILDING_BY_ID, findPath, type BuildingId, type Tile } from './world';

export type TaskKind = 'stage' | 'scan' | 'count' | 'wander' | 'handoff';

export interface Task {
  kind: TaskKind;
  building: BuildingId;
  work: number;
  left: number;
  status: Phrase;
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
  status: Phrase;
  idleFor: number;
  doneToday: number;
  carrying: string | null;
}

export type AgentMode = 'moving' | 'working' | 'waiting' | 'idle';

export interface Prompt {
  id: number;
  kind: 'hook' | 'approval';
  storyId: number;
  ttl: number;
  total: number;
}

export interface LogEntry {
  id: number;
  clock: number;
  who: AgentId | 'you' | 'city';
  text: Phrase;
}

export interface Metrics {
  views: number;
  followers: number;
  shares: number;
  viewRate: number;
  posts: number;
  hooksPicked: number;
  hooksByYou: number;
  pumpkinPicked: number;
  approved: number;
  edited: number;
  declined: number;
  autoDecisions: number;
}

export type Weather = 'clear';

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
  activeBubble: { building: BuildingId; text: Phrase; agent: AgentId } | null;
  storyFromQueue: boolean;
  wrapIn: number;
}

const START_CLOCK = 21 * 60;
const END_CLOCK = 29 * 60 + 30;
const CLOCK_RATE = 2.5;
const WALK_SPEED = 2.8;
const PROMPT_TTL = 40;
export const POSTS_PER_DAY = 6;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function agentMode(a: AgentState): AgentMode {
  if (a.path) return 'moving';
  if (a.waiting) return 'waiting';
  if (a.task && a.at === a.task.building) return 'working';
  return 'idle';
}

export function weatherAt(clock: number): { weather: Weather; temp: number } {
  const h = (clock / 60) % 24;
  const temp = Math.round(12 + 3 * Math.sin(((h - 21) / 12) * Math.PI));
  return { weather: 'clear', temp };
}

export function nightAt(clock: number) {
  const h = (clock / 60) % 24;
  return h >= 18 || h < 7 ? 1 : 0.85;
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
    this.startClock = h !== undefined && h >= 0 && h < 24 ? h * 60 : START_CLOCK;
    this.state = this.initial();
    this.log('city', { id: 'boot' });
  }

  private initial(): SimState {
    const agents = {} as Record<AgentId, AgentState>;
    for (const a of AGENTS) {
      const door = BUILDING_BY_ID[a.home].door;
      agents[a.id] = {
        id: a.id, at: a.home, tile: door, path: null, pos: 0, task: null, waiting: false,
        status: { id: 'clockIn' }, idleFor: rand(0.6, 2.2), doneToday: 0, carrying: null,
      };
    }
    return {
      t: 0, real: 0, clock: this.startClock, speed: 1, paused: false, agents,
      story: null, queue: [], nextStoryId: 1, stageIdx: 0, stagePhase: 'travel',
      stageCounts: STAGES.map(() => 0), prompts: [], log: [],
      metrics: {
        views: 0, followers: 0, shares: 0, viewRate: 2.2, posts: 0,
        hooksPicked: 0, hooksByYou: 0, pumpkinPicked: 0,
        approved: 0, edited: 0, declined: 0, autoDecisions: 0,
      },
      history: [0], ended: false, summaryOpen: false, activeBubble: null,
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
    this.log('city', { id: 'wrap' });
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
    this.log('city', { id: 'restart' });
    this.publish();
  }

  resolvePrompt(id: number, choice: number, auto = false, note?: string) {
    const s = this.state;
    const p = s.prompts.find((x) => x.id === id);
    if (!p) return;
    s.prompts = s.prompts.filter((x) => x.id !== id);
    const story = s.story;
    if (!story || story.id !== p.storyId) return;
    if (auto) s.metrics.autoDecisions++;
    if (p.kind === 'hook') {
      if (choice >= SERIES.length) {
        story.usedPumpkin = true;
        story.seriesPick = 'form';
        s.metrics.pumpkinPicked++;
        s.metrics.viewRate += rand(80, 140);
        this.log(auto ? 'city' : 'you', auto ? { id: 'pumpkinAuto' } : { id: 'pumpkinYou' });
      } else {
        const door = SERIES[Math.max(0, choice)];
        story.seriesPick = door.id;
        this.log(auto ? 'city' : 'you', auto ? { id: 'seriesAuto', series: door.id } : { id: 'seriesYou', series: door.id });
      }
      s.metrics.hooksPicked++;
      if (!auto) s.metrics.hooksByYou++;
    } else if (choice === 2) {
      story.gateDecision = 'decline';
      s.metrics.declined++;
      this.log(auto ? 'city' : 'you', { id: 'declined' });
    } else if (choice === 1) {
      story.gateDecision = 'edit';
      story.editNote = note?.trim() || story.editNote;
      s.metrics.edited++;
      s.metrics.followers += Math.round(rand(8, 24));
      s.metrics.viewRate += rand(30, 70);
      this.log('you', { id: 'edited' });
    } else {
      story.gateDecision = 'approve';
      s.metrics.approved++;
      s.metrics.followers += Math.round(rand(18, 50));
      s.metrics.viewRate += rand(60, 120);
      this.log('you', { id: 'approved' });
    }
    const agent = s.agents[STAGES[s.stageIdx].agent];
    agent.waiting = false;
    this.advanceStage();
    this.publish();
  }

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

  private log(who: LogEntry['who'], text: Phrase) {
    const s = this.state;
    s.log.unshift({ id: ++this.logId, clock: s.clock, who, text });
    if (s.log.length > 80) s.log.length = 80;
    this.changed();
  }

  private stepPrompts(dtReal: number) {
    for (const p of [...this.state.prompts]) {
      if (p.kind === 'approval' || p.ttl < 0) continue;
      p.ttl -= dtReal;
      if (p.ttl <= 0) this.resolvePrompt(p.id, 0, true);
    }
  }

  private stepMetrics(dt: number) {
    const m = this.state.metrics;
    const before = m.views;
    m.viewRate = 2.2 + (m.viewRate - 2.2) * Math.exp(-dt / 70);
    m.views += m.viewRate * dt * rand(0.7, 1.3);
    const dv = m.views - before;
    m.followers += dv * 0.0045;
    m.shares += dv * 0.0016;
    this.historyIn -= dt;
    if (this.historyIn <= 0) {
      this.historyIn = 6;
      this.state.history.push(m.views);
      if (this.state.history.length > 60) this.state.history.shift();
    }
  }

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
        const work = stage.key === 'found' && s.storyFromQueue ? 1.6 : stage.work;
        this.assign(agent, { kind: 'stage', building: stage.building, work, left: work, status: { id: 'stage', stage: stage.key }, storyId: s.story.id });
      }
      if (agent.at === stage.building && !agent.path) {
        s.stagePhase = 'work';
        s.activeBubble = { building: stage.building, text: { id: 'stage', stage: stage.key }, agent: stage.agent };
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
        this.log('proto', { id: 'found', topic: story.topic });
        break;
      case 'written':
        this.log('pumpkin', { id: 'hooksReady' });
        break;
      case 'adapted':
        this.log('design', { id: 'adapted' });
        break;
      case 'archived':
        this.log('analysis', { id: 'archived' });
        break;
      case 'gated':
        this.log('grok', { id: 'gated' });
        break;
      case 'published':
        if (story.gateDecision === 'decline') {
          this.log('post', { id: 'held' });
        } else {
          s.metrics.posts++;
          s.metrics.viewRate += rand(120, 220);
          s.metrics.shares += rand(6, 18);
          this.log('post', { id: 'published', n: s.metrics.posts });
        }
        break;
    }
    if (stage.gate) {
      agent.waiting = true;
      agent.status = { id: 'waiting' };
      s.stagePhase = 'gate';
      s.activeBubble = { building: stage.building, text: { id: 'needsYou' }, agent: stage.agent };
      s.prompts.push({
        id: ++this.promptId,
        kind: stage.gate === 'hook' ? 'hook' : 'approval',
        storyId: story.id,
        ttl: stage.gate === 'hook' ? PROMPT_TTL : -1,
        total: stage.gate === 'hook' ? PROMPT_TTL : 1,
      });
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
      this.assign(carrier, { kind: 'handoff', building: next.building, work: 1, left: 1, status: { id: 'handoff', agent: next.agent } });
      s.activeBubble = { building: next.building, text: { id: 'toAgent', agent: next.agent }, agent: prev.agent };
    }
  }

  private finishStory() {
    const s = this.state;
    const story = s.story!;
    this.log('city', { id: 'doneStreet', topic: story.topic });
    s.story = null;
    s.activeBubble = null;
    const archive = s.agents.analysis;
    this.assign(archive, { kind: 'count', building: 'bank', work: 2.4, left: 2.4, status: { id: 'countJob' } });
    if (s.metrics.posts >= POSTS_PER_DAY) {
      this.log('city', { id: 'quota' });
      s.wrapIn = 4;
    }
  }

  private assign(a: AgentState, task: Task) {
    a.task = task;
    if (task.kind !== 'handoff') a.carrying = null;
    a.status = task.kind === 'stage' && a.at !== task.building ? { id: 'goto', building: task.building } : task.status;
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
        a.idleFor = rand(1.5, 4);
        a.status = { id: 'idle' };
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
          this.log('proto', { id: 'bookmark', topic: story.topic });
        }
        break;
      }
      case 'count':
        this.log('analysis', { id: 'counted', views: Math.round(s.metrics.views), shares: Math.round(s.metrics.shares) });
        break;
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
    if (a.id === 'proto' && s.queue.length < 2 && s.metrics.posts + s.queue.length < POSTS_PER_DAY) {
      this.assign(a, { kind: 'scan', building: 'newsroom', work: 5, left: 5, status: { id: 'scan' } });
      return;
    }
    const home = AGENT_BY_ID[a.id].home;
    const options: { b: BuildingId; status: Phrase }[] = [
      { b: 'cafe', status: { id: 'wander', spot: 'gate' } },
      { b: home, status: { id: 'wander', spot: 'home' } },
      { b: 'newsroom', status: { id: 'wander', spot: 'peek' } },
      { b: 'studio', status: { id: 'wander', spot: 'dailies' } },
      { b: 'bank', status: { id: 'wander', spot: 'files' } },
      { b: 'writers', status: { id: 'wander', spot: 'steal' } },
      { b: 'post', status: { id: 'wander', spot: 'queue' } },
    ];
    const choice = Math.random() < 0.5 ? options[Math.floor(Math.random() * 2)] : options[Math.floor(Math.random() * options.length)];
    const work = rand(2.5, 5.5);
    this.assign(a, { kind: 'wander', building: choice.b, work, left: work, status: choice.status });
  }
}
