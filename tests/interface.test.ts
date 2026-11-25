// The player's side of the screen: the menu and the way back to it, the bag, the character
// sheet, the map, and the line across the top.

import { describe, expect, it } from 'vitest';
import { inventoryPage, itemActions, weighed } from '../src/engine/commands';
import { Renderer } from '../src/engine/render';
import { Shell, type Modal } from '../src/engine/shell';
import { behaviours } from '../src/game/behaviours';
import { content } from '../src/game/content';

function memoryStore(): { get(k: string): string | null; set(k: string, v: string): void } {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) };
}

function playing(room = 'village', x = 160, y = 150, store = memoryStore()): Shell {
  const shell = new Shell(content, store, false, behaviours);
  shell.modals = [];
  shell.sim.enterRoom(room, x, y);
  shell.tick();
  shell.modals = [];
  return shell;
}

type List = Extract<Modal, { k: 'list' }>;

function list(shell: Shell): List {
  const m = shell.modal;
  if (m?.k !== 'list') throw new Error(`expected a menu, not ${m?.k ?? 'nothing'}`);
  return m;
}

/** Choose the row of the open menu that reads `label` (or starts with it). */
function choose(shell: Shell, label: string): void {
  const m = list(shell);
  const i = m.items.findIndex((it) => it === label || it.startsWith(label));
  if (i < 0) throw new Error(`no row "${label}" in ${m.items.join(' | ')}`);
  m.sel = i;
  shell.keyDown('Enter');
}

/** Let the game run until something is open that is not a message or a page, reading those as they come. */
function settle(shell: Shell): string[] {
  const said: string[] = [];
  for (let i = 0, quiet = 0; i < 400 && quiet < 3; i++) {
    const m = shell.modal;
    if (m?.k === 'list' || m?.k === 'map') break;
    if (m) {
      said.push(m.k === 'msg' ? m.text : m.lines.join(' '));
      shell.keyDown('Enter');
      quiet = 0;
    } else {
      shell.tick();
      quiet = shell.busy ? 0 : quiet + 1;
    }
  }
  return said;
}

/** Close whatever is open, the way a player would: Esc on a menu or the map, Enter on anything else. */
function close(shell: Shell): void {
  const m = shell.modal;
  shell.keyDown(m?.k === 'list' || m?.k === 'map' ? 'Escape' : 'Enter');
}

