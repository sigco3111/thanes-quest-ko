// What happens to a typed line. Order: the room's own rules, then the standard behaviour of
// things, characters and items, then the game-wide rules, then a dry fallback.

import { playerAttack } from './combat';
import { beyond, parseWild, roomOf } from './frontier';
import { wordVariants } from './parser';
import { koNounLabel } from '../game/data/vocab';
import { cast, invoke } from './magic';
import { all, fire, questKey, reach, run, speak, test } from './rules';
import { PH, PW } from './scene';
import { DAY_LENGTH, type Sim } from './sim';
import type { ActorState, CharDef, EnemyDef, ItemDef, ThingDef } from './types';
import { reachable } from './walk';

type Target =
  | { k: 'thing'; def: ThingDef }
  | { k: 'char'; def: CharDef; actor: ActorState }
  | { k: 'enemy'; def: EnemyDef; actor: ActorState }
  | { k: 'item'; def: ItemDef };

/**
 * What a noun refers to right now: something in the room, someone in it, or something carried.
 * With `mine`, something carried comes first: the draught in the pack, not the one on the floor.
 */
function find(sim: Sim, noun: string, mine = false): Target | null {
  const c = sim.content;
  if (mine) {
    const own = carriedItem(sim, noun);
    if (own) return own;
  }
  const thing = sim.things().find((t) => t.nouns.includes(noun));
  if (thing) return { k: 'thing', def: thing };
  for (const actor of sim.rs.actors) {
    if (actor.kind === 'npc') {
      const def = c.chars[actor.ref];
      if (def?.nouns.includes(noun)) return { k: 'char', def, actor };
    } else {
      const def = c.enemies[actor.ref];
      if (def?.nouns.includes(noun) && actor.act !== 'dead' && !((actor.ai.lag ?? 0) > 0)) return { k: 'enemy', def, actor };
    }
  }
  return carriedItem(sim, noun);
}

/** Something carried that answers to a noun. */
function carriedItem(sim: Sim, noun: string): Target | null {
  const c = sim.content;
  const carried = Object.keys(sim.p.inv)
    .map((id) => c.items[id])
    .filter((it) => it?.nouns.includes(noun));
  // With several books in the pack, "the tome" means the one not yet read.
  const knows = (id: string): boolean => sim.p.spells.includes(id) || sim.p.words.includes(id);
  const item = carried.find((it) => it.use?.some((e) => 'teach' in e && !knows(e.teach))) ?? carried[0];
  return item ? { k: 'item', def: item } : null;
}

function nearestChar(sim: Sim): { def: CharDef; actor: ActorState } | null {
  let best: { def: CharDef; actor: ActorState } | null = null;
  let bd = Infinity;
  for (const actor of sim.rs.actors) {
    const def = sim.content.chars[actor.ref];
    if (actor.kind !== 'npc' || !def) continue;
    const d = Math.hypot(sim.p.x - actor.x, (sim.p.y - actor.y) * 2);
    if (d < bd) {
      bd = d;
      best = { def, actor };
    }
  }
  return best;
}

/**
 * What is carried, one row per kind of thing: its name, how many, and whether it is in hand or
 * worn; and what it all weighs in the pack (nothing, for what is in hand or worn, or a story's).
 */
export function bagRows(sim: Sim): { id: string; label: string; weight: number }[] {
  const p = sim.p;
  const c = sim.content;
  return Object.entries(p.inv)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => {
      const it = c.items[id];
      const worn = p.weapon === id || p.shield === id ? ' (손에)' : p.armor === id || p.trinket === id ? ' (착용)' : '';
      // A smith's work shows as a number after the name.
      const temper = p.weapon === id ? p.temper?.weapon : p.armor === id ? p.temper?.armor : 0;
      const weight = sim.weight(id) * (n - (sim.onPerson(id) ? 1 : 0));
      return { id, label: `${it?.name ?? id}${temper ? ` +${temper}` : ''}${n > 1 ? ` x${n}` : ''}${worn}`, weight };
    });
}

/** How full the pack is, as the bag shows it: "34/40". */
export function loadText(sim: Sim): string {
  const limit = sim.limit();
  return limit === Infinity ? String(sim.load()) : `${sim.load()}/${limit}`;
}

/** A row of the bag: the name on the left and the weight in a column on the right. */
export function weighed(label: string, weight: number | null, width = 33): string {
  const w = weight ? String(weight) : '';
  const room = width - Math.max(3, w.length) - 1;
  const name = label.length > room ? label.slice(0, room - 1) + '.' : label;
  return w ? `${name.padEnd(room)} ${w.padStart(Math.max(3, w.length))}` : name;
}

export function inventoryPage(sim: Sim): { title: string; lines: string[] } {
  const lines = bagRows(sim).map((r) => weighed(r.label, r.weight));
  if (!lines.length) lines.push(sim.text('emptyHanded'));
  lines.push('', `무게: ${loadText(sim)}`, `은화: ${sim.p.gold}`);
  return { title: '가지고 있는 것:', lines };
}

/** The room's store, if it has one: the chest where things are kept. */
export function storeHere(sim: Sim): ThingDef | undefined {
  return sim.things().find((t) => t.store);
}

