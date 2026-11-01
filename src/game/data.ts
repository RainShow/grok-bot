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
  { id: 'cut', name: '拆镜', role: '拆开片子', color: '#3ee0ff', home: 'newsroom', shape: 'pill' },
  { id: 'hook', name: '钩子', role: '写那一句', color: '#ff4d9a', home: 'writers', shape: 'ghost' },
  { id: 'platform', name: '平台', role: '改成能发的尺寸', color: '#ff8a3d', home: 'studio', shape: 'pill' },
  { id: 'archive', name: '归档', role: '让数字过夜', color: '#ffe14a', home: 'bank', shape: 'tri' },
  { id: 'gate', name: '门卫', role: '不点头就不发', color: '#b388ff', home: 'cafe', shape: 'ghost' },
  { id: 'dispatch', name: '发报', role: '只做模拟发出', color: '#3dffb0', home: 'post', shape: 'ghost' },
];

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, AgentDef>;

export interface SeriesDoor {
  key: string;
  verse: string;
  color: string;
}

export const SERIES: SeriesDoor[] = [
  { key: '时间', verse: '影子先于光抵达', color: '#7cf6ff' },
  { key: '因果', verse: '果子先落地，种子才想起', color: '#ff4d9a' },
  { key: '重力', verse: '向上的楼梯也在往下拉', color: '#ff8a3d' },
  { key: '知觉', verse: '你盯着的东西，其实在看你', color: '#b388ff' },
  { key: '尺度', verse: '整座城缩进一粒种子', color: '#3dffb0' },
  { key: '形体', verse: '空心之处，才装得下一座城', color: '#ffe14a' },
  { key: '路径', verse: '每扇门都通向刚才', color: '#7aa2ff' },
];

export const PUMPKIN_LINE = '天亮前谁也别走';

export type StageKey = 'found' | 'written' | 'adapted' | 'archived' | 'gated' | 'published';

export interface StageDef {
  key: StageKey;
  label: string;
  agent: AgentId;
  building: BuildingId;
  work: number;
  bubble: string;
  gate?: 'hook' | 'approval';
}

export const STAGES: StageDef[] = [
  { key: 'found', label: '拆镜', agent: 'cut', building: 'newsroom', work: 3.2, bubble: '拆开今晚的时间线' },
  { key: 'written', label: '钩子', agent: 'hook', building: 'writers', work: 3.6, bubble: '三道门，只留一道', gate: 'hook' },
  { key: 'adapted', label: '适配', agent: 'platform', building: 'studio', work: 3.4, bubble: '改成平台的尺寸' },
  { key: 'archived', label: '归档', agent: 'archive', building: 'bank', work: 2.6, bubble: '写进档案柜' },
  { key: 'gated', label: '过门', agent: 'gate', building: 'cafe', work: 2.4, bubble: '天亮前谁也别走', gate: 'approval' },
  { key: 'published', label: '发报', agent: 'dispatch', building: 'post', work: 3, bubble: '模拟发出，不真发' },
];

const TOPICS = [
  { title: '借腹南瓜城：空心南瓜里亮着一整座城', tag: '形体', pumpkin: true },
  { title: '影子比光先到门口', tag: '时间', pumpkin: false },
  { title: '果子先落地，树还没决定', tag: '因果', pumpkin: false },
  { title: '楼梯往上走，重力往下记', tag: '重力', pumpkin: false },
  { title: '你看海报的时候，海报也在看你', tag: '知觉', pumpkin: false },
  { title: '森林缩进停车位，城缩进种子', tag: '尺度', pumpkin: false },
  { title: '七扇门，每扇都通向刚才', tag: '路径', pumpkin: false },
  { title: '黑森林里有一盏永不长大的灯', tag: '形体', pumpkin: true },
];

export interface Story {
  id: number;
  title: string;
  tag: string;
  likes: number;
  pumpkin: boolean;
  draft: string;
  seriesPick?: string;
  usedPumpkin?: boolean;
  gateDecision?: 'approve' | 'edit' | 'decline';
  editNote?: string;
}

const pick = <T,>(arr: T[], n: number) => arr[Math.abs(Math.floor(n)) % arr.length];

const topicOffset = Math.floor(Math.random() * TOPICS.length);

export function makeStory(id: number): Story {
  const topic = TOPICS[(topicOffset + id) % TOPICS.length];
  const door = pick(SERIES, id * 3 + 1);
  const draft = topic.pumpkin
    ? `${PUMPKIN_LINE}。空心南瓜里亮着一座城，进去就是进去。`
    : `${door.key}：${door.verse}。今晚就讲「${topic.title}」。`;
  return {
    id,
    title: topic.title,
    tag: topic.tag,
    likes: Math.round(4 + Math.random() * 40) * 1000,
    pumpkin: topic.pumpkin,
    draft,
  };
}