describe('going back', () => {
  it('comes back to the menu from everything it opens, with the cursor where it was', () => {
    for (const row of ['가방', '지도', '일지', '인물', '위업', '저장하기', '불러오기', '설정', '플레이 방법', '처음부터 다시']) {
      const shell = playing();
      shell.keyDown('Escape');
      choose(shell, row);
      expect(shell.backToMenu).toBe(true);
      shell.tick();
      // Read and close whatever came of it, one box at a time, until the menu is back.
      for (let i = 0; i < 20 && !(shell.modal?.k === 'list' && list(shell).title === content.title); i++) {
        if (shell.modal) close(shell);
        else shell.tick();
      }
      const m = list(shell);
      expect(m.title, row).toBe(content.title);
      expect(m.items[m.sel], row).toBe(row);
      // Resume, and the game goes on with nothing waiting to come back.
      choose(shell, '돌아가기');
      shell.tick();
      expect(shell.modal, row).toBeUndefined();
      expect(shell.backToMenu).toBe(false);
    }
  });

  it('goes back to the game from Esc on the menu itself', () => {
    const shell = playing();
    shell.keyDown('Escape');
    expect(list(shell).items[0]).toBe('돌아가기');
    shell.keyDown('Escape');
    shell.tick();
    expect(shell.modal).toBeUndefined();
  });

  it('gives every menu opened from the menu a last row that goes back', () => {
    for (const row of ['저장하기', '불러오기', '설정']) {
      const shell = playing();
      shell.keyDown('Escape');
      choose(shell, row);
      const sub = list(shell);
      expect(sub.items[sub.items.length - 1], row).toBe('뒤로');
      choose(shell, '뒤로');
      expect(list(shell).title, row).toBe(content.title);
      expect(list(shell).items[list(shell).sel]).toBe(row);
    }
  });

  it('goes straight back to the game from what is opened directly', () => {
    const ways: [string, (s: Shell) => void][] = [
      ['F4', (s) => s.keyDown('F4')],
      ['Tab', (s) => s.keyDown('Tab')],
      ['F1', (s) => s.keyDown('F1')],
      ['map', (s) => s.submit('map')],
      ['journal', (s) => s.submit('journal')],
      ['skills', (s) => s.submit('skills')],
      ['deeds', (s) => s.submit('deeds')],
      ['inventory', (s) => s.submit('inventory')],
      ['save', (s) => s.submit('save')],
    ];
    for (const [name, open] of ways) {
      const shell = playing();
      open(shell);
      shell.tick();
      expect(shell.modal, name).toBeDefined();
      expect(shell.backToMenu, name).toBe(false);
      for (let i = 0; i < 12 && shell.modal; i++) close(shell);
      shell.tick();
      expect(shell.modal, name).toBeUndefined();
    }
  });

  it('leaves nothing to go back to after starting again, restoring, or dying', () => {
    const store = memoryStore();
    const shell = playing('village', 160, 150, store);
    shell.save('슬롯 1', true);
    // Starting again, from the menu.
    shell.keyDown('Escape');
    choose(shell, '처음부터 다시');
    choose(shell, '예');
    expect(shell.backToMenu).toBe(false);
    shell.modals = [];
    shell.tick();
    expect(shell.modal).toBeUndefined();
    // Restoring, from the menu.
    shell.keyDown('Escape');
    choose(shell, '불러오기');
    choose(shell, '슬롯 1');
    expect(shell.backToMenu).toBe(false);
    expect(shell.sim.state.room).toBe('village');
    shell.tick();
    expect(shell.modal).toBeUndefined();
    // Dying, with the bag waiting to come back after something chosen from it.
    shell.sim.give('bow');
    shell.keyDown('Escape');
    choose(shell, '가방');
    choose(shell, '사냥 활');
    choose(shell, '준비');
    expect(shell.backToMenu).toBe(true);
    shell.sim.die('The cold takes you.');
    shell.tick();
    expect(shell.backToMenu).toBe(false);
    // The death box, and then the choice of what to do: and nothing else comes back after it.
    settle(shell);
    expect(list(shell).title).toBe(shell.sim.text('deathPrompt'));
  });
});

