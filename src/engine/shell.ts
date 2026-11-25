// The player's side of the game: the typing line, message boxes, menus, saving, and turning held
// keys into intent messages. It owns no world state; in a networked game this is the client.
// Still no DOM here, so tests can drive it.

import { hostile } from './combat';
import { koNounLabel } from '../game/data/vocab';
const koLabel = (id: string): string => koNounLabel[id] ?? id;
import { bagRows, groundRows, itemActions, loadText, storedRows, storeHere, weighed } from './commands';
import { wrap } from './font';
import { chart, roomOf } from './frontier';
import { ICONS } from './icons';
import { all } from './rules';
import { PH, PW } from './scene';
import { fixJosa, Sim, type Behaviour } from './sim';
import type { ActorState, Content, DoorDef, GameState, Intent } from './types';
import { routeTo, type Pace } from './walk';

export interface Store {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export type Modal =
  /** `any`: goes away on any key at all, not only the usual ones. */
  | { k: 'msg'; text: string; more?: boolean; who?: string; any?: boolean }
  /** `heads`: which of these lines head a section. */
  | { k: 'page'; title: string; lines: string[]; more?: boolean; heads?: number[] }
  /**
   * The map, with a cursor that can be moved about it: dx, dy are its offset from where the player
   * stands. vx, vy are where the middle of the view is, the same way; the picture keeps them.
   */
  | { k: 'map'; dx: number; dy: number; vx?: number; vy?: number }
  /**
   * A menu. `lead`: the first line of the title is a heading (the name of the thing shown).
   * `top`: the first row in view, when there are more rows than fit; the picture keeps it.
   * `front`: the title screen or the main menu, where the page may show what lies outside the game.
   */
  | { k: 'list'; title: string; items: string[]; sel: number; pick: (i: number) => void; cancel: boolean; banner?: string; onCancel?: () => void; lead?: boolean; top?: number; front?: boolean };

/** Somewhere to come back to once every box is closed: the menu, at the row chosen from it, or the bag. */
type Return = { to: 'menu'; sel: number } | { to: 'bag'; item: string; room: string };

interface SaveFile {
  v: 1;
  /** The content's save version when this was written. */
  content: number;
  label: string;
  state: GameState;
}

const SLOTS = ['슬롯 1', '슬롯 2', '슬롯 3'];
const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);
const MAX_INPUT = 37;
/** Lines of text a box can hold before it must continue on another. */
const BOX_LINES = 13;
const TICK_MS = 50;
/** The most things offered at once. The first ten can be had by a digit key. */
const OFFERS = 16;

/** What stands at a point in the picture, and what pointing at it does. */
type Pointed =
  | { k: 'talk' | 'take' | 'look'; label: string; line: string; x: number; y: number; d: number }
  | { k: 'fight'; label: string; foe: ActorState };

export class Shell {
  sim: Sim;
  input = '';
  private last = '';
  /** Open boxes, front first. The simulation waits while any is open. */
  modals: Modal[] = [];
  /** Sounds to play, drained by the browser layer. */
  sounds: string[] = [];
  settings = { sound: true, music: true, tapToWalk: false };
  /** Interface clock (cursor blink, flames). Not part of the simulation. */
  uiTick = 0;
  /** A passing remark shown under the picture, and the interface tick at which it fades. */
  noteText = '';
  noteUntil = 0;
  private held = new Set<string>();
  private tapDir: [number, number] = [0, 0];
  private sent: [number, number] = [0, 0];
  private queue: Intent[] = [];
  private acc = 0;
  /** The character being spoken with; their menu reopens after each reply. */
  private talkingTo: string | null = null;
  /** The row last chosen in this conversation, by its label: where the cursor waits when the menu comes back. */
  private talkLast: string | null = null;
  /** Shown once as play begins. The browser layer swaps in wording for touch screens. */
  startHint = 'Arrows walk. Click, press 1-9, or type.';
  /** Space list rows further apart, for fingers. */
  roomy = false;
  /**
   * A digit pressed on an empty typing line does the thing of that number among those offered
   * (see `suggest`). The browser layer turns this off where the offers are shown without numbers.
   */
  digits = true;

  constructor(private content: Content, private store: Store, private dev = false, private behaviours: Record<string, Behaviour> = {}) {
    this.sim = this.fresh();
    try {
      Object.assign(this.settings, JSON.parse(store.get('thanes-quest:settings') ?? '{}'));
    } catch {
      // Unreadable settings are simply ignored.
    }
  }

  private fresh(saved?: GameState): Sim {
    const sim = new Sim(this.content, { seed: 1, saved, behaviours: this.behaviours });
    sim.dev = this.dev;
    // What the player's hands were doing is no part of a saved game. A save made in mid-stride
    // (every room is entered walking) would otherwise walk on by itself when taken up again.
    if (saved) {
      sim.p.mdx = sim.p.mdy = 0;
      sim.p.blocking = false;
    }
    this.held.clear();
    this.queue = [];
    this.sent = [0, 0];
    this.tapDir = [0, 0];
    this.bound = null;
    this.errand = null;
    this.waiting = [];
    this.modals = [];
    this.input = '';
    this.talkingTo = null;
    this.after = [];
    this.sim = sim;
    if (!saved) this.message(this.content.intro);
    this.absorb();
    return sim;
  }

  /** The opening screen: the game's name over the first room, and a choice of how to start. */
  showTitle(): void {
    // A save from before the first step is no game at all (older builds wrote one on opening).
    const saved = this.read('auto');
    const auto = saved && saved.state.tick > 0 ? saved : null;
    const items = auto ? ['새 사가를 시작한다', `이어하기: ${auto.label}`] : ['새 사가를 시작한다'];
    this.modals.unshift({
      k: 'list', title: this.content.tagline, items, sel: auto ? 1 : 0, cancel: false, banner: this.content.title.toUpperCase(), front: true,
      pick: (i) => void (i === 1 && this.restore('auto')),
    });
  }

  get modal(): Modal | undefined {
    return this.modals[0];
  }

