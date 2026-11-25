// What a Thane can carry: weight, the limit and what raises it, putting things down, keeping
// them in the chest at the inn, and games saved before any of it existed.

import { describe, expect, it } from 'vitest';
import { bagRows, groundRows, storedRows } from '../src/engine/commands';
import { homes, sights, wildId } from '../src/engine/frontier';
import { Renderer } from '../src/engine/render';
import { Shell, type Modal } from '../src/engine/shell';
import { Sim } from '../src/engine/sim';
import type { GameState } from '../src/engine/types';
import { behaviours } from '../src/game/behaviours';
import { content } from '../src/game/content';
import { game, type } from './helpers';

/** Fill the pack with wolf pelts until another would not go in. */
function fill(sim: Sim): void {
  while (sim.fits('pelt')) sim.give('pelt');
  while (sim.fits('potion')) sim.give('potion');
  sim.drain();
}

/** A game standing by somebody, with nothing about that bites. */
function by(room: string, who: string): Sim {
  const sim = game(room);
  sim.rs.actors = sim.rs.actors.filter((a) => a.kind === 'npc');
  const a = sim.rs.actors.find((x) => x.ref === who)!;
  sim.p.x = a.x;
  sim.p.y = a.y + 6;
  return sim;
}

/** The chest at the inn, within reach. */
function atChest(): Sim {
  const sim = game('inn');
  const chest = sim.things().find((t) => t.store)!;
  sim.p.x = chest.x + 8;
  sim.p.y = chest.y + 6;
  return sim;
}

describe('weight', () => {
  it('is given for every item; what a story needs weighs nothing, and silver nothing at all', () => {
    for (const it of Object.values(content.items)) {
      expect(it.weight, it.id).toBeGreaterThanOrEqual(0);
      if (it.keep) expect(it.weight, it.id).toBe(0);
    }
    for (const id of ['ember', 'ring', 'bottle', 'flint', 'amulet', 'glove', 'grain', 'log', 'ewe', 'toyhorse']) expect(content.items[id].keep, id).toBeTruthy();
    const sim = game();
    sim.p.gold = 5000;
    expect(sim.load()).toBe(0);
  });

  it('counts a stack per piece, and what is in hand or worn not at all', () => {
    const sim = game();
    sim.give('pelt', 3);
    expect(sim.load()).toBe(9);
    sim.give('sword');
    sim.give('mail');
    expect(sim.p.weapon).toBe('sword');
    expect(sim.load()).toBe(9);
    // A second weapon goes into the pack and weighs on it.
    sim.give('hatchet');
    expect(sim.load()).toBe(13);
    expect(type(sim, 'unequip')[0]).toBeTruthy();
    expect(sim.load()).toBe(19);
  });

  it('is told by WEIGH, of a thing or of the whole pack', () => {
    const sim = game();
    sim.give('pelt', 2);
    sim.give('ring');
    expect(type(sim, 'weigh pelts')[0]).toContain('전부 6이다');
    expect(type(sim, 'weigh the ring')[0]).toContain('내려놓지 않을 것이다');
    expect(type(sim, 'weigh my pack')[0]).toBe(`배낭에는 들 수 있는 ${sim.limit()} 중 6이 들어 있다.`);
    expect(type(sim, 'how heavy is my bag')[0]).toContain('중 6이 들어 있다');
  });
});