describe('the bag', () => {
  const kit = ['sword', 'bow', 'shield', 'mail', 'torc', 'potion', 'potion', 'cheese', 'torch', 'ember', 'pelt', 'crown'];

  function packed(): Shell {
    const shell = playing();
    for (const id of kit) shell.sim.give(id);
    shell.sim.p.gold = 37;
    return shell;
  }

  it('opens from Tab, from typing, and from the menu, as a row for each kind of thing', () => {
    for (const open of [(s: Shell) => s.keyDown('Tab'), (s: Shell) => s.submit('inventory'), (s: Shell) => (s.keyDown('Escape'), choose(s, '가방'))]) {
      const shell = packed();
      open(shell);
      const m = list(shell);
      expect(m.title).toContain('가방');
      expect(m.title).toContain('은화: 37');
      // And how full the pack is: what is in hand or worn is not in it.
      expect(m.title).toContain(`무게: ${shell.sim.load()}/${shell.sim.limit()}`);
      expect(m.title).not.toMatch(/gold/i);
      // One row per kind, with the count and what they weigh, then a row to leave by.
      expect(m.items).toContain(weighed('붉은 물약 x2', 2));
      expect(m.items).toContain(weighed('늑대 가죽', 3));
      expect(m.items.filter((it) => it.startsWith('붉은 물약')).length).toBe(1);
      expect(m.items).toContain('철검 (손에)');
      expect(m.items).toContain('둥근 방패 (손에)');
      expect(m.items.length).toBe(new Set(kit).size + 1);
      expect(['닫기', '뒤로']).toContain(m.items[m.items.length - 1]);
    }
  });

  it('says so when it is empty', () => {
    const shell = playing();
    shell.keyDown('Tab');
    const m = list(shell);
    expect(m.title).toContain(shell.sim.text('emptyHanded'));
    expect(m.items).toEqual(['닫기']);
    choose(shell, '닫기');
    shell.tick();
    expect(shell.modal).toBeUndefined();
  });

  it('offers what can be done with each kind of thing', () => {
    const shell = packed();
    shell.sim.give('tomeFlame');
    shell.sim.give('token');
    shell.sim.give('glove');
    const sim = shell.sim;
    const acts = (id: string): string[] => itemActions(sim, id).map((a) => `${a.label}: ${a.line}`);
    expect(acts('potion')).toEqual(['마시기: drink potion', '내려놓기: drop potion', '전부 내려놓기: drop all potion']);
    expect(acts('cheese')).toEqual(['먹기: eat cheese', '내려놓기: drop cheese']);
    expect(acts('tomeFlame')).toEqual(['읽기: read tome', '내려놓기: drop tome']);
    expect(acts('torch')).toEqual(['쓰기: use torch', '내려놓기: drop torch']);
    expect(acts('sword')).toEqual(['넣기: unequip sword', '내려놓기: drop sword']);
    expect(acts('bow')).toEqual(['준비: equip bow', '내려놓기: drop bow']);
    expect(acts('shield')).toEqual(['넣기: unequip shield', '내려놓기: drop shield']);
    expect(acts('mail')).toEqual(['벗기: unequip mail', '내려놓기: drop mail']);
    expect(acts('torc')).toEqual(['벗기: unequip torc', '내려놓기: drop torc']);
    expect(acts('token')).toEqual(['입기: equip token', '내려놓기: drop token']);
    // Things with no use can only be put down.
    expect(acts('pelt')).toEqual(['내려놓기: drop pelt']);
    // What a story needs is never to be put down, and offers nothing but what it is for.
    expect(acts('ember')).toEqual(['쓰기: use ember']);
    expect(acts('glove')).toEqual([]);
  });

  it('names the right one of two things that answer to the same word', () => {
    const shell = playing();
    shell.sim.give('sword');
    shell.sim.give('longsword');
    // Both are swords: the iron one, first in the pack, is "sword", and the steel one has to be called a longsword.
    expect(itemActions(shell.sim, 'sword').map((a) => a.line)).toEqual(['equip sword', 'drop sword']);
    expect(itemActions(shell.sim, 'longsword').map((a) => a.line)).toEqual(['unequip longsword', 'drop longsword']);
    // And with two books, each is called by the word that means it and not the other.
    shell.sim.give('tomeFlame');
    shell.sim.give('tomeFrost');
    expect(itemActions(shell.sim, 'tomeFlame').map((a) => a.line)).toEqual(['read tome', 'drop tome']);
    expect(itemActions(shell.sim, 'tomeFrost').map((a) => a.line)).toEqual(['read frost', 'drop frost']);
  });

  it('shows a thing, and its actions do just what typing them does', () => {
    const cases: [string, string, (s: Shell) => unknown][] = [
      ['붉은 물약', '마시기', (s) => [s.sim.p.hp, s.sim.p.inv.potion]],
      ['고름의 치즈', '먹기', (s) => [s.sim.p.hp, s.sim.p.inv.cheese]],
      ['사냥 활', '준비', (s) => [s.sim.p.weapon, s.sim.p.other]],
      ['사슬 갑옷', '벗기', (s) => s.sim.p.armor],
      ['쇠 목고리', '벗기', (s) => s.sim.p.trinket],
      ['둥근 방패', '넣기', (s) => [s.sim.p.weapon, s.sim.p.shield]],
    ];
    for (const [thing, action, state] of cases) {
      const a = packed();
      const b = packed();
      for (const s of [a, b]) s.sim.p.hp = 10;
      // One chooses it from the bag...
      a.keyDown('Tab');
      choose(a, thing);
      const page = list(a);
      expect(page.title.toLowerCase()).toContain(thing.toLowerCase());
      expect(page.lead).toBe(true);
      expect(page.items[page.items.length - 1]).toBe('뒤로');
      const line = itemActions(a.sim, Object.keys(a.sim.p.inv).find((id) => content.items[id].name === thing)!).find((x) => x.label === action)!.line;
      choose(a, action);
      const saidA = settle(a);
      // ...the other types it.
      b.submit(line);
      const saidB = settle(b);
      expect(saidA, thing).toEqual(saidB);
      expect(state(a), thing).toEqual(state(b));
      expect(saidA.length, thing).toBeGreaterThan(0);
    }
  });

  it('comes back to the bag after a thing that is not used up, and not after one that is', () => {
    const shell = packed();
    shell.keyDown('Tab');
    choose(shell, '사냥 활');
    choose(shell, '준비');
    settle(shell);
    const back = list(shell);
    expect(back.title).toContain('가방');
    expect(back.items[back.sel]).toBe('사냥 활 (손에)');
    expect(shell.sim.p.weapon).toBe('bow');
    // Back out of the bag, and the game goes on.
    shell.keyDown('Escape');
    shell.tick();
    expect(shell.modal).toBeUndefined();

    shell.sim.p.hp = 10;
    shell.keyDown('Tab');
    choose(shell, '붉은 물약');
    choose(shell, '마시기');
    settle(shell);
    expect(shell.modal).toBeUndefined();
    expect(shell.sim.p.hp).toBeGreaterThan(10);
  });

  it('goes back from a thing to the bag, by its last row or by Esc', () => {
    const shell = packed();
    shell.keyDown('Tab');
    choose(shell, '늑대 가죽');
    expect(list(shell).items).toEqual(['내려놓기', '뒤로']);
    choose(shell, '뒤로');
    expect(list(shell).title).toContain('가방');
    expect(list(shell).items[list(shell).sel]).toBe(weighed('늑대 가죽', 3));
    choose(shell, '사슬 갑옷');
    shell.keyDown('Escape');
    expect(list(shell).items[list(shell).sel]).toBe('사슬 갑옷 (착용)');
  });

  it('calls the money silver', () => {
    const shell = packed();
    expect(inventoryPage(shell.sim).lines.join(' ')).toContain('은화: 37');
    expect(inventoryPage(shell.sim).lines.join(' ')).not.toMatch(/gold/i);
  });
});