/** What is kept in the room's store, one row per kind. */
export function storedRows(sim: Sim): { id: string; label: string; weight: number; n: number }[] {
  return Object.entries(sim.rs.stored ?? {})
    .filter(([id, n]) => n > 0 && sim.content.items[id])
    .map(([id, n]) => ({ id, n, label: `${sim.content.items[id].name}${n > 1 ? ` x${n}` : ''}`, weight: sim.weight(id) * n }));
}

/** What lies on the ground here, one row per kind. */
export function groundRows(sim: Sim): { id: string; label: string; weight: number; n: number }[] {
  return (sim.rs.ground ?? [])
    .filter((g) => g.n > 0 && sim.content.items[g.item])
    .map((g) => ({ id: g.item, n: g.n, label: `${sim.content.items[g.item].name}${g.n > 1 ? ` x${g.n}` : ''}`, weight: sim.weight(g.item) * g.n }));
}

/** How many a command means: a number, or every one there is. */
type Qty = number | 'all';

/** Verbs whose noun means something carried before anything lying about. */
const MINE = ['use', 'drink', 'read', 'eat', 'equip', 'unequip', 'drop', 'store', 'weigh'];

/** Something kept in the room's store that answers to a noun: its id, or undefined if there is none. */
function keptItem(sim: Sim, noun: string): string | undefined {
  return storedRows(sim).find((r) => sim.content.items[r.id].nouns.includes(noun))?.id;
}

/** Take things out of the room's store, as many as are asked for and the pack will hold. */
function takeFromStore(sim: Sim, id: string, qty: Qty): void {
  const kept = sim.rs.stored!;
  const want = qty === 'all' ? kept[id] : Math.min(qty, kept[id]);
  // Something that goes straight into the hand fits even in a full pack.
  const room = sim.space(id);
  const got = Math.min(want, room > 0 ? room : sim.fits(id) ? 1 : 0);
  if (got <= 0) {
    sim.say(sim.text('tooHeavy', sim.named(id, 1)));
    return;
  }
  kept[id] -= got;
  if (kept[id] <= 0) delete kept[id];
  sim.give(id, got);
  sim.sound('take');
  sim.say(sim.text(got < want ? 'tookSome' : 'taken', sim.named(id, got)).replace('%n', sim.named(id, want - got)));
}

/** What the room's store holds, in a sentence. */
function storeText(sim: Sim): string {
  const rows = storedRows(sim);
  return rows.length ? sim.text('storeHolds', rows.map((r) => sim.named(r.id, r.n)).join(', ')) : sim.text('storeEmpty');
}

/** What a thing weighs, in a sentence, and how full the pack is. */
function weighText(sim: Sim, id: string): string {
  const it = sim.content.items[id];
  const n = sim.p.inv[id] ?? 0;
  const each = sim.weight(id);
  const load = sim.text('loadIs').replace('%l', String(sim.load())).replace('%m', String(sim.limit()));
  if (it?.keep) return `${sim.text('weighsKept', sim.named(id, 1))} ${load}`;
  const what = each === 0 ? sim.text('weighsNothing', cap(sim.named(id, 1))) : n > 1 && !sim.onPerson(id) ? sim.text('weighsEach', String(each)).replace('%n', String(each * n)).replace('%t', cap(sim.named(id, n))) : sim.text('weighs', cap(sim.named(id, 1))).replace('%w', String(each));
  return `${what}${sim.onPerson(id) && n === 1 ? ' ' + sim.text('weighsWorn') : ''} ${load}`;
}

const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);

const koLabel = (id: string): string => koNounLabel[id] ?? id;

/** A word that, typed after a verb, means this carried thing and not something else in sight or in the pack. */
export function itemNoun(sim: Sim, id: string): string {
  const nouns = sim.content.items[id]?.nouns ?? [id];
  const means = (word: string): boolean => {
    const r = sim.parser.parse(`look ${word}`);
    const t = r.ok && r.nouns.length === 1 ? carriedItem(sim, r.nouns[0]) : null;
    return t?.k === 'item' && t.def.id === id;
  };
  return nouns.find(means) ?? nouns[0];
}

/**
 * What can be done with something carried, each as the line a player could type for it: drink a
 * draught, eat food, read a book, use what has a use, ready or put on what is for holding or wearing.
 */
export function itemActions(sim: Sim, id: string): { label: string; line: string }[] {
  const p = sim.p;
  const it = sim.content.items[id];
  if (!it || !(p.inv[id] > 0)) return [];
  const noun = itemNoun(sim, id);
  const out: { label: string; line: string }[] = [];
  const can = (verb: string): boolean => !!it.use && USE_VERBS[verb].includes(it.kind);
  if (it.kind === 'potion' && can('drink')) out.push({ label: '마시기', line: `drink ${noun}` });
  else if (it.kind === 'food' && can('eat')) out.push({ label: '먹기', line: `eat ${noun}` });
  else if (it.kind === 'tome' && can('read')) out.push({ label: '읽기', line: `read ${noun}` });
  else if (can('use')) out.push({ label: '쓰기', line: `use ${noun}` });
  if (it.kind === 'weapon' || it.kind === 'bow' || it.kind === 'shield') {
    const held = p.weapon === id || p.shield === id;
    out.push(held ? { label: '넣기', line: `unequip ${noun}` } : { label: '준비', line: `equip ${noun}` });
  } else if (it.kind === 'armor' || it.kind === 'trinket') {
    const worn = p.armor === id || p.trinket === id;
    out.push(worn ? { label: '벗기', line: `unequip ${noun}` } : { label: '입기', line: `equip ${noun}` });
  }
  // Anything but what a story needs can be put down, or put away somewhere safe.
  if (!it.keep) {
    const many = p.inv[id] > 1;
    const store = storeHere(sim);
    if (store) {
      const into = `${store.nouns[0]}`;
      out.push({ label: `${into}에 넣기`, line: `put ${noun} in ${into}` });
      if (many) out.push({ label: `전부 ${into}에 넣기`, line: `put all ${noun} in ${into}` });
    }
    out.push({ label: '내려놓기', line: `drop ${noun}` });
    if (many) out.push({ label: '전부 내려놓기', line: `drop all ${noun}` });
  }
  return out;
}