  /** Show a message, split across several boxes if it is long. */
  message(text: string, who?: string): void {
    const lines = wrap(text, 32);
    for (let i = 0; i < lines.length; i += BOX_LINES) {
      const part = lines.slice(i, i + BOX_LINES);
      // Blank lines at a break would only waste a box.
      while (part.length && !part[0]) part.shift();
      if (!part.length) continue;
      const more = i + BOX_LINES < lines.length;
      if (lines.length <= BOX_LINES) this.modals.push({ k: 'msg', text, who });
      else this.modals.push({ k: 'msg', text: part.join('\n'), more, who });
    }
  }

  /** A page to read, over as many boxes as it takes. A line that is only "\f" starts a new box. */
  private pageOut(title: string, lines: string[], heads: number[] = []): void {
    const PAGE = BOX_LINES - 1;
    const boxes: { text: string; head: boolean }[][] = [[]];
    lines.forEach((l, n) => {
      if (l === '\f') return void (boxes[boxes.length - 1].length && boxes.push([]));
      const wrapped = l ? wrap(l, 34) : [''];
      // A paragraph that would run over into the next box starts in it instead, if it fits there whole.
      if (boxes[boxes.length - 1].length + wrapped.length > PAGE && wrapped.length <= PAGE) boxes.push([]);
      for (const text of wrapped) {
        if (boxes[boxes.length - 1].length >= PAGE) boxes.push([]);
        boxes[boxes.length - 1].push({ text, head: heads.includes(n) });
      }
    });
    // A box with nothing in it but blank lines is no box at all.
    const full = boxes.filter((b) => b.some((l) => l.text));
    (full.length ? full : boxes.slice(0, 1)).forEach((box, i, all) => {
      // A page should not open on a blank line.
      while (box.length > 1 && !box[0].text) box.shift();
      const hs = box.flatMap((b, j) => (b.head ? [j] : []));
      this.modals.push({ k: 'page', title, lines: box.map((b) => b.text), more: i < all.length - 1, ...(hs.length ? { heads: hs } : {}) });
    });
  }

  private list(title: string, items: string[], pick: (i: number) => void, cancel = true): void {
    this.modals.unshift({ k: 'list', title, items, sel: 0, pick, cancel });
  }

  // -------------------------------------------------------------------------------------------
  // Time

  /** Advance by real milliseconds; runs as many fixed ticks as fit. */
  advance(ms: number): void {
    this.acc += Math.min(250, ms);
    while (this.acc >= TICK_MS) {
      this.acc -= TICK_MS;
      this.tick();
    }
  }

  tick(): void {
    this.uiTick++;
    if (this.modal) return;
    // Something opened from the menu or the bag is done with: back to where it was opened from.
    this.resume();
    if (this.modal) return;
    // Mid-conversation, with the last reply read: offer what else can be said.
    if (this.talkingTo && !this.queue.length && !this.errand) {
      this.openTalk();
      if (this.modal) return;
    }
    const [dx, dy] = this.direction();
    if (dx !== this.sent[0] || dy !== this.sent[1]) {
      this.queue.push({ t: 'move', dx, dy });
      this.sent = [dx, dy];
    }
    const intents = this.queue;
    this.queue = [];
    const first = this.sim.state.tick === 0;
    this.sim.step(intents);
    this.absorb();
    if (first && this.startHint) {
      this.noteText = this.startHint;
      this.noteUntil = this.uiTick + 160;
    }
  }

  /**
   * Somewhere in the picture the player has pointed at and is walking to: the paces still to
   * take, which way to keep on once they are taken (off the edge of the picture), and how long
   * the walk has lasted and made no headway.
   */
  private bound: {
    x: number; y: number; paces: Pace[]; i: number; on: [number, number] | null; ticks: number; stuck: number; lastX: number; lastY: number; careful?: boolean;
    /** The door the walk is for, by its place in the room's list, and whether it began on that door's threshold. */
    door?: number; from?: boolean;
    /** Asked for by a typed line, which is not answered until the walk is over. */
    typed?: boolean;
  } | null = null;

  /**
   * Walk to a point in the picture, round whatever is in the way, or as near as the ground
   * allows. Pointing at the edge of the picture walks off it. Doors, and ground where something
   * happens to whoever steps on it, are only walked into when they are what was pointed at.
   */
  walkTo(x: number, y: number, typed = false, doorAt?: number, side?: 'n' | 's' | 'e' | 'w'): void {
    if (this.modal) return;
    this.errand = null;
    const sc = this.sim.scene();
    const p = this.sim.p;
    const ways: Record<string, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
    const on: [number, number] | null = side ? ways[side] : x < 12 ? [-1, 0] : x > PW - 13 ? [1, 0] : y >= PH - 7 ? [0, 1] : y <= sc.walkTop + 3 ? [0, -1] : null;
    // Pointing anywhere on a door means its threshold.
    const doors = this.sim.room.doors ?? [];
    // (A walk off one side, though, goes by the doors and not into them.)
    const at = doorAt ?? (side ? -1 : doors.findIndex((d) => x >= d.x0 - 6 && x <= d.x1 + 6 && y >= d.y0 - 40 && y <= d.y1 + 4));
    const door = doors[at];
    if (door) [x, y] = [Math.round((door.x0 + door.x1) / 2), Math.round((door.y0 + door.y1) / 2)];
    const from = !!door && p.x >= door.x0 && p.x <= door.x1 && p.y >= door.y0 && p.y <= door.y1;
    this.bound = { x, y, paces: [], i: 0, on: door ? null : on, ticks: 0, stuck: 0, lastX: p.x, lastY: p.y, typed, ...(door ? { door: at, from } : {}) };
    this.plan();
  }

  /** The door a point in the picture is on: anywhere on its leaf or its threshold. */
  private doorAt(x: number, y: number): DoorDef | undefined {
    return (this.sim.room.doors ?? []).find((d) => x >= d.x0 - 6 && x <= d.x1 + 6 && y >= d.y0 - 40 && y <= d.y1 + 4);
  }