describe('the character sheet', () => {
  it('opens from SKILLS and from the menu, as a sheet with sections', () => {
    for (const open of [(s: Shell) => s.submit('skills'), (s: Shell) => (s.keyDown('Escape'), choose(s, '인물'))]) {
      const shell = playing();
      shell.sim.state.flags.kills = 3;
      open(shell);
      shell.tick();
      const pages: Extract<Modal, { k: 'page' }>[] = [];
      while (shell.modal?.k === 'page') {
        pages.push(shell.modal);
        shell.keyDown('Enter');
      }
      expect(pages.length).toBe(2);
      expect(pages.every((p) => p.title === '인물')).toBe(true);
      const first = pages[0].lines;
      expect(first[0]).toMatch(/^레벨 +1 +날짜 +1$/);
      expect(first[1]).toMatch(/^체력 +\d+\/\d+ +마나 +\d+\/\d+$/);
      expect(first[2]).toMatch(/^기력 +\d+\/\d+ +점수 +\d+$/);
      // Skills are a section of their own, under a heading, and so are perks and travels.
      const heads = pages.flatMap((p) => (p.heads ?? []).map((i) => p.lines[i]));
      expect(heads[0]).toMatch(/^기술 +다음 특성$/);
      expect(heads).toContain('특성');
      expect(heads).toContain('여정');
      expect(pages[1].lines.join('\n')).toMatch(/쓰러뜨린 적 +3/);
      expect(first.some((l) => /^검술 +\d+ +.+ \(\d+\)$/.test(l))).toBe(true);
    }
  });
});

