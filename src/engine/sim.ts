// The simulation. Headless and deterministic: no DOM, no clock, no Math.random. It takes intent
// messages, advances one fixed tick, and emits events. Everything it remembers is in `state`.

import { buildScene } from './build';
import { hasPerk, hostile, playerAttack, swingHit, updateCombat } from './combat';
import { command } from './commands';
import { cellOf, depthOf, parseWild, roomOf } from './frontier';
import { Parser } from './parser';
import { all, questKey, run } from './rules';
import { PH, PW, type Scene } from './scene';
import { nearestGround } from './walk';
import type {
  ActorState, Content, Dir, DoorDef, GameState, Intent, ItemDef, LookWhen, Pile, PlayerState, RoomDef, RoomState, SimEvent, ThingDef, Value,
} from './types';

/** How close to a side edge the player gets before stepping into the next room. */
type Side = 'n' | 's' | 'e' | 'w';
const EDGE = 6;
/** How near a hunter must be to follow the player out of a room, and through how many rooms it will. */
const CHASE_RANGE = 150;
const CHASE_ROOMS = 4;

/** Somewhere to stand near: a point, and how close counts as within reach of it. */
export interface Spot {
  x: number;
  y: number;
  d: number;
}
export const TICKS_PER_SECOND = 20;
/** Ticks in a full day and night: eight minutes. */
export const DAY_LENGTH = 9600;

export type Behaviour = (sim: Sim, arg?: Value) => void;

export const SKILLS = ['blade', 'block', 'archery', 'sorcery', 'mending', 'lore'] as const;

/** The stamina every player starts with: what can be carried grows with stamina beyond this. */
const FIRST_SP = 30;

/** What lies on the ground is a thing whose id is this and the item's. */
export const PILE = 'ground:';

/** The small picture for a thing lying on the ground: its own, or one that suits its kind. */
export function iconOf(it: ItemDef): string {
  const byKind: Record<ItemDef['kind'], string> = {
    misc: 'sack', weapon: 'sword', shield: 'shield', bow: 'bow', armor: 'sack', trinket: 'amulet', potion: 'potion', tome: 'tome', key: 'key', food: 'sack',
  };
  return it.icon ?? byKind[it.kind];
}

function newPlayer(c: Content): PlayerState {
  return {
    x: c.start.x, y: c.start.y, dir: c.start.dir, act: 'idle', frame: 0, t: 0, mdx: 0, mdy: 0, blocking: false,
    hp: 40, mp: 20, sp: FIRST_SP, maxHp: 40, maxMp: 20, maxSp: FIRST_SP,
    level: 1, xp: 0, pendingLevels: 0,
    skills: Object.fromEntries(SKILLS.map((s) => [s, { lv: 5, xp: 0 }])),
    inv: {}, weapon: null, shield: null, spells: [], words: [], cd: {}, gold: 0, inside: [], dead: false, hurtT: 0,
  };
}

/** Resolve Korean particle placeholders like "X을(를)" against the batchim of the word before them. */
export function fixJosa(text: string): string {
  const bat = (w: string): boolean => {
    const m = /[\uac00-\ud7a3](?=[^\uac00-\ud7a3]*$)/.exec(w);
    if (!m) return true;
    return (m[0].charCodeAt(0) - 0xac00) % 28 !== 0;
  };
  return text
    .replace(/(\S+)을\(를\)/g, (_, w: string) => `${w}${bat(w) ? '을' : '를'}`)
    .replace(/(\S+)은\(는\)/g, (_, w: string) => `${w}${bat(w) ? '은' : '는'}`)
    .replace(/(\S+)이\(가\)/g, (_, w: string) => `${w}${bat(w) ? '이' : '가'}`)
    .replace(/(\S+)[과와]\([과와]\)/g, (_, w: string) => `${w}${bat(w) ? '과' : '와'}`)
    .replace(/(\S+)\(으\)로/g, (_, w: string) => `${w}${bat(w) ? '으로' : '로'}`)
    .replace(/(\S+)이\(라\)/g, (_, w: string) => `${w}${bat(w) ? '이' : ''}라`);
}

export class Sim {
  state: GameState;
  /** Events since the last drain(). */
  private out: SimEvent[] = [];
  readonly parser: Parser;
  /** Named behaviours that data can call with { run: name }. */
  behaviours: Record<string, Behaviour> = {};
  /** Enables debug commands (tp, give, set). */
  dev = false;
  private scenes = new Map<string, Scene>();
  /** The picture the player was last stood in: when it changes round them, they are stood clear of whatever arrived. */
  private sceneWas = '';

  constructor(readonly content: Content, opts: { seed?: number; saved?: GameState; behaviours?: Record<string, Behaviour> } = {}) {
    if (opts.behaviours) this.behaviours = opts.behaviours;
    this.parser = new Parser(content.vocab);
    for (const room of Object.values(content.rooms)) if (room.vocab) this.parser.addNouns(room.vocab);
    if (opts.saved) {
      this.state = opts.saved;
      this.adopt(opts.saved);
    } else {
      const seed = opts.seed ?? 1;
      this.state = {
        v: 1, seed, rng: seed | 0, tick: 0, room: content.start.room, player: newPlayer(content),
        rooms: {}, flags: { ...content.flags }, scored: [], score: 0, won: false,
      };
      this.enterRoom(content.start.room, content.start.x, content.start.y, content.start.dir);
    }
  }

