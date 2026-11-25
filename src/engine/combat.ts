// Real-time fighting: swings, blocking and parrying, arrows and bolts, enemy behaviour, and the
// learn-by-doing skills (and their perks) that all of it feeds.

import { all, run } from './rules';
import { PH, PW } from './scene';
import type { Sim } from './sim';
import type { ActorState, EnemyDef, Shot } from './types';

/** Practice needed for the next skill level: gentle at first, steep for a master. */
const skillNeed = (lv: number): number => 8 + lv * 2 + Math.floor(Math.max(0, lv - 10) ** 2 * 0.06);
export const levelNeed = (level: number): number => 6 + level * 4;

/** Has the player earned a perk? Perks are data; what each one does lives where it applies. */
export function hasPerk(sim: Sim, id: string): boolean {
  const perk = sim.content.perks.find((k) => k.id === id);
  return !!perk && (sim.p.skills[perk.skill]?.lv ?? 0) >= perk.lv;
}

/** Practise a skill. Skill gains are what raise the character's level, and unlock perks. */
export function gainSkill(sim: Sim, id: string, amount: number): void {
  const p = sim.p;
  const s = p.skills[id];
  if (!s || s.lv >= 100) return;
  s.xp += amount;
  while (s.xp >= skillNeed(s.lv) && s.lv < 100) {
    s.xp -= skillNeed(s.lv);
    s.lv++;
    p.xp += 1 + s.lv * 0.2;
    sim.note(`${id[0].toUpperCase()}${id.slice(1)} is now ${s.lv}.`);
    for (const perk of sim.content.perks)
      if (perk.skill === id && perk.lv === s.lv) {
        sim.sound('level');
        sim.sayWhenIdle(`${perk.name}.\n\n${perk.text}`);
      }
  }
  while (p.xp >= levelNeed(p.level)) {
    p.xp -= levelNeed(p.level);
    p.level++;
    p.pendingLevels++;
    sim.sound('level');
  }
}

const alive = (a: ActorState): boolean => a.kind === 'enemy' && a.act !== 'dead';

/** Still on its way in after the player, out of sight: it cannot be struck, and strikes nothing. */
export const coming = (a: ActorState): boolean => (a.ai.lag ?? 0) > 0;

/** Alive, and meaning harm: game that only grazes and runs does not count. */
export const hostile = (sim: Sim, a: ActorState): boolean => alive(a) && sim.content.enemies[a.ref]?.ai !== 'prey';

/** What the trinket being worn adds, by kind. */
export const worn = (sim: Sim, key: 'dmg' | 'armor' | 'regen' | 'mana' | 'stamina'): number => (sim.p.trinket ? sim.content.items[sim.p.trinket]?.mods?.[key] ?? 0 : 0);

/** What a smith's tempering (and anything worn) adds to a weapon: an eighth again for each step. */
export const edge = (sim: Sim): number =>
  (1 + 0.125 * (sim.p.temper?.weapon ?? 0)) * (1 + worn(sim, 'dmg') / 100) * (Number(sim.state.flags.might ?? 0) > sim.state.tick ? 1.25 : 1);

/** Percent of a blow the player's armour turns: the armour's own worth, plus four for each tempering, to seventy at most. */
export function armourOf(sim: Sim): number {
  const p = sim.p;
  const base = p.armor ? sim.content.items[p.armor]?.power ?? 0 : 0;
  return Math.min(75, (base ? Math.min(70, base + 4 * (p.temper?.armor ?? 0)) : 0) + worn(sim, 'armor'));
}

/** How much tougher a foe is than the ordinary run of its kind. */
const might = (a: ActorState): number => 1 + 0.25 * (a.ai.lv ?? 0);

function knock(sim: Sim, a: ActorState, dx: number, dy: number): void {
  const sc = sim.scene();
  const nx = Math.max(8, Math.min(PW - 9, a.x + dx));
  const ny = Math.max(sc.walkTop + 1, Math.min(PH - 3, a.y + dy));
  if (!sc.blocked(nx, ny)) {
    a.x = nx;
    a.y = ny;
  }
}