describe('the map', () => {
  it('scrolls with the cursor across country bigger than the sheet, and a tap names what is under it', { timeout: 30000 }, () => {
    const shell = playing('wild_2_1');
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 9; x++) shell.sim.state.flags[`seen.wild_${x}_${y}`] = true;
    shell.keyDown('F4');
    shell.tick();
    const m = shell.modal;
    if (m?.k !== 'map') throw new Error('expected the map');
    const r = new Renderer();
    r.draw(shell);
    for (let i = 0; i < 6; i++) shell.keyDown('ArrowRight');
    r.draw(shell);
    expect(m.dx).toBe(6);
    // The view has followed the cursor east.
    expect(m.vx).toBeGreaterThan(0);
    // A tap on any tile in view names it as an offset from the player, scrolled or not.
    const at = (r as unknown as { mapAt: { x: number; y: number; cw: number; ch: number; x0: number; y0: number } }).mapAt;
    const hit = r.hitMap(at.x + (m.dx - at.x0) * at.cw + 3, at.y + (m.dy - at.y0) * at.ch + 3);
    expect(hit).toEqual([m.dx, m.dy]);
    // No further than a step beyond what is known: walked to 9 east of the valley, known of to 10,
    // seen from 2 east.
    for (let i = 0; i < 30; i++) shell.keyDown('ArrowRight');
    expect(m.dx).toBe(10 - 2 + 1);
  });

  it('marks places with names of their own', async () => {
    const { chart } = await import('../src/engine/frontier');
    const shell = playing('village');
    const cells = chart(content, shell.sim.state.flags, shell.sim.state.room);
    expect(cells.find((c) => c.here)?.named).toBe(true);
  });
});

describe('the line across the top', () => {
  it('has room for four figures of score and of silver', () => {
    const shell = playing();
    shell.sim.state.score = 9999;
    shell.sim.p.gold = 9999;
    const r = new Renderer();
    const fb = r.draw(shell);
    // The health bar's label stands where it always does, clear of the silver.
    const ink = (x0: number, x1: number): number => {
      let n = 0;
      for (let y = 0; y < 8; y++) for (let x = x0; x < x1; x++) if (fb[y * 320 + x] === 0) n++;
      return n;
    };
    // Something is drawn for the silver, and nothing is drawn between it and the health bar.
    expect(ink(113, 204)).toBeGreaterThan(0);
    expect(ink(203, 206)).toBe(0);
  });
});