  /**
   * Take up a saved game. Everything the simulation knows is in the state, so this is all a
   * restore is. A game saved by an older build may not quite fit this one: drop anyone the
   * content no longer knows, and make sure the player is not standing inside something that has
   * moved.
   */
  adopt(saved: GameState): void {
    this.state = structuredClone(saved);
    const rs = this.rs;
    if (rs) rs.actors = rs.actors.filter((a) => (a.kind === 'npc' ? this.content.chars[a.ref] : this.content.enemies[a.ref]));
    // Things the content no longer knows are no longer anywhere.
    for (const r of Object.values(this.state.rooms)) if (r.ground) r.ground = r.ground.filter((g) => this.content.items[g.item]);
    this.settle(this.scene());
    // A game saved before packs had limits may be carrying more than a pack holds now. It can
    // still walk; it only cannot pick up more until something is put down.
    if (this.load() > this.limit()) this.note(this.text('overladen'));
  }

  // -------------------------------------------------------------------------------------------
  // Accessors

  get p(): PlayerState {
    return this.state.player;
  }
  get room(): RoomDef {
    return roomOf(this.content, this.state.room)!;
  }
  get rs(): RoomState {
    return this.state.rooms[this.state.room];
  }

  /** Picture buffers for a room. Derived from its data and cached; never part of saved state. */
  scene(id = this.state.room): Scene {
    const key = this.sceneKey(id);
    let sc = this.scenes.get(key);
    if (!sc) {
      const def = roomOf(this.content, id)!.scene;
      this.scenes.set(key, (sc = buildScene(def, (def.when ?? []).filter((w) => all(this, w.if)))));
    }
    return sc;
  }

  /** Identifies the room's picture as it stands now, including which conditional parts are showing. */
  sceneKey(id = this.state.room): string {
    const when = roomOf(this.content, id)!.scene.when;
    return when ? `${id}#${when.map((w) => (all(this, w.if) ? 1 : 0)).join('')}` : id;
  }