describe('the limit', () => {
  it('lets a new Thane carry what the first hour gives without a second thought', () => {
    const sim = game();
    for (const id of ['hatchet', 'potion', 'potion', 'pelt', 'pelt', 'tomeFlame', 'bow', 'cheese', 'sword']) sim.give(id);
    expect(sim.load()).toBeLessThan(sim.limit());
  });

  it('refuses a pick-up that will not fit, says so and what would help, and leaves the thing where it is', () => {
    const sim = game('village', 172, 126);
    sim.give('sword');
    fill(sim);
    const said = type(sim, 'take hatchet');
    expect(said[0]).toContain('손도끼까지는 들어가지 않는다');
    expect(said[0]).toMatch(/팔거나|내려놓거나|궤짝/);
    expect(sim.p.inv.hatchet).toBeUndefined();
    expect(sim.things().some((t) => t.id === 'hatchet')).toBe(true);
    // Make room, and it can be had.
    type(sim, 'drop 2 pelts');
    expect(type(sim, 'take hatchet')[0]).toContain('손도끼');
    expect(sim.p.inv.hatchet).toBe(1);
  });

  it('leaves what a fallen foe carried where it fell, to be fetched once there is room', () => {
    const sim = game('pinewood');
    fill(sim);
    const wolf = sim.rs.actors.find((a) => a.ref === 'wolf')!;
    sim.rs.actors = [wolf];
    const before = sim.p.inv.pelt;
    // A wolf is killed until one drops its pelt.
    for (let i = 0; i < 40 && !sim.pile('pelt'); i++) {
      wolf.hp = 1;
      wolf.act = 'idle';
      sim.p.x = wolf.x - 14;
      sim.p.y = wolf.y;
      sim.p.dir = 'right';
      sim.step([{ t: 'attack' }]);
      for (let t = 0; t < 8; t++) sim.step();
    }
    const pile = sim.pile('pelt')!;
    expect(pile).toBeTruthy();
    expect(sim.p.inv.pelt).toBe(before);
    expect(Math.abs(pile.x - wolf.x)).toBeLessThan(16);
    // Saved and walked away from, it is still there.
    const saved = JSON.parse(JSON.stringify(sim.state)) as GameState;
    const back = new Sim(content, { saved, behaviours });
    back.enterRoom('village', 160, 150);
    back.enterRoom('pinewood', pile.x, pile.y + 4);
    expect(back.pile('pelt')?.n).toBe(pile.n);
    type(back, 'drop 3 pelts');
    const n0 = back.pile('pelt')!.n;
    const got = type(back, 'take pelt');
    expect(got[0]).toContain('늑대 가죽');
    expect(back.pile('pelt')?.n ?? 0).toBe(n0 - 1);
  });

  it('keeps the silver and the loot of a chest apart: the silver always, what will not fit on the ground beside it', () => {
    const sim = game('camp');
    sim.rs.actors = [];
    fill(sim);
    const chest = sim.things().find((t) => t.id === 'chest')!;
    sim.p.x = chest.x + 10;
    sim.p.y = chest.y + 6;
    const silver = sim.p.gold;
    type(sim, 'open chest');
    expect(sim.p.gold).toBe(silver + 20);
    // The grain is the farmer's whole spring: it always goes in.
    expect(sim.p.inv.grain).toBe(1);
    expect(sim.pile('potion')?.n).toBe(1);
  });

  it('cannot be raised past by buying: a seller will not sell what will not fit, and keeps the silver', () => {
    const sim = by('village', 'odd');
    // Wearing something better, so that the mail would go in the pack.
    sim.give('bearcloak');
    fill(sim);
    sim.p.gold = 100;
    const said = type(sim, 'buy mail');
    expect(said[0]).toContain('노새는 안 팔아');
    expect(sim.p.gold).toBe(100);
    expect(sim.p.inv.mail).toBeUndefined();
    // A blade bought goes into the hand, so it always fits: the one it replaces is what goes in the pack.
    expect(type(sim, 'buy sword')[0]).toContain('철검');
    expect(sim.p.weapon).toBe('sword');
    const inn = by('inn', 'halla');
    fill(inn);
    inn.p.gold = 20;
    expect(type(inn, 'buy potion')[0]).toContain('덜거덕거리겠네');
    expect(inn.p.gold).toBe(20);
  });

  it('can be gone over, by what comes off a hand into the pack, but then nothing more goes in until it is sorted out', () => {
    const sim = game('village', 172, 126);
    sim.give('sword');
    fill(sim);
    sim.give('longsword');
    expect(type(sim, 'swap')).toBeTruthy();
    expect(sim.p.weapon).toBe('sword');
    expect(sim.load()).toBeGreaterThan(sim.limit());
    // Still free to walk.
    const x = sim.p.x;
    for (let i = 0; i < 10; i++) sim.step([{ t: 'move', dx: 1, dy: 0 }]);
    expect(sim.p.x).not.toBe(x);
    expect(type(sim, 'take hatchet')[0]).toContain('들어가지 않는다');
  });
});

