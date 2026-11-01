import type { BuildingId } from './world';

export type AgentId = 'scout' | 'hook' | 'reel' | 'post' | 'reply' | 'ledger';

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  home: BuildingId;
  shape: 'pill' | 'ghost' | 'tri';
}

export const AGENTS: AgentDef[] = [
  { id: 'scout', name: 'scout', role: 'reads everything', color: '#2f9e6e', home: 'newsroom', shape: 'pill' },
  { id: 'hook', name: 'hook', role: 'writes the hooks', color: '#e8344e', home: 'writers', shape: 'ghost' },
  { id: 'reel', name: 'reel', role: 'cuts the video', color: '#f2622e', home: 'studio', shape: 'pill' },
  { id: 'post', name: 'post', role: 'ships to timeline', color: '#6a4be0', home: 'post', shape: 'ghost' },
  { id: 'reply', name: 'reply', role: 'talks to people', color: '#2f6fe0', home: 'cafe', shape: 'ghost' },
  { id: 'ledger', name: 'ledger', role: 'counts everything', color: '#f0a020', home: 'bank', shape: 'tri' },
];

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, AgentDef>;

export type StageKey =
  | 'found' | 'written' | 'edited' | 'sponsored' | 'rendered' | 'reviewed' | 'published' | 'crosspost' | 'hottake';

export interface StageDef {
  key: StageKey;
  label: string;
  agent: AgentId;
  building: BuildingId;
  work: number;
  bubble: string;
  gate?: 'hook' | 'hottake';
}

export const STAGES: StageDef[] = [
  { key: 'found', label: 'found', agent: 'scout', building: 'newsroom', work: 4, bubble: 'reading the timeline' },
  { key: 'written', label: 'written', agent: 'hook', building: 'writers', work: 6, bubble: 'three hooks, one wins', gate: 'hook' },
  { key: 'edited', label: 'edited', agent: 'reel', building: 'studio', work: 5, bubble: 'cutting the reel' },
  { key: 'sponsored', label: 'sponsored', agent: 'reply', building: 'cafe', work: 4, bubble: 'a sponsor dropped by' },
  { key: 'rendered', label: 'rendered', agent: 'reel', building: 'studio', work: 6, bubble: '1080p, eventually' },
  { key: 'reviewed', label: 'reviewed', agent: 'ledger', building: 'bank', work: 3, bubble: 'checking the numbers' },
  { key: 'published', label: 'published', agent: 'post', building: 'post', work: 4, bubble: 'posting to the timeline' },
  { key: 'crosspost', label: 'cross-post', agent: 'post', building: 'post', work: 3, bubble: 'cross-posting everywhere' },
  { key: 'hottake', label: 'hot take', agent: 'reply', building: 'cafe', work: 4, bubble: 'brewing a hot take', gate: 'hottake' },
];

const TOPICS = [
  { title: 'a robot vacuum learned to open doors', tag: 'tech' },
  { title: 'a city replaced parking with tiny forests', tag: 'cities' },
  { title: 'someone ran an LLM on a pocket calculator', tag: 'ai' },
  { title: 'the world’s slowest speedrun just finished', tag: 'games' },
  { title: 'a bakery that only opens when it rains', tag: 'food' },
  { title: 'a cat became mayor of a small town again', tag: 'pets' },
  { title: 'an open-source satellite phoned home', tag: 'space' },
  { title: 'a museum lets visitors touch everything', tag: 'culture' },
  { title: 'a startup sells silence by the minute', tag: 'business' },
];

const HOOK_TEMPLATES = [
  (t: string) => `nobody is talking about how ${t}.`,
  (t: string) => `${t} — and it changes everything.`,
  (t: string) => `I spent 3 hours on this: ${t}.`,
  (t: string) => `wait until you see why ${t}.`,
  (t: string) => `the internet can't stop arguing: ${t}.`,
];

const TAKES = [
  'honestly? this is the most 2026 thing that has ever happened.',
  'hot take: this is good, actually, and you know it.',
  'unpopular opinion: we needed this five years ago.',
  'this is either genius or a cry for help. maybe both.',
  'everyone is sleeping on the real story here.',
];

export interface Story {
  id: number;
  title: string;
  tag: string;
  likes: number;
  hooks: string[];
  hookPick?: number;
  take: string;
  sponsor?: { name: string; fee: number };
  takeApproved?: boolean;
}

const SPONSORS = ['oat milk co.', 'keyboard club', 'cloud sauna', 'tiny desk lamps', 'sock subscription', 'meal kit'];

const pick = <T>(arr: T[], n: number) => arr[Math.abs(Math.floor(n)) % arr.length];

const topicOffset = Math.floor(Math.random() * TOPICS.length);

export function makeStory(id: number): Story {
  const topic = TOPICS[(topicOffset + id) % TOPICS.length];
  const start = Math.floor(Math.random() * HOOK_TEMPLATES.length);
  return {
    id,
    title: topic.title,
    tag: topic.tag,
    likes: Math.round(4 + Math.random() * 40) * 1000,
    hooks: [0, 1, 2].map((k) => pick(HOOK_TEMPLATES, start + k)(topic.title)),
    take: pick(TAKES, id + Math.random() * 5),
  };
}

export function makeSponsor() {
  return { name: pick(SPONSORS, Math.random() * 100), fee: Math.round(40 + Math.random() * 160) };
}