export function hitEnemy(sim: Sim, a: ActorState, dmg: number, skill: string, kx = 0, ky = 0): void {
  const def = sim.content.enemies[a.ref];
  if (!def || !alive(a)) return;
  a.hp -= dmg;
  a.ai.flash = 4;
  // The living stagger and lose their swing, but not twice running: having just recovered, a foe
  // keeps its feet for a moment. The dead barely notice blows, and a great foe not at all.
  if (def.ai === 'wight') {
    a.ai.stun = Math.max(a.ai.stun ?? 0, 2);
    knock(sim, a, kx * 0.4, ky * 0.4);
  } else if (def.ai !== 'boss') {
    if (!(a.ai.poise > 0)) {
      a.ai.stun = Math.max(a.ai.stun ?? 0, 6);
      a.ai.atk = 0;
      a.ai.poise = 26;
      knock(sim, a, kx, ky);
    } else knock(sim, a, kx * 0.3, ky * 0.3);
  }
  sim.sound('hit');
  // What a blow teaches depends on what it was struck at, not on how hard it landed: there is
  // more to learn from something dangerous.
  gainSkill(sim, skill, 3 + Math.min(4, dmg * 0.3) + (a.ai.lv ?? 0) * 0.5);
  if (a.hp > 0) return;
  a.act = 'dead';
  a.t = 0;
  sim.state.flags.kills = Number(sim.state.flags.kills ?? 0) + 1;
  if (!a.id.startsWith('dyn:')) {
    sim.rs.dead.push(a.id);
    (sim.rs.deadAt ??= {})[a.id] = sim.state.tick;
  }
  // Whatever it was carrying. If nothing else remarks on it, the silver at least is counted aloud.
  const [silver, said] = [sim.p.gold, sim.notes];
  // What will not fit in the pack stays where it fell.
  sim.dropAt = { x: a.x, y: a.y };
  try {
    if (def.death) run(sim, def.death);
  } finally {
    sim.dropAt = null;
  }
  if (sim.p.gold > silver && sim.notes === said) sim.note(sim.text('foundSilver', String(sim.p.gold - silver)));
  // The last one down: the room, and the game, may have something to say about that.
  if (def.ai !== 'prey' && !sim.rs.actors.some((k) => hostile(sim, k))) for (const r of [...(sim.room.rules ?? []), ...sim.content.rules]) if (r.cleared && all(sim, r.if) && !sim.p.dead) run(sim, r.do);
}

/** The moment a swing connects: everything in the arc in front of the player is struck. */
export function swingHit(sim: Sim): void {
  const p = sim.p;
  const w = p.weapon ? sim.content.items[p.weapon] : null;
  const power = (w?.kind === 'weapon' ? w.power ?? 3 : 1.5) * edge(sim);
  const tired = p.sp < 5;
  p.sp = Math.max(0, p.sp - 5);
  // Swinging on no breath does little; say so, now and then, so it is not a mystery.
  if (tired && !(p.cd.winded > 0)) {
    p.cd.winded = 240;
    sim.note(sim.text('winded'));
  }
  const reach = hasPerk(sim, 'reach') ? 34 : 28;
  // A blow struck just after a parry lands twice as hard, for those who have learned how.
  const riposte = (p.cd.riposte ?? 0) > 0 && hasPerk(sim, 'riposte');
  for (const a of sim.rs.actors) {
    if (!alive(a) || coming(a)) continue;
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const inArc =
      p.dir === 'right' ? dx > -4 && dx < reach && Math.abs(dy) <= 8
      : p.dir === 'left' ? dx < 4 && dx > -reach && Math.abs(dy) <= 8
      : p.dir === 'down' ? dy > -3 && dy < reach / 2 && Math.abs(dx) <= 15
      : dy < 3 && dy > -reach / 2 && Math.abs(dx) <= 15;
    if (!inArc) continue;
    // Those who have learned to finish things hit the half-beaten harder.
    const finish = hasPerk(sim, 'executioner') && a.hp < (a.ai.max ?? sim.content.enemies[a.ref]?.hp ?? 0) / 2 ? 1.25 : 1;
    const dmg = power * (1 + p.skills.blade.lv / 40) * (0.85 + sim.rand() * 0.3) * (tired ? 0.5 : 1) * (riposte ? 2 : 1) * finish;
    const k = p.dir === 'right' ? [8, 0] : p.dir === 'left' ? [-8, 0] : p.dir === 'down' ? [0, 4] : [0, -4];
    hitEnemy(sim, a, dmg, 'blade', k[0], k[1]);
    if (riposte) {
      p.cd.riposte = 0;
      sim.note('Riposte!');
    }
  }
}