describe('putting things down', () => {
  it('leaves them on the ground in that room, drawn there, saved, and to be taken again', () => {
    const sim = game('village', 160, 150);
    sim.give('pelt', 4);
    sim.give('potion');
    expect(type(sim, 'drop pelt')[0]).toBe('늑대 가죽을 내려놓았다.');
    expect(type(sim, 'drop two pelts')[0]).toBe('늑대 가죽 2개를 내려놓았다.');
    expect(sim.p.inv.pelt).toBe(1);
    expect(sim.pile('pelt')?.n).toBe(3);
    // Said either way about.
    expect(type(sim, 'put the draught down')[0]).toBe('붉은 물약을 내려놓았다.');
    // Each kind lies in its own place, beside the other, as a thing to look at and take.
    const piles = sim.things().filter((t) => t.pile);
    expect(piles.map((t) => t.take).sort()).toEqual(['pelt', 'potion']);
    expect(piles.every((t) => t.icon)).toBe(true);
    expect(Math.abs(piles[0].x - piles[1].x)).toBeGreaterThanOrEqual(9);
    expect(type(sim, 'look at the pelts')[0]).toContain('늑대 가죽 3개');
    // Drawn without complaint.
    new Renderer().draw(Object.assign(new Shell(content, { get: () => null, set: () => {} }, false, behaviours), { sim }));
    // Through a save, and away and back.
    const back = new Sim(content, { saved: JSON.parse(JSON.stringify(sim.state)), behaviours });
    back.enterRoom('inn', 160, 140);
    back.enterRoom('village', 160, 150);
    expect(back.pile('pelt')?.n).toBe(3);
    expect(type(back, 'take all the pelts')[0]).toBe('가져감: 늑대 가죽 3개.');
    expect(back.p.inv.pelt).toBe(4);
    expect(type(back, 'take draught')[0]).toBe('Taken: a red draught.');
    expect(back.rs.ground).toEqual([]);
  });

  it('puts down what is in hand or worn, taking it off first', () => {
    const sim = game();
    sim.give('mail');
    sim.give('sword');
    type(sim, 'drop the mail');
    expect(sim.p.armor).toBeNull();
    type(sim, 'drop sword');
    expect(sim.p.weapon).toBeNull();
    expect(sim.p.inv).toEqual({});
  });

  it('never puts down what a story needs', () => {
    const sim = game();
    for (const id of ['ember', 'ring', 'bottle', 'flint', 'amulet', 'glove', 'grain', 'ewe', 'toyhorse', 'log']) {
      sim.give(id);
      const noun = content.items[id].nouns[0];
      expect(type(sim, `drop ${noun}`)[0], id).toBeTruthy();
      expect(sim.p.inv[id], id).toBe(1);
    }
    expect(sim.rs.ground ?? []).toEqual([]);
    expect(type(sim, 'drop the sheep')[0]).toContain('기다리는 사람이 있다');
  });

  it('is offered from the bag, for what can be put down, and does just what typing it does', () => {
    const shell = new Shell(content, { get: () => null, set: () => {} }, false, behaviours);
    shell.modals = [];
    shell.sim.enterRoom('village', 160, 150);
    shell.sim.give('pelt', 2);
    shell.sim.give('ember');
    shell.tick();
    shell.modals = [];
    shell.keyDown('Tab');
    const pick = (label: string): void => {
      const m = shell.modal as Extract<Modal, { k: 'list' }>;
      const i = m.items.findIndex((t) => t.startsWith(label));
      expect(i, `${label} in ${m.items.join(' | ')}`).toBeGreaterThanOrEqual(0);
      m.sel = i;
      shell.keyDown('Enter');
    };
    pick('늑대 가죽');
    pick('전부 내려놓기');
    for (let i = 0; i < 30 && !(shell.modal?.k === 'list' && shell.modal.title.startsWith('가방')); i++) shell.modal ? shell.keyDown('Enter') : shell.tick();
    expect(shell.sim.p.inv.pelt).toBeUndefined();
    expect(shell.sim.pile('pelt')?.n).toBe(2);
    // And taken up again from the bag, by somebody who never types.
    pick('여기 바닥에 있음 (2)');
    pick('늑대 가죽 x2');
    pick('2개 전부 가져가기');
    for (let i = 0; i < 60 && !(shell.modal?.k === 'list' && shell.modal.title.startsWith('가방')); i++) shell.modal ? shell.keyDown('Enter') : shell.tick();
    expect(shell.sim.p.inv.pelt).toBe(2);
    // The ember is for a story: there is no row to put it down.
    shell.keyDown('Escape');
    shell.tick();
    shell.keyDown('Tab');
    pick('hearth-ember');
    expect((shell.modal as Extract<Modal, { k: 'list' }>).items).not.toContain('내려놓기');
  });
});

