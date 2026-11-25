// @ts-nocheck
import { readFileSync } from 'fs';
import { expect, it } from 'vitest';
import { game } from './helpers';

// Every Korean command button label must also work when a player types it: the same verb as the English line.
it('Korean button labels parse like their English commands', () => {
  const src = readFileSync('src/engine/shell.ts', 'utf8');
  const block = src.slice(src.indexOf('koTryLabel'), src.indexOf('/** A ready-made command'));
  const pairs = [...block.matchAll(/'([^']+)':\s*'([^']+)'|(\w+):\s*'([^']+)'/g)].map((m) => [m[1] ?? m[3], m[2] ?? m[4]]);
  expect(pairs.length).toBeGreaterThan(25);
  const sim = game();
  const bad: string[] = [];
  for (const [en, ko] of pairs) {
    const a = sim.parser.parse(en);
    const b = sim.parser.parse(ko);
    if (!b.ok || !a.ok || a.verb !== b.verb) bad.push(`${en} | ${ko} | ${JSON.stringify(b)}`);
  }
  expect(bad).toEqual([]);
});
