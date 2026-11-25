// The frontier: country beyond the hand-made map, generated a screen at a time as the player
// walks into it. A generated room is an ordinary RoomDef, built from nothing but the content's
// frontier settings and the cell's position, so the same cell is the same place for everyone,
// every time, without being stored.

import { buildScene } from './build';
import { mix, stream } from './noise';
import type { Content, DoorDef, Effect, LayerDef, LookWhen, NpcDef, PropDef, RoomDef, Rule, SightDef, SpawnDef, ThingDef } from './types';
import { blockedEdges, canReach, reachable } from './walk';

type Biome = 'pines' | 'open' | 'mere' | 'ruin' | 'camp' | 'crags' | 'deadwood' | 'shrine' | 'steading' | 'valley' | 'pass';

type Side = 'n' | 's' | 'e' | 'w';
const STEP: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const BACK: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };

export const wildId = (x: number, y: number): string => `wild_${x}_${y}`;
/** The vault under the ruined tower in a cell, where there is one. */
export const cryptId = (x: number, y: number): string => `crypt_${x}_${y}`;

function parseCrypt(id: string): [number, number] | null {
  const m = /^crypt_(-?\d+)_(-?\d+)$/.exec(id);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** A name from two halves, never one that says the same thing twice ("Greywater Water"). */
function placeName(first: string, seconds: string[], pick: <T>(list: T[]) => T): string {
  const second = pick(seconds);
  const echo = (s: string): boolean => first.toLowerCase().includes(s.toLowerCase());
  return `${first} ${echo(second) ? seconds.find((s) => !echo(s)) ?? second : second}`;
}

/** "a brooch", "an iron torc". */
export const withArticle = (name: string): string => name;

export function parseWild(id: string): [number, number] | null {
  const m = /^wild_(-?\d+)_(-?\d+)$/.exec(id);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

const cache = new WeakMap<Content, Map<string, RoomDef | undefined>>();

/** Which hand-made room, if any, sits on a cell of the map. */
function handAt(c: Content, x: number, y: number): string | undefined {
  return Object.entries(c.frontier?.grid ?? {}).find(([, at]) => at[0] === x && at[1] === y)?.[0];
}

/**
 * Any room by id: hand-made, or generated if the id names a cell of the frontier. Hand-made
 * rooms come back with their gates onto the frontier added to their exits.
 */
export function roomOf(c: Content, id: string): RoomDef | undefined {
  let mine = cache.get(c);
  if (!mine) cache.set(c, (mine = new Map()));
  if (mine.has(id)) return mine.get(id);
  let def: RoomDef | undefined = c.rooms[id];
  const f = c.frontier;
  if (def && f?.gates[id] && f.grid[id]) {
    const [x, y] = f.grid[id];
    const exits = { ...def.exits };
    for (const side of f.gates[id] as Iterable<Side>) if (edgeOf(c, x, y, side) !== 'wall') exits[side] ??= wildId(x + STEP[side][0], y + STEP[side][1]);
    def = { ...def, exits };
  } else if (!def && f) {
    const at = parseWild(id);
    const under = parseCrypt(id);
    if (at && !handAt(c, at[0], at[1])) def = generate(c, at[0], at[1]);
    else if (under) def = crypt(c, under[0], under[1]);
  }
  mine.set(id, def);
  return def;
}

/**
 * Where a room sits on the map. Rooms that are not on it themselves (the inside of a house, the
 * chambers under a mound) are placed where their doors lead out.
 */
export function cellOf(c: Content, id: string): [number, number] | null {
  const seen = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const at = queue.shift()!;
    if (seen.has(at)) continue;
    seen.add(at);
    const cell = c.frontier?.grid[at] ?? parseWild(at);
    if (cell) return cell;
    for (const d of roomOf(c, at)?.doors ?? []) queue.push(d.to);
  }
  return null;
}

export interface MapCell {
  x: number;
  y: number;
  /** Empty for a place known of but not yet walked. */
  mark: string;
  name: string;
  here: boolean;
  /** Somewhere the player has been asked to go. */
  goal?: boolean;
  /** A place with a name of its own: made by hand, or where one of the hand-written sights stands. */
  named?: boolean;
}

/** The map as the player knows it: everywhere visited, and the unvisited places those lead to. */
export function chart(c: Content, flags: Record<string, unknown>, here: string): MapCell[] {
  const at = cellOf(c, here);
  const cells = new Map<string, MapCell>();
  const key = (x: number, y: number): string => `${x},${y}`;
  const visited = new Set<string>([c.start.room]);
  for (const k of Object.keys(flags)) if (k.startsWith('seen.') && flags[k]) visited.add(k.slice(5));
  // Wherever you are standing, you have plainly been.
  if (at) visited.add(handAt(c, at[0], at[1]) ?? wildId(at[0], at[1]));
  const outdoors = [...visited].filter((id) => (c.frontier?.grid[id] ?? parseWild(id)) && roomOf(c, id));
  for (const id of outdoors) {
    const def = roomOf(c, id)!;
    const [x, y] = (c.frontier?.grid[id] ?? parseWild(id))!;
    cells.set(key(x, y), { x, y, mark: def.mark ?? 'open', name: def.name, here: false });
    if (c.frontier?.grid[id] || sights(c).has(id)) cells.get(key(x, y))!.named = true;
  }
  for (const id of outdoors) {
    const [x, y] = (c.frontier?.grid[id] ?? parseWild(id))!;
    for (const [side, to] of Object.entries(roomOf(c, id)!.exits ?? {}) as [Side, string][]) {
      const k = key(x + STEP[side][0], y + STEP[side][1]);
      if (to && !cells.has(k)) cells.set(k, { x: x + STEP[side][0], y: y + STEP[side][1], mark: '', name: '', here: false });
    }
  }
  if (at) {
    const mine = cells.get(key(at[0], at[1]));
    if (mine) mine.here = true;
  }
  // Flags named "goal" or "goal.something" name rooms the player has been sent to; they are shown
  // even before they are found.
  for (const [name, room] of Object.entries(flags)) {
    if ((name !== 'goal' && !name.startsWith('goal.')) || typeof room !== 'string') continue;
    const goal = c.frontier?.grid[room] ?? parseWild(room);
    if (!goal) continue;
    const k = key(goal[0], goal[1]);
    if (!cells.has(k)) cells.set(k, { x: goal[0], y: goal[1], mark: '', name: '', here: false });
    cells.get(k)!.goal = true;
  }
  return [...cells.values()];
}

/** How far the valley reaches from the middle of the map. Without one, the hand-made places sit edge to edge in the middle three by three. */
const reachOf = (c: Content): number => c.frontier?.valley?.reach ?? 1;

/**
 * How far a cell is beyond the edge of the valley: 0 inside it, 1 for the first ring of country
 * outside. Hand-made places further out do not move the edge.
 */
export function depthOf(c: Content, x: number, y: number): number {
  const r = Math.max(Math.abs(x), Math.abs(y));
  return r <= reachOf(c) ? 0 : r - reachOf(c);
}

const ringOf = (x: number, y: number): number => Math.max(Math.abs(x), Math.abs(y));

/** Which march (counting from 0, nearest home first) runs along the outer edge of a ring, if any. */
function marchOf(c: Content, ring: number): number {
  return c.frontier?.marches?.rings.indexOf(ring) ?? -1;
}

/** The side of its ring a cell faces outward on, if it is on a side and not a corner. */
function outward(x: number, y: number): Side | null {
  const r = ringOf(x, y);
  if (Math.abs(x) === r && Math.abs(y) < r) return x > 0 ? 'e' : 'w';
  if (Math.abs(y) === r && Math.abs(x) < r) return y > 0 ? 's' : 'n';
  return null;
}

/**
 * Is this cell one of the passes through a march? Each side of the ring is cut into as many
 * stretches as it has passes, and each stretch has one, somewhere along it.
 */
export function isPass(c: Content, X: number, Y: number): boolean {
  const f = c.frontier;
  const r = ringOf(X, Y);
  const side = outward(X, Y);
  if (!f?.marches || !side || marchOf(c, r) < 0 || handAt(c, X, Y)) return false;
  // The north wall has no passes: the only way through it is a place made by hand.
  if (side === 'n' && f.northWall === r) return false;
  const along = side === 'e' || side === 'w' ? Y : X;
  const span = 2 * r - 1;
  const n = Math.max(1, f.marches.passes);
  for (let k = 0; k < n; k++) {
    const lo = -(r - 1) + Math.floor((span * k) / n);
    const hi = -(r - 1) + Math.floor((span * (k + 1)) / n) - 1;
    if (along >= lo && along <= hi && along === lo + (mix(r, 'nsew'.indexOf(side), k, f.seed + 17) % (hi - lo + 1))) return true;
  }
  return false;
}

/**
 * What lies between a cell and its neighbour on one side: open country, the wall of a march, or
 * a pass through one.
 */
export function edgeOf(c: Content, X: number, Y: number, side: Side): 'open' | 'wall' | 'pass' {
  const [nx, ny] = [X + STEP[side][0], Y + STEP[side][1]];
  // The north wall runs on past the corners of its ring, east and west, without end.
  const wall = c.frontier?.northWall;
  if (wall !== undefined && (side === 'n' || side === 's') && Math.min(Y, ny) === -wall - 1) return 'wall';
  const [r1, r2] = [ringOf(X, Y), ringOf(nx, ny)];
  if (Math.abs(r1 - r2) !== 1 || marchOf(c, Math.min(r1, r2)) < 0) return 'open';
  const [ix, iy, out] = r1 < r2 ? [X, Y, side] : [nx, ny, BACK[side]];
  return isPass(c, ix, iy) && outward(ix, iy) === out ? 'pass' : 'wall';
}

/** The biome a cell of the frontier will be, without building it. Cheap enough to scan with. */
export function kindAt(c: Content, X: number, Y: number): string | null {
  const f = c.frontier;
  if (!f || handAt(c, X, Y)) return null;
  // Between the places of the valley there is only the valley's own country: roads.
  if (f.valley && !depthOf(c, X, Y)) return 'valley';
  if (isPass(c, X, Y)) return 'pass';
  const set = f.kinds?.[`${X},${Y}`];
  if (set) return set;
  let roll = (mix(X, Y, f.seed) / 4294967296) * Object.values(f.odds).reduce((n, v) => n + v, 0);
  for (const [biome, weight] of Object.entries(f.odds)) if ((roll -= weight) < 0) return biome;
  return Object.keys(f.odds)[0];
}

const homeCache = new WeakMap<Content, Record<string, [number, number]>>();

/** Where each of the frontier's folk lives: the steadings nearest home, one each, in the order they are listed. */
export function homes(c: Content): Record<string, [number, number]> {
  let found = homeCache.get(c);
  if (found) return found;
  homeCache.set(c, (found = {}));
  const folk = c.frontier?.folk ?? [];
  const past = c.frontier?.folkPast ?? {};
  const taken = new Set<string>();
  // First those who live out past some place with a name: the nearest steading beyond it.
  for (const who of folk) {
    const from = past[who] ? c.frontier?.grid[past[who]] : undefined;
    if (!from) continue;
    const at = findNear(c, from[0], from[1], ['steading'], 8, 0, (x, y) => Math.hypot(x, y) > Math.hypot(from[0], from[1]) && !taken.has(wildId(x, y)));
    if (!at) continue;
    found[who] = [at.x, at.y];
    taken.add(wildId(at.x, at.y));
  }
  const rest = folk.filter((who) => !found[who]);
  let n = 0;
  for (let r = 1; r <= 16 && n < rest.length; r++)
    for (let dy = -r; dy <= r && n < rest.length; dy++)
      for (let dx = -r; dx <= r && n < rest.length; dx++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && kindAt(c, dx, dy) === 'steading' && !taken.has(wildId(dx, dy))) found[rest[n++]] = [dx, dy];
  return found;
}

const sightCache = new WeakMap<Content, Map<string, SightDef>>();

/**
 * Which sight stands in which cell of the frontier. Each stands once: in the nearest ring of
 * country far enough out that has a free cell of a kind that suits it, starting round the ring
 * from a different place for each, so that they do not all lie the same way from home.
 */
export function sights(c: Content): Map<string, SightDef> {
  let found = sightCache.get(c);
  if (found) return found;
  sightCache.set(c, (found = new Map()));
  const f = c.frontier;
  if (!f?.sights?.length) return found;
  const taken = new Set(Object.values(homes(c)).map(([x, y]) => wildId(x, y)));
  for (const h of f.haunts ?? []) {
    const at = lair(c, h.kind);
    if (at) taken.add(wildId(at[0], at[1]));
  }
  const lies = (side: Side, x: number, y: number): boolean => (side === 'w' ? x < 0 && -x >= Math.abs(y) : side === 'e' ? x > 0 && x >= Math.abs(y) : side === 'n' ? y < 0 && -y >= Math.abs(x) : y > 0 && y >= Math.abs(x));
  f.sights.forEach((s, n) => {
    for (let r = (s.minDepth ?? 1) + reachOf(c); r <= 24; r++) {
      const ring: [number, number][] = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      const start = Math.floor(stream(mix(n, r, f.seed, 91))() * ring.length);
      for (let k = 0; k < ring.length; k++) {
        const [x, y] = ring[(start + k) % ring.length];
        const id = wildId(x, y);
        if (taken.has(id) || !s.biomes.includes(kindAt(c, x, y) ?? '') || (s.side && !lies(s.side, x, y))) continue;
        taken.add(id);
        found!.set(id, s);
        return;
      }
    }
  });
  return found;
}

/** The cell where a haunt (a creature with a lair of its own) is to be found, if there is one. */
export function lair(c: Content, kind: string): [number, number] | null {
  const h = c.frontier?.haunts?.find((k) => k.kind === kind);
  const from = h && homes(c)[h.near];
  const at = h && from && findNear(c, from[0], from[1], [h.biome], 8);
  return at ? [at.x, at.y] : null;
}

/** The nearest cell of one of the given kinds, searching outward ring by ring. */
export function findNear(c: Content, X: number, Y: number, kinds: string[], reach: number, skip = 0, ok: (x: number, y: number) => boolean = () => true): { x: number; y: number; kind: string } | null {
  for (let r = Math.max(1, skip); r <= reach; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const kind = kindAt(c, X + dx, Y + dy);
        if (kind && kinds.includes(kind) && ok(X + dx, Y + dy)) return { x: X + dx, y: Y + dy, kind };
      }
  return null;
}

function generate(c: Content, X: number, Y: number): RoomDef {
  const f = c.frontier!;
  const id = wildId(X, Y);
  // Try a few variations of the same cell until one can be walked across; the last has no
  // obstacles at all, so the world can never generate a dead end.
  for (let attempt = 0; attempt < 6; attempt++) {
    const def = compose(c, X, Y, attempt, attempt === 5);
    const sc = buildScene(def.scene);
    const seen = reachable(sc, 160, 137);
    const sides = Object.keys(def.exits ?? {}).join('');
    const things = (def.things ?? []).every((t) => canReach(seen, t.x, t.y, t.reach ?? 30));
    const folk = (def.npcs ?? []).every((n) => canReach(seen, n.x, n.y, 40));
    const doors = (def.doors ?? []).every((d) => canReach(seen, (d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, 4));
    if (seen.some((v) => v) && !blockedEdges(seen, def.scene.walkTop, sides).length && things && folk && doors) return def;
  }
  throw new Error(`frontier: could not generate ${id} (seed ${f.seed})`);
}

/** What a valley road runs through, by its position alone: woodland, open ground or a small mere. */
function groundAt(c: Content, X: number, Y: number): string {
  const odds = c.frontier!.valley!.odds;
  let roll = (mix(X, Y, c.frontier!.seed, 3) / 4294967296) * Object.values(odds).reduce((n, v) => n + v, 0);
  for (const [kind, weight] of Object.entries(odds)) if ((roll -= weight) < 0) return kind;
  return Object.keys(odds)[0];
}

const WAY: Record<Side, string> = { n: '북쪽', s: '남쪽', e: '동쪽', w: '서쪽' };
const CORNERS: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const listed = (parts: string[]): string => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')}, 그리고 ${parts[parts.length - 1]}`);

/**
 * Where a valley road goes: the sides its path runs to, and a sentence that names the hand-made
 * place lying each way, so that nobody need be lost between them.
 */
export function roadOf(c: Content, X: number, Y: number): { ways: Side[]; says: string } {
  const f = c.frontier!;
  const called = (id: string): string => f.valley?.called[id] ?? c.rooms[id]?.name ?? id;
  const beside: [Side, string][] = [];
  for (const way of ['n', 's', 'e', 'w'] as Side[]) {
    const hand = handAt(c, X + STEP[way][0], Y + STEP[way][1]);
    if (hand && f.gates[hand]?.includes(BACK[way])) beside.push([way, hand]);
  }
  // Between two places, the path runs straight through from one to the other.
  if (beside.length) {
    const ways = [...new Set(beside.flatMap(([way]) => [way, BACK[way]]))];
    return { ways, says: f.text.road.replace('%s', listed(beside.map(([way, id]) => `${WAY[way]}으로 ${called(id)}`))) };
  }
  // Between four, two paths cross, and each place lies off a corner.
  const round = CORNERS.flatMap(([dx, dy]) => {
    const hand = handAt(c, X + dx, Y + dy);
    return hand ? [`${called(hand)}은 ${COMPASS(dx, dy)}`] : [];
  });
  // With no place beside it or off a corner (a corner of the valley that has nothing in it), the
  // path still leads somewhere: to whatever lies next along it, a road's length further on.
  if (!round.length) {
    const on: [Side, string][] = [];
    for (const way of ['n', 's', 'e', 'w'] as Side[]) {
      const hand = handAt(c, X + 2 * STEP[way][0], Y + 2 * STEP[way][1]);
      if (hand && f.gates[hand]?.includes(BACK[way])) on.push([way, hand]);
    }
    if (on.length) return { ways: ['n', 's', 'e', 'w'], says: f.text.road.replace('%s', listed(on.map(([way, id]) => `${WAY[way]}으로 ${called(id)}`))) };
  }
  const says = f.text.crossroads.replace('%s', listed(round.map((p, i) => (i ? `${p} 쪽` : `${p} 쪽에 놓여 있다`))));
  return { ways: ['n', 's', 'e', 'w'], says: says.replace(/(^|\. )([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()) };
}

/** The hand-made place a valley road leads on to, for someone setting out along it that way. */
export function beyond(c: Content, road: string, way: Side): string | undefined {
  const at = parseWild(road);
  const f = c.frontier;
  if (!at || !f || kindAt(c, at[0], at[1]) !== 'valley') return undefined;
  const hand = handAt(c, at[0] + STEP[way][0], at[1] + STEP[way][1]);
  return hand && f.gates[hand]?.includes(BACK[way]) ? (f.valley?.called[hand] ?? c.rooms[hand]?.name ?? hand) : undefined;
}

const COMPASS = (dx: number, dy: number): string => `${dy < 0 ? '북' : dy > 0 ? '남' : ''}${dx < 0 ? '서' : dx > 0 ? '동' : ''}쪽`;

function compose(c: Content, X: number, Y: number, attempt: number, bare: boolean): RoomDef {
  const f = c.frontier!;
  const id = wildId(X, Y);
  // The cell's kind comes from its position alone; everything else from its own sequence of
  // numbers, which a failed attempt reshuffles.
  const biome = kindAt(c, X, Y)!;
  const roll = stream(mix(X, Y, f.seed, attempt + 1));
  const pick = <T>(list: readonly T[]): T => list[Math.floor(roll() * list.length)];
  const depth = depthOf(c, X, Y);
  // The further out, the tougher, with no end to it: the edge of what can be survived moves out
  // only as the player grows. The valley and the first ring beyond it are as gentle as it gets.
  const level = Math.max(0, Math.min(40, depth - 1));
  // A valley road is drawn as the woodland, open ground or mere it runs through; elsewhere the
  // kind of country is what is drawn.
  const valley = biome === 'valley' ? f.valley ?? null : null;
  // A pass is drawn as the crags it cuts through.
  const ground = valley ? groundAt(c, X, Y) : biome === 'pass' ? 'crags' : biome;
  const road = valley ? roadOf(c, X, Y) : null;
  // Whoever holds this pass, if it is one, and which way it leads out; and where the walls of a
  // march close the country off. These come from the cell's position alone, never from a retry.
  const holds = f.marches?.holds ?? [];
  const hold = biome === 'pass' && holds.length ? holds[mix(X, Y, f.seed, 23) % holds.length] : null;
  const out = hold ? outward(X, Y) : null;
  const walls = (['n', 's', 'e', 'w'] as Side[]).filter((w) => edgeOf(c, X, Y, w) !== 'open');

  const hz = 60 + Math.floor(roll() * 10);
  const walkTop = hz + 30;

  const layers: LayerDef[] = [
    { t: 'sky', horizon: hz },
    { t: 'mountains', base: hz + 3, height: 40 + Math.floor(roll() * 26), seed: Math.floor(roll() * 900), far: true },
    ...(roll() < (ground === 'crags' ? 1 : 0.6) ? [{ t: 'mountains', base: hz + 5, height: (ground === 'crags' ? 34 : 22) + Math.floor(roll() * 16), seed: Math.floor(roll() * 900) }] : []),
    ...(ground === 'open' || ground === 'crags' ? [] : [{ t: 'treeline', y: hz + 4, seed: Math.floor(roll() * 900), shade: 0.34, hmin: 5, hvar: 7, spacing: 5 }]),
    { t: 'snow', from: hz + 4 },
    ...(ground === 'open' || ground === 'crags' || ground === 'deadwood' ? [] : [{ t: 'treeline', y: hz + 10, seed: Math.floor(roll() * 900), shade: 0.2, hmin: 8, hvar: 11, spacing: 7 }]),
    // A mere beside a road lies off to one side of it, small enough to walk round.
    ...(ground === 'mere' && valley ? [{ t: 'ice', x: roll() < 0.5 ? 62 + Math.floor(roll() * 16) : 242 + Math.floor(roll() * 16), y: 157, rx: 34 + Math.floor(roll() * 10), ry: 8 }] : []),
    ...(ground === 'mere' && !valley ? [{ t: 'ice', x: 80 + Math.floor(roll() * 160), y: 156, rx: 54 + Math.floor(roll() * 22), ry: 10 }] : []),
    ...(valley ? [] : roll() < (biome === 'steading' ? 1 : 0.45) ? [{ t: 'path', w: 9, pts: [[-6, 136 + roll() * 6], [100, 134], [220, 140], [326, 136 + roll() * 6]] }] : []),
    // A valley road always has its path, trodden wide, running through to the places on either side.
    ...(road && (road.ways.includes('e') || road.ways.includes('w')) ? [{ t: 'path', w: 11, pts: [[-6, 134 + Math.floor(roll() * 6)], [96, 136 + Math.floor(roll() * 4)], [224, 134 + Math.floor(roll() * 4)], [326, 134 + Math.floor(roll() * 6)]] }] : []),
    ...(road && (road.ways.includes('n') || road.ways.includes('s')) ? [{ t: 'path', w: 10, pts: [[156 + Math.floor(roll() * 8), 176], [160, 150], [158 + Math.floor(roll() * 6), 118], [160 + Math.floor(roll() * 6) - 3, walkTop - 6], [162, hz + 8]] }] : []),
    { t: 'tufts', count: 14 + Math.floor(roll() * 20), seed: Math.floor(roll() * 900) },
  ];

  // Obstacles stay clear of a cross through the middle, so every edge can reach every other.
  const props: PropDef[] = [];
  const clear = (x: number, y: number, r: number): boolean => x - r > 14 && x + r < 306 && Math.abs(x - 160) > 16 + r && (y < 124 || y > 150);
  const crowded = (x: number, y: number, r: number): boolean => props.some((p) => Math.abs(p.x - x) < r + 12 && Math.abs(p.y - y) < 10);
  const place = (t: string, y0: number, y1: number, r: number, more: Partial<PropDef> = {}): PropDef | null => {
    for (let k = 0; k < 8; k++) {
      const x = Math.round(20 + roll() * 280);
      const y = Math.round(y0 + roll() * (y1 - y0));
      if (clear(x, y, r) && !crowded(x, y, r)) {
        const p: PropDef = { t, x, y, seed: Math.floor(roll() * 900), ...more };
        props.push(p);
        return p;
      }
    }
    return null;
  };
  const scatter = (t: string, count: number, y0: number, y1: number, r: number, more: () => Partial<PropDef>): void => {
    for (let k = 0; k < count; k++) place(t, y0, y1, r, more());
  };
  const pines = (count: number): void => scatter('pine', count, walkTop + 3, 121, 6, () => ({ h: 48 + Math.floor(roll() * 44) }));
  const boulders = (count: number): void => scatter('boulder', count, 152, 164, 10, () => ({ r: 6 + Math.floor(roll() * 6) }));
  /** A free spot in the foreground for something small. */
  const spot = (): [number, number] | null => {
    for (let k = 0; k < 6; k++) {
      const x = Math.round(roll() < 0.5 ? 40 + roll() * 90 : 190 + roll() * 90);
      const y = Math.round(152 + roll() * 10);
      if (!props.some((p) => Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 10) && !things.some((t) => Math.abs(t.x - x) < 24 && Math.abs(t.y - y) < 10)) return [x, y];
    }
    return null;
  };

  const text = f.text[biome as Biome] ?? f.text.crags;
  const things: ThingDef[] = [
    { id: 'snow', nouns: ['snow', 'ground'], x: 160, y: 140, reach: 400, look: pick(text.snow ?? f.text.snow) },
    { id: 'sky', nouns: ['mountain', 'sky'], x: 160, y: 100, reach: 400, look: pick(text.sky ?? f.text.sky) },
  ];
  const rules: Rule[] = [
    { enter: true, if: [{ not: { flag: `seen.${id}` } }], do: [{ set: `seen.${id}` }, { score: 1, id: `seen.${id}` }] },
    // The valley is still on everybody's map; the first step off it is the first step beyond.
    ...(valley ? [] : [{ enter: true, if: [{ not: { flag: 'hint.wild' } }], do: [{ set: 'hint.wild' }, { note: f.text.firstStep }] } as Rule]),
  ];
  if (road) things.push({ id: 'path', nouns: ['path'], x: 160, y: 136, reach: 400, look: road.says });
  const npcs: NpcDef[] = [];
  const doors: DoorDef[] = [];
  let mark: string = valley ? (ground === 'pines' ? 'wood' : ground) : biome;
  let peaceful = false;
  // Nobody leaves a chest of silver beside a road everybody walks.
  let chest = !bare && roll() < 0.4 && !valley;
  const side = roll() < 0.5 ? -1 : 1;

  if (!bare) {
    if (valley) {
      if (ground === 'pines') {
        pines(5 + Math.floor(roll() * 3));
        boulders(1 + Math.floor(roll() * 2));
      } else if (ground === 'mere') {
        pines(2 + Math.floor(roll() * 3));
        boulders(Math.floor(roll() * 2));
        things.push({ id: 'mere', nouns: ['tarn'], x: 160, y: 156, reach: 400, look: f.text.pond });
      } else {
        pines(Math.floor(roll() * 3));
        boulders(1 + Math.floor(roll() * 2));
      }
    } else if (biome === 'pines') {
      mark = 'wood';
      pines(6 + Math.floor(roll() * 3));
      boulders(1 + Math.floor(roll() * 3));
    } else if (biome === 'open') {
      pines(Math.floor(roll() * 2));
      boulders(1 + Math.floor(roll() * 3));
    } else if (biome === 'mere') {
      pines(2 + Math.floor(roll() * 3));
      boulders(1 + Math.floor(roll() * 2));
      things.push({ id: 'mere', nouns: ['tarn'], x: 160, y: 156, reach: 400, look: f.text.pond });
    } else if (biome === 'ruin') {
      const tower = roll() < 0.5 ? place('tower', 118, 122, 28, { w: 46, h: 84 + Math.floor(roll() * 26) }) : null;
      mark = tower ? 'tower' : 'stone';
      if (tower) {
        // Under every such tower is the vault it was built to guard.
        things.push({ id: 'ruin', nouns: ['tower', 'door', 'arch'], x: tower.x, y: tower.y + 4, reach: 400, look: `${f.text.tower} ${f.text.stair}` });
        doors.push({ x0: tower.x - 6, y0: tower.y + 3, x1: tower.x + 6, y1: tower.y + 5, to: cryptId(X, Y), x: 60, y: 126, dir: 'right' });
        rules.push({ on: ['enter tower', 'enter door', 'open door', 'enter arch', 'climb tower', 'enter', 'climb', 'enter crag'], do: [{ say: f.text.stairWalk }] });
      }
      else {
        const a = place('stone', 116, 122, 8, { h: 40 + Math.floor(roll() * 16), v: pick(['a', 'b', 'c']) });
        place('stone', 114, 122, 8, { h: 30 + Math.floor(roll() * 14), v: pick(['a', 'b', 'c']) });
        if (a) things.push({ id: 'stones', nouns: ['menhir', 'rune'], x: a.x, y: a.y + 4, reach: 400, look: f.text.stones });
      }
      const wall = roll() < 0.7 ? place('wall', 116, 122, 30, { w: 44 + Math.floor(roll() * 24), h: 20 + Math.floor(roll() * 12) }) : null;
      if (wall) things.push({ id: 'wall', nouns: ['inscription'], x: wall.x, y: wall.y + 4, reach: 400, look: f.text.wall });
      pines(2 + Math.floor(roll() * 3));
      boulders(1 + Math.floor(roll() * 3));
    } else if (biome === 'camp') {
      const tent = place('tent', 116, 122, 26, { w: 44 });
      place('tent', 114, 122, 22, { w: 38 });
      place('campfire', 154, 160, 12);
      if (tent) things.push({ id: 'tents', nouns: ['tent', 'hearth'], x: tent.x, y: tent.y + 4, reach: 400, look: f.text.tents });
      pines(2 + Math.floor(roll() * 3));
      boulders(1 + Math.floor(roll() * 2));
    } else if (biome === 'crags') {
      mark = 'crag';
      const first = place('crag', 116, 122, 34, { w: 58 + Math.floor(roll() * 26), h: 44 + Math.floor(roll() * 26) });
      place('crag', 114, 122, 26, { w: 40 + Math.floor(roll() * 20), h: 30 + Math.floor(roll() * 20) });
      if (roll() < 0.5) place('crag', 114, 120, 20, { w: 30 + Math.floor(roll() * 12), h: 22 + Math.floor(roll() * 14) });
      if (first) things.push({ id: 'crags', nouns: ['crag', 'boulder'], x: first.x, y: first.y + 4, reach: 400, look: f.text.crag });
      pines(1 + Math.floor(roll() * 2));
      boulders(2 + Math.floor(roll() * 3));
    } else if (biome === 'deadwood') {
      mark = 'dead';
      scatter('deadtree', 5 + Math.floor(roll() * 4), walkTop + 3, 121, 5, () => ({ h: 40 + Math.floor(roll() * 34) }));
      scatter('deadtree', 1 + Math.floor(roll() * 2), 154, 164, 5, () => ({ h: 34 + Math.floor(roll() * 20) }));
      boulders(1 + Math.floor(roll() * 2));
    } else if (biome === 'shrine') {
      // A ring of stones to one side, with a cairn among them. Nothing hostile comes here.
      peaceful = true;
      chest = false;
      const cx = 160 + side * 78;
      [-36, -18, 18, 36].forEach((dx, i) => props.push({ t: 'stone', x: cx + dx, y: 117 + (i % 2) * 4, h: 26 + Math.floor(roll() * 12), v: pick(['a', 'b', 'c']), seed: Math.floor(roll() * 900) }));
      props.push({ t: 'cairn', x: cx, y: 121, seed: Math.floor(roll() * 900) });
      things.push({ id: 'shrine', nouns: ['shrine', 'menhir', 'rune', 'cairn'], x: cx, y: 126, reach: 40, try: ['pray'], look: f.text.shrineLook });
      rules.push(
        { on: ['pray', 'pray *', 'pet shrine', 'pet menhir', 'pet rune', 'read rune', 'read menhir', 'read shrine'], if: [{ near: 'shrine', d: 54 }], do: [{ run: 'bless', arg: id }] },
        { on: ['pray', 'pray *'], do: [{ say: f.text.shrineFar }] },
        { on: ['take shrine', 'take work', 'take treasure', 'take cairn'], do: [{ say: f.text.shrineTake }] },
      );
      pines(2 + Math.floor(roll() * 3));
    } else if (biome === 'pass') {
      // The one way through the wall for miles, and somebody standing in it.
      mark = 'crag';
      chest = false;
      boulders(2 + Math.floor(roll() * 2));
      pines(Math.floor(roll() * 2));
    } else if (biome === 'steading') {
      // A lone hut. Either somebody lives here and trades, or nobody does and something has moved in.
      const w = 62 + Math.floor(roll() * 14);
      const cx = 160 + side * (62 + Math.floor(roll() * 30));
      const y = 118;
      props.push({ t: 'hall', x: cx - (w >> 1), y, w });
      props.push({ t: 'woodpile', x: cx + (side < 0 ? -(w >> 1) - 40 : (w >> 1) + 4), y: y + 1 });
      props.push({ t: 'barrel', x: cx + (side < 0 ? (w >> 1) + 6 : -(w >> 1) - 8), y: y + 3 });
      const who = Object.entries(homes(c)).find(([, at]) => at[0] === X && at[1] === Y)?.[0] ?? null;
      peaceful = !!who;
      chest = !who;
      if (who) npcs.push({ char: who, x: cx, y: 134, wander: [cx - 26, 130, cx + 26, 140] });
      things.push({ id: 'hut', nouns: ['hut', 'hall', 'door', 'roof', 'smoke'], x: cx, y: y + 4, reach: 400, look: who ? f.text.hutLived : f.text.hutEmpty });
      rules.push({ on: ['open door', 'knock door', 'enter hut', 'enter hall', 'enter door'], do: [{ say: who ? f.text.hutDoorLived : f.text.hutDoorEmpty }] });
      pines(2 + Math.floor(roll() * 3));
    }
  }
  // The wall of a march, along whichever sides it closes; a pass leaves a gap in it.
  for (const w of walls) props.push({ t: 'scarp', x: 160, y: w === 'n' ? walkTop + 9 : w === 's' ? 167 : 124, v: w, w: edgeOf(c, X, Y, w) === 'pass' ? 46 : 0, seed: mix(X, Y, 'nsew'.indexOf(w)) % 900 });
  if (walls.length && f.text.scarp) {
    const sx = walls.includes('e') ? 306 : walls.includes('w') ? 14 : 160;
    const sy = walls.includes('s') ? 160 : walls.includes('n') ? walkTop + 6 : 134;
    things.push({ id: 'scarp', nouns: ['scarp'], x: sx, y: sy, reach: 400, look: f.text.scarpLook ?? f.text.scarp.replace('%s', WAY[walls[0]]) });
    rules.push({ on: ['climb scarp', 'climb mountain', 'climb', 'climb boulder', 'climb crag'], do: [{ say: f.text.scarpClimb ?? f.text.scarpLook ?? '' }] });
  }
  if (biome !== 'deadwood' || bare) things.push({ id: 'trees', nouns: ['tree'], x: 160, y: 110, reach: 400, look: pick(text.trees ?? f.text.trees) });
  else things.push({ id: 'trees', nouns: ['tree'], x: 160, y: 110, reach: 400, look: f.text.deadtrees });
  // Trees in the foreground frame the picture and block nothing: their feet are off the screen.
  // Not where the wall of a march stands, which wants to be seen.
  for (const x of [4 + Math.floor(roll() * 20), 296 + Math.floor(roll() * 20)])
    if (roll() < 0.75) {
      const tree: PropDef = { t: biome === 'deadwood' && !bare ? 'deadtree' : 'pine', x, y: 180 + Math.floor(roll() * 8), h: 86 + Math.floor(roll() * 30), seed: Math.floor(roll() * 900) };
      if (!walls.includes(x < 160 ? 'w' : 'e')) props.push(tree);
    }

  // What lives here. Further out, more of it, and tougher.
  const tiers = f.life[biome] ?? [[]];
  const kinds = tiers[Math.min(tiers.length - 1, Math.ceil(level / 2))];
  // On a valley road, by day, there is one at most, and as often nothing; by night, nothing at all.
  // The roads straight into the middle of the valley are kept clear altogether.
  const quiet = valley && Math.abs(X) + Math.abs(Y) <= (valley.quiet ?? 0);
  // Much of the wild has nothing living in it, more of it near home than far out. Drawn from the
  // cell's own numbers, apart from everything else, so a place's look does not hang on it.
  const still = stream(mix(X, Y, f.seed, 211));
  const q = f.quiet;
  const empty = !valley && !hold && !!q && still() < (q.odds[biome] ?? 0) * (1 - (1 - q.far) * Math.min(1, Math.max(0, depth - 1) / Math.max(1, q.farDepth - 1)));
  // How many would live here: drawn even where none do, so the rest of the place comes out the same.
  const might = peaceful || quiet || !kinds.length ? 0 : valley ? (roll() < 0.5 ? 1 : 0) : Math.min(4, 1 + (roll() < 0.5 ? 1 : 0) + Math.floor(level / 3));
  const count = empty || hold ? 0 : might;
  const spawns: SpawnDef[] = [];
  for (let k = 0; k < might; k++) {
    const s: SpawnDef = { id: `${id}:${k}`, kind: kinds[k % kinds.length], x: Math.round(70 + roll() * 180), y: Math.round(128 + roll() * 18), respawn: 3000, level, ...(valley ? { when: 'day' as const } : {}) };
    if (k < count) spawns.push(s);
  }
  // A pass is held instead by whatever holds it, and once they are beaten they stay beaten.
  if (hold) {
    const m = marchOf(c, ringOf(X, Y));
    const band = hold.life[Math.min(hold.life.length - 1, m)];
    // They stand across the gap, between the player and the way out.
    const [gx, gy] = out === 'e' ? [250, 134] : out === 'w' ? [70, 134] : out === 'n' ? [160, walkTop + 24] : [160, 150];
    band.forEach((kind, k) => {
      const off = (k - (band.length - 1) / 2) * 16;
      const [x, y] = out === 'e' || out === 'w' ? [gx + (k % 2 ? -14 : 0) * (out === 'e' ? 1 : -1), gy + off * 0.7] : [gx + off * 1.4, gy + (k % 2 ? 6 : 0) * (out === 'n' ? 1 : -1)];
      spawns.push({ id: `${id}:hold${k}`, kind, x: Math.round(x), y: Math.round(y), level: level + 1 });
    });
    const [tx, ty] = out === 'e' ? [300, 134] : out === 'w' ? [20, 134] : out === 'n' ? [160, walkTop + 4] : [160, 160];
    things.push({ id: 'gap', nouns: ['gap'], x: tx, y: ty, reach: 400, look: hold.look.replace('%s', WAY[out!]) });
    rules.push({ on: ['enter gap', 'climb gap', 'enter'], do: [{ say: `${WAY[out!]}으로 가는 길이다. 지나가라, 지나가게 해 준다면.` }] });
    rules.push({ cleared: true, if: [{ not: { flag: `pass.${id}` } }], do: [{ set: `pass.${id}` }, { sound: 'quest' }, { score: 5, id: `pass.${id}` }, { say: hold.open }] });
  }

  // By day there may be game, for anyone with a bow and the patience to use it.
  const game = f.game?.[biome];
  const rare = f.rareGame && depth >= f.rareGame.minDepth && roll() < f.rareGame.odds ? f.rareGame.kind : null;
  if (game && !bare && roll() < 0.45) spawns.push({ id: `${id}:game`, kind: rare ?? game, x: Math.round(roll() < 0.5 ? 50 + roll() * 60 : 210 + roll() * 60), y: Math.round(130 + roll() * 26), respawn: 4000, when: 'day' });

  // After dark, something else is abroad as well.
  const night = f.life.night;
  // Where nothing lives by day, something may still pass through by night.
  const dark = count > 0 || (empty && still() < 0.5);
  if (might && night?.length && !valley) {
    const abroad = night[Math.min(night.length - 1, Math.ceil(level / 2))];
    if (abroad.length) {
      const s: SpawnDef = { id: `${id}:night`, kind: pick(abroad), x: Math.round(70 + roll() * 180), y: Math.round(128 + roll() * 18), respawn: 3000, level, when: 'night', if: f.nightIf };
      if (dark && !hold) spawns.push(s);
    }
  }

  // Anything that has made this place its own.
  for (const h of f.haunts ?? []) {
    const at = lair(c, h.kind);
    if (at && at[0] === X && at[1] === Y) spawns.push({ id: `${id}:${h.kind}`, kind: h.kind, x: 160, y: 136, if: h.if });
  }

  const exits: RoomDef['exits'] = {};
  for (const way of ['n', 's', 'e', 'w'] as Side[]) {
    const [x, y] = [X + STEP[way][0], Y + STEP[way][1]];
    const hand = handAt(c, x, y);
    // Nobody climbs the wall of a march.
    if (edgeOf(c, X, Y, way) === 'wall') continue;
    // A hand-made neighbour is only joined where it has a gate facing this way.
    if (!hand) exits[way] = wildId(x, y);
    else if (f.gates[hand]?.includes(BACK[way])) exits[way] = hand;
  }

  // Something written by hand, if this is where one of them stands.
  const sight = bare ? undefined : sights(c).get(id);
  const when: NonNullable<RoomDef['scene']['when']> = [];
  if (sight) {
    const at = spot() ?? [side < 0 ? 70 : 250, 158];
    if (sight.prop) props.push({ ...sight.prop, x: at[0], y: at[1] });
    for (const w of sight.when ?? []) when.push({ if: w.if, props: [{ ...w.prop, x: at[0], y: at[1] }] });
    things.push({ reach: 34, ...sight.thing, id: sight.id, x: at[0], y: at[1] + 2 });
    for (const r of sight.rules ?? [])
      rules.push({ ...r, do: r.do.map((e) => ('spawn' in e ? { ...e, x: at[0] + e.x, y: at[1] + e.y, level: e.level ?? level + 1 } : e)) });
  }

  // Small things to find.
  if (!bare) {
    // A waymark: a cairn that points the way home.
    if ((biome === 'open' && roll() < 0.6) || (biome === 'crags' && roll() < 0.3)) {
      const at = spot();
      if (at) {
        props.push({ t: 'cairn', x: at[0], y: at[1], v: 'pole', seed: Math.floor(roll() * 900) });
        const says = f.text.waymark.replace('%s', COMPASS(-X, -Y));
        things.push({ id: 'waymark', nouns: ['cairn'], x: at[0], y: at[1] + 3, reach: 34, try: ['look cairn'], look: says });
        rules.push(
          { on: ['look bow', 'look inn', 'read cairn', 'follow cairn', 'follow bow', 'follow'], do: [{ say: says }] },
          { on: ['use menhir', 'use boulder', 'use cairn', 'give menhir', 'give boulder', 'give menhir cairn', 'use menhir cairn', 'use boulder cairn'], if: [{ near: 'waymark', d: 44 }], do: [{ score: 1, id: `waymark.${id}` }, { say: f.text.waymarkStone }] },
        );
      }
    }
    if (chest) {
      const at = spot();
      if (at) {
        const silver = 6 + level * 4 + Math.floor(roll() * 6);
        things.push({ id: 'cache', nouns: ['chest'], x: at[0], y: at[1], reach: 28, icon: 'chest', try: ['open chest'], look: f.text.chest });
        rules.push(
          { on: ['open chest', 'take chest'], if: [{ flag: `loot.${id}` }], do: [{ say: f.text.chestEmpty }] },
          {
            on: ['open chest', 'take chest'], if: [{ near: 'cache' }],
            do: [{ set: `loot.${id}` }, { gold: silver }, { sound: 'take' }, { score: 3, id: `loot.${id}` }, { say: f.text.chestOpen.replace('%s', String(silver)) }, { chance: 0.35, do: [{ give: 'potion', took: '그리고 붉은 약 한 병, 아직 밀봉된.' }] }],
          },
          { on: ['open chest', 'take chest'], do: [{ say: '충분히 가까이 있지 않다.' }] },
        );
      }
    }
    if ((ground === 'pines' || ground === 'deadwood' || ground === 'mere') && f.herb && roll() < 0.45) {
      const at = spot();
      if (at) things.push({ id: 'herb', nouns: ['herb'], x: at[0], y: at[1], reach: 26, icon: 'herb', take: f.herb, takeSay: f.text.herbTake, look: f.text.herb });
    }
    if ((biome === 'open' || biome === 'crags' || biome === 'ruin') && roll() < 0.35) {
      const at = spot();
      if (at) {
        const silver = 3 + level * 3 + Math.floor(roll() * 5);
        things.push({ id: 'bones', nouns: ['bones'], x: at[0], y: at[1], reach: 28, icon: 'bones', try: ['search bones'], look: f.text.bones });
        rules.push(
          { on: ['look bones', 'take bones', 'open bones', 'pet bones'], if: [{ flag: `bones.${id}` }], do: [{ say: f.text.bonesEmpty }] },
          {
            on: ['look bones', 'take bones', 'open bones', 'pet bones'], if: [{ near: 'bones' }],
            do: [{ set: `bones.${id}` }, { gold: silver }, { sound: 'take' }, { score: 2, id: `bones.${id}` }, { say: f.text.bonesSearch.replace('%s', String(silver)) }, { chance: 0.25, do: [{ give: 'potion', took: '그리고 붉은 약 한 병, 얼었지만 온전한.' }] }],
          },
        );
      }
    }
  }

  // Where the dead walked by day, they are still to be seen once they walk no longer.
  const walker = spawns.find((sp) => sp.when !== 'night' && c.enemies[sp.kind]?.undead);
  const rested = !!(walker && c.rest && f.text.deadRest);
  if (walker && rested) {
    things.push({ id: 'atrest', nouns: f.text.deadRestNouns ?? ['bones'], x: walker.x, y: walker.y, reach: 400, hidden: true, look: f.text.deadRest! });
    rules.push({ enter: true, if: c.rest, do: [{ show: 'atrest' }] });
  }

  const ways = Object.keys(exits).length;
  const far = level >= 3 ? ' ' + f.text.deep : '';
  // The walls, as the country round them describes them.
  // In a pass, whoever holds it is description enough.
  const told = hold ? [] : walls;
  const gaps = told.filter((w) => edgeOf(c, X, Y, w) === 'pass');
  const scarp =
    (told.length && f.text.scarp ? ' ' + f.text.scarp.replace('%s', listed(told.map((w) => WAY[w]))) : '') +
    (gaps.length && f.text.scarpGap ? ' ' + f.text.scarpGap.replace('%s', listed(gaps.map((w) => WAY[w]))) : '');
  // A place's name is always drawn, so that the same numbers follow whether or not a sight took it.
  const called = placeName(pick(text.first), text.second, pick);
  const look = `${pick(text.look)}${hold ? ' ' + hold.look.replace('%s', WAY[out!]) : ''}${sight ? ' ' + sight.seen : ''}${far}${road ? ' ' + road.says : ''}${scarp} ${ways === 4 ? f.text.waysAll : f.text.waysSome}`;
  const lookWhen: LookWhen[] = [
    ...(rested && f.text.deadRestSeen ? [{ if: c.rest!, look: `${look} ${f.text.deadRestSeen}` }] : []),
    ...(biome === 'camp' && !bare ? [{ if: [{ quiet: true }], look: f.text.campQuiet }] : []),
  ];
  return {
    id,
    name: hold ? placeName(hold.first[mix(X, Y, f.seed, 29) % hold.first.length], text.second, pick) : sight ? sight.name : called,
    music: valley ? valley.music : peaceful ? f.calm : empty && q ? q.music : f.music,
    mark,
    ...(valley || peaceful ? { haven: true } : {}),
    ...(hold && out ? { holds: { [out]: hold.held } } : {}),
    look,
    ...(lookWhen.length ? { lookWhen } : {}),
    scene: { kind: 'outdoor', horizon: hz, walkTop, layers, props, ...(when.length ? { when } : {}) },
    exits,
    doors,
    things,
    npcs,
    spawns,
    rules,
  };
}

/** The vault under a ruined tower: dark, guarded, and worth the trouble. */
function crypt(c: Content, X: number, Y: number): RoomDef | undefined {
  const f = c.frontier!;
  const id = cryptId(X, Y);
  const above = roomOf(c, wildId(X, Y));
  const way = above?.doors?.find((d) => d.to === id);
  if (!above || !way) return undefined;
  const roll = stream(mix(X, Y, f.seed, 977));
  const pick = <T>(list: readonly T[]): T => list[Math.floor(roll() * list.length)];
  const level = Math.max(0, Math.min(40, depthOf(c, X, Y) - 1));
  const FL = 98;
  const runeX = Math.round(236 + roll() * 50);
  const hoardX = Math.round(256 + roll() * 24);
  const two = roll() < 0.6;
  const props: PropDef[] = [
    { t: 'arch', x: 44, y: FL, w: 30, h: 46 },
    { t: 'niche', x: 92, y: 52, w: 26, h: 20 },
    { t: 'niche', x: 146, y: 52, w: 26, h: 20 },
    ...(roll() < 0.6 ? [{ t: 'niche', x: 196, y: 52, w: 26, h: 20 }] : []),
    { t: 'rune', x: runeX, y: 56, h: 22, v: pick(['a', 'b', 'c']) },
    { t: 'pillar', x: Math.round(78 + roll() * 12), y: 110, lit: 1 },
    { t: 'pillar', x: Math.round(214 + roll() * 12), y: 110, lit: -1 },
    { t: 'sarcophagus', x: Math.round(104 + roll() * 20), y: 154, w: 56 },
    ...(two ? [{ t: 'sarcophagus', x: Math.round(184 + roll() * 14), y: 140, w: 56 }] : []),
    { t: 'treasure', x: hoardX, y: 152, r: Math.round(15 + roll() * 7) },
  ];
  const tiers = f.life.crypt ?? [[]];
  const kinds = tiers[Math.min(tiers.length - 1, Math.ceil(level / 2))];
  const count = kinds.length ? Math.min(3, 1 + (roll() < 0.6 ? 1 : 0) + Math.floor(level / 4)) : 0;
  const posts: [number, number][] = [[154, 124], [236, 126], [150, 138]];
  // Vaults differ. In some the dead are already up; in some they lie still until the hoard is
  // touched; and some have a flagstone that was laid to be stepped on.
  const ambush = count > 0 && roll() < 0.35;
  const trap = roll() < 0.4;
  const waking: Effect[] = ambush ? [...Array.from({ length: count }, (_, k) => ({ spawn: kinds[k % kinds.length], x: posts[k][0], y: posts[k][1], level })), { say: f.text.cryptWake }] : [];
  const silver = 24 + level * 12 + Math.floor(roll() * 10);
  const text = f.text.crypt;
  // Some hoards hold more than silver. Which, if any, depends on the place, so vaults differ.
  const trinket = f.trinkets?.length && roll() < 0.6 ? f.trinkets[mix(X, Y, f.seed, 5) % f.trinkets.length] : null;
  return {
    id,
    name: placeName(pick(text.first), text.second, pick),
    music: f.under,
    dark: true,
    look: pick(text.look),
    scene: {
      kind: 'indoor', walkTop: 106, ambient: 0.3,
      layers: [{ t: 'stonewall', floor: FL }, { t: 'flagstones', floor: FL }],
      props,
      lights: [{ x: runeX, y: 56, r: 34, i: 0.7, kind: 'glow' }, { x: 160, y: 126, r: 90, i: 0.5, kind: 'warm' }],
    },
    doors: [{ x0: 36, y0: 107, x1: 52, y1: 109, to: above.id, x: Math.round((way.x0 + way.x1) / 2), y: way.y1 + 7, dir: 'down' }],
    things: [
      { id: 'hoard', nouns: ['treasure', 'cup'], x: hoardX, y: 154, reach: 40, try: ['take treasure'], look: f.text.cryptTreasure },
      { id: 'rune', nouns: ['rune', 'inscription'], x: runeX, y: 108, reach: 40, try: ['read rune'], look: f.text.cryptRune },
      { id: 'coffins', nouns: ['sarcophagus', 'niche'], x: 124, y: 156, reach: 400, look: f.text.cryptCoffins },
      { id: 'arch', nouns: ['arch', 'door'], x: 44, y: 108, reach: 400, look: f.text.cryptWayOut },
      { id: 'pillars', nouns: ['pillar'], x: 90, y: 112, reach: 400, look: f.text.pillars },
    ],
    spawns: ambush ? [] : Array.from({ length: count }, (_, k) => ({ id: `${id}:${k}`, kind: kinds[k % kinds.length], x: posts[k][0], y: posts[k][1], respawn: 6000, level })),
    zones: trap ? [{ id: 'plate', x0: 196, y0: 116, x1: 214, y1: 124 }] : [],
    rules: [
      { enter: true, if: [{ not: { flag: `seen.${id}` } }], do: [{ set: `seen.${id}` }, { score: 2, id: `seen.${id}` }] },
      { on: ['take treasure', 'open treasure'], if: [{ flag: `loot.${id}` }], do: [{ say: f.text.cryptTaken }] },
      {
        on: ['take treasure', 'open treasure'], if: [{ near: 'hoard' }],
        do: [
          { set: `loot.${id}` }, { gold: silver }, { sound: 'take' }, { score: 4, id: `loot.${id}` }, { say: f.text.cryptTake.replace('%s', String(silver)) },
          ...(trinket ? [{ give: trinket }, { say: f.text.cryptTrinket.replace('%s', withArticle(c.items[trinket]?.name ?? trinket)) }] : []),
          ...waking,
          { chance: 0.5, do: [{ give: 'potion', took: '그리고 붉은 약 한 병, 바쳐진 채 놓인.' }] },
        ],
      },
      { on: ['take treasure', 'open treasure'], do: [{ say: '충분히 가까이 있지 않다.' }] },
      { on: ['read rune', 'pet rune', 'read inscription'], if: [{ flag: `rune.${id}` }], do: [{ say: f.text.cryptReadAgain }] },
      { on: ['read rune', 'pet rune', 'read inscription'], if: [{ near: 'rune' }], do: [{ set: `rune.${id}` }, { run: 'study', arg: 25 }, { sound: 'word' }, { score: 2, id: `rune.${id}` }, { say: f.text.cryptRead }] },
      { on: ['read rune', 'pet rune', 'read inscription'], do: [{ say: '충분히 가까이 있지 않다.' }] },
      { on: ['enter', 'climb', 'exits', 'enter arch', 'climb arch', 'enter door'], do: [{ say: f.text.stairBelow }] },
      ...(trap ? [{ zone: 'plate', if: [{ not: { flag: `trap.${id}` } }], do: [{ set: `trap.${id}` }, { sound: 'hurt' }, { hurt: 6 + level * 2, why: f.text.cryptTrap }, { say: f.text.cryptTrap }] } as Rule] : []),
    ],
  };
}

/** Check that a frontier setup makes sense against the hand-made rooms. */
export function frontierProblems(c: Content): string[] {
  const f = c.frontier;
  if (!f) return [];
  const errs: string[] = [];
  for (const id of Object.keys(f.grid)) c.rooms[id] || errs.push(`frontier: grid names unknown room "${id}"`);
  for (const [id, sides] of Object.entries(f.gates)) {
    if (!f.grid[id]) errs.push(`frontier: gate on "${id}", which is not on the grid`);
    for (const side of sides as Iterable<Side>) {
      if (!STEP[side]) errs.push(`frontier: "${id}" has a gate on side "${side}"`);
      else if (c.rooms[id]?.exits?.[side]) errs.push(`frontier: "${id}" already has a ${side} exit`);
      else if (f.grid[id] && handAt(c, f.grid[id][0] + STEP[side][0], f.grid[id][1] + STEP[side][1])) errs.push(`frontier: the ${side} gate of "${id}" opens onto another hand-made room`);
    }
  }
  if (!c.music[f.music]) errs.push(`frontier: unknown tune "${f.music}"`);
  if (!c.music[f.calm]) errs.push(`frontier: unknown tune "${f.calm}"`);
  if (!c.music[f.under]) errs.push(`frontier: unknown tune "${f.under}"`);
  if (f.herb && !c.items[f.herb]) errs.push(`frontier: unknown item "${f.herb}"`);
  for (const t of f.trinkets ?? []) c.items[t]?.kind === 'trinket' || errs.push(`frontier: "${t}" is not a trinket`);
  for (const [biome, kind] of Object.entries(f.game ?? {})) c.enemies[kind]?.ai === 'prey' || errs.push(`frontier: the game in ${biome} country, "${kind}", is not prey`);
  if (f.rareGame && c.enemies[f.rareGame.kind]?.ai !== 'prey') errs.push(`frontier: the rare game "${f.rareGame.kind}" is not prey`);
  for (const who of f.folk) c.chars[who] || errs.push(`frontier: unknown character "${who}"`);
  for (const h of f.haunts ?? []) {
    c.enemies[h.kind] || errs.push(`frontier: unknown enemy "${h.kind}" has a lair`);
    f.folk.includes(h.near) || errs.push(`frontier: the lair of "${h.kind}" is near "${h.near}", who has no home`);
    f.odds[h.biome] || errs.push(`frontier: the lair of "${h.kind}" is in "${h.biome}" country, which does not exist`);
  }
  for (const biome of Object.keys(f.odds)) {
    if (!(f.text as unknown as Record<string, unknown>)[biome]) errs.push(`frontier: no wording for "${biome}" country`);
    if (!f.life[biome]) errs.push(`frontier: nothing listed as living in "${biome}" country`);
  }
  if (f.valley) {
    if (!c.music[f.valley.music]) errs.push(`frontier: unknown tune "${f.valley.music}" for the valley`);
    for (const ground of Object.keys(f.valley.odds)) ['pines', 'open', 'mere'].includes(ground) || errs.push(`frontier: a valley road cannot run through "${ground}"`);
    for (const id of Object.keys(f.valley.called)) f.grid[id] || errs.push(`frontier: the valley names "${id}", which is not on the grid`);
    if (!f.life.valley) errs.push('frontier: nothing listed as living in the valley');
    if (!f.text.valley) errs.push('frontier: no wording for the valley');
  }
  if (f.quiet) {
    if (!c.music[f.quiet.music]) errs.push(`frontier: unknown tune "${f.quiet.music}" for quiet country`);
    for (const biome of Object.keys(f.quiet.odds)) f.odds[biome] || errs.push(`frontier: quiet odds for "${biome}" country, which does not exist`);
  }
  if (f.marches) {
    const rings = f.marches.rings;
    if (!f.text.pass) errs.push('frontier: marches, but no wording for a pass');
    if (!f.marches.holds.length) errs.push('frontier: marches, but nobody to hold their passes');
    if (rings.some((r, i) => r <= reachOf(c) || (i && r <= rings[i - 1]))) errs.push('frontier: the rings of the marches must lie beyond the valley, nearest first');
    for (const h of f.marches.holds) for (const kind of h.life.flat()) c.enemies[kind] || errs.push(`frontier: unknown enemy "${kind}" holding a pass`);
    for (const [id, at] of Object.entries(f.grid)) {
      // A place made by hand may stand in the wall of a march only as the way through it: with a road of its own out on that side.
      const out = outward(at[0], at[1]);
      if (rings.includes(Math.max(Math.abs(at[0]), Math.abs(at[1]))) && !(out && c.rooms[id]?.exits?.[out])) errs.push(`frontier: "${id}" stands on a march, where its wall would run through it`);
      for (const side of (f.gates[id] ?? '') as Iterable<Side>) if (STEP[side] && edgeOf(c, at[0], at[1], side) === 'wall') errs.push(`frontier: the ${side} gate of "${id}" opens onto the wall of a march`);
    }
  }
  for (const [biome, tiers] of Object.entries(f.life))
    for (const kind of tiers.flat()) c.enemies[kind] || errs.push(`frontier: unknown enemy "${kind}" in ${biome} country`);
  return errs;
}