describe('the chest at the inn', () => {
  it('keeps what is put in it, through a save and a long absence, until it is taken out', () => {
    const sim = atChest();
    sim.give('pelt', 5);
    sim.give('hatchet');
    sim.give('sword');
    expect(type(sim, 'put the hatchet in the chest')[0]).toBe('손도끼를 궤짝에 넣었다.');
    expect(type(sim, 'put all the pelts in the chest')[0]).toBe('늑대 가죽 5개를 궤짝에 넣었다.');
    expect(type(sim, 'stash sword')[0]).toBe('철검을 궤짝에 넣었다.');
    expect(sim.p.inv).toEqual({});
    expect(type(sim, 'open the chest')[0]).toBe('안에 있는 것: 손도끼, 늑대 가죽 5개, 철검.');
    const back = new Sim(content, { saved: JSON.parse(JSON.stringify(sim.state)), behaviours });
    back.enterRoom('village', 160, 150);
    back.state.tick += 50000;
    back.enterRoom('inn', 160, 140);
    expect(storedRows(back).map((r) => r.id)).toEqual(['hatchet', 'pelt', 'sword']);
    // Asked for from across the room, the walk is asked for first.
    back.drain();
    back.step([{ t: 'say', line: 'take two pelts from the chest', afoot: true }]);
    expect(back.drain().some((e) => e.t === 'approach')).toBe(true);
    const chest = back.things().find((t) => t.store)!;
    back.p.x = chest.x + 8;
    back.p.y = chest.y + 6;
    expect(type(back, 'take two pelts from the chest')[0]).toBe('Taken: 2 wolf pelts.');
    expect(type(back, 'take the sword')[0]).toBe('Taken: an iron sword.');
    expect(back.p.weapon).toBe('sword');
    expect(type(back, 'take the ring from the chest')[0]).toBe(content.text.notStored);
    expect(storedRows(back).map((r) => `${r.id}:${r.n}`)).toEqual(['hatchet:1', 'pelt:3']);
  });

  it('will not take what a story needs, and gives back only what will fit', () => {
    const sim = atChest();
    sim.give('ring');
    expect(type(sim, 'put the ring in the chest')[0]).toContain('쉽게 빠지지는 않는다');
    sim.give('pelt', 4);
    type(sim, 'put pelts in chest');
    fill(sim);
    sim.give('potion', sim.limit() - sim.load() - 3 >= 0 ? sim.limit() - sim.load() - 3 : 0);
    while (sim.fits('potion')) sim.give('potion');
    type(sim, 'drop 2 potions');
    expect(type(sim, 'take all the pelts from the chest')[0]).toMatch(/들어가지 않는다/);
  });

  it('is offered in the bag, beside each thing that could go in it', () => {
    const sim = atChest();
    sim.give('pelt', 2);
    expect(bagRows(sim).length).toBe(1);
    const shell = new Shell(content, { get: () => null, set: () => {} }, false, behaviours);
    shell.sim = sim;
    shell.modals = [];
    shell.keyDown('Tab');
    const m = shell.modal as Extract<Modal, { k: 'list' }>;
    expect(m.items).toContain('궤짝 안에 있음 (0)');
  });
});

describe('carrying more', () => {
  /** Beside somebody who lives out at a steading. */
  const atHome = (who: string): Sim => {
    const [x, y] = homes(content)[who];
    const sim = game(wildId(x, y));
    sim.rs.actors = sim.rs.actors.filter((a) => a.kind === 'npc');
    const a = sim.rs.actors.find((k) => k.ref === who)!;
    sim.p.x = a.x;
    sim.p.y = a.y + 6;
    return sim;
  };

  it("comes of six wolf pelts and Brekka's needle", () => {
    const sim = atHome('brekka');
    sim.state.flags['brekka.met'] = true;
    sim.give('pelt', 5);
    const before = sim.limit();
    expect(type(sim, 'ask brekka about a pack')[0]).toContain('늑대 가죽 여섯 장');
    expect(sim.p.inv.pelt).toBe(5);
    sim.give('pelt');
    expect(type(sim, 'ask brekka about a pack')[0]).toContain('네 것도 짊어지겠지');
    expect(sim.p.inv.pelt).toBeUndefined();
    expect(sim.limit()).toBe(before + 20);
    // The bag says so, and the pack can never be put down.
    expect(bagRows(sim).map((r) => r.label)).toContain('브레카의 배낭');
    expect(type(sim, 'drop the pack')[0]).toContain('브레카가 알 것이다');
    expect(sim.limit()).toBe(before + 20);
    expect(type(sim, 'ask brekka about a pack')[0]).toContain('너보다 오래갈 거야');
  });

  it('comes of a deeper wind: every level put into stamina', () => {
    const sim = game();
    const before = sim.limit();
    sim.p.pendingLevels = 2;
    sim.step([{ t: 'level', pool: 'hp' }]);
    expect(sim.limit()).toBe(before);
    sim.step([{ t: 'level', pool: 'sp' }]);
    expect(sim.limit()).toBe(before + 5);
    expect(sim.drain().some((e) => e.t === 'note' && e.text.includes(`${before + 5}을 들 수 있다`))).toBe(true);
  });

  it("comes of a pedlar's frame, a long way out, left for whoever has further to go", () => {
    const [room] = [...sights(content)].find(([, s]) => s.id === 'pedlar')!;
    const sim = game(room);
    sim.rs.actors = [];
    const frame = sim.things().find((t) => t.id === 'pedlar')!;
    sim.p.x = frame.x + 16;
    sim.p.y = frame.y + 2;
    const before = sim.limit();
    expect(type(sim, 'read the frame')[0]).toContain('멀리 갈 사람은 가져가라');
    expect(type(sim, 'take the frame')[0]).toContain('자리가 남는다');
    expect(sim.limit()).toBe(before + 15);
    expect(type(sim, 'take the frame')[0]).toContain('이미 네 등에 있다');
    expect(sim.limit()).toBe(before + 15);
  });
});

