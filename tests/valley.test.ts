import { describe, expect, it } from 'vitest';
import { depthOf, kindAt, parseWild, roomOf, sights, wildId } from '../src/engine/frontier';
import { DAY_LENGTH } from '../src/engine/sim';
import { behaviours } from '../src/game/behaviours';
import { content } from '../src/game/content';
import { Bot, game, type } from './helpers';

/**
 * The valley: eight hand-made places with a screen of road between each and the next. The roads
 * are generated, and gentle; the country beyond them starts as hard as it always did.
 */
const f = content.frontier!;
const reach = f.valley!.reach;
const ring = (x: number, y: number): number => Math.max(Math.abs(x), Math.abs(y));
const places = Object.entries(f.grid).filter(([, [x, y]]) => ring(x, y) <= reach);
const roads: [string, number, number][] = [];
for (let y = -reach; y <= reach; y++) for (let x = -reach; x <= reach; x++) if (kindAt(content, x, y) === 'valley') roads.push([wildId(x, y), x, y]);
const SIDES = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] } as const;
const WORD = { n: '북쪽', s: '남쪽', e: '동쪽', w: '서쪽' } as const;
const placeAt = (x: number, y: number): string | undefined => places.find(([, at]) => at[0] === x && at[1] === y)?.[0];
const hostile = (kind: string): boolean => content.enemies[kind]?.ai !== 'prey';
// A creature with a lair of its own is as tough as it is, wherever its lair happens to be.
const haunt = new Set((f.haunts ?? []).map((h) => h.kind));