describe('playing without typing', () => {
  /** The line the shell last sent as if typed: F3 brings it back to the typing line. */
  function lastLine(shell: Shell): string {
    shell.keyDown('F3');
    const line = shell.input;
    shell.input = '';
    return line;
  }

  /** A game in the village with every spell and runeword known, and nobody else about unless wanted. */
  function learned(alone = true): Shell {
    const shell = playing('village', 160, 150);
    for (const id of Object.keys(content.spells)) shell.sim.teach(id);
    for (const w of Object.values(content.words)) shell.sim.teach(w.id);
    if (alone) shell.sim.rs.actors = [];
    return shell;
  }

  it('runs the offer of that number from a digit key, on an empty line with nothing open', () => {
    const offers = learned().suggest();
    expect(offers.length).toBeGreaterThanOrEqual(10);
    // 1 to 9 are the first nine, and 0 is the tenth.
    for (const [key, i] of [['1', 0], ['4', 3], ['9', 8], ['0', 9]] as const) {
      const s = learned();
      s.keyDown(key);
      expect(s.input, key).toBe('');
      expect(lastLine(s), key).toBe(offers[i].line);
    }
    // And it does what typing the line does.
    const [a, b] = [learned(), learned()];
    const look = offers.findIndex((o) => o.line === 'look');
    a.keyDown(String((look + 1) % 10));
    b.submit('look');
    const said = settle(a);
    expect(said).toEqual(settle(b));
    expect(said.length).toBeGreaterThan(0);
  });

  it('leaves digits to be typed further along a line, and never starts a line with one', () => {
    const shell = learned();
    for (const ch of 'drop 3') shell.keyDown(ch);
    expect(shell.input).toBe('drop 3');
    expect(lastLine(shell)).toBe('');
    // A number with no offer behind it does nothing at all.
    const few = playing('village', 160, 150);
    few.sim.rs.actors = [];
    expect(few.suggest().length).toBeLessThan(9);
    few.keyDown('9');
    expect(few.input).toBe('');
    expect(lastLine(few)).toBe('');
    // Where the offers are shown without numbers (a touch screen), digits are only digits.
    const plain = learned();
    plain.digits = false;
    plain.keyDown('1');
    expect(plain.input).toBe('1');
  });

  it('gives a digit to whatever box is open, not to the offers behind it', () => {
    const shell = learned();
    shell.keyDown('Tab');
    const bag = list(shell);
    shell.keyDown('1');
    expect(shell.modal).toBe(bag);
    shell.keyDown('Escape');
    shell.tick();
    expect(shell.modal).toBeUndefined();
    expect(lastLine(shell)).toBe('');
    // A message is waiting to be read: nothing is offered, and a digit runs nothing.
    shell.message('Wait.');
    expect(shell.suggest()).toEqual([]);
    shell.keyDown('1');
    expect(lastLine(shell)).toBe('');
  });

  it('offers what belongs to the spot first, then the runewords, then the rest', () => {
    const shell = learned(false);
    const sim = shell.sim;
    // Beside somebody, with something lying in reach, hurt, and a draught in the pack.
    const who = sim.rs.actors.find((a) => a.kind === 'npc' && content.chars[a.ref])!;
    sim.p.x = who.x - 16;
    sim.p.y = who.y;
    sim.putDown('cheese', 1, sim.p.x - 10, sim.p.y);
    sim.give('potion');
    sim.p.hp = 5;
    const lines = shell.suggest().map((s) => s.line);
    const at = (line: string): number => lines.indexOf(line);
    const words = Object.values(content.words).map((w) => w.verb);
    const spells = Object.keys(content.spells).map((id) => `cast ${id}`);
    expect(lines[0]).toBe(`talk to ${content.chars[who.ref].nouns[0]}`);
    expect(at('take cheese')).toBeGreaterThan(0);
    for (const w of words) expect(at(w), w).toBeGreaterThan(at('take cheese'));
    for (const w of words) expect(at(w), w).toBeLessThan(at('look'));
    for (const rest of ['map', 'drink potion', ...spells]) expect(at(rest), rest).toBeGreaterThan(at('look'));
    // A word that cannot be spoken again yet is not offered.
    sim.p.cd[Object.values(content.words)[0].id] = 40;
    expect(shell.suggest().map((s) => s.line)).not.toContain(words[0]);
  });

  it('never offers more than will fit, and it is spells that go unshown, not runewords', () => {
    // A game with more spells than anybody could want.
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`extra${i}`, { ...Object.values(content.spells)[0], id: `extra${i}`, name: `Extra ${i}` }]));
    const shell = new Shell({ ...content, spells: { ...content.spells, ...many } }, memoryStore(), false, behaviours);
    shell.modals = [];
    shell.sim.enterRoom('village', 160, 150);
    shell.tick();
    shell.modals = [];
    for (const id of Object.keys(many)) shell.sim.teach(id);
    for (const w of Object.values(content.words)) shell.sim.teach(w.id);
    const offers = shell.suggest();
    expect(offers.length).toBe(16);
    const lines = offers.map((s) => s.line);
    for (const w of Object.values(content.words)) expect(lines).toContain(w.verb);
    expect(lines).toContain('look');
    expect(new Set(lines).size).toBe(lines.length);
    for (const o of offers) expect(Object.keys(o).sort()).toEqual(['label', 'line']);
  });

  it('walks over and talks to somebody who is clicked on, as typing it would', () => {
    const fresh = (): Shell => playing('village', 160, 150);
    const [a, b] = [fresh(), fresh()];
    // Whoever is furthest off: there must be a walk in it.
    const far = (s: Shell) => s.sim.rs.actors.filter((k) => k.kind === 'npc' && content.chars[k.ref]).sort((p, q) => Math.abs(q.x - s.sim.p.x) - Math.abs(p.x - s.sim.p.x))[0];
    const who = far(a);
    const def = content.chars[who.ref];
    expect(a.sim.within(who.x, who.y, 48)).toBe(false);
    // Anywhere on the figure will do: the middle of it, here.
    const [x, y] = [Math.round(who.x), Math.round(who.y) - 18];
    expect(a.aim(x, y)).toBe(`${def.name}에게 말 걸기`);
    a.point(x, y);
    a.tick();
    expect(a.busy).toBe(true);
    b.submit(`talk to ${def.nouns[0]}`);
    const said = settle(a);
    expect(said).toEqual(settle(b));
    expect(said.length).toBeGreaterThan(0);
    expect(a.sim.within(who.x, who.y, 60)).toBe(true);
    expect([a.sim.p.x, a.sim.p.y]).toEqual([b.sim.p.x, b.sim.p.y]);
    expect(a.modal?.k).toBe(b.modal?.k);
    // Nothing was typed, and nothing is left for Enter to repeat.
    expect(a.input).toBe('');
    expect(lastLine(a)).toBe('');
  });

  it('walks over and takes a thing that is clicked on', () => {
    const shell = playing('village', 60, 160);
    const sim = shell.sim;
    sim.rs.actors = [];
    sim.putDown('cheese', 1, 230, 160);
    const pile = sim.things().find((t) => t.take === 'cheese')!;
    expect(sim.within(pile.x, pile.y, pile.reach ?? 30)).toBe(false);
    expect(shell.aim(pile.x, pile.y - 3)).toMatch(/가져가기$/);
    shell.point(pile.x, pile.y - 3);
    shell.tick();
    expect(shell.busy).toBe(true);
    const said = settle(shell);
    expect(sim.p.inv.cheese).toBe(1);
    expect(sim.things().some((t) => t.take === 'cheese')).toBe(false);
    expect(said.length).toBeGreaterThan(0);
    expect(sim.within(pile.x, pile.y, pile.reach ?? 30)).toBe(true);
  });

  it('walks over and looks at any other thing that is clicked on, and then offers what can be tried', () => {
    const shell = playing('ford', 60, 160);
    const sim = shell.sim;
    sim.rs.actors = [];
    // Something that is not to be taken, with something to try, clear of any door.
    const thing = sim.things().find((t) => !t.take && t.try?.length && shell.aim(t.x, t.y - 4)?.includes('살펴보기'))!;
    expect(thing).toBeDefined();
    const noun = thing.nouns.find((w) => sim.things().find((o) => o.nouns.includes(w)) === thing) ?? thing.nouns[0];
    expect(sim.within(thing.x, thing.y, thing.reach ?? 30)).toBe(false);
    shell.point(thing.x, thing.y - 4);
    shell.tick();
    expect(shell.busy).toBe(true);
    const said = settle(shell);
    expect(sim.within(thing.x, thing.y, thing.reach ?? 30)).toBe(true);
    const typed = playing('ford', 60, 160);
    typed.submit(`look at ${noun}`);
    expect(said).toEqual(settle(typed));
    expect(said.length).toBeGreaterThan(0);
    expect(shell.suggest().map((s) => s.line)).toContain(thing.try![0]);
  });

  it('only walks when the click is on bare ground, far scenery, a door, or the edge of the picture', () => {
    const shell = playing('village', 160, 150);
    const sim = shell.sim;
    sim.rs.actors = [];
    // Scenery that can be seen from anywhere has a place in the picture only to hang its words on.
    for (const t of sim.things().filter((k) => (k.reach ?? 30) > 100)) expect(shell.aim(t.x, t.y - 2)?.endsWith(` ${t.nouns[0]}`) ?? false, t.id).toBe(false);
    // A door is gone through, as it always was, whatever stands by it.
    const door = sim.room.doors![0];
    const [dx, dy] = [Math.round((door.x0 + door.x1) / 2), Math.round((door.y0 + door.y1) / 2)];
    expect(shell.aim(dx, dy - 10)).toBeNull();
    shell.point(dx, dy - 10);
    shell.tick();
    expect(shell.busy).toBe(false);
    for (let i = 0; i < 400 && sim.state.room === 'village'; i++) shell.modal ? shell.keyDown('Enter') : shell.tick();
    expect(sim.state.room).toBe(door.to);
    // And the top edge of the picture is the way north.
    const out = playing('ford', 160, 150);
    const north = out.sim.room.exits!.n;
    expect(out.aim(160, 20)).toBeNull();
    out.point(160, 20);
    for (let i = 0; i < 400 && out.sim.state.room === 'ford'; i++) out.modal ? out.keyDown('Enter') : out.tick();
    expect(north).toBeDefined();
    expect(out.sim.state.room).toBe(north);
  });

  it('strikes up no conversation with something that means harm: a click closes with it, then strikes', () => {
    const shell = playing('village', 100, 150);
    const sim = shell.sim;
    sim.rs.actors = [];
    sim.spawn('wolf', 220, 150);
    const wolf = sim.rs.actors[0];
    expect(shell.aim(Math.round(wolf.x), Math.round(wolf.y) - 8)).toMatch(/싸우기$/);
    shell.point(Math.round(wolf.x), Math.round(wolf.y) - 8);
    shell.tick();
    // A walk, and no line sent on the player's behalf.
    expect(shell.heading).not.toBeNull();
    expect(shell.busy).toBe(false);
    // Face to face, the same click is a swing.
    wolf.x = sim.p.x + 14;
    wolf.y = sim.p.y;
    sim.p.dir = 'right';
    shell.point(Math.round(wolf.x), Math.round(wolf.y) - 8);
    shell.tick();
    expect(sim.p.act).toBe('swing');
  });

  it('points at nothing while a box is open', () => {
    const shell = playing('village', 160, 150);
    const who = shell.sim.rs.actors.find((a) => a.kind === 'npc')!;
    shell.keyDown('Tab');
    expect(shell.aim(Math.round(who.x), Math.round(who.y) - 18)).toBeNull();
    shell.point(Math.round(who.x), Math.round(who.y) - 18);
    shell.keyDown('Escape');
    shell.tick();
    expect(shell.busy).toBe(false);
    expect(shell.heading).toBeNull();
  });
});

describe('the front of the game', () => {
  // The page shows a way out to the rest of Daventry only where the game is standing at its own
  // front door: the title screen and the main menu. Nothing opened from them is the front.
  it('is the title screen and the main menu, and nothing else', () => {
    const fresh = new Shell(content, memoryStore(), false, behaviours);
    fresh.showTitle();
    expect(list(fresh).front).toBe(true);

    const shell = playing();
    expect(shell.modal).toBeUndefined();
    shell.keyDown('Escape');
    expect(list(shell).items[0]).toBe('돌아가기');
    expect(list(shell).front).toBe(true);
    // The bag, opened from the menu, is not; coming back to the menu is.
    list(shell).sel = 1;
    shell.keyDown('Enter');
    expect(list(shell).title).toContain('가방');
    expect(list(shell).front).toBeFalsy();
    shell.keyDown('Escape');
    expect(list(shell).front).toBe(true);
    // Nor is a conversation.
    const talk = playing();
    talk.submit('talk to sigga');
    for (let i = 0; i < 200 && talk.modal?.k !== 'list'; i++) talk.modal ? talk.keyDown('Enter') : talk.tick();
    expect(list(talk).front).toBeFalsy();
  });
});