export function journalPage(sim: Sim): { title: string; lines: string[] } {
  const lines: string[] = [];
  // What is still to do comes first; what is finished, after.
  const known = Object.values(sim.content.quests)
    .map((q) => ({ q, stage: Number(sim.state.flags[questKey(q.id)] ?? 0) }))
    .filter((k) => k.stage > 0)
    .sort((a, b) => Number(a.stage >= a.q.done) - Number(b.stage >= b.q.done));
  for (const { q, stage } of known) lines.push(`${q.name}${stage >= q.done ? ' (완료)' : ''}`, `  ${sim.fill(q.stages[stage] ?? '')}`, '');
  if (!lines.length) lines.push(sim.text('noQuests'));
  return { title: '일지', lines };
}

/** A line of the character sheet that heads a section, and a break to a new box. */
export const PAGE_BREAK = '\f';

/**
 * The character sheet: who you are now (level, health, mana, stamina, the day), what you can do
 * (skills, and the perk each is working towards), and what you have to show for it. `heads` are
 * the lines that head a section.
 */
export function skillsPage(sim: Sim): { title: string; lines: string[]; heads: number[] } {
  const p = sim.p;
  const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);

const koLabel = (id: string): string => koNounLabel[id] ?? id;
  // Two columns in a box 34 wide: a label and value on the left, another on the right.
  const pair = (a: string, av: string, b: string, bv: string): string => `${a.padEnd(8)} ${av.padEnd(8)}${b.padEnd(8)} ${bv}`;
  const of = (v: number, max: number): string => `${Math.ceil(v)}/${max}`;
  const lines: string[] = [];
  const heads: number[] = [];
  const head = (text: string): void => void (heads.push(lines.length), lines.push(text));
  lines.push(
    pair('레벨', String(p.level), '날짜', String(Math.floor(sim.state.tick / DAY_LENGTH) + 1)),
    pair('체력', of(p.hp, p.maxHp), '마나', of(p.mp, p.maxMp)),
    pair('기력', of(p.sp, p.maxSp), '점수', String(sim.state.score)),
    '',
  );
  head(`${'기술'.padEnd(12)}  다음 특성`);
  for (const [id, s] of Object.entries(p.skills)) {
    // What practice will earn next, so there is something to aim at.
    const next = sim.content.perks.filter((k) => k.skill === id && k.lv > s.lv).sort((a, b) => a.lv - b.lv)[0];
    lines.push(`${(SKILL_KO[id] ?? cap(id)).padEnd(9)}${String(s.lv).padStart(3)}  ${next ? `${next.name} (${next.lv})` : '-'}`);
  }
  lines.push(PAGE_BREAK);
  const perks = sim.content.perks.filter((k) => (p.skills[k.skill]?.lv ?? 0) >= k.lv);
  head('특성');
  lines.push(perks.length ? '  ' + perks.map((k) => k.name).join(', ') : '  아직 없다. 연습하면 얻는다.', '');
  if (p.spells.length) {
    head('주문');
    lines.push('  ' + p.spells.map((id) => sim.content.spells[id]?.name ?? id).join(', '), '');
  }
  if (p.words.length) {
    head('룬어');
    lines.push('  ' + p.words.map((w) => w.replace('word:', '').toUpperCase()).join(', '), '');
  }
  head('여정');
  const places = Object.keys(sim.state.flags).filter((k) => k.startsWith('seen.')).length;
  lines.push(`  발견한 곳 ${String(places).padStart(6)}`, `  쓰러뜨린 적  ${String(Number(sim.state.flags.kills ?? 0)).padStart(6)}`);
  return { title: '인물', lines, heads };
}

const DIRS: Record<string, 'n' | 's' | 'e' | 'w'> = { north: 'n', south: 's', east: 'e', west: 'w' };
const DIR_KO: Record<string, string> = { north: '북', south: '남', east: '동', west: '서' };
const SKILL_KO: Record<string, string> = { blade: '검술', block: '방어', archery: '궁술', sorcery: '마법', mending: '치유', lore: '학식' };

/** What lies one way from here, and a reminder of how to get there. */
function wayText(sim: Sim, dir: string): string {
  const to = sim.room.exits?.[DIRS[dir]];
  return to ? sim.text('wayTo', DIR_KO[dir] ?? dir).replace('%r', wayName(sim, to, DIRS[dir])) : sim.text('noWay', DIR_KO[dir] ?? dir);
}

/**
 * Walk off one side of the picture, as a click at that edge would: at the nearest place on it
 * that can be walked to from here.
 */