  /**
   * Who or what is drawn at a point in the picture. Somebody comes before a door they stand in
   * front of, and a door before the things about it, so that pointing at a door still goes
   * through it. Scenery that can be seen from anywhere (snow, sky, the far trees) is nothing to
   * point at: its place in the picture is only somewhere to hang its description. Nor is
   * anything in the dark.
   */
  private under(x: number, y: number): Pointed | null {
    const sim = this.sim;
    const c = this.content;
    if (sim.isDark()) return null;
    // People, and creatures that mean harm, by the room their figures take up: the nearest, if figures overlap.
    let who: ActorState | null = null;
    for (const a of sim.rs.actors) {
      const spec = a.kind === 'npc' ? c.chars[a.ref]?.spec : hostile(sim, a) ? c.enemies[a.ref]?.spec : undefined;
      if (!spec) continue;
      const four = !!spec.body && spec.body !== 'human';
      const size = spec.size ?? 1;
      if (Math.abs(x - a.x) > (four ? 14 : 10) * size || y > a.y + 4 || y < a.y - (four ? 24 : 40) * size) continue;
      if (!who || Math.abs(x - a.x) < Math.abs(x - who.x)) who = a;
    }
    if (who?.kind === 'npc') {
      const def = c.chars[who.ref];
      return { k: 'talk', label: `${def.name}에게 말 걸기`, line: `talk to ${def.nouns[0]}`, x: who.x, y: who.y, d: 48 };
    }
    // Some are named with their article ("the Greyback"), and most are not ("wolf").
    if (who) return { k: 'fight', label: fixJosa(`${c.enemies[who.ref].name.replace(/^the /, '')}와(과) 싸우기`), foe: who };
    if (this.doorAt(x, y)) return null;
    // Things: a small picture is itself the mark; anything else is taken to stand on its spot, a
    // little taller than it is wide. Of two that overlap, the smaller is meant: the book, not the table.
    const things = sim.things();
    let best: { t: (typeof things)[number]; hw: number } | null = null;
    for (const t of things) {
      const reach = t.reach ?? 30;
      if (reach > 100) continue;
      const icon = t.icon ? ICONS[t.icon] : undefined;
      const hw = icon ? (icon.w >> 1) + 4 : Math.max(8, Math.min(14, Math.round(reach / 3)));
      const top = icon ? icon.h + (t.lift ?? 0) + 4 : hw * 2 + 4;
      if (Math.abs(x - t.x) > hw || y > t.y + 5 || y < t.y - top) continue;
      if (!best || hw < best.hw) best = { t, hw };
    }
    if (!best) return null;
    const t = best.t;
    // A word for it that means this thing and no other here.
    const noun = t.nouns.find((w) => things.find((o) => o.nouns.includes(w)) === t) ?? t.nouns[0];
    const at = { x: t.x, y: t.y, d: t.reach ?? 30 };
    return t.take ? { k: 'take', label: `${koLabel(noun)} 가져가기`, line: `take ${noun}`, ...at } : { k: 'look', label: `${koLabel(noun)} 살펴보기`, line: `look at ${noun}`, ...at };
  }

  /** What pointing at this spot in the picture would do, in a few words; null where it would only walk there. */
  aim(x: number, y: number): string | null {
    return this.modal ? null : this.under(x, y)?.label ?? null;
  }

  /**
   * The player has pointed at a spot in the picture (a click, a tap). On somebody: walk over and
   * talk to them. On a thing: walk over and take it, or look at it if it is not to be taken. On
   * something that means harm: strike if it is within the blow, and otherwise close with it.
   * Anywhere else it is `walkTo`: bare ground, a door, the way off the edge of the picture.
   */
  point(x: number, y: number): void {
    if (this.modal) return;
    const at = this.under(x, y);
    if (!at) return this.walkTo(x, y);
    if (at.k === 'fight') {
      // The arc of a swing, as the fight reckons it. With a bow, anything ahead and level is in range.
      const p = this.sim.p;
      const [dx, dy] = [at.foe.x - p.x, at.foe.y - p.y];
      const far = p.weapon && this.content.items[p.weapon]?.kind === 'bow' ? PW : 28;
      const inArc =
        p.dir === 'right' ? dx > -4 && dx < far && Math.abs(dy) <= 8
        : p.dir === 'left' ? dx < 4 && dx > -far && Math.abs(dy) <= 8
        : p.dir === 'down' ? dy > -3 && dy < far / 2 && Math.abs(dx) <= 15
        : dy < 3 && dy > -far / 2 && Math.abs(dx) <= 15;
      if (inArc) this.queue.push({ t: 'attack' });
      // Walking at it turns the player to face it, and the next click strikes.
      else this.walkTo(Math.round(at.foe.x), Math.round(at.foe.y));
    } else if (at.k === 'look') {
      // Looking is done from where one stands, so nothing would walk the player over for it.
      // That is done here, and the look is taken on arriving, with the thing in reach to be tried.
      this.bound = this.errand = null;
      this.tries = 0;
      if (this.sim.within(at.x, at.y, at.d)) this.queue.push({ t: 'say', line: at.line });
      else this.goFor(at);
    } else this.send(at.line);
  }

  /**
   * A typed line waiting on a walk: what was typed, how near to its object the player must come,
   * and how many times the walk has been tried.
   */
  private errand: { line: string; x: number; y: number; d: number } | null = null;
  private tries = 0;

  /** True while the player is being walked over to something a typed line named. */
  get busy(): boolean {
    return !!this.errand || !!this.bound?.typed;
  }

  /**
   * The simulation says a typed line needs the player nearer to something. Walk there, round
   * whatever is in the way and without treading on anything that bites, and send the line again
   * on arriving. If there is no getting nearer, or it has been tried twice (whoever it is keeps
   * moving off), the line is sent as it stands, and gets the plain answer.
   */
  private goFor(e: { x: number; y: number; d: number; line: string }): void {
    const p = this.sim.p;
    this.errand = null;
    // Something chosen from the bag that means walking somewhere is not followed by the bag again.
    this.after = this.after.filter((a) => a.to !== 'bag');
    if (this.tries < 2) {
      this.bound = { x: Math.round(e.x), y: Math.round(e.y), paces: [], i: 0, on: null, ticks: 0, stuck: 0, lastX: p.x, lastY: p.y, careful: true };
      this.plan();
      if (this.bound.paces.length) {
        this.tries++;
        this.errand = { line: e.line, x: e.x, y: e.y, d: e.d };
        return;
      }
      this.bound = null;
    }
    this.queue.push({ t: 'say', line: e.line });
  }

