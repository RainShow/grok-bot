import { N } from './iso';

export type BuildingId = 'newsroom' | 'studio' | 'bank' | 'writers' | 'post' | 'cafe';
export type Kind = 'tower' | 'studio' | 'bank' | 'house' | 'postoffice' | 'cafe' | 'apt' | 'cottage';

export interface Structure {
  id: string;
  kind: Kind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  h: number;
  color: string;
  roof?: string;
}

export interface Building extends Structure {
  id: BuildingId;
  no: string;
  name: string;
  tagline: string;
  door: [number, number];
  sign?: string;
}

export const BUILDINGS: Building[] = [
  {
    id: 'newsroom', no: '01', name: 'newsroom', tagline: 'scout reads everything', kind: 'tower',
    x0: 1, y0: 0.9, x1: 3.2, y1: 3.1, h: 170, color: '#8fa4d4', door: [4, 2], sign: 'NEWSROOM',
  },
  {
    id: 'writers', no: '02', name: "writers' room", tagline: 'three hooks, one wins', kind: 'house',
    x0: 5.3, y0: 0.8, x1: 7.6, y1: 3, h: 62, color: '#f3c9b4', roof: '#e0574f', door: [6, 4],
  },
  {
    id: 'post', no: '03', name: 'post office', tagline: 'six posts a day', kind: 'postoffice',
    x0: 9.3, y0: 5.2, x1: 12.1, y1: 7.7, h: 78, color: '#86d1b3', door: [8, 6], sign: 'POST OFFICE',
  },
  {
    id: 'studio', no: '04', name: 'studio', tagline: '1080p, eventually', kind: 'studio',
    x0: 0.5, y0: 5.2, x1: 3.3, y1: 7.7, h: 92, color: '#f2c14e', door: [4, 6], sign: 'STUDIO',
  },
  {
    id: 'bank', no: '05', name: 'bank', tagline: 'where ledger counts', kind: 'bank',
    x0: 5.3, y0: 9.3, x1: 7.8, y1: 11.8, h: 64, color: '#ece2cc', roof: '#d9ccb0', door: [6, 8], sign: 'BANK',
  },
  {
    id: 'cafe', no: '06', name: 'reply café', tagline: 'sponsors drop by', kind: 'cafe',
    x0: 9.4, y0: 9.4, x1: 11.6, y1: 11.5, h: 56, color: '#f4a6a0', door: [10, 8], sign: 'CAFÉ',
  },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, Building>;

export const FILLERS: Structure[] = [
  { id: 'f1', kind: 'apt', x0: 0.4, y0: 9.3, x1: 2.2, y1: 11, h: 110, color: '#e9a9a4' },
  { id: 'f2', kind: 'cottage', x0: 2.6, y0: 11.1, x1: 3.7, y1: 12.4, h: 36, color: '#f5e7c8', roof: '#e0574f' },
  { id: 'f3', kind: 'cottage', x0: 0.5, y0: 11.5, x1: 1.8, y1: 12.6, h: 34, color: '#f1ebe0', roof: '#5c7fc9' },
  { id: 'f4', kind: 'apt', x0: 9.3, y0: 0.6, x1: 10.8, y1: 2.1, h: 96, color: '#a9d5a4' },
  { id: 'f5', kind: 'apt', x0: 11.2, y0: 0.6, x1: 12.5, y1: 3.2, h: 140, color: '#b8a9e2' },
  { id: 'f7', kind: 'apt', x0: 12.1, y0: 9.4, x1: 12.8, y1: 11.8, h: 120, color: '#c3b6ea' },
  { id: 'f8', kind: 'cottage', x0: 5.4, y0: 12.0, x1: 6.6, y1: 12.8, h: 30, color: '#d4ecd0', roof: '#7a9e6a' },
];

export const TREES: [number, number][] = [
  [0.4, 0.4], [3.6, 3.6], [0.4, 3.6], [3.6, 0.5], [2.1, 3.65],
  [5.25, 3.6], [7.85, 0.5], [5.0, 0.45],
  [9.5, 3.5], [10.7, 3.2], [12.7, 3.7],
  [3.7, 5.4], [0.3, 7.85], [2, 7.95],
  [5.25, 5.25], [7.8, 5.3], [5.25, 7.75],
  [12.6, 5.4], [12.65, 7.6],
  [3.3, 9.5], [2.85, 10.5], [3.75, 12.7],
  [7.65, 12.45], [5.0, 11.4],
  [9.5, 12.45], [11.0, 12.55], [12.55, 12.65],
];

export const LAMPS: [number, number][] = [
  [3.85, 3.85], [7.85, 3.85], [9.15, 3.85], [3.85, 9.15], [7.85, 9.15], [9.15, 9.15], [3.85, 5.15], [9.15, 5.0],
];

export const BILLBOARD = { x0: 5.4, x1: 6.9, y: 6.1 };
export const HUB = { x: 7.15, y: 7.15 };

export const CONVEYORS: [number, number][][] = [
  [[3.3, 7.15], [7.15, 7.15], [9.3, 7.15]],
  [[7.15, 3], [7.15, 7.15]],
];

export const isRoad = (i: number, j: number) => i === 4 || i === 8 || j === 4 || j === 8;
export const isPlaza = (i: number, j: number) => i >= 5 && i <= 7 && j >= 5 && j <= 7;

export type Tile = [number, number];

export function findPath(from: Tile, to: Tile): Tile[] {
  const key = (t: Tile) => t[0] * 100 + t[1];
  const prev = new Map<number, Tile | null>();
  prev.set(key(from), null);
  const q: Tile[] = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur[0] === to[0] && cur[1] === to[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n: Tile = [cur[0] + dx, cur[1] + dy];
      if (n[0] < 0 || n[1] < 0 || n[0] >= N || n[1] >= N) continue;
      if (!isRoad(n[0], n[1]) || prev.has(key(n))) continue;
      prev.set(key(n), cur);
      q.push(n);
    }
  }
  if (!prev.has(key(to))) return [from, to];
  const path: Tile[] = [];
  let c: Tile | null = to;
  while (c) {
    path.unshift(c);
    c = prev.get(key(c)) ?? null;
  }
  return path;
}
