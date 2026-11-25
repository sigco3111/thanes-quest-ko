// Manual verification: Korean commands, English compatibility, save/restore.
import { Bot, game } from '../tests/helpers';

const bot = new Bot(game());
const { sim } = bot;
const out = (label: string, lines: string | string[]) => {
  const s = (Array.isArray(lines) ? lines.join(' ') : lines).replace(/\s+/g, ' ').slice(0, 140);
  console.log(`[${label}] ${s}`);
};

// Korean commands
bot.walkTo(196, 162, 20);
out('KO read sign', bot.say('표지판 읽어'));
bot.travel('village');
bot.walkTo(172, 126, 12);
out('KO take hatchet', bot.say('도끼 가져가'));
console.log('[KO equip] weapon before:', String(sim.p.weapon));
out('KO equip', bot.say('도끼 장비'));
console.log('[KO equip] weapon after:', String(sim.p.weapon));
out('KO inventory', bot.say('가방'));
// English compatibility on the same state
out('EN unequip', bot.say('unequip hatchet'));
console.log('[EN unequip] weapon:', String(sim.p.weapon ?? 'none'));
out('EN equip', bot.say('equip hatchet'));
console.log('[EN equip] weapon:', String(sim.p.weapon));
out('EN look', bot.say('look'));
// Save/restore through a real serialized state
const saved = JSON.stringify(sim.state);
out('KO save cmd', bot.say('저장'));
sim.adopt(JSON.parse(saved));
out('after restore: look', bot.say('봐'));
console.log('[restore] room:', sim.state.room, 'weapon:', String(sim.p.weapon));
console.log('VERIFY DONE');
