import rawSample from './fleet.sample.json';

export type FleetStatus = 'idle' | 'busy' | 'needs_you' | 'offline';

export interface FleetBot {
  id: string;
  name: string;
  role: string;
  status: FleetStatus;
  deepLink: string;
  title?: string;
  webLink?: string;
  color?: string;
}

export interface FleetFile {
  updatedAt: string;
  source: string;
  bots: FleetBot[];
}

const STATUSES: readonly FleetStatus[] = ['idle', 'busy', 'needs_you', 'offline'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Night-shift walkers stay first. Everyone else keeps file order. */
const NIGHT_CORE = ['proto', 'pumpkin', 'analysis', 'grok', 'design', 'post'];

function canonicalDeepLink(id: string) {
  return `grokbot://app/v1/agent?id=${id}`;
}

function isStatus(value: unknown): value is FleetStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

export function parseFleet(data: unknown): FleetFile | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  if (typeof root.updatedAt !== 'string' || typeof root.source !== 'string' || !Array.isArray(root.bots)) return null;
  const bots: FleetBot[] = [];
  for (const raw of root.bots) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== 'string' || !UUID_RE.test(row.id)) continue;
    if (typeof row.name !== 'string' || row.name.trim() === '') continue;
    if (typeof row.role !== 'string') continue;
    if (!isStatus(row.status)) continue;
    const bot: FleetBot = {
      id: row.id,
      name: row.name,
      role: row.role,
      status: row.status,
      deepLink: canonicalDeepLink(row.id),
    };
    if (typeof row.title === 'string' && row.title.trim()) bot.title = row.title;
    if (typeof row.webLink === 'string' && /^https:\/\//.test(row.webLink)) bot.webLink = row.webLink;
    if (typeof row.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(row.color)) bot.color = row.color;
    bots.push(bot);
  }
  if (bots.length === 0) return null;
  return { updatedAt: root.updatedAt, source: root.source, bots };
}

const parsedSample = parseFleet(rawSample);
if (!parsedSample) throw new Error('fleet.sample.json is not a valid fleet file');

export const SAMPLE_FLEET: FleetFile = parsedSample;

export function orderRoster(bots: readonly FleetBot[]): FleetBot[] {
  const core = new Map<string, FleetBot>();
  const rest: FleetBot[] = [];
  for (const bot of bots) {
    const key = bot.name.toLowerCase();
    if (NIGHT_CORE.includes(key) && !core.has(key)) core.set(key, bot);
    else rest.push(bot);
  }
  return [...NIGHT_CORE.flatMap((key) => (core.has(key) ? [core.get(key)!] : [])), ...rest];
}

export function fleetCounts(fleet: FleetFile) {
  const total = fleet.bots.length;
  const online = fleet.bots.filter((bot) => bot.status !== 'offline').length;
  const needsYou = fleet.bots.filter((bot) => bot.status === 'needs_you').length;
  return { total, online, needsYou };
}

export async function loadFleet(): Promise<FleetFile> {
  try {
    const res = await fetch('./fleet.json', { cache: 'no-cache' });
    if (!res.ok) return SAMPLE_FLEET;
    return parseFleet(await res.json()) ?? SAMPLE_FLEET;
  } catch {
    return SAMPLE_FLEET;
  }
}