function goWay(sim: Sim, dir: string): boolean {
  const side = DIRS[dir];
  if (!sim.room.exits?.[side]) {
    sim.say(sim.text('noWay', DIR_KO[dir] ?? dir));
    return true;
  }
  const sc = sim.scene();
  const p = sim.p;
  // Never by way of a door: walking north past the inn is not going into it.
  const doors = (sim.room.doors ?? []).filter((d) => !(p.x >= d.x0 && p.x <= d.x1 && p.y >= d.y0 && p.y <= d.y1));
  const seen = reachable(sc, p.x, p.y, (x, y) => doors.some((d) => x >= d.x0 - 2 && x <= d.x1 + 2 && y >= d.y0 - 2 && y <= d.y1 + 2));
  let best = null as [number, number] | null;
  const consider = (x: number, y: number): void => {
    if (!seen[y * PW + x]) return;
    if (!best || Math.hypot(x - p.x, (y - p.y) * 2) < Math.hypot(best[0] - p.x, (best[1] - p.y) * 2)) best = [x, y];
  };
  if (side === 'n' || side === 's') for (let x = 7; x < PW - 7; x++) consider(x, side === 'n' ? sc.walkTop + 1 : PH - 3);
  else for (let y = sc.walkTop + 1; y < PH - 2; y++) consider(side === 'w' ? 7 : PW - 8, y);
  const found = best as [number, number] | null;
  if (!found) {
    sim.say(sim.text('wayTo', dir).replace('%r', wayName(sim, sim.room.exits[side]!, side)));
    return true;
  }
  const [x, y] = found;
  // Aimed just past the edge, so the walk carries on off it.
  sim.walk(x, y, undefined, side);
  return true;
}

/** The doors there are to be seen here, by their place in the room's list: open, or shut and said to be. */
function doorsHere(sim: Sim): number[] {
  return (sim.room.doors ?? []).flatMap((d, i) => (all(sim, d.if) || d.locked ? [i] : []));
}

/**
 * Go in at a door: the one a word names (the place it leads to, or a thing that stands at it,
 * as "hall" names the hall's door from the square), or with no word, the only or nearest door.
 */