  /** The walk a typed line asked for is over: send the line again from here. */
  private arrive(): void {
    const e = this.errand;
    this.errand = null;
    this.bound = null;
    if (e) this.queue.push({ t: 'say', line: e.line, afoot: true });
  }

  /** Where a pointed-at walk will end, while one is under way: so the picture can mark the spot. */
  get heading(): { x: number; y: number } | null {
    const b = this.bound;
    const end = b?.paces[b.paces.length - 1];
    return b && end && b.i < b.paces.length ? { x: end.x, y: end.y } : null;
  }

  private plan(): void {
    const b = this.bound!;
    const room = this.sim.room;
    const p = this.sim.p;
    // Ground that does something when stepped on is kept off, unless it is where the walk is going or already stands.
    const holds = (z: { x0: number; y0: number; x1: number; y1: number }, x: number, y: number): boolean => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1;
    // A walk the player pointed out may end on such ground. One made on their behalf never sets
    // foot on a threshold, nor on ground that would do something to them as things now stand.
    const live = (id: string): boolean => (room.rules ?? []).some((r) => r.zone === id && all(this.sim, r.if));
    const shut = b.careful
      ? [...(room.doors ?? []), ...(room.zones ?? []).filter((z) => live(z.id))].filter((z) => !holds(z, p.x, p.y))
      : [...(room.doors ?? []), ...(room.zones ?? [])].filter((z) => !holds(z, b.x, b.y) && !holds(z, p.x, p.y));
    b.paces = routeTo(this.sim.scene(), p.x, p.y, b.x, b.y, shut.length ? (x, y) => shut.some((z) => holds(z, x, y)) : undefined);
    b.i = 0;
  }

  private direction(): [number, number] {
    const h = this.held;
    const keys: [number, number] = [(h.has('ArrowRight') ? 1 : 0) - (h.has('ArrowLeft') ? 1 : 0), (h.has('ArrowDown') ? 1 : 0) - (h.has('ArrowUp') ? 1 : 0)];
    const b = this.bound;
    if (b) {
      const p = this.sim.p;
      b.stuck = p.x === b.lastX && p.y === b.lastY ? b.stuck + 1 : 0;
      [b.lastX, b.lastY] = [p.x, p.y];
      // A key takes over at once; and a walk that has gone on far too long is given up.
      if (keys[0] || keys[1] || this.tapDir[0] || this.tapDir[1] || ++b.ticks > 600) this.bound = this.errand = null;
      // Near enough for what was typed, with something to spare (whoever it is may shift): no need to tread on its toes.
      else if (this.errand && this.sim.within(this.errand.x, this.errand.y, Math.min(this.errand.d - 4, this.errand.d * 0.8))) this.arrive();
      else {
        // Knocked off the way (a blow, a swing, a raised guard): find it again from here.
        const at = b.i ? b.paces[b.i - 1] : null;
        if (at && (Math.abs(p.x - at.x) > 0.5 || Math.abs(p.y - at.y) > 0.5)) this.plan();
        const pace = b.paces[b.i++];
        if (pace) return [pace.dx, pace.dy];
        // Arrived. At the edge of the picture, keep on until it gives way or will not.
        if (b.on && b.stuck <= 6) return b.on;
        if (this.errand) this.arrive();
        // At a door and not through it: it was already underfoot, or it has opened since it was
        // stepped on. Either way, on through it (or be told it is shut, if that was asked for).
        if (b.door !== undefined) {
          const d = this.sim.room.doors?.[b.door];
          if (d && (b.from || all(this.sim, d.if))) this.queue.push({ t: 'through', door: b.door });
        }
        this.bound = null;
      }
    }
    if (this.settings.tapToWalk) return this.tapDir;
    return keys;
  }

  /** Turn simulation events into boxes and sounds. */
  private absorb(): void {
    for (const e of this.sim.drain()) {
      if (e.t === 'say') {
        // News that keeps is not told in the middle of a fight: a word of it under the picture, the rest after.
        if (e.idle && this.pressed()) {
          this.waiting.push(e.text);
          this.noteText = e.text.split('\n')[0];
          this.noteUntil = this.uiTick + 70;
        } else this.message(e.text, e.who);
      }
      else if (e.t === 'talk') {
        // A new conversation starts at the top of its menu, wherever the last one was left.
        if (this.talkingTo !== e.char) this.talkLast = null;
        this.talkingTo = e.char;
      } else if (e.t === 'approach') this.goFor(e);
      else if (e.t === 'walk') this.walkTo(e.x, e.y, true, e.door, e.side);
      else if (e.t === 'note') {
        this.noteText = e.text;
        // Long enough to read: hints are a sentence, not a word.
        this.noteUntil = this.uiTick + Math.max(70, e.text.length * 4);
      }
      else if (e.t === 'page') this.pageOut(e.title, e.lines, e.heads);
      else if (e.t === 'map') this.modals.push({ k: 'map', dx: 0, dy: 0 });
      else if (e.t === 'sound') this.settings.sound && this.sounds.push(e.id);
      else if (e.t === 'room') {
        this.talkingTo = null;
        this.bound = this.errand = null;
        // Not at the very start: a new game must not overwrite, or pose as, a game in progress.
        if (this.sim.state.tick > 0) {
          this.save('auto', true);
          // And a second, kept from the last place nothing was hunting you: a way back out of a
          // fight that was lost before it began.
          if (!this.sim.rs.actors.some((a) => hostile(this.sim, a))) this.save('safe', true);
        }
        this.noteText = this.sim.room.name;
        this.noteUntil = this.uiTick + 60;
        // Going through a door halts the walk: the key must be pressed again to move on.
        if (!this.sim.p.mdx && !this.sim.p.mdy) {
          this.held.clear();
          this.tapDir = [0, 0];
          this.sent = [0, 0];
        }
      }
      else if (e.t === 'died') {
        this.talkingTo = null;
        this.bound = this.errand = null;
        this.after = [];
        this.message(e.text);
        this.modals.push({
          k: 'list', title: this.sim.text('deathPrompt'), items: ['저장된 게임 불러오기', '처음부터 다시'], sel: 0, cancel: false,
          pick: (i) => (i === 0 ? this.restoreMenu(true) : this.restart()),
        });
      } else if (e.t === 'won') this.message(e.text);
    }
    // With nothing pressing: whatever news was kept back, and any level earned meanwhile. Neither
    // is worth being bitten for, and a level chosen by a key meant for a wolf is not chosen at all.
    const calm = !this.pressed();
    if (calm && !this.sim.p.dead) for (const text of this.waiting.splice(0)) this.message(text);
    if (calm && this.sim.p.pendingLevels > 0 && !this.modals.some((m) => m.k === 'list')) {
      const pools = ['hp', 'mp', 'sp'] as const;
      this.modals.push({
        k: 'list', title: `더 강해졌다: 레벨 ${this.sim.p.level - this.sim.p.pendingLevels + 1}. 무엇을 올리겠는가?`,
        items: ['체력', '마나', '기력'], sel: 0, cancel: false,
        pick: (i) => this.queue.push({ t: 'level', pool: pools[i] }),
      });
    }
    // Arriving in a room stops the walk, so a held key does not carry the player straight through.
    if (this.modal) this.held.clear();
  }