/** The attack key: a swing, or a loosed arrow if a bow is in hand. */
export function playerAttack(sim: Sim): void {
  const p = sim.p;
  if (p.act === 'swing' || p.dead) return;
  const w = p.weapon ? sim.content.items[p.weapon] : null;
  if (w?.kind === 'bow') {
    if ((p.cd.bow ?? 0) > 0) return;
    p.cd.bow = hasPerk(sim, 'quickdraw') ? 8 : 14;
    p.sp = Math.max(0, p.sp - 3);
    shoot(sim, 'arrow', (w.power ?? 4) * edge(sim) * (1 + p.skills.archery.lv / 40) * (hasPerk(sim, 'hawkeye') ? 1.25 : 1));
    sim.sound('swing');
    return;
  }
  p.act = 'swing';
  p.t = 0;
  p.frame = 0;
  sim.sound('swing');
}

/** Send a missile from the player in the direction they face. */
export function shoot(sim: Sim, kind: Shot['kind'], dmg: number): void {
  const p = sim.p;
  const [dx, dy] = p.dir === 'right' ? [6, 0] : p.dir === 'left' ? [-6, 0] : p.dir === 'down' ? [0, 3] : [0, -3];
  sim.rs.shots.push({ x: p.x + dx * 2, y: p.y + dy, dx, dy, from: 'player', kind, dmg, life: 60 });
}

/**
 * A blow is parried, not merely blocked, when the guard went up in answer to it: after the
 * attacker began to wind up. For arrows, which have no wind-up to read, it is a guard raised
 * within this many ticks of the arrow landing.
 */
const PARRY_WINDOW = 8;

/** `by` is whoever struck the blow, if it was struck by hand. */
export function hurtPlayer(sim: Sim, dmg: number, fromX: number, fromY: number, why: string, by?: ActorState): void {
  const p = sim.p;
  if (p.hurtT > 0 || p.dead) return;
  const dx = fromX - p.x;
  const dy = fromY - p.y;
  const facing =
    p.dir === 'right' ? dx > 0 : p.dir === 'left' ? dx < 0 : p.dir === 'down' ? dy >= 0 : dy <= 0;
  if (p.blocking && p.sp > 0 && facing) {
    const since = by?.ai.t0 ?? sim.state.tick - PARRY_WINDOW;
    if ((p.guardT ?? -99) >= since) {
      // A guard raised at the last moment: the blow slides off and the attacker is left open.
      if (by) {
        by.ai.stun = Math.round((sim.content.enemies[by.ref]?.ai === 'boss' ? 12 : 26) * (hasPerk(sim, 'ironarm') ? 1.5 : 1));
        by.ai.atk = 0;
        by.ai.poise = 0;
      }
      p.cd.riposte = 40;
      gainSkill(sim, 'block', 9);
      sim.sound('parry');
      sim.note('Parried!');
      return;
    }
    const shield = p.shield ? 0.15 : 0;
    const bulwark = hasPerk(sim, 'bulwark');
    dmg *= 1 - Math.min(0.92, 0.6 + p.skills.block.lv * 0.003 + shield + (bulwark ? 0.1 : 0));
    p.sp = Math.max(0, p.sp - (bulwark ? 2 : 5));
    gainSkill(sim, 'block', 4);
    sim.sound('block');
  } else sim.sound('hurt');
  if (Number(sim.state.flags.ward ?? 0) > sim.state.tick) dmg *= 0.5;
  // For those who came for the adventure rather than the fighting.
  if (sim.state.flags.gentle) dmg *= 0.6;
  const armour = armourOf(sim);
  dmg *= 1 - armour / 100;
  p.hurtT = 10;
  sim.hurt(dmg, why);
}