describe('the valley', () => {
  it('is eight places, five screens by five, with a road between every two', () => {
    // The south-east corner has nothing in it but road: the old watchtower stands out beyond the valley's mouth.
    expect(places.length).toBe(8);
    expect(roads.length).toBe(17);
    expect(f.grid.tower[1]).toBeGreaterThan(reach);
    // No place touches another: every way out of each is onto a road or the country beyond.
    for (const [id] of places)
      for (const to of Object.values(roomOf(content, id)!.exits ?? {})) expect(f.grid[to], `${id} -> ${to}`).toBeUndefined();
    // The barrow's mound still closes its north side.
    expect(roomOf(content, 'barrow')!.exits?.n).toBeUndefined();
  });

  it('can be walked from the village to every place in it by road, and back', () => {
    // As the map has it: by the exits, never leaving the valley.
    const seen = new Set(['village']);
    const queue = ['village'];
    while (queue.length) {
      const at = queue.shift()!;
      for (const to of Object.values(roomOf(content, at)!.exits ?? {})) {
        const cell = f.grid[to] ?? parseWild(to);
        if (!cell || ring(cell[0], cell[1]) > reach || seen.has(to)) continue;
        seen.add(to);
        queue.push(to);
      }
    }
    for (const [id] of places) expect(seen.has(id), id).toBe(true);
    for (const [id] of roads) expect(seen.has(id), id).toBe(true);
    // And on foot, as a new Thane with a sword would, dealing with what is on the road.
    const bot = new Bot(game('village', 160, 150));
    bot.sim.give('sword');
    bot.sim.give('potion', 4);
    bot.say('equip sword');
    const walked: string[] = [];
    for (const [id] of places) {
      if (id === 'village') continue;
      bot.travel(id);
      expect(bot.sim.state.room).toBe(id);
      walked.push(bot.sim.state.room);
      bot.travel('village');
    }
    expect(walked.length).toBe(7);
    // Never from one place straight into the next: there was always a road between.
    expect(Object.keys(bot.sim.state.flags).filter((k) => k.startsWith('seen.wild_')).length).toBeGreaterThanOrEqual(8);
  }, 60000);

  it('has nothing on its roads at night, and by day a single wolf at most', () => {
    let empty = 0;
    for (const [id] of roads) {
      const def = roomOf(content, id)!;
      const foes = (def.spawns ?? []).filter((s) => hostile(s.kind));
      expect(foes.length, id).toBeLessThanOrEqual(1);
      for (const s of foes) {
        expect(s.kind, id).toBe('wolf');
        expect(s.when, id).toBe('day');
        expect(s.level ?? 0, id).toBe(0);
      }
      if (!foes.length) empty++;
      // Walked into after dark, there is nothing there.
      const sim = game();
      sim.state.tick = Math.round(DAY_LENGTH * 0.68);
      expect(sim.daylight()).toBe(0);
      sim.enterRoom(id, 160, 140);
      expect(sim.rs.actors.filter((a) => a.kind === 'enemy' && hostile(a.ref)), id).toEqual([]);
      // Nor anything to loot, nor any of the wild's hand-written sights.
      expect((def.things ?? []).some((t) => t.id === 'cache' || t.id === 'bones'), id).toBe(false);
      expect(sights(content).has(id), id).toBe(false);
      expect(def.music, id).toBe(f.valley!.music);
    }
    // Roughly half the roads are empty, and the four into Hollowmere always are.
    expect(empty).toBeGreaterThanOrEqual(6);
    for (const id of ['wild_0_-1', 'wild_0_1', 'wild_1_0', 'wild_-1_0']) expect((roomOf(content, id)!.spawns ?? []).filter((s) => hostile(s.kind)), id).toEqual([]);
  });

  it('says on every road where its path leads, naming the place that lies each way', () => {
    for (const [id, x, y] of roads) {
      const def = roomOf(content, id)!;
      const beside = (Object.keys(SIDES) as (keyof typeof SIDES)[]).flatMap((side) => {
        const at = placeAt(x + SIDES[side][0], y + SIDES[side][1]);
        return at ? [[side, at] as const] : [];
      });
      if (beside.length) {
        for (const [side, at] of beside) expect(def.look, id).toContain(`${WORD[side]}으로 ${f.valley!.called[at]}`);
      } else {
        // A crossing: the places round it, each named with the way it lies.
        const round = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).flatMap(([dx, dy]) => (placeAt(x + dx, y + dy) ? [[dx, dy, placeAt(x + dx, y + dy)!] as const] : []));
        for (const [dx, dy, at] of round) {
          const way = `${dy < 0 ? '북' : '남'}${dx < 0 ? '서' : '동'}`;
          expect(def.look, id).toMatch(new RegExp(`${f.valley!.called[at]}[은는] ${way}쪽`));
        }
        // The empty corner of the valley has no place off any corner of it: its path says where it leads on to.
        if (!round.length) {
          const on = (Object.keys(SIDES) as (keyof typeof SIDES)[]).flatMap((side) => (placeAt(x + 2 * SIDES[side][0], y + 2 * SIDES[side][1]) ? [[side, placeAt(x + 2 * SIDES[side][0], y + 2 * SIDES[side][1])!] as const] : []));
          expect(on.length, id).toBeGreaterThan(0);
          for (const [side, at] of on) expect(def.look, id).toContain(`${WORD[side]}으로 ${f.valley!.called[at]}`);
        }
      }
      // Whatever it says, it says something: never a sentence with nothing in it.
      expect(def.look, id).not.toMatch(/\. \.|  /);
      // Looking at the path says the same.
      const sim = game(id, 160, 140);
      sim.rs.actors = [];
      const said = type(sim, 'look at the path')[0];
      for (const [, at] of beside) expect(said, id).toContain(f.valley!.called[at]);
    }
  });

  it('starts the country beyond it exactly as hard as it was', () => {
    // The roads are as gentle as anything near home, and difficulty is counted from their edge.
    for (const [, x, y] of roads) expect(depthOf(content, x, y)).toBe(0);
    for (let y = -6; y <= 6; y++)
      for (let x = -6; x <= 6; x++) {
        const r = ring(x, y);
        if (r <= reach || !kindAt(content, x, y)) continue;
        expect(depthOf(content, x, y)).toBe(r - reach);
        // What the first ring beyond the valley was before the roads were put in, it still is.
        const want = Math.max(0, r - reach - 1);
        // Whoever holds a pass through a march is a step tougher than the country round it, on purpose.
        const held = kindAt(content, x, y) === 'pass' ? 1 : 0;
        for (const s of roomOf(content, wildId(x, y))!.spawns ?? []) if (hostile(s.kind) && !haunt.has(s.kind)) expect(s.level, `${wildId(x, y)} ${s.kind}`).toBe(want + held);
      }
    // Just outside the valley there is only what is met near home.
    for (let y = -3; y <= 3; y++)
      for (let x = -3; x <= 3; x++) {
        if (ring(x, y) !== reach + 1 || !kindAt(content, x, y)) continue;
        const def = roomOf(content, wildId(x, y))!;
        const kind = kindAt(content, x, y)!;
        const near = new Set([...(f.life[kind]?.[0] ?? []), ...(f.life.night?.[0] ?? [])]);
        for (const s of def.spawns ?? []) if (hostile(s.kind) && !haunt.has(s.kind)) expect(near.has(s.kind), `${def.id} ${s.kind}`).toBe(true);
        expect((def.spawns ?? []).filter((s) => hostile(s.kind) && !haunt.has(s.kind) && s.when !== 'night').length, def.id).toBeLessThanOrEqual(2);
        expect(def.look, def.id).not.toContain(f.text.deep);
      }
    // Every sight stands at least as far beyond the valley as it asks to.
    for (const [id, s] of sights(content)) {
      const [x, y] = parseWild(id)!;
      expect(depthOf(content, x, y), s.id).toBeGreaterThanOrEqual(s.minDepth ?? 1);
    }
    // The Elder's first errand is to the first ring beyond the valley, as it always was.
    const sim = game('hall', 200, 122);
    behaviours.bountyOffer(sim, 'Marta');
    const [bx, by] = parseWild(String(sim.state.flags['bounty.room']))!;
    expect(depthOf(content, bx, by)).toBe(1);
  });

  it('keeps the dead out of it, and says the wild begins at its edge', () => {
    // The first step off a road into the country beyond is the first step off the map.
    const sim = game();
    sim.enterRoom('wild_0_1', 160, 140);
    expect(sim.drain().some((e) => e.t === 'note' && e.text === f.text.firstStep)).toBe(false);
    sim.enterRoom('wild_0_3', 160, 140);
    expect(sim.drain().some((e) => e.t === 'note' && e.text === f.text.firstStep)).toBe(true);
  });
});