  // -------------------------------------------------------------------------------------------
  // Keys

  keyDown(key: string): boolean {
    const m = this.modal;
    if (m) {
      if (m.k === 'list') {
        if (key === 'ArrowUp') m.sel = (m.sel + m.items.length - 1) % m.items.length;
        else if (key === 'ArrowDown') m.sel = (m.sel + 1) % m.items.length;
        else if (key === 'Enter') {
          this.modals.shift();
          m.pick(m.sel);
        } else if (key === 'Escape' && m.cancel) {
          this.modals.shift();
          m.onCancel?.();
        }
      } else if (m.k === 'map' && key.startsWith('Arrow')) {
        // Look about the map, as far as the country known so far: the place under the cursor is named below it.
        const [x0, y0, x1, y1] = this.mapBounds();
        m.dx = Math.max(x0, Math.min(x1, m.dx + (key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0)));
        m.dy = Math.max(y0, Math.min(y1, m.dy + (key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0)));
      } else if (key === 'Enter' || key === 'Escape' || key === ' ' || (m.k === 'msg' && m.any)) this.modals.shift();
      // The last box closed: back to the menu or the bag it was opened from, if it was, and nothing is still to come.
      if (!this.modal) this.resume();
      return true;
    }
    if (key.startsWith('Arrow')) {
      if (this.settings.tapToWalk) {
        const d: [number, number] = key === 'ArrowLeft' ? [-1, 0] : key === 'ArrowRight' ? [1, 0] : key === 'ArrowUp' ? [0, -1] : [0, 1];
        this.tapDir = d[0] === this.tapDir[0] && d[1] === this.tapDir[1] ? [0, 0] : d;
      } else this.held.add(key);
      return true;
    }
    // Function keys, after the fashion of the old typing adventures.
    if (key === 'F1') this.pageOut('플레이 방법', this.sim.text('help').split('\n'));
    else if (key === 'F2') {
      const on = !(this.settings.music || this.settings.sound);
      this.settings.music = this.settings.sound = on;
      this.store.set('thanes-quest:settings', JSON.stringify(this.settings));
      this.noteText = on ? '소리 켜짐.' : '소리 꺼짐.';
      this.noteUntil = this.uiTick + 50;
    } else if (key === 'F3') this.input = this.last.slice(0, MAX_INPUT);
    else if (key === 'F4') this.queue.push({ t: 'say', line: 'map' });
    else if (key === 'Control') this.queue.push({ t: 'attack' });
    else if (key === 'Shift') this.queue.push({ t: 'block', on: true });
    // Space on an empty line is a second attack key, for keyboards where Ctrl+arrow is taken.
    else if (key === ' ' && !this.input) this.queue.push({ t: 'attack' });
    else if (key === 'Tab') this.bag();
    else if (key === 'Escape') this.menu();
    else if (key === 'Enter') this.submit(this.input || this.last);
    else if (key === 'Backspace') this.input = this.input.slice(0, -1);
    // A digit on an empty line is the offer of that number (1 to 9, then 0 for the tenth), and
    // never the start of a line: a number pressed a moment late would otherwise sit on the line
    // and quietly turn every number after it into typing. Further along a line it is only a digit.
    else if (this.digits && !this.input && key.length === 1 && key >= '0' && key <= '9') {
      const offer = this.suggest()[(Number(key) + 9) % 10];
      if (offer) this.submit(offer.line);
    }
    else if (key.length === 1 && this.input.length < MAX_INPUT) this.input += key;
    else return false;
    return true;
  }

  keyUp(key: string): void {
    this.held.delete(key);
    if (key === 'Shift') this.queue.push({ t: 'block', on: false });
  }

  /** Forget held keys, for when the window loses focus. */
  release(): void {
    this.held.clear();
  }

  /** Stop the world while the player is looking elsewhere: it is a poor time to be bitten. */
  pause(): void {
    this.held.clear();
    this.tapDir = [0, 0];
    if (this.modal || this.sim.p.dead || this.sim.state.tick === 0) return;
    this.modals.unshift({ k: 'msg', text: this.sim.text('paused'), any: true });
  }

  /** A typed line. A few commands belong to the player's side and never reach the simulation. */
  submit(line: string): void {
    this.input = '';
    if (!line.trim()) return;
    this.last = line;
    const r = this.sim.parser.parse(line);
    const verb = r.ok ? r.verb : '';
    if (verb === 'save') this.saveMenu();
    else if (verb === 'restore') this.restoreMenu(false);
    else if (verb === 'restart') this.confirmRestart();
    else if (verb === 'help') this.pageOut('플레이 방법', this.sim.text('help').split('\n'));
    else if (verb === 'quit') this.menu();
    else if (verb === 'inventory' && r.ok && !r.nouns.length) this.bag();
    else this.send(line);
  }