  /** Seeded random number in [0, 1). */
  rand(): number {
    let t = (this.state.rng = (this.state.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  drain(): SimEvent[] {
    const o = this.out;
    this.out = [];
    return o;
  }

  text(key: string, word = ''): string {
    return fixJosa((this.content.text[key] ?? key).replace('%s', word));
  }

  /** How something looks just now: its usual description, unless events have changed it. */
  lookOf(def: { look: string; lookWhen?: LookWhen[] }): string {
    return def.lookWhen?.find((v) => all(this, v.if))?.look ?? def.look;
  }

  /** Fill {flag.name} in a piece of text with that flag's value, as it stands (or stood at the start). */
  fill(text: string): string {
    return text.replace(/\{([\w.]+)\}/g, (_, k: string) => String(this.state.flags[k] ?? this.content.flags?.[k] ?? ''));
  }

  // -------------------------------------------------------------------------------------------
  // Things the rule language can do

  /** `who` names the speaker, when somebody is speaking. */
  say(text: string, who?: string): void {
    this.out.push({ t: 'say', text: fixJosa(text), who });
  }
  /** News that keeps: told at once in a quiet moment, and otherwise when the fight is over. */
  sayWhenIdle(text: string): void {
    this.out.push({ t: 'say', text, idle: true });
  }
  talked(char: string): void {
    this.out.push({ t: 'talk', char });
  }
  /** How many passing remarks have been made: lets a caller tell whether something already spoke up. */
  notes = 0;
  note(text: string): void {
    this.notes++;
    this.out.push({ t: 'note', text: fixJosa(text) });
  }
  sound(id: string): void {
    this.out.push({ t: 'sound', id });
  }
  /** A page to read. `heads` are the lines that head a section; a line that is only "\f" starts a new box. */
  page(title: string, lines: string[], heads?: number[]): void {
    this.out.push(heads?.length ? { t: 'page', title, lines, heads } : { t: 'page', title, lines });
  }
  showMap(): void {
    this.out.push({ t: 'map' });
  }

  /**
   * Into the pack, as many as it will hold. A first or better weapon goes straight into the hand,
   * a first shield onto the arm, and so on, and does not weigh on the pack there. Whatever will
   * not fit is left on the ground (where `dropAt` says, or at the player's feet) to be fetched
   * later. `took` is said in passing only if all of it was taken. Returns how many were.
   */
  give(item: string, n = 1, took?: string): number {
    const p = this.p;
    const def = this.content.items[item];
    // What goes into the hand always fits. What it displaces goes into the pack, even if that
    // leaves the pack too full to take anything more.
    const slot = def ? this.slotFor(def) : null;
    const fit = Math.min(n, (slot ? 1 : 0) + this.space(item));
    if (fit > 0) {
      p.inv[item] = (p.inv[item] ?? 0) + fit;
      if (slot === 'weapon') {
        if (p.weapon) p.other = p.weapon;
        p.weapon = item;
        this.note(this.text('equipped', def!.name));
      } else if (slot === 'shield') {
        p.shield = item;
        this.note(this.text('shieldHint'));
      } else if (slot === 'armor') {
        p.armor = item;
        this.note(this.text('equipped', def!.name));
      } else if (slot === 'trinket') {
        p.trinket = item;
        this.note(this.text('wearing', def!.name));
      } else if (def?.kind === 'tome') this.note(this.text('tomeHint'));
      if (def?.carry) this.note(this.text('canCarry', String(this.limit())));
    }
    if (fit < n) {
      const at = this.dropAt ?? { x: p.x + (p.dir === 'left' ? -14 : 14), y: p.y + 1 };
      this.putDown(item, n - fit, at.x, at.y);
      this.note(this.text(n - fit > 1 ? 'leftBehindMany' : 'leftBehind', this.named(item, n - fit)));
    } else if (took) this.note(took);
    return fit;
  }

  /** Where a thing given goes of its own accord: into the hand, onto the arm or the back; or, if null, into the pack. */
  private slotFor(def: ItemDef): 'weapon' | 'shield' | 'armor' | 'trinket' | null {
    const p = this.p;
    const held = p.weapon ? this.content.items[p.weapon] : null;
    if (def.kind === 'weapon' && (!held || (held.kind === 'weapon' && (def.power ?? 0) > (held.power ?? 0)))) return 'weapon';
    if (def.kind === 'shield' && !p.shield) return 'shield';
    if (def.kind === 'armor' && (def.power ?? 0) > (p.armor ? this.content.items[p.armor]?.power ?? 0 : 0)) return 'armor';
    if (def.kind === 'trinket' && !p.trinket) return 'trinket';
    return null;
  }

  // -------------------------------------------------------------------------------------------
  // Carrying

  /** Set while a fallen foe's belongings are handed over: what will not fit stays where it fell. */
  dropAt: { x: number; y: number } | null = null;

  /** How heavy one of a thing is. A thing a story needs weighs nothing. */
  weight(item: string): number {
    const def = this.content.items[item];
    return !def || def.keep ? 0 : def.weight;
  }

  /** Is this carried thing in hand or worn? Then it is on the player, not in the pack. */
  onPerson(item: string): boolean {
    const p = this.p;
    return p.weapon === item || p.shield === item || p.armor === item || p.trinket === item;
  }

  /** How much is in the pack: everything carried but what is in hand or worn. */
  load(): number {
    let sum = 0;
    for (const [id, n] of Object.entries(this.p.inv)) sum += this.weight(id) * Math.max(0, n - (this.onPerson(id) ? 1 : 0));
    return sum;
  }

  /** How much the pack can hold: more with stamina, and more with whatever the pack is carried in. */
  limit(): number {
    const carry = this.content.carry;
    if (!carry) return Infinity;
    let extra = 0;
    for (const [id, n] of Object.entries(this.p.inv)) if (n > 0) extra += this.content.items[id]?.carry ?? 0;
    return carry.base + Math.floor(Math.max(0, this.p.maxSp - FIRST_SP) * carry.stamina) + extra;
  }

  /** How many more of a thing the pack has room for (as many as are wanted, of a thing that weighs nothing). */
  space(item: string): number {
    const each = this.weight(item);
    return each > 0 ? Math.max(0, Math.floor((this.limit() - this.load()) / each)) : Infinity;
  }

  /** Would this many more of a thing be taken? Something that goes straight into the hand always is. */
  fits(item: string, n = 1): boolean {
    const def = this.content.items[item];
    return (def && this.slotFor(def) ? 1 : 0) + this.space(item) >= n;
  }

  /** "늑대 가죽", "늑대 가죽 3개". Korean needs no article or plural ending. */
  named(item: string, n: number): string {
    const def = this.content.items[item];
    const name = def?.name ?? item;
    if (n !== 1) return `${name} ${n}개`;
    return name;
  }

  /** Leave some of a thing on the ground here, with any of the same already lying here. */
  putDown(item: string, n: number, x: number, y: number): void {
    if (n <= 0) return;
    const ground = (this.rs.ground ??= []);
    const pile = ground.find((g) => g.item === item);
    if (pile) pile.n += n;
    else {
      // Beside whatever else is lying there, not on top of it.
      const sc = this.scene();
      const away = x >= this.p.x ? 1 : -1;
      const spots = [0, 10, 20, 30, -10, -20].map((dx) => nearestGround(sc, Math.round(x + dx * away), Math.round(y), 12));
      const [px, py] = spots.find(([sx, sy]) => !ground.some((g) => Math.abs(g.x - sx) < 9 && Math.abs(g.y - sy) < 5)) ?? spots[0];
      ground.push({ item, n, x: px, y: py });
    }
  }

  /** What of a thing lies on the ground here. */
  pile(item: string): Pile | undefined {
    return this.rs.ground?.find((g) => g.item === item && g.n > 0);
  }

  /** Take up to `n` of what lies here, as many as the pack will hold. Returns how many. */
  pickUp(item: string, n: number): number {
    const pile = this.pile(item);
    if (!pile) return 0;
    const def = this.content.items[item];
    const fit = Math.min(n, pile.n, (def && this.slotFor(def) ? 1 : 0) + this.space(item));
    if (fit <= 0) return 0;
    pile.n -= fit;
    this.rs.ground = this.rs.ground!.filter((g) => g.n > 0);
    this.give(item, fit);
    return fit;
  }

  lose(item: string, n = 1): void {
    const left = (this.p.inv[item] ?? 0) - n;
    if (left > 0) this.p.inv[item] = left;
    else {
      delete this.p.inv[item];
      if (this.p.weapon === item) this.p.weapon = null;
      if (this.p.shield === item) this.p.shield = null;
      if (this.p.armor === item) this.p.armor = null;
      if (this.p.trinket === item) this.p.trinket = null;
    }
  }

  award(id: string, points: number): void {
    if (this.state.scored.includes(id)) return;
    this.state.scored.push(id);
    this.state.score += points;
    this.sound('score');
  }

  setQuest(id: string, stage: number): void {
    const key = questKey(id);
    const now = Number(this.state.flags[key] ?? 0);
    if (stage <= now) return;
    this.state.flags[key] = stage;
    const q = this.content.quests[id];
    if (!q) return;
    if (now === 0) this.say(this.text('questStart', q.name));
    else if (stage >= q.done) this.say(this.text('questDone', q.name));
    this.sound('quest');
  }

  teach(id: string): void {
    const list = id.startsWith('word:') ? this.p.words : this.p.spells;
    if (!list.includes(id)) list.push(id);
  }

  hurt(n: number, why: string): void {
    this.p.hp -= n;
    if (this.p.hp <= 0) this.die(why);
    // The first time things look bad, a reminder that there is something to be done about it.
    else if (this.p.hp < this.p.maxHp * 0.4 && !this.state.flags['hint.low'] && Object.keys(this.p.inv).some((id) => this.content.items[id]?.kind === 'potion')) {
      this.state.flags['hint.low'] = true;
      this.note(this.text('lowHint'));
    }
  }

  die(text: string): void {
    if (this.p.dead) return;
    this.p.dead = true;
    this.p.hp = 0;
    this.p.act = 'dead';
    this.p.mdx = this.p.mdy = 0;
    this.sound('death');
    this.out.push({ t: 'died', text });
  }

  win(text: string): void {
    this.state.won = true;
    this.sound('win');
    this.out.push({ t: 'won', text });
  }

  /** Hide or show a thing. "room/thing" reaches into another room. */
  setThing(ref: string, visible: boolean): void {
    const [a, b] = ref.split('/');
    const roomId = b ? a : this.state.room;
    const thing = b ?? a;
    const rs = this.roomState(roomId);
    const add = (list: string[]): void => void (list.includes(thing) || list.push(thing));
    const drop = (list: string[]): void => void (list.includes(thing) && list.splice(list.indexOf(thing), 1));
    if (visible) {
      add(rs.shown);
      drop(rs.gone);
    } else {
      add(rs.gone);
      drop(rs.shown);
    }
  }

  spawn(kind: string, x: number, y: number, level = 0): void {
    const def = this.content.enemies[kind];
    if (!def || (def.undead && this.atRest())) return;
    // Never inside anything: a creature called up into a pile of treasure would stand there for ever.
    [x, y] = nearestGround(this.scene(), x, y, 12);
    const a = this.makeActor(`dyn:${this.state.tick}:${this.rs.actors.length}`, 'enemy', kind, x, y, 'down', Math.round(def.hp * (1 + 0.25 * level)));
    a.ai.lv = level;
    a.ai.max = a.hp;
    this.rs.actors.push(a);
  }

  // -------------------------------------------------------------------------------------------
  // Looking things up

  /** Things currently present in the room. */
  things(): ThingDef[] {
    const rs = this.rs;
    const here = (this.room.things ?? []).filter((t) => !rs.gone.includes(t.id) && (!t.hidden || rs.shown.includes(t.id)));
    // Whatever has been put down here is a thing like any other, to be looked at and taken up again.
    for (const g of rs.ground ?? []) {
      const it = this.content.items[g.item];
      if (it && g.n > 0) here.push({ id: PILE + g.item, nouns: it.nouns, x: g.x, y: g.y, reach: 26, look: it.look, take: g.item, icon: iconOf(it), pile: g.n });
    }
    return here;
  }

  /** Is the player within reach of a point? Depth counts double, as the ground is foreshortened. */
  within(x: number, y: number, d: number): boolean {
    return Math.hypot(this.p.x - x, (this.p.y - y) * 2) <= d;
  }

  /** Is the player near a thing or actor, named by id (or a character/enemy id)? */
  isNear(id: string, d?: number): boolean {
    const thing = this.things().find((t) => t.id === id);
    const actor = thing ? undefined : this.rs.actors.find((a) => a.id === id || a.ref === id);
    const at = thing ? { x: thing.x, y: thing.y, d: d ?? thing.reach ?? 30 } : actor ? { x: actor.x, y: actor.y, d: d ?? 44 } : null;
    // What is not here at all cannot be walked up to.
    if (!at) return false;
    if (this.within(at.x, at.y, at.d)) {
      if (this.probe) this.probe.hits++;
      return true;
    }
    if (!this.probe) return false;
    this.probe.misses.push(at);
    return this.probe.assume;
  }

  /**
   * Set while a command is being weighed rather than carried out: counts the things it found
   * within reach, lists those it found too far off, and can pretend the far ones are near, to
   * see what the answer would be from there. Never part of a saved game.
   */
  probe: { assume: boolean; hits: number; misses: Spot[] } | null = null;

  /** Ask whoever is sending the player's lines to walk within reach of a spot, and send this one again. */
  approach(at: Spot, line: string): void {
    this.out.push({ t: 'approach', ...at, line });
  }

  /** Ask to be walked somewhere, as a click there would: through a door, or off an edge. */
  walk(x: number, y: number, door?: number, side?: Side): void {
    this.out.push({ t: 'walk', x: Math.round(x), y: Math.round(y), ...(door === undefined ? {} : { door }), ...(side ? { side } : {}) });
  }

  /**
   * How much daylight there is, from 1 (day) to 0 (deep night). The day turns with the game
   * clock: a long day, a short dusk, a night, a dawn.
   */
  daylight(): number {
    const phase = ((this.state.tick + DAY_LENGTH * 0.12) % DAY_LENGTH) / DAY_LENGTH;
    if (phase < 0.58) return 1;
    if (phase < 0.68) return 1 - (phase - 0.58) / 0.1;
    if (phase < 0.92) return 0;
    return (phase - 0.92) / 0.08;
  }

  /** True in a dark room when the player has no light. */
  isDark(): boolean {
    return !!this.room.dark && Number(this.state.flags.light ?? 0) <= this.state.tick;
  }

  // -------------------------------------------------------------------------------------------
  // Rooms

  private roomState(id: string): RoomState {
    return (this.state.rooms[id] ??= { actors: [], gone: [], shown: [], dead: [], shots: [] });
  }

  private makeActor(id: string, kind: 'npc' | 'enemy', ref: string, x: number, y: number, dir: Dir, hp: number): ActorState {
    return { id, kind, ref, x, y, dir, act: 'idle', frame: 0, t: 0, wait: 20, tx: x, ty: y, hp, ai: {} };
  }

  /**
   * Let the room's people come and go as things now stand: whoever should be here and is not
   * arrives at their place, and whoever should not be has left.
   */
  muster(): void {
    const rs = this.rs;
    const due = (this.room.npcs ?? []).filter((n) => all(this, n.if));
    rs.actors = rs.actors.filter((a) => a.kind !== 'npc' || due.some((n) => a.id === `npc:${n.char}`));
    for (const n of due)
      if (!rs.actors.some((a) => a.id === `npc:${n.char}`)) rs.actors.push(this.makeActor(`npc:${n.char}`, 'npc', n.char, n.x, n.y, n.dir ?? 'down', 1));
  }

  enterRoom(id: string, x: number, y: number, dir?: Dir): void {
    const def = roomOf(this.content, id);
    if (!def) return;
    const p = this.p;
    // Whoever was in the room being left is rebuilt on return, so need not be remembered (or saved).
    const left = this.state.rooms[this.state.room];
    if (left && this.state.room !== id) {
      left.actors = [];
      left.shots = [];
    }
    this.state.room = id;
    const rs = this.roomState(id);
    const sc = this.scene(id);

    // Whoever should be here right now. Rebuilt on every entry: characters return to their
    // posts, and anything not yet defeated is back on its feet.
    rs.actors = [];
    rs.shots = [];
    for (const n of def.npcs ?? [])
      if (all(this, n.if)) rs.actors.push(this.makeActor(`npc:${n.char}`, 'npc', n.char, n.x, n.y, n.dir ?? 'down', 1));
    for (const s of def.spawns ?? []) {
      const e = this.content.enemies[s.kind];
      // Some things do not stay dead.
      const fell = rs.deadAt?.[s.id];
      if (s.respawn && fell !== undefined && this.state.tick - fell >= s.respawn) {
        rs.dead = rs.dead.filter((d) => d !== s.id);
        delete rs.deadAt![s.id];
      }
      if (!e || rs.dead.includes(s.id) || !all(this, s.if) || (e.undead && this.atRest())) continue;
      // Some things keep to the dark.
      if ((s.when === 'night' && this.daylight() > 0.35) || (s.when === 'day' && this.daylight() < 0.5)) continue;
      const [sx, sy] = nearestGround(sc, s.x, s.y, 12);
      const a = this.makeActor(s.id, 'enemy', s.kind, sx, sy, 'down', Math.round(e.hp * (1 + 0.25 * (s.level ?? 0))));
      a.ai.lv = s.level ?? 0;
      a.ai.max = a.hp;
      rs.actors.push(a);
    }

    p.x = Math.max(EDGE + 1, Math.min(PW - EDGE - 2, x));
    p.y = Math.max(sc.walkTop + 1, Math.min(PH - 3, y));
    if (dir) p.dir = dir;
    p.inside = [];
    this.settle(sc);
    this.sceneWas = this.sceneKey(id);
    // Standing in a doorway on arrival must not send the player straight back.
    p.inside = this.standingIn();

    this.out.push({ t: 'room', id });
    // Arriving somewhere one was sent is worth saying.
    if (Object.entries(this.state.flags).some(([k, v]) => (k === 'goal' || k.startsWith('goal.')) && v === id)) this.note(this.text('atGoal', def.name));
    // A place that was only pointed out (marked under its own name) is no longer a mark once found.
    if (this.state.flags[`goal.${id}`] === id) this.state.flags[`goal.${id}`] = false;
    if (this.isDark()) this.say(this.text('dark'));
    // The room's own rules for arriving, then the game's.
    for (const r of [...(def.rules ?? []), ...this.content.rules]) if (r.enter && this.state.room === id && all(this, r.if)) run(this, r.do);
  }

  /** Is the player out beyond the valley? Indoors counts as wherever the door leads out. */
  afield(): boolean {
    const at = cellOf(this.content, this.state.room);
    return !!at && depthOf(this.content, at[0], at[1]) > 0;
  }

  /** Have the dead stopped walking? */
  atRest(): boolean {
    return !!this.content.rest && all(this, this.content.rest);
  }

  private footBlocked(sc: Scene, x: number, y: number): boolean {
    return sc.blocked(x, y) || sc.blocked(x - 4, y) || sc.blocked(x + 4, y);
  }

  /**
   * Make sure the player is standing on the room's real ground: not inside anything, and not in
   * a pocket cut off from the rest. If they are, move them to the nearest place that is.
   */
  private settle(sc: Scene): void {
    // Wherever they could have walked to is fine as it is, right up to the edges.
    [this.p.x, this.p.y] = nearestGround(sc, this.p.x, this.p.y, EDGE + 1);
  }

  private standingIn(): string[] {
    const { x, y } = this.p;
    const hit: string[] = [];
    (this.room.zones ?? []).forEach((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1 && hit.push(`zone:${z.id}`));
    (this.room.doors ?? []).forEach((d, i) => x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1 && hit.push(`door:${i}`));
    return hit;
  }

  // -------------------------------------------------------------------------------------------
  // The tick

  step(intents: Intent[] = []): void {
    const p = this.p;
    if (p.dead) return;
    for (const it of intents) {
      if (it.t === 'move') {
        p.mdx = Math.sign(it.dx);
        p.mdy = Math.sign(it.dy);
      } else if (it.t === 'attack') playerAttack(this);
      else if (it.t === 'block') {
        // Raising a guard takes a little breath, so it cannot simply be hammered.
        if (it.on && !p.blocking) {
          p.guardT = this.state.tick;
          if (!hasPerk(this, 'ironarm')) p.sp = Math.max(0, p.sp - 1.5);
        }
        p.blocking = it.on;
      }
      else if (it.t === 'say') command(this, it.line, !!it.afoot);
      else if (it.t === 'ease') this.state.flags.gentle = it.gentle;
      else if (it.t === 'through') this.through(it.door);
      else if (it.t === 'level' && p.pendingLevels > 0) {
        p.pendingLevels--;
        if (it.pool === 'hp') p.hp = p.maxHp += 10;
        else if (it.pool === 'mp') p.mp = p.maxMp += 10;
        else {
          // A deeper wind makes a broader back.
          const could = this.limit();
          p.sp = p.maxSp += 10;
          if (this.limit() > could) this.note(this.text('strongerBack', String(this.limit())));
        }
      }
      if (p.dead) return;
    }
    // A room's picture can change while the player stands in it (a hearth lit, and a bed made up
    // where there was floor). Nobody is left standing inside what arrived.
    const picture = this.sceneKey();
    if (picture !== this.sceneWas) {
      this.sceneWas = picture;
      this.settle(this.scene());
    }
    this.state.tick++;
    // Out of doors, the day's turning is worth a word.
    if (this.room.scene.kind === 'outdoor') {
      const phase = (t: number): number => ((t + DAY_LENGTH * 0.12) % DAY_LENGTH) / DAY_LENGTH;
      const [was, now] = [phase(this.state.tick - 1), phase(this.state.tick)];
      if (was < 0.6 && now >= 0.6) {
        this.note(this.text(this.state.flags['hint.night'] ? 'dusk' : 'firstDusk'));
        this.state.flags['hint.night'] = true;
      } else if (was < 0.94 && now >= 0.94) this.note(this.text('dawn'));
    }
    this.updatePlayer();
    if (p.dead) return;
    this.updateActors();
    updateCombat(this);
    if (p.dead) return;
    this.checkTriggers();
  }

  private updatePlayer(): void {
    const p = this.p;
    if (p.act === 'swing') {
      p.t++;
      p.frame = Math.min(2, p.t >> 1);
      if (p.t === 3) swingHit(this);
      if (p.t >= 8) {
        p.act = 'idle';
        p.t = 0;
      }
      return;
    }
    // Holding a guard roots you to the spot and slowly tires you.
    if (p.blocking && p.sp > 0) {
      p.act = 'block';
      p.sp = Math.max(0, p.sp - 0.12);
      // The guard can always be turned to face a new threat.
      if (p.mdx || p.mdy) p.dir = p.mdx > 0 ? 'right' : p.mdx < 0 ? 'left' : p.mdy > 0 ? 'down' : 'up';
      // With practice a guard can be carried forward, slowly.
      if (hasPerk(this, 'steady') && (p.mdx || p.mdy) && this.state.tick % 2 === 0) {
        if (p.mdx) this.tryStep(p.mdx * 2, 0);
        if (p.mdy) this.tryStep(0, p.mdy);
      }
      return;
    }
    const { mdx, mdy } = p;
    if (!mdx && !mdy) {
      p.act = 'idle';
      return;
    }
    p.dir = mdx > 0 ? 'right' : mdx < 0 ? 'left' : mdy > 0 ? 'down' : 'up';
    const room = this.state.room;
    const mx = mdx ? this.tryStep(mdx * 2, 0) : false;
    const my = mdy && this.state.room === room ? this.tryStep(0, mdy) : false;
    p.act = 'walk';
    if (mx || my) p.t++;
    p.frame = Math.floor(p.t / 3) & 3;
  }

  /** Move the player if the ground allows, or into the next room at an edge. */
  private tryStep(dx: number, dy: number): boolean {
    const p = this.p;
    const sc = this.scene();
    const ex = this.room.exits ?? {};
    const nx = p.x + dx;
    const ny = p.y + dy;
    const leave = (side: Side, to: string | undefined, x: number, y: number, dir: Dir): boolean => {
      if (!to) return false;
      // A held way is not passed while whoever holds it is still standing (not whatever came in after the player).
      const held = this.room.holds?.[side];
      if (held && this.rs.actors.some((a) => hostile(this, a) && !a.id.startsWith('dyn:'))) {
        if (!(p.cd.held > 0)) {
          p.cd.held = 80;
          this.note(held);
        }
        return false;
      }
      const after = this.hunters(to);
      const [fromX, fromY] = [p.x, p.y];
      const from = this.state.room;
      this.enterRoom(to, x, y, dir);
      this.follow(after, from, side, fromX, fromY);
      return true;
    };
    if (nx < EDGE) return leave('w', ex.w, PW - EDGE - 2, p.y, 'left');
    if (nx > PW - 1 - EDGE) return leave('e', ex.e, EDGE + 1, p.y, 'right');
    if (ny <= sc.walkTop) return leave('n', ex.n, p.x, PH - 4, 'up');
    if (ny >= PH - 2) return ex.s ? leave('s', ex.s, p.x, this.scene(ex.s).walkTop + 2, 'down') : false;
    if (this.footBlocked(sc, nx, ny)) return false;
    p.x = nx;
    p.y = ny;
    return true;
  }

  /**
   * Whatever is hunting the player closely enough to come after them out of this room and into
   * another. Out in the wild, things do not forget a scent because it went out of sight; but
   * nothing follows anyone into the valley or a haven, nor away from a place it was set to keep.
   */
  private hunters(to: string): ActorState[] {
    if (!parseWild(this.state.room)) return [];
    const p = this.p;
    const close = this.rs.actors.filter((a) => {
      const def = this.content.enemies[a.ref];
      if (!def || !hostile(this, a) || def.ai === 'boss' || (a.ai.frozen ?? 0) > 0 || (a.ai.chase ?? 0) >= CHASE_ROOMS) return false;
      // A thing with a home of its own, that does not come back once beaten, stays where it was put.
      if (!a.id.startsWith('dyn:') && !(this.room.spawns ?? []).find((sp) => sp.id === a.id)?.respawn) return false;
      return (a.ai.lag ?? 0) > 0 || Math.hypot(a.x - p.x, (a.y - p.y) * 2) <= CHASE_RANGE;
    });
    if (close.length && (!parseWild(to) || roomOf(this.content, to)?.haven)) {
      const shaken = this.content.frontier?.text.shaken;
      if (shaken) this.note(shaken);
      return [];
    }
    return close;
  }

  /**
   * Bring the hunters on after the player, who has just come in over the given side. Each comes in
   * over the same edge, as far behind as it was, and is a while about it: the slower, the longer.
   * A creature that came from the room it followed out of is gone from there until it would
   * have come back had it been killed.
   */
  private follow(hunters: ActorState[], from: string, side: Side, fromX: number, fromY: number): void {
    if (!hunters.length) return;
    const p = this.p;
    const left = this.state.rooms[from];
    const sc = this.scene();
    hunters.forEach((a, k) => {
      const def = this.content.enemies[a.ref]!;
      if (left && !a.id.startsWith('dyn:')) {
        left.dead.push(a.id);
        (left.deadAt ??= {})[a.id] = this.state.tick;
      }
      const behind = Math.hypot(a.x - fromX, (a.y - fromY) * 2);
      const [ox, oy] = [a.x - fromX, a.y - fromY];
      const [x, y] =
        side === 'e' ? [EDGE + 4, p.y + oy] : side === 'w' ? [PW - EDGE - 5, p.y + oy] : side === 'n' ? [p.x + ox, PH - 5] : [p.x + ox, sc.walkTop + 3];
      const [gx, gy] = nearestGround(sc, Math.max(EDGE + 4, Math.min(PW - EDGE - 5, x)), Math.max(sc.walkTop + 3, Math.min(PH - 5, y)), 10);
      const b = this.makeActor(`dyn:${this.state.tick}:after${k}`, 'enemy', a.ref, gx, gy, a.dir, a.hp);
      b.ai = { lv: a.ai.lv ?? 0, max: a.ai.max ?? a.hp, chase: (a.ai.chase ?? 0) + 1, lag: Math.round((a.ai.lag ?? 0) + behind / Math.max(0.3, def.speed)) + 8 };
      this.rs.actors.push(b);
    });
    if (!this.state.flags['hint.followed']) {
      this.state.flags['hint.followed'] = true;
      const said = this.content.frontier?.text.followed;
      if (said) this.note(said);
    }
  }

  private updateActors(): void {
    const sc = this.scene();
    for (const a of this.rs.actors) {
      if (a.kind !== 'npc') continue;
      const def = (this.room.npcs ?? []).find((n) => n.char === a.ref);
      const box = def?.wander;
      if (a.wait > 0) {
        a.wait--;
        a.act = 'idle';
        // Turn to face the player when they come close.
        if (this.within(a.x, a.y, 40)) {
          const dx = this.p.x - a.x;
          const dy = this.p.y - a.y;
          a.dir = Math.abs(dx) > Math.abs(dy) * 2 ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          if (box) a.wait = Math.max(a.wait, 10);
        }
        continue;
      }
      if (!box) {
        a.wait = 1000;
        continue;
      }
      const dx = a.tx - a.x;
      const dy = a.ty - a.y;
      if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1) {
        a.wait = 40 + Math.floor(this.rand() * 90);
        a.tx = box[0] + this.rand() * (box[2] - box[0]);
        a.ty = box[1] + this.rand() * (box[3] - box[1]);
        a.dir = 'down';
        continue;
      }
      a.act = 'walk';
      const horiz = Math.abs(dx) >= 1.5;
      a.dir = horiz ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      const nx = a.x + (horiz ? Math.sign(dx) : 0);
      const ny = a.y + (horiz ? 0 : Math.sign(dy) * 0.5);
      if (sc.blocked(nx, ny) || sc.blocked(nx - 4, ny) || sc.blocked(nx + 4, ny)) {
        a.tx = a.x;
        a.ty = a.y;
      } else {
        a.x = nx;
        a.y = ny;
      }
      a.t++;
      a.frame = Math.floor(a.t / 4) & 3;
    }
  }

  /**
   * Zones and doors fire once when stepped into. A door that was shut when it was stepped into
   * (marked with a "!" in `inside`) is gone through once it opens, as soon as the player presses
   * on into it, without first having to step off the threshold and back.
   */
  private checkTriggers(): void {
    const p = this.p;
    const now = this.standingIn();
    const refused = now.filter((id) => p.inside.includes(`${id}!`));
    const entered = now.filter((id) => !p.inside.includes(id) && !refused.includes(id));
    p.inside = now.map((id) => (refused.includes(id) ? `${id}!` : id));
    const room = this.room;
    const go = (d: DoorDef): void => {
      this.sound('door');
      this.enterRoom(d.to, d.x, d.y, d.dir);
      // Stop on the threshold, or a held key would walk straight back out.
      p.mdx = p.mdy = 0;
    };
    for (const id of entered) {
      if (this.room !== room || p.dead) return;
      const [kind, key] = id.split(':');
      if (kind === 'zone') {
        for (const r of room.rules ?? []) if (r.zone === key && all(this, r.if)) run(this, r.do);
      } else {
        const d = room.doors![Number(key)];
        if (all(this, d.if)) go(d);
        else {
          p.inside = p.inside.map((i) => (i === id ? `${id}!` : i));
          if (d.locked) this.say(d.locked);
        }
      }
    }
    // Every door is a threshold in a back wall, walked into by going up.
    for (const id of refused) {
      if (this.room !== room || p.dead || p.mdy >= 0) return;
      const d = room.doors![Number(id.split(':')[1])];
      if (all(this, d.if)) return go(d);
    }
  }

  /**
   * Go through a door the player stands at, as if they had walked on into it: for a walk that
   * ended on a threshold that was not open when it was reached, or was reached from the door's
   * own ground. Said to be shut if it is.
   */
  through(i: number): void {
    const d = this.room.doors?.[i];
    if (!d || !this.within((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, 14)) return;
    if (all(this, d.if)) {
      this.sound('door');
      this.enterRoom(d.to, d.x, d.y, d.dir);
      this.p.mdx = this.p.mdy = 0;
    } else if (d.locked) this.say(d.locked);
  }
}