describe('what a story needs', () => {
  it('can always be taken, however full the pack', () => {
    const sim = game('tarn');
    fill(sim);
    for (const id of ['ember', 'ring', 'bottle', 'flint', 'amulet', 'glove', 'grain', 'ewe', 'toyhorse', 'log', 'trappack', 'frame']) {
      expect(sim.fits(id), id).toBe(true);
      sim.give(id);
      expect(sim.p.inv[id], id).toBe(1);
    }
    expect(sim.rs.ground ?? []).toEqual([]);
  });
});

describe('a game saved before packs had limits', () => {
  it('loads, says the pack is over-full, walks, and takes nothing more until it is lightened', () => {
    const sim = game('village', 172, 126);
    // As an older build wrote it: no ground, no chest, and everything taken whatever it weighed.
    sim.p.inv = { pelt: 30, bearskin: 3, potion: 6, sword: 1 };
    sim.p.weapon = 'sword';
    const old = JSON.parse(JSON.stringify(sim.state)) as GameState;
    for (const r of Object.values(old.rooms)) {
      delete r.ground;
      delete r.stored;
    }
    const back = new Sim(content, { saved: old, behaviours });
    const notes = back.drain().flatMap((e) => (e.t === 'note' ? [e.text] : []));
    expect(notes).toContain(content.text.overladen);
    expect(back.p.inv.pelt).toBe(30);
    const x = back.p.x;
    for (let i = 0; i < 10; i++) back.step([{ t: 'move', dx: 1, dy: 0 }]);
    expect(back.p.x).not.toBe(x);
    expect(groundRows(back)).toEqual([]);
    back.p.x = 172;
    back.p.y = 126;
    expect(type(back, 'take hatchet')[0]).toContain('들어가지 않는다');
    // Lightened, it carries on as ever.
    type(back, 'drop all bearskins');
    type(back, 'drop 25 pelts');
    expect(back.load()).toBeLessThan(back.limit());
    type(back, 'take hatchet');
    expect(back.p.inv.hatchet).toBe(1);
  });
});

describe('things to do with what is carried', () => {
  it('Fenn shelves the books that have been read, and asks for the others to be read first', () => {
    // While the fires are out he is at the inn with everybody else, and his books with him.
    const sim = by('inn', 'fenn');
    sim.give('tomeFlame');
    sim.give('tomeFrost');
    type(sim, 'read tome');
    expect(type(sim, 'return the books to fenn')[0]).toContain('선반 위의 책이 책이오');
    expect(sim.p.inv.tomeFlame).toBeUndefined();
    expect(sim.p.inv.tomeFrost).toBe(1);
    expect(type(sim, 'give tome to fenn')[0]).toContain('먼저 읽으시오');
  });

  it('Odd buys back what he made, and nothing he did not', () => {
    const sim = by('village', 'odd');
    sim.give('sword');
    sim.give('longsword');
    sim.give('hatchet');
    sim.give('spear');
    const gold = sim.p.gold;
    expect(type(sim, 'sell the sword back')[0]).toContain('은화 10 닢');
    expect(sim.p.gold).toBe(gold + 10);
    expect(sim.p.inv.sword).toBeUndefined();
    expect(type(sim, 'sell hatchet')[0]).toContain('본 적 없고');
    expect(type(sim, 'sell spear')[0]).toContain('안 만든 건 안 사');
    expect(sim.p.inv.hatchet).toBe(1);
  });
});