function goIn(sim: Sim, noun?: string): boolean {
  const doors = doorsHere(sim);
  if (!doors.length) return false;
  const all = sim.room.doors!;
  const mid = (i: number): [number, number] => [(all[i].x0 + all[i].x1) / 2, (all[i].y0 + all[i].y1) / 2];
  const p = sim.p;
  const near = (i: number): number => Math.hypot(mid(i)[0] - p.x, (mid(i)[1] - p.y) * 2);
  let pick: number[];
  if (!noun || noun === 'door') pick = doors;
  else {
    const at = sim.things().filter((t) => t.nouns.includes(noun));
    pick = doors.filter((i) => {
      const to = roomOf(sim.content, all[i].to);
      const words = (to?.name ?? '').toLowerCase().split(/[^a-z']+/);
      return all[i].to === noun || words.includes(noun) || at.some((t) => Math.abs(t.x - mid(i)[0]) <= 24 && Math.abs(t.y - mid(i)[1]) <= 12);
    });
  }
  if (!pick.length) return false;
  const i = pick.reduce((a, b) => (near(b) < near(a) ? b : a));
  sim.walk(...mid(i), i);
  return true;
}

/** Leave a place with a roof on by its way out; out of doors, say which ways there are. */
function goOut(sim: Sim): boolean {
  if (sim.room.scene.kind !== 'indoor') {
    sim.say(exitsText(sim));
    return true;
  }
  const doors = doorsHere(sim);
  const all = sim.room.doors!;
  // The way out is the door to somewhere under the sky, or failing that the nearest.
  const out = doors.filter((i) => roomOf(sim.content, all[i].to)?.scene.kind !== 'indoor');
  const pick = out.length ? out : doors;
  if (!pick.length) {
    sim.say(exitsText(sim));
    return true;
  }
  const p = sim.p;
  const mid = (i: number): [number, number] => [(all[i].x0 + all[i].x1) / 2, (all[i].y0 + all[i].y1) / 2];
  const i = pick.reduce((a, b) => (Math.hypot(mid(b)[0] - p.x, mid(b)[1] - p.y) < Math.hypot(mid(a)[0] - p.x, mid(a)[1] - p.y) ? b : a));
  sim.walk(...mid(i), i);
  return true;
}

/** A neighbouring screen by name; a road is also told by where it is going. */
function wayName(sim: Sim, to: string, side: 'n' | 's' | 'e' | 'w'): string {
  const name = roomOf(sim.content, to)?.name ?? to;
  const on = beyond(sim.content, to, side);
  return on ? `${name}, ${on}(으)로 가는 길` : name;
}

/** Every way out of the room. */
function exitsText(sim: Sim): string {
  const room = sim.room;
  const parts = Object.entries(DIRS).flatMap(([name, side]) => {
    const to = room.exits?.[side];
    return to ? [`${DIR_KO[name] ?? name}: ${wayName(sim, to, side)}.`] : [];
  });
  const doors = [...new Set((room.doors ?? []).map((d) => roomOf(sim.content, d.to)?.name ?? d.to))];
  if (doors.length) parts.push(`${doors.join(', ')}(으)로 통하는 문.`);
  // Out in the wild, which way home lies is worth knowing.
  const at = parseWild(sim.state.room);
  const home = at ? ' ' + sim.text('homeWay', [at[1] > 0 ? '북' : at[1] < 0 ? '남' : '', at[0] > 0 ? '서' : at[0] < 0 ? '동' : ''].filter(Boolean).join('')) : '';
  return `${room.name}. ${parts.join(' ') || '뚜렷한 출구는 보이지 않는다.'}${home} ${sim.text('walkHint')}`;
}

const USE_VERBS: Record<string, ItemDef['kind'][]> = {
  use: ['misc', 'potion', 'tome', 'key', 'food'],
  drink: ['potion'],
  read: ['tome', 'misc'],
  eat: ['food'],
};

/**
 * Standard behaviour for common verbs. Returns false if the verb means nothing here. `afoot` is
 * the line as typed, when whoever sent it will walk the player over to what it names.
 */
function builtin(sim: Sim, verb: string, nouns: string[], afoot: string | null, qty: Qty = 1): boolean {
  const p = sim.p;
  // "Put the pelts in the chest" is keeping them there.
  if (verb === 'use' && nouns.length === 2 && storeHere(sim)?.nouns.includes(nouns[1])) verb = 'store';
  const target = nouns.length ? find(sim, nouns[0], MINE.includes(verb)) : null;
  const needNear = (x: number, y: number, d: number): boolean => {
    if (sim.within(x, y, d)) return true;
    if (afoot) sim.approach({ x, y, d }, afoot);
    else sim.say(sim.text('notClose'));
    return false;
  };

  switch (verb) {
    case 'look': {
      const someone = nouns[0] === 'person' ? nearestChar(sim) : null;
      const outside = sim.room.scene.kind === 'outdoor';
      if (sim.isDark()) sim.say(sim.text('dark'));
      else if (!nouns.length) sim.say(sim.lookOf(sim.room));
      else if (someone) sim.say(sim.lookOf(someone.def));
      else if (DIRS[nouns[0]]) sim.say(wayText(sim, nouns[0]));
      // After dark the sky is a different thing to look at.
      else if (nouns[0] === 'sky' && outside && sim.daylight() < 0.4) sim.say(sim.text('nightSky'));
      else if (!target) sim.say(sim.text('notHere'));
      else if (target.k === 'enemy') {
        // A creature grown tougher than its kind looks it: fair warning, far from home.
        const lv = target.actor.ai.lv ?? 0;
        const size = lv >= 9 ? 'toughest' : lv >= 4 ? 'tougher' : lv >= 1 ? 'tough' : '';
        sim.say(sim.lookOf(target.def) + (size ? ' ' + sim.text(size) : ''));
      } else if (target.k === 'thing' && target.def.store) sim.say(`${sim.lookOf(target.def)} ${storeText(sim)}`);
      else if (target.k === 'thing' && (target.def.pile ?? 0) > 1) sim.say(`${sim.lookOf(target.def)} ${sim.text('pileOf', sim.named(target.def.take!, target.def.pile!))}`);
      else sim.say(sim.lookOf(target.def));
      return true;
    }
    case 'take': {
      const store = storeHere(sim);
      // "Take the pelts from the chest", or a thing that is only to be had from the chest.
      const kept = store && nouns.length && (nouns[1] ? store.nouns.includes(nouns[1]) : !target || target.k === 'item') ? keptItem(sim, nouns[0]) : null;
      if (store && kept !== null && (kept || nouns[1])) {
        if (!kept) sim.say(sim.text('notStored'));
        else if (needNear(store.x, store.y, store.reach ?? 30)) takeFromStore(sim, kept, qty);
      } else if (!nouns.length) sim.say(sim.text('takeWhat'));
      else if (!target) sim.say(sim.text('notHere'));
      else if (target.k === 'item') sim.say(sim.text('haveIt'));
      else if (target.k !== 'thing') sim.say(sim.text('takePerson'));
      else if (!target.def.take) sim.say(sim.text('cantTake'));
      else if (needNear(target.def.x, target.def.y, target.def.reach ?? 30)) {
        const item = target.def.take;
        const want = target.def.pile ? (qty === 'all' ? target.def.pile : Math.min(qty, target.def.pile)) : 1;
        if (!sim.fits(item)) sim.say(sim.text('tooHeavy', sim.named(item, 1)));
        else if (target.def.pile) {
          const got = sim.pickUp(item, want);
          sim.sound('take');
          sim.say(sim.text(got < want ? 'tookSome' : 'taken', sim.named(item, got)).replace('%n', sim.named(item, want - got)));
        } else {
          sim.give(item);
          sim.setThing(target.def.id, false);
          sim.sound('take');
          sim.say(target.def.takeSay ?? sim.text('taken', sim.content.items[item]?.name ?? ''));
        }
      }
      return true;
    }
    case 'drop':
    case 'store': {
      // "Put the pelts in the chest" comes here as STORE; "drop pelts in chest" is the same.
      const store = storeHere(sim);
      const into = verb === 'store' || (nouns[1] !== undefined && sim.things().some((t) => t.nouns.includes(nouns[1])));
      const what = target?.k === 'item' ? target.def : null;
      const n = what ? Math.min(p.inv[what.id] ?? 0, qty === 'all' ? Infinity : qty) : 0;
      if (!nouns.length) sim.say(sim.text(qty === 'all' ? 'dropAll' : 'dropWhat'));
      else if (!what) sim.say(sim.text('notCarried'));
      else if (what.keep) sim.say(typeof what.keep === 'string' ? what.keep : sim.text('noDrop'));
      else if (into && !store) sim.say(sim.text('noStore'));
      else if (into && nouns[1] !== undefined && !store!.nouns.includes(nouns[1])) sim.say(sim.text('notAStore'));
      else if (!into || needNear(store!.x, store!.y, store!.reach ?? 30)) {
        // What is in hand or worn comes off first.
        if ((p.inv[what.id] ?? 0) - n < 1) {
          if (p.weapon === what.id) p.weapon = null;
          if (p.shield === what.id) p.shield = null;
          if (p.armor === what.id) p.armor = null;
          if (p.trinket === what.id) p.trinket = null;
        }
        sim.lose(what.id, n);
        if (into) {
          const kept = (sim.rs.stored ??= {});
          kept[what.id] = (kept[what.id] ?? 0) + n;
          sim.say(sim.text('stored', sim.named(what.id, n)).replace('%t', koLabel(store!.nouns[0])));
        } else {
          // At the player's side, where it can be seen.
          sim.putDown(what.id, n, p.x + (p.dir === 'left' ? -14 : 14), p.y + 1);
          sim.say(sim.text('dropped', sim.named(what.id, n)));
        }
        sim.sound('take');
      }
      return true;
    }
    case 'weigh':
      if (!nouns.length || nouns[0] === 'pack') sim.say(sim.text('loadIs').replace('%l', String(sim.load())).replace('%m', String(sim.limit())));
      else if (target?.k === 'item') sim.say(weighText(sim, target.def.id));
      else if (target?.k === 'thing' && target.def.take) sim.say(sim.text('weighThere', sim.named(target.def.take, 1)).replace('%w', String(sim.weight(target.def.take))));
      else if (target?.k === 'thing' && target.def.store) sim.say(sim.text('weighStore'));
      else sim.say(target ? sim.text('weighWhat') : sim.text('notHere'));
      return true;
    case 'open':
      // A chest for keeping things in shows what is in it.
      if (target?.k !== 'thing' || !target.def.store) return false;
      sim.say(storeText(sim));
      return true;
    case 'talk':
    case 'ask': {
      // "the man", "someone": whoever is nearest.
      const anyone = nouns[0] === 'person';
      // Naming somebody who is elsewhere, as the one being addressed.
      const addressed = verb === 'talk' || nouns.length > 1;
      const away = addressed && !target && Object.values(sim.content.chars).some((ch) => ch.nouns.includes(nouns[0]));
      const who = target?.k === 'char' ? target : anyone || !target || verb === 'ask' ? nearestChar(sim) : null;
      if (away) sim.say(sim.text('personAway'));
      else if (target && target.k !== 'char' && verb === 'talk') sim.say((target.k === 'enemy' && target.def.hail) || sim.text('talkThing'));
      else if (!who) sim.say(sim.text('talkNoOne'));
      else if (needNear(who.actor.x, who.actor.y, 48)) {
        const topic = verb === 'ask' ? nouns[target?.k === 'char' || anyone ? 1 : 0] : undefined;
        const entry = topic ? who.def.topics?.[topic] : who.def.talk;
        const said = entry ? speak(sim, entry, who.def.name) : false;
        if (!said && !(who.def.shrug && speak(sim, who.def.shrug, who.def.name))) sim.say(sim.text('shrug'), who.def.name);
        if (said !== 'brief') sim.talked(who.def.id);
      }
      return true;
    }
    case 'inventory': {
      const pg = inventoryPage(sim);
      sim.page(pg.title, pg.lines);
      return true;
    }
    case 'journal': {
      const pg = journalPage(sim);
      sim.page(pg.title, pg.lines);
      return true;
    }
    case 'skills': {
      const pg = skillsPage(sim);
      sim.page(pg.title, pg.lines, pg.heads);
      return true;
    }
    case 'use':
    case 'drink':
    case 'read':
    case 'eat': {
      if (!nouns.length) sim.say(sim.text('useWhat'));
      else if (!target) sim.say(sim.text('notHere'));
      // Reading a stone, or drinking from a well, is the room's to answer, or the game's.
      else if (target.k !== 'item') return false;
      else if (!target.def.use || !USE_VERBS[verb].includes(target.def.kind)) sim.say(sim.text('cantUse'));
      else {
        const id = target.def.id;
        run(sim, target.def.use);
        if (target.def.consumed) sim.lose(id);
      }
      return true;
    }
    case 'equip': {
      if (!target || target.k !== 'item') sim.say(sim.text(nouns.length ? 'notCarried' : 'useWhat'));
      else if (target.def.kind === 'weapon' || target.def.kind === 'bow') {
        if (p.weapon && p.weapon !== target.def.id) p.other = p.weapon;
        p.weapon = target.def.id;
        sim.say(sim.text('equipped', target.def.name));
      } else if (target.def.kind === 'shield') {
        p.shield = target.def.id;
        sim.say(sim.text('equipped', target.def.name));
      } else if (target.def.kind === 'armor') {
        p.armor = target.def.id;
        sim.say(sim.text('equipped', target.def.name));
      } else if (target.def.kind === 'trinket') {
        p.trinket = target.def.id;
        sim.say(sim.text('wearing', target.def.name));
      } else if (target.def.don) run(sim, target.def.don);
      else sim.say(sim.text('cantEquip'));
      return true;
    }
    case 'unequip':
      // Naming something worn takes off that one thing; otherwise the hands are emptied.
      if (target?.k === 'item' && (p.armor === target.def.id || p.trinket === target.def.id)) {
        if (p.armor === target.def.id) p.armor = null;
        else p.trinket = null;
        sim.say(sim.text('tookOff', target.def.name));
      } else if (!p.weapon && !p.shield) sim.say(sim.text('handsEmpty'));
      else {
        p.weapon = p.shield = null;
        sim.say(sim.text('unequipped'));
      }
      return true;
    case 'swap': {
      // Blade for bow and back again, without having to name either.
      const carried = (id: string | null | undefined): id is string => !!id && (p.inv[id] ?? 0) > 0;
      const next = carried(p.other) ? p.other : Object.keys(p.inv).find((id) => id !== p.weapon && ['weapon', 'bow'].includes(sim.content.items[id]?.kind ?? ''));
      if (!next) sim.say(sim.text('noSwap'));
      else {
        p.other = p.weapon;
        p.weapon = next;
        sim.note(sim.text('equipped', sim.content.items[next].name));
      }
      return true;
    }
    case 'exits':
      sim.say(exitsText(sim));
      return true;
    case 'map':
      sim.showMap();
      return true;
    case 'deeds': {
      const done = (sim.content.deeds ?? []).filter((d) => !d.if || d.if.every((c) => test(sim, c))).map((d) => sim.fill(d.text));
      sim.page('위업', done.length ? done : [sim.text('noDeeds')]);
      return true;
    }
    case 'time': {
      const light = sim.daylight();
      const waning = sim.daylight() > 0 && light < 1 && ((sim.state.tick + DAY_LENGTH * 0.12) % DAY_LENGTH) / DAY_LENGTH < 0.8;
      sim.say(sim.text(light >= 1 ? 'timeDay' : light <= 0 ? 'timeNight' : waning ? 'timeDusk' : 'timeDawn'));
      return true;
    }
    case 'enter':
      if (DIRS[nouns[0]]) return goWay(sim, nouns[0]);
      return goIn(sim, nouns[0]);
    case 'approach': {
      if (DIRS[nouns[0]]) return goWay(sim, nouns[0]);
      if (nouns[0] && goIn(sim, nouns[0])) return true;
      // Going to somebody or something here is walking over to it.
      const t = nouns[0] ? find(sim, nouns[0]) : null;
      if (t?.k === 'thing' && (t.def.reach ?? 30) < 200) sim.walk(t.def.x, t.def.y + 4);
      else if (t?.k === 'char') sim.walk(t.actor.x + (sim.p.x < t.actor.x ? -16 : 16), t.actor.y);
      else return false;
      return true;
    }
    case 'leave':
      // "Leave the sword" is putting it down; "leave", or "leave the hut", is going out.
      if (nouns[0] && carriedItem(sim, nouns[0])) return builtin(sim, 'drop', nouns, afoot, qty);
      return goOut(sim);
    case 'think': {
      // A nudge: whatever the journal says is next.
      const open = Object.values(sim.content.quests)
        .map((q) => ({ q, stage: Number(sim.state.flags[questKey(q.id)] ?? 0) }))
        .filter(({ q, stage }) => stage > 0 && stage < q.done);
      const idle = (sim.content.hints ?? []).find((h) => !h.if || h.if.every((c) => test(sim, c)))?.text ?? sim.text('noHint');
      // And whatever is within arm's reach right now, as things that could be typed.
      const here: string[] = [];
      const who = nearestChar(sim);
      if (who && sim.within(who.actor.x, who.actor.y, 48)) here.push(`${koLabel(who.def.nouns[0])}에게 말`);
      if (!sim.isDark())
        for (const t of sim.things()) {
          if (!sim.within(t.x, t.y, t.reach ?? 30) || (t.reach ?? 30) > 100) continue;
          if (t.take) here.push(`${koLabel(t.nouns[0])} 줍`);
          for (const line of t.try ?? []) here.push(line.toUpperCase());
        }
      const near = here.length ? `\n\n${sim.text('couldDo')} ${[...new Set(here)].slice(0, 4).join(', ')}.` : '';
      sim.say((open.length ? open.map(({ q, stage }) => `${q.name}: ${sim.fill(q.stages[stage])}`).join('\n\n') : idle) + near);
      return true;
    }
    case 'cast':
      cast(sim, nouns[0]);
      return true;
    case 'shoot': {
      const w = p.weapon ? sim.content.items[p.weapon] : null;
      if (w?.kind === 'bow') playerAttack(sim);
      else sim.say(sim.text('noBow'));
      return true;
    }
    case 'attack':
      // Typing it works too, though Ctrl is quicker.
      if (!sim.rs.actors.some((a) => a.kind === 'enemy' && a.act !== 'dead')) return false;
      playerAttack(sim);
      return true;
    default:
      return false;
  }
}

const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const NUMBERS_KO: Record<string, number> = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 열하나: 11, 열둘: 12 };
/** Words that mean every one of a thing. */
const ALL = ['all', 'every', 'everything', 'both', '모두', '전부', '다'];
/** Verbs that can be told how many. */
const COUNTED = ['take', 'drop', 'store', 'use'];

/** Verbs that can carry a runeword: "say veth". */
const SPEAKING = ['say', 'shout', 'talk', 'cast', 'sing'];

/** Debug commands, available only in dev builds. They start with a slash. */
function devCommand(sim: Sim, line: string): boolean {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (!cmd.startsWith('/')) return false;
  if (cmd === '/tp' && roomOf(sim.content, a)) {
    const sc = sim.scene(a);
    sim.enterRoom(a, 160, Math.round((sc.walkTop + 168) / 2));
    return true;
  }
  if (cmd === '/give' && sim.content.items[a]) {
    sim.give(a, Number(b) || 1);
    sim.say(`[dev] ${a}`);
    return true;
  }
  if (cmd === '/set' && a) {
    sim.state.flags[a] = b === undefined ? true : isNaN(Number(b)) ? b : Number(b);
    sim.say(`[dev] ${a} = ${sim.state.flags[a]}`);
    return true;
  }
  if (cmd === '/pos') {
    sim.say(`[dev] ${sim.state.room} ${sim.p.x},${sim.p.y}`);
    return true;
  }
  return false;
}

/** Does what the player can see or read here use this word? Then it is scenery, not nonsense. */
function mentioned(sim: Sim, word: string): boolean {
  if (sim.isDark()) return false;
  const texts = [sim.lookOf(sim.room), sim.room.name, ...sim.things().map((t) => sim.lookOf(t))].join(' ').toLowerCase();
  if (/[\uac00-\ud7a3]/.test(word)) {
    // Korean: the word as typed, or without its trailing particle, may appear in the text.
    return wordVariants(word).some((v) => v.length >= 2 && texts.includes(v));
  }
  if (word.length < 3) return false;
  const stem = word.replace(/(es|s)$/, '');
  return new RegExp(`\\b${stem}(s|es)?\\b`).test(texts);
}

/** Is the line a look of some kind, or a bare word? */
function looking(sim: Sim, line: string): boolean {
  const words = line.toLowerCase().replace(/[^a-z0-9' \uac00-\ud7a3]+/g, ' ').split(' ').filter(Boolean);
  const verb = sim.parser.verbOf(words.slice(0, 2).join(' ')) ?? sim.parser.verbOf(words[0] ?? '');
  return verb === 'look' || !verb;
}

/**
 * Carry out a typed line. With `afoot`, a line that would only be told its object is too far
 * away asks to be walked there instead (see Sim.approach). Looking is always done from where
 * one stands.
 */
export function command(sim: Sim, line: string, afoot = false): void {
  if (sim.dev && devCommand(sim, line)) return;
  // "put the pelts down" is "put down the pelts" said the other way about.
  line = line.replace(/^\s*(put|set|lay)\s+(.+?)\s+down\s*$/i, '$1 down $2');
  let r = sim.parser.parse(line);
  // How many are meant, by somebody taking, dropping or putting away: "drop 3 pelts", "drop two
  // pelts", "drop all the pelts", "drop pelts". Anything else may use numbers as it likes.
  let qty: Qty = 1;
  const typed = line.toLowerCase().split(/[^a-z0-9'\uac00-\ud7a3]+/).filter(Boolean);
  const count = typed.findIndex((w) => /^\d+$/.test(w) || NUMBERS.includes(w) || w in NUMBERS_KO);
  if (count >= 0) {
    const counted = sim.parser.parse(typed.filter((_, i) => i !== count).join(' '));
    if (counted.ok && COUNTED.includes(counted.verb)) {
      r = counted;
      qty = Math.max(1, /^\d+$/.test(typed[count]) ? Number(typed[count]) : NUMBERS_KO[typed[count]] ?? NUMBERS.indexOf(typed[count]) + 1);
    }
  } else if (r.ok && COUNTED.includes(r.verb) && typed.some((w) => ALL.includes(w) || sim.parser.plural(w))) qty = 'all';
  if (!r.ok) {
    if (r.why === 'unknown') sim.say(mentioned(sim, r.word) ? sim.text(looking(sim, line) ? 'nothingSpecial' : 'scenery', r.word) : sim.text('unknownWord', r.word));
    else if (r.why === 'noverb') DIRS[r.nouns[0]] ? goWay(sim, r.nouns[0]) : sim.say(sim.text('noVerb'));
    return;
  }
  const { verb, nouns } = r;
  // A runeword does its work first; the room may then react to having heard it. It can be typed
  // bare ("veth") or spoken ("say veth", "shout veth").
  const words = Object.values(sim.content.words);
  const word = words.find((w) => w.verb === verb) ?? (SPEAKING.includes(verb) && nouns.length === 1 ? words.find((w) => w.verb === nouns[0]) : undefined);
  if (word) {
    // What saying it here would mean can be weighed before it is said: a room may answer the
    // thought of it ("say sol"), and then the word stays unspoken and costs nothing.
    if (sim.p.words.includes(word.id) && fire(sim, sim.room.rules, 'say', [word.verb])) return;
    if (invoke(sim, word)) fire(sim, sim.room.rules, word.verb, []) || sim.note(`${word.verb.toUpperCase()}!`);
    return;
  }
  const walk = afoot && verb !== 'look';
  const nearer = (rules: typeof sim.room.rules): boolean => {
    const at = walk ? reach(sim, rules, verb, nouns) : null;
    if (at) sim.approach(at, line);
    return !!at;
  };
  if (nearer(sim.room.rules) || fire(sim, sim.room.rules, verb, nouns)) return;
  if (builtin(sim, verb, nouns, walk ? line : null, qty)) return;
  if (nearer(sim.content.rules) || fire(sim, sim.content.rules, verb, nouns)) return;
  const fb = sim.content.fallbacks;
  sim.say(fb[Math.floor(sim.rand() * fb.length)] ?? '...');
}
