import type { BuildingId } from './world';

export type AgentId = 'cut' | 'hook' | 'platform' | 'archive' | 'gate' | 'dispatch';

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  home: BuildingId;
  shape: 'pill' | 'ghost' | 'tri';
}

export const AGENTS: AgentDef[] = [
  { id: 'cut', name: '拆镜', role: '拆开片子', color: '#9ec4e0', home: 'newsroom', shape: 'pill' },
  { id: 'hook', name: '钩子', role: '写那一句', color: '#d7c4b2', home: 'writers', shape: 'ghost' },
  { id: 'platform', name: '平台', role: '改成能发的尺寸', color: '#b7c4a4', home: 'studio', shape: 'pill' },
  { id: 'archive', name: '归档', role: '让数字过夜', color: '#e0d2a8', home: 'bank', shape: 'tri' },
  { id: 'gate', name: '门卫', role: '不点头就不发', color: '#c5ced8', home: 'cafe', shape: 'ghost' },
  { id: 'dispatch', name: '发报', role: '只做模拟发出', color: '#c4f93e', home: 'post', shape: 'ghost' },
];

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, AgentDef>;

export type SeriesId = 'time' | 'cause' | 'gravity' | 'sense' | 'scale' | 'form' | 'path';

export interface SeriesDoor {
  id: SeriesId;
  color: string;
}

export const SERIES: SeriesDoor[] = [
  { id: 'time', color: '#c5d8ea' },
  { id: 'cause', color: '#d8cbb8' },
  { id: 'gravity', color: '#c4b48a' },
  { id: 'sense', color: '#b7c0cc' },
  { id: 'scale', color: '#c4f93e' },
  { id: 'form', color: '#e6e8ea' },
  { id: 'path', color: '#8eafc8' },
];

export type StageKey = 'found' | 'written' | 'adapted' | 'archived' | 'gated' | 'published';

export interface StageDef {
  key: StageKey;
  agent: AgentId;
  building: BuildingId;
  work: number;
  gate?: 'hook' | 'approval';
}

export const STAGES: StageDef[] = [
  { key: 'found', agent: 'cut', building: 'newsroom', work: 3.2 },
  { key: 'written', agent: 'hook', building: 'writers', work: 3.6, gate: 'hook' },
  { key: 'adapted', agent: 'platform', building: 'studio', work: 3.4 },
  { key: 'archived', agent: 'archive', building: 'bank', work: 2.6 },
  { key: 'gated', agent: 'gate', building: 'cafe', work: 2.4, gate: 'approval' },
  { key: 'published', agent: 'dispatch', building: 'post', work: 3 },
];

export type TopicId = 'hollow' | 'shadow' | 'fruit' | 'stairs' | 'poster' | 'seed' | 'doors' | 'lamp';

const TOPICS: { id: TopicId; series: SeriesId; pumpkin: boolean }[] = [
  { id: 'hollow', series: 'form', pumpkin: true },
  { id: 'shadow', series: 'time', pumpkin: false },
  { id: 'fruit', series: 'cause', pumpkin: false },
  { id: 'stairs', series: 'gravity', pumpkin: false },
  { id: 'poster', series: 'sense', pumpkin: false },
  { id: 'seed', series: 'scale', pumpkin: false },
  { id: 'doors', series: 'path', pumpkin: false },
  { id: 'lamp', series: 'form', pumpkin: true },
];

export function topicMeta(id: TopicId) {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}

export interface Story {
  id: number;
  topic: TopicId;
  likes: number;
  pumpkin: boolean;
  seriesPick?: SeriesId;
  usedPumpkin?: boolean;
  gateDecision?: 'approve' | 'edit' | 'decline';
  editNote?: string;
}

const topicOffset = Math.floor(Math.random() * TOPICS.length);

export function makeStory(id: number): Story {
  const topic = TOPICS[(topicOffset + id) % TOPICS.length];
  return {
    id,
    topic: topic.id,
    likes: Math.round(4 + Math.random() * 40) * 1000,
    pumpkin: topic.pumpkin,
  };
}