// ---------------------------------------------------------------------------------------------
// Enemies

const AI = {
  // Wind-ups are long enough for a person to see and answer: a wolf's lunge is under half a
  // second, a wight's swing most of one.
  prey: { reach: 0, windup: 0, rest: 0 },
  wolf: { reach: 20, windup: 9, rest: 23 },
  melee: { reach: 22, windup: 12, rest: 20 },
  wight: { reach: 24, windup: 16, rest: 28 },
  boss: { reach: 26, windup: 12, rest: 22 },
  archer: { reach: 0, windup: 12, rest: 50 },
};

function moveToward(sim: Sim, a: ActorState, tx: number, ty: number, speed: number, beast: boolean): void {
  const sc = sim.scene();
  const dx = tx - a.x;
  const dy = ty - a.y;
  const sx = Math.max(-speed, Math.min(speed, dx));
  const sy = Math.max(-speed * 0.5, Math.min(speed * 0.5, dy));
  const free = (x: number, y: number): boolean =>
    x > 6 && x < PW - 7 && y > sc.walkTop && y < PH - 2 && !sc.blocked(x, y) && !sc.blocked(x - 4, y) && !sc.blocked(x + 4, y);
  let moved = false;
  if (Math.abs(sx) > 0.05 && free(a.x + sx, a.y)) {
    a.x += sx;
    moved = true;
  }
  if (Math.abs(sy) > 0.05 && free(a.x, a.y + sy)) {
    a.y += sy;
    moved = true;
  } else if (!moved && Math.abs(sx) > 0.05) {
    // Blocked head-on: slide along the obstacle.
    const slide = a.ai.slide || (sim.rand() < 0.5 ? 1 : -1);
    a.ai.slide = slide;
    if (free(a.x, a.y + slide)) {
      a.y += slide;
      moved = true;
    } else a.ai.slide = -slide;
  }
  if (beast || Math.abs(dx) > Math.abs(dy) * 2) {
    if (Math.abs(dx) > 1) a.dir = dx > 0 ? 'right' : 'left';
  } else a.dir = dy > 0 ? 'down' : 'up';
  a.act = moved ? 'walk' : 'idle';
  if (moved) a.t++;
  a.frame = Math.floor(a.t / (beast ? 2 : 4)) & 3;
}