  /** Send a line to the world, as typed. */
  private send(line: string): void {
    // A new line drops whatever walk the last one was waiting on.
    this.bound = this.errand ? null : this.bound;
    this.errand = null;
    this.tries = 0;
    this.queue.push({ t: 'say', line, afoot: true });
  }

  /**
   * Things worth doing right here, as ready-made commands: who to talk to, what to pick up or
   * examine, which spells and words are to hand. They are shown as buttons: by the picture where
   * there is a keyboard (the first ten answer to the digit keys), above the pad on a touch screen.
   *
   * What belongs to this spot comes first, then the runewords, then what can be done anywhere.
   * If there are more than will fit it is the last of those that go unshown, and never a word
   * that a story may be waiting on.
   */
  suggest(): { label: string; line: string }[] {
    if (this.modal) return [];
    const sim = this.sim;
    const p = sim.p;
    const c = this.content;
    const out: { label: string; line: string }[] = [];
    const dist = (x: number, y: number): number => Math.hypot(p.x - x, (p.y - y) * 2);
    const who = sim.rs.actors
      .filter((a) => a.kind === 'npc' && c.chars[a.ref] && dist(a.x, a.y) <= 48)
      .sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y))[0];
    if (who) out.push({ label: `${c.chars[who.ref].name}에게 말 걸기`, line: `talk to ${c.chars[who.ref].nouns[0]}` });
    const close = sim.things().filter((t) => dist(t.x, t.y) <= (t.reach ?? 30));
    // A thing to be tried with something carried ("lay the log on the hearth") is offered only to whoever carries it.
    const lacking = (line: string): boolean => {
      const r = sim.parser.parse(line);
      return r.ok && r.nouns.some((n) => !sim.things().some((t) => t.nouns.includes(n)) && Object.values(c.items).some((it) => it.nouns.includes(n)) && !Object.keys(p.inv).some((id) => c.items[id]?.nouns.includes(n)));
    };
    for (const t of close) {
      if (t.take) out.push({ label: `${koLabel(t.nouns[0])} 가져가기`, line: `take ${t.nouns[0]}` });
      for (const line of t.try ?? []) if (!lacking(line)) out.push({ label: line[0].toUpperCase() + line.slice(1), line });
    }
    for (const w of Object.values(c.words)) if (p.words.includes(w.id) && !(p.cd[w.id] > 0)) out.push({ label: w.verb.toUpperCase(), line: w.verb });
    out.push({ label: '주위 살펴보기', line: 'look' });
    if (sim.room.scene.kind === 'outdoor') out.push({ label: '지도', line: 'map' });
    if (p.inv.potion && p.hp < p.maxHp * 0.6) out.push({ label: '물약 마시기', line: 'drink potion' });
    if (p.inv.torch && sim.isDark()) out.push({ label: '횃불 켜기', line: 'light torch' });
    const spare = p.other && p.inv[p.other] ? c.items[p.other] : null;
    if (spare) out.push({ label: `${spare.name} 준비하기`, line: 'swap' });
    for (const [id, n] of Object.entries(p.inv)) {
      // Things carried that are worth using where the player now stands, as the game's data marks them.
      const it = c.items[id];
      if (n > 0 && it?.offer && all(sim, it.offer.if)) out.push({ label: it.offer.label, line: it.offer.say });
    }
    for (const id of p.spells) out.push({ label: `${c.spells[id]?.name ?? id} 시전`, line: `cast ${id}` });
    const seen = new Set<string>();
    return out.filter((o) => !seen.has(o.line) && seen.add(o.line)).slice(0, OFFERS);
  }

  private fightUntil = 0;
  /** News kept back until the fight is over. */
  private waiting: string[] = [];

  /** Is a fight on: something hostile close by, or in the middle of a blow? */
  private pressed(): boolean {
    const sim = this.sim;
    const p = sim.p;
    return !p.dead && sim.rs.actors.some((a) => hostile(sim, a) && (a.ai.atk > 0 || Math.hypot(a.x - p.x, (a.y - p.y) * 2) < 120));
  }

  /** Which tune suits this moment: the title, a fight, or wherever the player is standing. */
  musicCue(): string {
    const { cues } = this.content;
    if (this.modals.some((m) => m.k === 'list' && m.banner)) return cues.title;
    const sim = this.sim;
    const p = sim.p;
    // A fight is on while something hostile is close or mid-swing; the music lingers a little after.
    if (this.pressed()) this.fightUntil = this.uiTick + 70;
    if (this.uiTick < this.fightUntil) return cues.boss && sim.rs.actors.some((a) => hostile(sim, a) && this.content.enemies[a.ref]?.ai === 'boss') ? cues.boss : cues.battle;
    // Out of doors after dark, the night has its own music.
    if (cues.night && sim.room.scene.kind === 'outdoor' && sim.daylight() < 0.3) return cues.night;
    return sim.room.music ?? cues.fallback;
  }

  /** The conversation menu: what this character can be asked, sold or given right now. */
  private openTalk(): void {
    const id = this.talkingTo!;
    const def = this.content.chars[id];
    const options = (def?.menu ?? []).filter((m) => all(this.sim, m.if));
    if (!def || !options.length || !this.sim.isNear(id, 60)) {
      this.talkingTo = null;
      return;
    }
    const leave = (): void => void (this.talkingTo = null);
    // The cursor waits on the row just chosen. If that row has gone (a thing bought, a thing
    // given), it waits on Farewell: never on whatever slid up into its place, which may cost silver.
    const at = this.talkLast === null ? 0 : options.findIndex((o) => o.label === this.talkLast);
    this.modals.push({
      k: 'list', title: def.name, items: [...options.map((o) => this.sim.fill(o.label)), '작별 인사'], sel: at < 0 ? options.length : at, cancel: true, onCancel: leave,
      pick: (i) => {
        this.talkLast = options[i]?.label ?? null;
        if (i >= options.length) leave();
        else {
          // Standing near enough to talk is not always near enough to trade: the row walks the last step itself.
          this.tries = 0;
          this.queue.push({ t: 'say', line: options[i].say, afoot: true });
        }
      },
    });
  }

  // -------------------------------------------------------------------------------------------
  // Menus and saving

  /** Where closing what is open will lead: back to the menu, or straight back to the game. */
  get backToMenu(): boolean {
    return this.after.length > 0;
  }

  /** Places to come back to once every box is closed, the most recent last. */
  private after: Return[] = [];

  /**
   * With every box closed and nothing still to come of what was chosen: go back to the menu or
   * the bag that it was chosen from. A walk that something chosen sent the player on comes first.
   */
  private resume(): void {
    if (this.modal || this.queue.length || this.errand) return;
    const back = this.after.pop();
    if (back?.to === 'menu') this.menu(back.sel);
    // Not if what was done took the player somewhere else.
    else if (back?.to === 'bag' && back.room === this.sim.state.room && !this.sim.p.dead) this.bag(back.item);
  }

  private menu(sel = 0): void {
    // The menu is the bottom of everything: nothing opened before it is waiting to be gone back to.
    this.after = [];
    const rows: [string, () => void][] = [
      ['돌아가기', () => {}],
      ['가방', () => this.bag()],
      ['지도', () => this.send('map')],
      ['일지', () => this.send('journal')],
      ['인물', () => this.send('skills')],
      ['위업', () => this.send('deeds')],
      ['저장하기', () => this.saveMenu()],
      ['불러오기', () => this.restoreMenu(false)],
      ['설정', () => this.settingsMenu()],
      ['플레이 방법', () => this.pageOut('플레이 방법', this.sim.text('help').split('\n'))],
      ['처음부터 다시', () => this.confirmRestart()],
    ];
    this.list(this.content.title, rows.map((r) => r[0]), (i) => {
      // Whatever a row opens comes back here when it is closed, with the cursor on that row.
      if (i > 0) this.after.push({ to: 'menu', sel: i });
      rows[i][1]();
    });
    const m = this.modals[0];
    if (m.k === 'list') {
      m.sel = Math.max(0, Math.min(rows.length - 1, sel));
      m.front = true;
    }
  }

  /** What is carried, a row for each kind of thing; choosing one shows it, and what can be done with it. */
  bag(item?: string): void {
    const sim = this.sim;
    const rows = bagRows(sim);
    const close = this.backToMenu ? '뒤로' : '닫기';
    // How full the pack is, beside the silver: a full pack is worth knowing about before a fight, not after.
    const load = `무게: ${loadText(sim)}${sim.load() > sim.limit() ? ' (너무 무거움)' : ''}`;
    const title = `가방\n${rows.length ? '' : sim.text('emptyHanded') + '\n'}${load.padEnd(18)}은화: ${sim.p.gold}`;
    // What lies on the ground here, and what is kept in a chest here, can be gone through from the bag too.
    const ground = groundRows(sim);
    const store = storeHere(sim);
    const kept = store ? storedRows(sim) : [];
    const extra: [string, () => void][] = [];
    if (ground.length) extra.push([`여기 바닥에 있음 (${ground.reduce((n, g) => n + g.n, 0)})`, () => this.heap('ground')]);
    if (store) extra.push([`${koLabel(store.nouns[0])} 안에 있음 (${kept.reduce((n, g) => n + g.n, 0)})`, () => this.heap('store')]);
    this.modals.unshift({
      k: 'list', title, lead: true, items: [...rows.map((r) => weighed(r.label, r.weight)), ...extra.map((e) => e[0]), close], cancel: true,
      sel: Math.max(0, item?.startsWith(':') ? rows.length + extra.findIndex((e) => (item === ':ground' ? e[0].startsWith('여기 바닥에') : e[0].includes('안에 있음'))) : rows.findIndex((r) => r.id === item)),
      pick: (i) => (rows[i] ? this.itemMenu(rows[i].id) : extra[i - rows.length]?.[1]()),
    });
  }

  /**
   * What lies on the ground here, or what is kept in the chest here: a row for each kind, and
   * choosing one takes it (one, or all of them) into the pack.
   */
  private heap(where: 'ground' | 'store'): void {
    const sim = this.sim;
    const rows = where === 'ground' ? groundRows(sim) : storedRows(sim);
    const store = storeHere(sim);
    const back = where === 'ground' ? ':ground' : ':store';
    const from = where === 'store' && store ? ` from ${store.nouns[0]}` : '';
    const title = where === 'ground' ? '여기 바닥에 있는 것' : `${koLabel(store?.nouns[0] ?? 'chest')} 안에 있는 것`;
    const empty = rows.length ? '' : `\n${sim.text(where === 'ground' ? 'nothingDown' : 'storeEmpty')}`;
    this.modals.unshift({
      k: 'list', title: `${title}${empty}\n무게: ${loadText(sim)}`, lead: true, items: [...rows.map((r) => weighed(r.label, r.weight)), '뒤로'], sel: 0, cancel: true,
      onCancel: () => this.bag(back),
      pick: (i) => {
        const r = rows[i];
        if (!r) return this.bag(back);
        // A word for it that nothing else lying there answers to.
        const nouns = this.content.items[r.id].nouns;
        const noun = nouns.find((w) => rows.every((o) => o.id === r.id || !this.content.items[o.id].nouns.includes(w))) ?? nouns[0];
        const acts = [{ label: '하나 가져가기', line: `take ${noun}${from}` }, ...(r.n > 1 ? [{ label: `${r.n}개 전부 가져가기`, line: `take all ${noun}${from}` }] : [])];
        this.modals.unshift({
          k: 'list', title: `${cap(r.label)}\n무게 ${sim.weight(r.id)}${r.n > 1 ? ' (하나당)' : ''}. 소지 무게: ${loadText(sim)}`, lead: true,
          items: [...acts.map((a) => a.label), '뒤로'], sel: 0, cancel: true,
          onCancel: () => this.heap(where),
          pick: (j) => {
            const a = acts[j];
            if (!a) return this.heap(where);
            // Back to the bag afterwards, to go on sorting.
            this.after.push({ to: 'bag', item: back, room: sim.state.room });
            this.send(a.line);
          },
        });
      },
    });
  }

  /** One thing from the bag: what it is, what it weighs, and the things that can be done with it. */
  private itemMenu(id: string): void {
    const sim = this.sim;
    const it = this.content.items[id];
    const acts = itemActions(sim, id);
    const n = sim.p.inv[id] ?? 0;
    const each = sim.weight(id);
    const weight = it?.keep ? '말할 만한 무게는 없다.' : each === 0 ? '거의 무게가 없다.' : `무게 ${each}${n > 1 ? ` (하나당, 전부 ${each * n})` : ''}.`;
    this.modals.unshift({
      k: 'list', title: `${cap(it?.name ?? id)}${n > 1 ? ` x${n}` : ''}\n${weight}${sim.onPerson(id) && n === 1 ? (sim.p.weapon === id || sim.p.shield === id ? ' 배낭이 아니라 손에 들고 있다.' : ' 배낭이 아니라 몸에 지니고 있다.') : ''}\n${it ? sim.lookOf(it) : ''}`, lead: true,
      items: [...acts.map((a) => a.label), '뒤로'], sel: 0, cancel: true,
      onCancel: () => this.bag(id),
      pick: (i) => {
        const a = acts[i];
        if (!a) return this.bag(id);
        // Something that is not used up by this comes back to the bag afterwards.
        if (!it?.consumed) this.after.push({ to: 'bag', item: id, room: sim.state.room });
        this.send(a.line);
      },
    });
  }

  /** How far the map's cursor may go, as offsets from where the player stands: the country known so far, and a step beyond. */
  private mapBounds(): [number, number, number, number] {
    const cells = chart(this.content, this.sim.state.flags, this.sim.state.room);
    const here = cells.find((c) => c.here) ?? { x: 0, y: 0 };
    const xs = cells.map((c) => c.x - here.x);
    const ys = cells.map((c) => c.y - here.y);
    return [Math.min(-1, ...xs) - 1, Math.min(-1, ...ys) - 1, Math.max(1, ...xs) + 1, Math.max(1, ...ys) + 1];
  }

  private settingsMenu(sel = 0): void {
    const s = this.settings;
    const flip = (k: 'music' | 'sound' | 'tapToWalk') => (i: number): void => {
      s[k] = !s[k];
      this.tapDir = [0, 0];
      this.store.set('thanes-quest:settings', JSON.stringify(s));
      // Back to the same row, so a setting can be flipped to and fro.
      this.settingsMenu(i);
    };
    const rows: [string, (i: number) => void][] = [
      [`음악: ${s.music ? '켜짐' : '꺼짐'}`, flip('music')],
      [`효과음: ${s.sound ? '켜짐' : '꺼짐'}`, flip('sound')],
      [`걷기: ${s.tapToWalk ? '탭으로 시작·정지' : '키를 누르고 있기'}`, flip('tapToWalk')],
      [
        `싸움: ${this.sim.state.flags.gentle ? '부드럽게' : '정정당당'}`,
        (i) => {
          // This one belongs to the game in progress, and is saved with it.
          const gentle = !this.sim.state.flags.gentle;
          this.sim.state.flags.gentle = gentle;
          this.queue.push({ t: 'ease', gentle });
          this.settingsMenu(i);
        },
      ],
      // Back to the menu these were opened from: closing them is enough.
      ['뒤로', () => {}],
    ];
    this.list('설정', rows.map((r) => r[0]), (i) => rows[i][1](i));
    const m = this.modals[0];
    if (m.k === 'list') m.sel = sel;
  }

  private read(slot: string): SaveFile | null {
    try {
      const f = JSON.parse(this.store.get(`thanes-quest:save:${slot}`) ?? 'null') as SaveFile | null;
      // Saves from an incompatible build, or pointing at a room that no longer exists, count as empty.
      const ok = f && f.v === 1 && f.state?.v === 1 && f.content === this.content.saveVersion && !!roomOf(this.content, f.state.room);
      return ok ? f : null;
    } catch {
      return null;
    }
  }

  save(slot: string, quiet = false): void {
    const st = this.sim.state;
    if (st.player.dead) return;
    const label = `${this.sim.room.name}, 점수 ${st.score}`;
    this.store.set(`thanes-quest:save:${slot}`, JSON.stringify({ v: 1, content: this.content.saveVersion, label, state: st } satisfies SaveFile));
    if (!quiet) this.message(this.sim.text('saved'));
  }

  restore(slot: string): boolean {
    const f = this.read(slot);
    if (!f) return false;
    this.fresh(f.state);
    return true;
  }

  private slotLabels(withAuto: boolean): { ids: string[]; labels: string[] } {
    const ids = withAuto ? ['auto', 'safe', ...SLOTS] : SLOTS;
    const names: Record<string, string> = { auto: '마지막 방', safe: '마지막 안전한 곳' };
    const labels = ids.map((id) => `${names[id] ?? id}: ${this.read(id)?.label ?? '비어 있음'}`);
    return { ids, labels };
  }

  private saveMenu(): void {
    const { ids, labels } = this.slotLabels(false);
    this.list('어느 칸에 저장할까?', [...labels, '뒤로'], (i) => i < ids.length && this.save(ids[i]));
  }

  private restoreMenu(afterDeath: boolean): void {
    const { ids, labels } = this.slotLabels(true);
    const back = (): void => {
      if (!afterDeath) return;
      // Dead players must choose again; there is no game to go back to.
      this.modals.push({
        k: 'list', title: this.sim.text('deathPrompt'), items: ['저장된 게임 불러오기', '처음부터 다시'], sel: 0, cancel: false,
        pick: (i) => (i === 0 ? this.restoreMenu(true) : this.restart()),
      });
    };
    this.list('어느 게임을 불러올까?', [...labels, '뒤로'], (i) => {
      if (i >= ids.length || !this.restore(ids[i])) {
        if (i < ids.length) this.message(this.sim.text('emptySlot'));
        back();
      }
    }, !afterDeath);
  }

  private confirmRestart(): void {
    this.list('처음부터 다시 시작할까?', ['아니오', '예'], (i) => i === 1 && this.restart());
  }

  restart(): void {
    this.fresh();
  }
}

