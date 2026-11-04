import type { FleetBot } from '../../game/fleet';
import type { Lang } from '../../i18n/copy';

export type FloorId = 'overview' | 'night' | 'content' | 'research' | 'lobby' | 'classified';
export type HomeFloor = 'night' | 'content' | 'research' | 'lobby';

export const FLOOR_Y: Record<HomeFloor, number> = {
  lobby: 0.4,
  research: 3.76,
  content: 7.12,
  night: 10.48,
};

export const PLATE_W = 12.6;
export const PLATE_D = 9.2;

/** Desk yaw. Chair sits on local +z; bots face the desk, three-quarter toward the camera. */
export const DESK_YAW = Math.PI + 0.72;

export interface Seat {
  at: [number, number];
  rot: number;
}

export function chairFromDesk(x: number, z: number, yaw = DESK_YAW): Seat {
  return {
    at: [x + Math.sin(yaw) * 0.5, z + Math.cos(yaw) * 0.5],
    rot: yaw + Math.PI,
  };
}

const NIGHT_DESKS: [number, number][] = [
  [-4.4, -0.15],
  [-2.64, -0.15],
  [-0.88, -0.15],
  [0.88, -0.15],
  [2.64, -0.15],
  [4.4, -0.15],
];
const CONTENT_DESKS: [number, number][] = [
  [-3.55, 0.2],
  [-1.6, 0.2],
  [0.35, 0.2],
];
const RESEARCH_DESKS: [number, number][] = [
  [-3.35, -0.25],
  [-1.15, -0.25],
  [1.1, -0.25],
  [3.25, -0.25],
];

export const WORK_DESKS = {
  night: NIGHT_DESKS,
  content: CONTENT_DESKS,
  research: RESEARCH_DESKS,
} as const;

export const SEATS: Record<HomeFloor, Seat[]> = {
  night: NIGHT_DESKS.map(([x, z]) => chairFromDesk(x, z)),
  content: CONTENT_DESKS.map(([x, z]) => chairFromDesk(x, z)),
  research: RESEARCH_DESKS.map(([x, z]) => chairFromDesk(x, z)),
  lobby: [{ at: [1.45, 1.72], rot: 0.5 }],
};

const NIGHT = new Set(['proto', 'pumpkin', 'design', 'analysis', 'grok', 'post']);
const CONTENT = new Set(['operation', 'weekly', 'chat']);
const RESEARCH = new Set(['research', 'answer', 'id', 'dr eggbot']);

/** book is offline in the sample, so the lobby is where they sit. */
export function floorOf(bot: { name: string }): HomeFloor {
  const key = bot.name.toLowerCase();
  if (key === 'book') return 'lobby';
  if (NIGHT.has(key)) return 'night';
  if (CONTENT.has(key)) return 'content';
  if (RESEARCH.has(key)) return 'research';
  return 'lobby';
}

export const CLASSIFIED_NAMES = ['proto', 'analysis', 'grok'] as const;

export function presenceCounts(bots: readonly FleetBot[]) {
  let working = 0;
  let waiting = 0;
  for (const bot of bots) {
    if (bot.status === 'busy') working += 1;
    else if (bot.status === 'needs_you') waiting += 1;
  }
  return { working, waiting };
}

export interface Pose {
  pos: [number, number, number];
  look: [number, number, number];
  zoom: number;
}

export function poseFor(floor: FloorId): Pose {
  switch (floor) {
    case 'overview':
      return { pos: [23, 17.5, 23], look: [0.7, 6.3, 0.45], zoom: 40 };
    case 'night':
      return { pos: [14.2, 15.4, 14.2], look: [0.15, 9.15, 0.05], zoom: 76 };
    case 'content':
      return { pos: [13.6, 13.2, 13.6], look: [0.1, 6.15, 0.05], zoom: 78 };
    case 'research':
      return { pos: [13.2, 11.2, 13.2], look: [0.1, 3.35, 0.05], zoom: 80 };
    case 'lobby':
      return { pos: [15.5, 10.4, 15.5], look: [0.15, 1.7, 0.4], zoom: 58 };
    case 'classified':
      return { pos: [12, 13.6, 12], look: [0, 1.2, 0], zoom: 58 };
  }
}

export function frameZoom(base: number, width: number, height: number) {
  const fit = Math.min(1, Math.max(0.48, Math.min(width / 1120, height / 760)));
  return base * fit;
}

const TASKS: Record<string, { zh: string; en: string }> = {
  proto: { zh: '把想法收成 draft', en: 'Turning an idea into a draft' },
  pumpkin: { zh: '钩子摆上桌，等你点头', en: 'Hooks on the table, waiting for a nod' },
  design: { zh: '在改封面的第三稿', en: 'Revising the cover, third pass' },
  analysis: { zh: '晨间 digest 写到一半', en: 'Halfway through the morning digest' },
  grok: { zh: '看着整层的队列', en: 'Watching the whole floor’s queue' },
  post: { zh: '只做模拟，不真的发出去', en: 'Simulating a send, not a real one' },
  operation: { zh: '把今天的操作摊开', en: 'Laying out today’s operations' },
  weekly: { zh: '在拼这一周的版面', en: 'Composing the weekly spread' },
  chat: { zh: '接着昨天的对话', en: 'Picking up yesterday’s chat' },
  research: { zh: '夹进一页新笔记', en: 'Clipping a new note' },
  answer: { zh: '在改一句回答', en: 'Rewriting one answer' },
  id: { zh: '对一下身份卡', en: 'Checking the identity card' },
  'dr eggbot': { zh: '在想下一个 bot 的样子', en: 'Sketching the next bot' },
  book: { zh: '离线，来大厅坐一会儿', en: 'Offline, visiting the lobby' },
};