function enemyAI(sim: Sim, a: ActorState, def: EnemyDef): void {
  const p = sim.p;
  const ai = a.ai;
  const k = AI[def.ai];
  const beast = !!def.spec.body && def.spec.body !== 'human';
  const reach = def.reach ?? k.reach;
  if (coming(a)) {
    ai.lag--;
    a.act = 'idle';
    return;
  }
  if (ai.flash > 0) ai.flash--;
  if (ai.poise > 0) ai.poise--;
  ai.wind = 0;
  if ((ai.frozen ?? 0) > 0) {
    ai.frozen--;
    a.act = 'idle';
    return;
  }
  if ((ai.stun ?? 0) > 0) {
    ai.stun--;
    return;
  }
  let speed = def.speed;
  if ((ai.slow ?? 0) > 0) {
    ai.slow--;
    speed *= 0.5;
  }
  if (ai.cool > 0) ai.cool--;
  const dx = p.x - a.x;
  const dy = p.y - a.y;
  const dist = Math.hypot(dx, dy * 2);
  const face = (): void => {
    a.dir = beast || Math.abs(dx) > Math.abs(dy) * 2 ? (dx >= 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  };

  // Game: it grazes until somebody comes too near or draws blood, and then it is gone.
  if (def.ai === 'prey') {
    if (dist < 78 || ai.flash > 0) ai.flee = 50;
    if (ai.flee > 0) {
      ai.flee--;
      moveToward(sim, a, a.x - Math.sign(dx || 1) * 60, a.y - Math.sign(dy) * 6, speed, true);
      // Off the edge of the picture and away.
      if (a.x < 14 || a.x > PW - 15) ai.gone = 1;
    } else if (ai.cool > 0) a.act = 'idle';
    else {
      // A few steps, then stand and graze a while.
      if (!(ai.walk > 0)) {
        ai.walk = 12 + Math.floor(sim.rand() * 20);
        ai.tx = a.x + (sim.rand() - 0.5) * 50;
      }
      moveToward(sim, a, ai.tx, a.y, 0.5, true);
      if (--ai.walk <= 0) ai.cool = 60 + Math.floor(sim.rand() * 80);
    }
    return;
  }

  // Drawing back to loose or hurl something takes a moment, and shows.
  if (ai.draw > 0) {
    ai.draw--;
    ai.wind = 1;
    a.act = 'swing';
    a.frame = 0;
    if (ai.draw === 0) {
      a.frame = 1;
      ai.cool = def.ai === 'archer' ? k.rest : 30;
      const d = a.dir === 'left' ? -5 : 5;
      const kind = def.throws ?? 'arrow';
      sim.rs.shots.push({ x: a.x + d * 2, y: a.y, dx: d, dy: 0, from: 'enemy', kind, dmg: def.dmg * might(a) * (def.ai === 'archer' ? 1 : 0.7), life: 70 });
      sim.sound(kind === 'arrow' ? 'swing' : 'cast');
    }
    return;
  }
  // Things that can throw do so at anyone who stands off from them.
  if (def.throws && def.ai !== 'archer' && dist > 64 && Math.abs(dy) <= 4 && !(ai.cool > 0) && !(ai.atk > 0)) {
    a.dir = dx >= 0 ? 'right' : 'left';
    ai.draw = 14;
    return;
  }

  if (def.ai === 'archer') {
    const stand = p.x + (a.x >= p.x ? 1 : -1) * 96;
    if (Math.abs(dy) <= 3 && dist > 44 && !(ai.cool > 0)) {
      a.dir = dx >= 0 ? 'right' : 'left';
      ai.draw = k.windup;
    } else if (ai.cool > k.rest - 6) a.act = 'swing';
    else moveToward(sim, a, Math.max(12, Math.min(PW - 13, stand)), p.y, speed, false);
    return;
  }

  // Mid-attack: wind up (plainly, so it can be answered), strike, recover.
  if (ai.atk > 0) {
    ai.atk++;
    a.act = 'swing';
    a.frame = ai.atk < k.windup ? 0 : ai.atk < k.windup + 2 ? 1 : 2;
    if (ai.atk < k.windup) ai.wind = 1;
    if (ai.atk === k.windup && dist <= reach + 6 && Math.abs(dy) <= 9)
      hurtPlayer(sim, def.dmg * might(a) * (0.85 + sim.rand() * 0.3), a.x, a.y, def.kills, a);
    if (ai.atk >= k.windup + 5) {
      ai.atk = 0;
      ai.cool = k.rest;
      a.act = 'idle';
    }
    return;
  }
  if (dist <= reach && Math.abs(dy) <= 6 && !(ai.cool > 0)) {
    face();
    ai.atk = 1;
    ai.t0 = sim.state.tick;
    // The first time anything winds up at the player, say what the warning means.
    if (!sim.state.flags['hint.parry']) {
      sim.state.flags['hint.parry'] = true;
      sim.note(sim.text('parryHint'));
    }
    return;
  }
  // Wolves dart back after a bite; everything else presses in.
  if (def.ai === 'wolf' && ai.cool > 8) moveToward(sim, a, a.x - Math.sign(dx || 1) * 30, a.y + (ai.slide || 1) * 6, speed, true);
  else moveToward(sim, a, p.x - Math.sign(dx || 1) * (reach - 7), p.y, speed, beast);

  // A great foe calls the dead as he weakens.
  if (def.ai === 'boss') {
    const full = ai.max ?? def.hp;
    const stage = a.hp < full * 0.33 ? 2 : a.hp < full * 0.66 ? 1 : 0;
    if (stage > (ai.stage ?? 0)) {
      ai.stage = stage;
      sim.behaviours.bossPhase?.(sim, stage);
    }
  }
}

function updateShots(sim: Sim): void {
  const rs = sim.rs;
  const p = sim.p;
  rs.shots = rs.shots.filter((s) => {
    s.x += s.dx;
    s.y += s.dy;
    if (--s.life <= 0 || s.x < 0 || s.x >= PW || s.y < sim.scene().walkTop - 6 || s.y >= PH) return false;
    if (s.from === 'player') {
      const hit = rs.actors.find((a) => alive(a) && !coming(a) && Math.abs(a.x - s.x) < 9 && Math.abs(a.y - s.y) < 6);
      if (!hit) return true;
      const spell = s.kind !== 'arrow';
      // With the right learning a bolt bursts, catching everything near where it lands.
      const caught = spell && hasPerk(sim, 'wildfire') ? rs.actors.filter((a) => alive(a) && !coming(a) && Math.hypot(a.x - hit.x, (a.y - hit.y) * 2) < 30) : [hit];
      for (const a of caught) {
        if (s.kind === 'frost') a.ai.slow = 100;
        const push = !spell && hasPerk(sim, 'heavyshot') ? 14 : 4;
        hitEnemy(sim, a, s.dmg * (a === hit ? 1 : 0.6), spell ? 'sorcery' : 'archery', Math.sign(s.dx) * push, 0);
      }
      return false;
    }
    if (Math.abs(p.x - s.x) < 7 && Math.abs(p.y - s.y) < 5) {
      hurtPlayer(sim, s.dmg, s.x - s.dx, s.y, s.kind === 'arrow' ? '화살이 네 주의의 유일한 틈을 찾는다. 작은 틈은 아니었다.' : '정통으로 가슴에 맞는다. 얼마나 차가운지 알아차릴 시간은 있고, 다른 어떤 시간도 없다.');
      return false;
    }
    return true;
  });
}

/** Everything about a fight that happens each tick. */
export function updateCombat(sim: Sim): void {
  const p = sim.p;
  const rs = sim.rs;
  if (p.hurtT > 0) p.hurtT--;
  for (const key of Object.keys(p.cd)) if (p.cd[key] > 0) p.cd[key]--;

  const fighting = rs.actors.some((a) => hostile(sim, a));
  if (p.act !== 'swing' && !p.blocking) p.sp = Math.min(p.maxSp, p.sp + 0.3 * (1 + worn(sim, 'stamina') / 100));
  p.mp = Math.min(p.maxMp, p.mp + 0.04 * (hasPerk(sim, 'deepwell') ? 2 : 1) * (1 + worn(sim, 'mana') / 100));
  if (!fighting) p.hp = Math.min(p.maxHp, p.hp + 0.02);
  else if (hasPerk(sim, 'vigor')) p.hp = Math.min(p.maxHp, p.hp + 0.012);
  // Health per hundred seconds, from whatever is worn.
  p.hp = Math.min(p.maxHp, p.hp + worn(sim, 'regen') / 2000);

  for (const a of rs.actors) {
    if (a.kind !== 'enemy') continue;
    if (a.act === 'dead') {
      a.t++;
      continue;
    }
    const def = sim.content.enemies[a.ref];
    if (def) enemyAI(sim, a, def);
    if (p.dead) return;
  }
  // Keep attackers from standing inside one another.
  const pack = rs.actors.filter((a) => alive(a) && !coming(a));
  const sc = sim.scene();
  for (const a of pack)
    for (const b of pack) {
      if (a === b || Math.abs(a.x - b.x) > 16 || Math.abs(a.y - b.y) > 5) continue;
      const ny = a.y + (a.y > b.y || (a.y === b.y && a.id > b.id) ? 0.7 : -0.7);
      if (ny > sc.walkTop + 1 && ny < PH - 3 && !sc.blocked(a.x, ny)) a.y = ny;
    }
  rs.actors = rs.actors.filter((a) => !(a.kind === 'enemy' && ((a.act === 'dead' && a.t > 100) || a.ai.gone)));
  updateShots(sim);
}
