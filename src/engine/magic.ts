// Spells (learned from tomes, cast with mana) and runewords (found in the world, spoken by
// typing the word itself, limited by a cooldown).

import { gainSkill, hasPerk, hitEnemy, shoot } from './combat';
import type { Sim } from './sim';
import type { WordDef } from './types';

export function cast(sim: Sim, noun: string | undefined): void {
  const p = sim.p;
  if (!noun) return sim.say(sim.text('castWhat'));
  const spell = sim.content.spells[noun];
  if (!spell || !p.spells.includes(spell.id)) return sim.say(sim.text('noSpell'));
  const cost = spell.cost * (hasPerk(sim, 'thrift') ? 0.75 : 1);
  if (p.mp < cost) return sim.say(sim.text('noMana'));
  p.mp -= cost;
  sim.sound('cast');
  const sorcery = 1 + p.skills.sorcery.lv / 40;
  const mending = 1 + p.skills.mending.lv / 40;
  if (spell.kind === 'bolt') {
    shoot(sim, spell.shot ?? 'flame', spell.power * sorcery);
    gainSkill(sim, 'sorcery', 2);
  } else if (spell.kind === 'heal') {
    p.hp = Math.min(p.maxHp, p.hp + spell.power * mending * (hasPerk(sim, 'hale') ? 1.5 : 1));
    if (hasPerk(sim, 'secondwind')) p.sp = p.maxSp;
    gainSkill(sim, 'mending', 6);
    sim.note('따뜻함이 너를 다시 깁는다.');
  } else if (spell.kind === 'light') {
    sim.state.flags.light = sim.state.tick + spell.power;
    gainSkill(sim, 'sorcery', 4);
    sim.note('창백한 빛이 네 주위에 모인다.');
  } else {
    sim.state.flags.ward = sim.state.tick + spell.power;
    gainSkill(sim, 'mending', 5);
    sim.note('공기가 네 주위에서 단단해진다.');
  }
}

/** Speak a runeword. Returns false (having explained why) if nothing happened. */
export function invoke(sim: Sim, word: WordDef): boolean {
  const p = sim.p;
  if (!p.words.includes(word.id)) {
    sim.say(sim.text('wordUnknown'));
    return false;
  }
  if ((p.cd[word.id] ?? 0) > 0) {
    sim.say(sim.text('wordTired'));
    return false;
  }
  // Lore shortens the wait.
  p.cd[word.id] = Math.round(word.cooldown * (1 - Math.min(0.5, p.skills.lore.lv * 0.005)) * (hasPerk(sim, 'oldtongue') ? 0.6 : 1));
  sim.sound('word');
  gainSkill(sim, 'lore', 8);
  sim.state.flags.spoke = sim.state.tick;
  if (hasPerk(sim, 'echo')) p.mp = Math.min(p.maxMp, p.mp + 8);
  const long = hasPerk(sim, 'longvoice') ? 1.5 : 1;
  const foes = sim.rs.actors.filter((a) => a.kind === 'enemy' && a.act !== 'dead' && !((a.ai.lag ?? 0) > 0));
  if (word.kind === 'push') {
    for (const a of foes) {
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      const d = Math.hypot(dx, dy * 2) || 1;
      if (d > 90 * long) continue;
      a.ai.stun = Math.round(34 * long);
      a.ai.poise = 0;
      hitEnemy(sim, a, 3, 'lore', (dx / d) * 44, ((dy * 2) / d) * 14);
    }
  } else if (word.kind === 'freeze') {
    for (const a of foes) a.ai.frozen = Math.round((sim.content.enemies[a.ref]?.ai === 'boss' ? 50 : 110) * long);
  } else if (word.kind === 'smite') {
    // A moment of daylight: the dead are struck and staggered by it, and the dark gives way.
    for (const a of foes) {
      if (!sim.content.enemies[a.ref]?.undead || Math.hypot(a.x - p.x, (a.y - p.y) * 2) > 120 * long) continue;
      a.ai.stun = Math.round(24 * long);
      a.ai.poise = 0;
      hitEnemy(sim, a, 16 + p.skills.lore.lv * 0.6, 'lore');
    }
    sim.state.flags.light = Math.max(Number(sim.state.flags.light ?? 0), sim.state.tick + 500);
  } else {
    sim.state.flags.light = Math.max(Number(sim.state.flags.light ?? 0), sim.state.tick + 240);
  }
  return true;
}