export function taskFor(lang: Lang, name: string, classified = false) {
  const row = TASKS[name.toLowerCase()];
  const base = row ? row[lang] : lang === 'zh' ? '在楼层里走动' : 'Walking the floor';
  if (!classified) return base;
  return lang === 'zh' ? `机密席 · ${base}` : `Classified desk · ${base}`;
}

export interface ActivityItem {
  name: string;
  zh: string;
  en: string;
}

export const ACTIVITIES: ActivityItem[] = [
  { name: 'proto', zh: 'proto 收好一份 draft', en: 'proto folded a draft' },
  { name: 'pumpkin', zh: 'pumpkin 把钩子留在桌上', en: 'pumpkin left the hooks on the table' },
  { name: 'design', zh: 'design 换了一版封面', en: 'design revised a cover' },
  { name: 'Grok', zh: 'Grok 把夜班队列理顺', en: 'Grok straightened the night queue' },
  { name: 'post', zh: 'post 模拟发出一条，没有真的投稿', en: 'post simulated a send. Nothing went out' },
  { name: 'research', zh: 'research 夹进一页笔记', en: 'research clipped a note' },
  { name: 'weekly', zh: 'weekly 摊开这一周的版面', en: 'weekly opened this week’s spread' },
];

export const CLASSIFIED_LINE = {
  zh: '夜巡把记录合上了。没人看见',
  en: 'Night watch closed the log. Nobody saw',
};

export const FLOOR_BLURB: Record<Exclude<FloorId, 'overview'>, { zh: string; en: string }> = {
  night: { zh: '想法、钩子、设计、digest、放行、模拟发出', en: 'Ideas, hooks, design, the digest, the nod, a simulated send' },
  content: { zh: '操作、周报、对话', en: 'Operations, the weekly, chat' },
  research: { zh: '调研、回答、身份。book 下楼坐着', en: 'Notes, answers, identity. book went downstairs' },
  lobby: { zh: '前台亮着。离线的 book 来坐一会儿', en: 'The desk is lit. Offline book is visiting' },
  classified: { zh: '红灯亮了才算进来', en: 'The red lights mean you are in' },
};

export function floorTitle(lang: Lang, floor: Exclude<FloorId, 'overview'>) {
  const zh = lang === 'zh';
  switch (floor) {
    case 'night':
      return zh ? '夜班作战' : 'Night shift';
    case 'content':
      return zh ? '内容运营' : 'Content';
    case 'research':
      return zh ? '研究写作' : 'Research';
    case 'lobby':
      return zh ? '大厅' : 'Lobby';
    case 'classified':
      return zh ? '夜巡' : 'Night watch';
  }
}

export function floorKicker(floor: FloorId) {
  switch (floor) {
    case 'overview':
      return '';
    case 'night':
      return '3';
    case 'content':
      return '2';
    case 'research':
      return '1';
    case 'lobby':
      return '';
    case 'classified':
      return 'B2';
  }
}

type V2 = [number, number];

const PATHS: Record<HomeFloor | 'classified', V2[][]> = {
  night: [
    [[-3.8, -0.2], [-1.6, -0.2], [-1.6, 2.3], [-3.8, 2.3]],
    [[-0.4, -2.4], [1.4, -2.4], [1.4, -0.6], [-0.4, -0.6]],
    [[2.2, 0.4], [4.3, 0.4], [4.3, 2.5], [2.4, 2.6]],
    [[-4.4, -2.6], [-2.2, -2.6], [-2.2, -1.2], [-4.4, -1.2]],
    [[3.1, -2.5], [4.6, -1.2], [3.2, -0.2], [2.1, -1.6]],
    [[0.2, 1.2], [1.8, 2.4], [-0.6, 2.6], [-0.8, 1.1]],
  ],
  content: [
    [[-3.2, -0.4], [-0.8, -0.4], [-0.8, 1.6], [-3.2, 1.6]],
    [[0.8, -1.8], [3.2, -1.8], [3.2, 0.4], [0.8, 0.4]],
    [[-1.2, 2.2], [1.6, 2.4], [3.4, 1.4], [0.4, 1.2]],
  ],
  research: [
    [[-3.4, -1.6], [-1.2, -1.6], [-1.2, 0.6], [-3.4, 0.6]],
    [[0.4, -1.8], [2.6, -1.8], [2.6, 0.2], [0.4, 0.2]],
    [[-2.4, 1.8], [0.2, 2.4], [1.8, 1.2], [-1.4, 1.1]],
    [[3.4, 1.2], [4.4, 2.2], [3.2, 2.6], [2.4, 1.6]],
  ],
  lobby: [
    [[1.5, 2.15]],
    [[-3.4, 0.8], [-1.2, 1.5], [0.4, 2.5], [-2.2, 2.6]],
    [[3.2, -0.6], [4.6, 0.8], [3.4, 2.1]],
  ],
  classified: [
    [[-2.2, 1.6], [-1.2, 2.3], [0.2, 1.8], [-1.4, 0.8]],
    [[2.2, -1.4], [1.2, -2.2], [0.2, -1.2], [1.4, -0.4]],
    [[2.4, 1.5], [1.4, 2.2], [2.6, 0.4]],
  ],
};

export function pathFor(floor: HomeFloor | 'classified', index: number): V2[] {
  const set = PATHS[floor];
  if (set[index]) return set[index];
  const x = -3 + (index % 5) * 1.3;
  return [
    [x, -1.8],
    [x + 1.1, -0.4],
    [x, 1.6],
  ];
}
