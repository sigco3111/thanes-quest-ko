import { describe, expect, it } from 'vitest';
import { questKey } from '../src/engine/rules';
import { content } from '../src/game/content';
import { Bot, awardsOnOffer, game, pointsOnOffer } from './helpers';

/**
 * Plays the whole game from a new start, earning every point on offer, using nothing but the intents a
 * keyboard sends: no teleporting, no flags set by hand. If any room, rule, fight or quest is
 * broken, this fails.
 */
function playThrough(reloadEvery = 0, sloth = 0): Bot {
  const bot = new Bot(game());
  bot.reloadEvery = reloadEvery;
  bot.sloth = sloth;
  const { sim } = bot;
  const has = (item: string): boolean => (sim.p.inv[item] ?? 0) > 0;
  const said = (): string => bot.log.join(' ');

  // The ford, then down toward the one roof with smoke at it.
  bot.walkTo(196, 162, 20);
  expect(bot.say('read sign')).toContain('홀로미어, 북쪽');
  bot.travel('village');
  expect(bot.say('look')).toContain('지붕 열한 개, 연기는 하나에서');
  bot.walkTo(172, 126, 12);
  bot.say('take hatchet');
  bot.say('equip hatchet');
  expect(sim.p.weapon).toBe('hatchet');
  bot.meet('sigga');
  expect(bot.say('talk to sigga')).toContain('케틀 앤 헬름으로 가');
  bot.meet('odd');
  expect(bot.say('talk to the smith')).toContain("그게 이 일이야");

  // Everybody is in the one room with a fire. The Elder comes down to look at the stranger.
  bot.door('inn');
  expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(4);
  bot.meet('halla');
  expect(bot.say('talk to halla')).toContain('네가 없어지면 슬퍼할 사람이 누구지');
  expect(sim.state.flags[questKey('hearth')]).toBe(1);
  bot.meet('gorm');
  expect(bot.say('talk to farmer')).toContain('씨앗 곡식을 가져갔어');
  bot.meet('toke');
  expect(bot.say('talk to hunter')).toContain('세 마리를 잡아주면');
  bot.meet('fenn');
  bot.say('talk to fenn');
  expect(bot.say('ask fenn about the tarn')).toContain('부적은');
  bot.door('village');

  // The hall: a girl under every fur in Hollowmere, and an errand.
  bot.door('hall');
  expect(said()).toContain('거기 말고');
  bot.meet('marta');
  expect(bot.say('talk to elder')).toContain('너는 낼 수 있어');
  expect(sim.state.flags[questKey('hearth')]).toBe(2);
  expect(String(sim.state.flags['goal.runa'])).toMatch(/^wild_/);
  bot.door('village');
  bot.door('inn');
  bot.meet('halla');
  expect(bot.say('talk to halla')).toContain('다리 전에 꺼질 거야');
  expect(has('flint') && has('coals')).toBe(true);
  bot.door('village');
  bot.walkTo(146, 124, 12);
  expect(bot.say('take wood')).toContain('속까지 마른 통나무');
  expect(has('log')).toBe(true);
  // A fire will not take here. Not even laid properly, on the Elder's own hearth.
  bot.door('hall');
  bot.walkTo(160, 112, 10);
  expect(bot.say('lay the log on the hearth')).toContain("안 붙어");
  expect(bot.say('light the fire')).toContain('내가—');
  expect(bot.say('give the flint to the elder')).toContain('그 입술이 뭐라 하는지 안다면');
  bot.door('village');

  // West: wolves for Toke, and the word on the ridge.
  bot.travel('pinewood');
  bot.fight();
  bot.travel('ridge');
  bot.fight();
  bot.walkTo(152, 132, 12);
  expect(bot.say('touch the rune')).toContain('VETH');
  // Back through the village (the short way south runs through the robbers' camp, which wants a
  // word first), over the bridge, where the coals die, and on to the old watchtower, where a fire lights.
  bot.travel('village');
  bot.travel('ford');
  bot.travel('tower');
  expect(has('coals')).toBe(false);
  expect(said()).toContain('새까맣게 식었다');
  bot.fight();
  bot.walkTo(100, 138, 12);
  expect(bot.say('read the stone')).toContain('ISKA');
  bot.walkTo(126, 152, 12);
  expect(bot.say('light a fire')).toContain('평생 이 순간을 기다렸다는 듯');
  bot.waitFor('word:iska');
  expect(bot.say('iska')).toContain('못처럼 박혀 있다');
  expect(sim.state.flags['tower.fire']).toBe(false);

  // Out past the watchtower: Runa, and the black bottle.
  const runa = String(sim.state.flags['goal.runa']);
  bot.travel(runa);
  bot.meet('runa');
  expect(bot.say('talk to runa')).toContain('삼킬 수 있다면," 루나가 말한다');
  expect(has('bottle')).toBe(true);
  expect(bot.say('ask runa about the stone')).toContain('양동이의 젖이 얼었어');
  expect(sim.state.flags[questKey('hearth')]).toBe(3);

  // Back by the robbers' camp, with a word now that stops three of them where they stand: Gorm's grain.
  bot.travel('camp');
  bot.fight();
  bot.walkTo(56, 162, 14);
  expect(bot.say('open chest')).toContain('씨앗 곡식 한 자루');

  // Home by the tarn: freeze it, and take what the ice kept.
  bot.travel('tarn');
  bot.waitFor('word:iska');
  expect(bot.say('iska')).toContain('두꺼워진다');
  bot.walkTo(124, 137, 4);
  bot.say('take amulet');
  expect(has('amulet')).toBe(true);
  bot.door('hut');
  bot.walkTo(122, 150, 14);
  bot.say('take tome');
  expect(bot.say('read tome')).toContain('불에 말을 거는 법을 이해한다');
  bot.door('tarn');

  // The inn again: a bow, twenty-five silver and a cheese, a book for the amulet, and a sword.
  bot.travel('village');
  bot.door('inn');
  bot.meet('toke');
  expect(bot.say('talk to hunter')).toContain("약속은 약속이야");
  expect(has('bow')).toBe(true);
  bot.meet('gorm');
  expect(bot.say('talk to farmer')).toContain('은화 스물다섯 닢을 네 손에 세어 주고');
  bot.meet('fenn');
  expect(bot.say('give amulet to fenn')).toContain('빛. 어두운 곳에서 필요할 게다');
  bot.say('read tome');
  expect(sim.p.spells).toContain('light');
  bot.walkTo(44, 118, 16);
  bot.door('village');
  bot.meet('odd');
  sellAll(bot, 'pelt');
  if (sim.p.gold >= 25) {
    expect(bot.say('buy sword')).toContain('철검에 은화 스물다섯 닢');
    bot.say('equip sword');
  }

  // The hall. This time the word on her lips is one the stranger knows.
  bot.door('hall');
  expect(said()).toContain('그 단어를 안다');
  bot.walkTo(160, 112, 10);
  expect(bot.say('give the bottle to the girl')).toContain("삼키지 못해");
  expect(bot.say('light the fire')).toContain('내가—');
  bot.meet('marta');
  expect(bot.say('hold out the flint to the elder')).toContain('그녀가 멈춘다');
  expect(sim.state.flags[questKey('hearth')]).toBe(4);
  // Nobody walks out now.
  makeForTheDoor(bot);
  expect(sim.state.room).toBe('hall');
  expect(said()).toContain('돌아본다.');
  bot.walkTo(160, 112, 10);
  expect(bot.say('strike the flint')).toContain('과제 완료: 차가운 화로.');
  expect(sim.state.won).toBe(true);
  expect(has('ring')).toBe(true);
  expect(has('bottle')).toBe(false);
  // The village has come in to see whether it would take. The night ends at the door.
  expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(7);
  expect(has('ember')).toBe(false);
  makeForTheDoor(bot);
  expect(said()).toContain("빗자루는 내가 간직할 테니");
  expect(has('ember')).toBe(true);
  expect(sim.state.room).toBe('hall');
  expect(bot.say('sleep')).toContain('모든 지붕에서 연기가 난다');
  bot.meet('tova');
  expect(bot.say('talk to tova')).toContain('그럼 넌 과자야');
  return bot;
}

/** Make for the hall door, at a time when something may turn the walker back from it. */
function makeForTheDoor(bot: Bot): void {
  try {
    bot.door('village');
  } catch {
    // Turned back: which is what was being found out.
  }
}

/** Sell every one of a thing to whoever is at hand, as long as they are buying. */
function sellAll(bot: Bot, item: string): void {
  for (let n = bot.p.inv[item] ?? 0; n > 0; n = bot.p.inv[item] ?? 0) {
    bot.say(`sell ${item}`);
    if ((bot.p.inv[item] ?? 0) >= n) throw new Error(`Nobody here would buy the ${item}: ${bot.log[bot.log.length - 1]}`);
  }
}

const STORY = ['hearth', 'stores', 'wolves', 'errand'];

describe('walkthrough', () => {
  it('can be played from the first screen to the end of the first saga', () => {
    const bot = playThrough();
    const { state } = bot.sim;
    expect(state.won).toBe(true);
    for (const id of STORY) expect(state.flags[questKey(id)], id).toBe(content.quests[id].done);
    expect(state.player.words.sort()).toEqual(['word:iska', 'word:veth']);
    expect(state.player.spells.sort()).toEqual(['flame', 'light']);
    expect(state.score).toBeGreaterThan(100);
    // QA=1 npm test prints how the story left the player, for judging pace.
    if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.QA) {
      const p = state.player;
      console.log(JSON.stringify({ minutes: Math.round(state.tick / 1200), level: p.level, maxHp: p.maxHp, gold: p.gold, score: state.score, skills: Object.fromEntries(Object.entries(p.skills).map(([k, v]) => [k, v.lv])), minHp: bot.minHp }));
    }
  }, 20000);

  it('plays out identically every time', () => {
    expect(playThrough().sim.state).toEqual(playThrough().sim.state);
  }, 30000);

  it('plays out identically when saved and restored every few seconds along the way', () => {
    // Nothing the game knows may live anywhere but in what is saved.
    expect(playThrough(37).sim.state).toEqual(playThrough().sim.state);
  }, 30000);
});

describe('a slower hand', () => {
  it('can still finish the first saga, if not comfortably', () => {
    // A player who dithers most of a second after every swing, and never once raises a guard.
    const bot = playThrough(0, 14);
    expect(bot.sim.state.won).toBe(true);
    if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.QA) console.log('SLOW ' + JSON.stringify(bot.minHp));
  }, 20000);
});

describe('a Thane', () => {
  it('can go north to where the wind stops, and come home, and do everything else there is to do', async () => {
    const { homes, lair, roomOf } = await import('../src/engine/frontier');
    // Saved and restored every few seconds throughout, as a real player's game would be.
    const bot = playThrough(61);
    const { sim } = bot;
    const has = (item: string): boolean => (sim.p.inv[item] ?? 0) > 0;
    const cell = (at: [number, number]): string => `wild_${at[0]}_${at[1]}`;
    /** Whatever the journal says just now must have every blank filled in. */
    const journalReads = (): void => {
      for (const q of Object.values(content.quests)) {
        const stage = Number(sim.state.flags[questKey(q.id)] ?? 0);
        if (!stage || !q.stages[stage]) continue;
        const line = sim.fill(q.stages[stage]);
        expect(line, q.name).not.toMatch(/\{|  | ,| \.|at , /);
        for (const hole of q.stages[stage].match(/\{[\w.]+\}/g) ?? []) expect(String(sim.state.flags[hole.slice(1, -1)] ?? content.flags?.[hole.slice(1, -1)] ?? ''), `${q.name} ${hole}`).not.toBe('');
      }
    };
    const elder = (): void => {
      bot.travel('village');
      bot.door('hall');
      bot.meet('marta');
    };

    // The morning after: it is colder every day, and the Elder can count.
    bot.meet('marta');
    expect(bot.say('talk to elder')).toContain("절반은 맞을 거고");
    expect(sim.state.flags[questKey('north')]).toBe(1);
    expect(bot.say('ask the elder about her name')).toContain('아홉 살 때부터');
    bot.door('village');
    expect(bot.say('look')).toContain('모든 지붕에서 연기가 곧게 솟는다');
    // Odd is at his forge, and has something to say that is not about iron.
    bot.meet('odd');
    expect(bot.say('talk to the smith')).toContain('칼 값이야');
    if (!has('sword')) {
      expect(bot.say('buy sword')).toContain('iron sword');
      bot.say('equip sword');
    }
    bot.door('inn');
    bot.walkTo(44, 118, 16);
    expect(bot.say('put the hatchet in the chest')).toContain('손도끼를 궤짝에 넣었다');
    bot.meet('halla');
    expect(bot.say('talk to halla')).toContain('하루하고 밤을');
    while (sim.p.gold >= 6 && (sim.p.inv.potion ?? 0) < 3 && sim.fits('potion')) bot.say('buy potion');
    bot.door('village');

    // Fenn, on his knees on the shore, and his sum.
    bot.travel('tarn');
    bot.door('hut');
    expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(1);
    expect(bot.say('look')).toContain('월장석이 걸려 있다');
    bot.meet('fenn');
    expect(bot.say('talk to fenn')).toContain('합을 구해 봐');
    expect(sim.state.flags[questKey('north')]).toBe(2);
    expect(sim.state.flags['goal.dolmen']).toBe('dolmen');
    journalReads();
    expect(bot.say('return the books to fenn')).toContain('선반 위의 책이 책이오');
    bot.door('tarn');

    // The Elder's work: out to wherever she names, and back to be paid. It is how a Thane comes by silver.
    const work = (): void => {
      elder();
      bot.say('talk to elder');
      if (!sim.state.flags['bounty.room']) bot.say('ask elder about work');
      const target = String(sim.state.flags['bounty.room']);
      const pay = Number(sim.state.flags['bounty.pay']);
      journalReads();
      bot.door('village');
      bot.travel(target);
      expect(sim.state.flags['bounty.done']).toBe(true);
      elder();
      const gold = sim.p.gold;
      expect(bot.say('talk to elder')).toContain(`은화 ${pay}닢`);
      expect(sim.p.gold).toBe(gold + pay);
      bot.door('village');
    };
    work();
    bot.meet('odd');
    sellAll(bot, 'pelt');
    work();
    bot.meet('odd');
    sellAll(bot, 'pelt');
    if (sim.p.gold >= 45) expect(bot.say('buy mail')).toContain('은화 마흔다섯 닢');
    work();
    bot.meet('odd');
    sellAll(bot, 'pelt');
    sim.p.gold = Math.max(sim.p.gold, 60);
    expect(bot.say('buy longsword')).toContain('은화 예순 닢');
    if (!has('mail')) {
      sim.p.gold = Math.max(sim.p.gold, 45);
      bot.say('buy mail');
    }
    expect(bot.say('sell the sword back')).toContain('은화 10 닢');
    sim.p.gold = Math.max(sim.p.gold, 40);
    expect(bot.say('have my sword tempered')).toContain('전보다 낫군');
    expect(sim.p.temper?.weapon).toBe(1);
    bot.door('inn');
    bot.walkTo(44, 118, 16);
    expect(bot.say('put bow in chest')).toContain('사냥 활을 궤짝에 넣었다');
    expect(bot.say('look in the chest')).toContain('손도끼, 사냥 활');
    bot.meet('halla');
    expect(bot.say('ask halla about the news')).toContain('올가미꾼 브레카');
    bot.door('village');
    bot.travel('tarn');
    bot.door('hut');
    bot.meet('fenn');
    if (sim.p.gold >= 15) {
      bot.say('buy mend');
      bot.say('read tome');
    }
    bot.door('tarn');

    // Ivar's message, and Marta's answer.
    const at = homes(content);
    bot.travel(cell(at.ivar));
    bot.meet('ivar');
    bot.say('talk to ivar');
    expect(bot.say('ask ivar about the elder')).toContain('이바르는 아직 안 죽었다고');
    elder();
    expect(bot.say('talk to elder')).toContain('회색 장갑 한 짝');
    journalReads();
    bot.door('village');
    bot.travel(cell(at.ivar));
    bot.meet('ivar');
    expect(bot.say('talk to ivar')).toContain('멧돼지창을 네 손에');
    expect(sim.p.weapon).toBe('spear');

    // Brekka's bear.
    bot.travel(cell(at.brekka));
    bot.meet('brekka');
    bot.say('talk to brekka');
    expect(bot.say('ask brekka about bears')).toContain('그레이백');
    journalReads();
    bot.travel(cell(lair(content, 'greyback')!));
    expect(sim.state.flags[questKey('greyback')]).toBe(2);
    journalReads();
    bot.travel(cell(at.brekka));
    bot.meet('brekka');
    expect(bot.say('talk to brekka')).toContain('너는 따뜻하게 해주겠지');
    expect(sim.p.armor).toBe('bearcloak');
    // The spear and the cloak have taken the place of the longsword and the mail, which only weigh
    // the pack down now: they are left with Brekka, who has a use for everything.
    expect(bot.say('drop mail')).not.toContain('not');
    bot.say('drop longsword');
    // Six wolf pelts are worth more to Brekka than to anybody: she makes a pack of them.
    const wolves = (x: number, y: number): boolean =>
      !!roomOf(content, cell([x, y]))?.spawns?.some((s) => s.kind === 'wolf' && !s.when) && !sim.state.rooms[cell([x, y])]?.dead.length;
    for (let r = 3; r <= 5 && (sim.p.inv.pelt ?? 0) < 6; r++)
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r && (sim.p.inv.pelt ?? 0) < 6; x++)
          if (Math.max(Math.abs(x), Math.abs(y)) === r && wolves(x, y)) {
            bot.travel(cell([x, y]));
            bot.fight();
          }
    expect(sim.p.inv.pelt ?? 0, `${sim.load()}/${sim.limit()} ${JSON.stringify(sim.p.inv)} wolves killed ${sim.state.flags['wolves.killed']}`).toBeGreaterThanOrEqual(6);
    bot.travel(cell(at.brekka));
    bot.meet('brekka');
    const room = sim.limit();
    expect(bot.say('ask brekka about a pack')).toContain('네 것도 짊어지겠지');
    expect(sim.limit()).toBe(room + 20);

    // Frostcaps for Runa: gathered wherever they grow nearest.
    const patches: string[] = [];
    for (let r = 2; r <= 6 && patches.length < 3; r++)
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
          if (Math.max(Math.abs(x), Math.abs(y)) === r && patches.length < 3 && (roomOf(content, cell([x, y]))?.things ?? []).some((t) => t.id === 'herb')) patches.push(cell([x, y]));
    for (const id of patches) {
      bot.travel(id);
      const herb = sim.room.things!.find((t) => t.id === 'herb')!;
      bot.walkTo(herb.x, herb.y + 3, 14);
      bot.say('pick frostcaps');
    }
    expect(sim.p.inv.herb).toBe(3);
    bot.travel(cell(at.runa));
    bot.meet('runa');
    expect(bot.say('talk to runa')).toContain('삼켰어?');
    expect(bot.say('trade frostcaps for a tonic')).toContain('절구');
    const hp = sim.p.maxHp;
    bot.say('drink tonic');
    expect(sim.p.maxHp).toBe(hp + 5);
    expect(has('tonic')).toBe(false);

    // A bell in the ice, to the east.
    bot.travel('bellmere');
    bot.waitFor('word:iska');
    expect(bot.say('iska')).toContain('종까지');
    bot.walkTo(160, 142, 4);
    const mana = sim.p.maxMp;
    expect(bot.say('ring the bell')).toContain('한 음');
    expect(sim.p.maxMp).toBe(mana + 10);

    // South, beyond the first wall: the Giant's Table, which keeps what it has until dark.
    bot.travel('dolmen');
    bot.walkTo(160, 136, 10);
    if (sim.daylight() >= 0.35) expect(bot.say('read the rune')).toContain('해가 지면 자신을 드러낸다');
    while (sim.daylight() >= 0.35) bot.step();
    bot.fight();
    bot.walkTo(160, 136, 10);
    expect(bot.say('read the rune')).toContain('여름 맛이 난다');
    expect(sim.p.words).toContain('word:sol');
    expect(sim.state.flags[questKey('north')]).toBe(3);
    expect(sim.state.flags['goal.gate']).toBe('northgate');

    // It is a month back north the way you came. The coal is quicker.
    bot.fight();
    expect(bot.say('breathe on the coal')).toContain("장로의 화로돌 위에 서 있다");
    expect(sim.state.room).toBe('hall');
    expect(bot.log.join(' ')).toContain('발 닦아라');
    bot.meet('tova');
    expect(bot.say('ask tova about her knitting')).toContain('더 못하게');
    bot.door('village');
    bot.door('inn');
    bot.meet('halla');
    while (sim.p.gold >= 6 && (sim.p.inv.potion ?? 0) < 8 && sim.fits('potion')) bot.say('buy potion');
    bot.door('village');

    // North: the tree of ropes.
    bot.travel('hangtree');
    bot.walkTo(174, 136, 14);
    expect(bot.say('cut down the ropes')).toContain('북쪽을 향해 매달려');

    // The gate in the last wall. Its guards are not to be fought; they are to be told.
    bot.truce.add('gateguard');
    bot.travel('wild_0_-9');
    bot.rest();
    bot.waitFor('word:sol');
    bot.exit('n');
    expect(sim.state.room).toBe('northgate');
    expect(bot.log.join(' ')).toContain('남은 창을 든다');
    expect(bot.say('sol')).toContain('그들은 견디지 못한다');
    expect(sim.rs.actors.length).toBe(0);
    expect(sim.state.flags[questKey('north')]).toBe(4);

    // The stone Fenn looked sixty years for, and what it shows on the road.
    bot.exit('n');
    expect(sim.state.room).toBe('oldroad');
    bot.walkTo(214, 140, 12);
    expect(bot.say('read the rune')).toContain('ORUN');
    bot.waitFor('word:orun');
    expect(bot.say('orun')).toContain("아이의");
    expect(sim.state.flags[questKey('north')]).toBe(5);

    // Where the wind stops. The hanging snow does not move aside for a shoulder.
    bot.exit('n');
    expect(sim.state.room).toBe('windend');
    expect(bot.log.join(' ')).toContain('망루에서 눈이 멎은 것처럼');
    expect(() => bot.exit('n')).toThrow();
    expect(sim.state.room).toBe('windend');
    expect(bot.say('light a fire')).toContain('작은 붉은 씨앗처럼');
    expect(bot.say('breathe on the coal')).toContain('늙은 눈처럼 흐리다');
    bot.waitFor('word:veth');
    expect(bot.say('veth')).toContain('길이 밀려 열린다');
    bot.exit('n');
    expect(sim.state.room).toBe('hanging');
    expect(bot.say('look at the raven')).toContain('날개를 반쯤 편 채');
    expect(() => bot.exit('n')).toThrow();
    bot.waitFor('word:veth');
    expect(bot.say('veth')).toContain('작고 마른 소리');
    bot.exit('n');

    // The hollow.
    expect(sim.state.room).toBe('hollow');
    expect(bot.log.join(' ')).toContain('너는 네 손을 본다.');
    expect(sim.state.flags[questKey('north')]).toBe(6);
    bot.waitFor('word:orun');
    expect(bot.say('orun')).toContain('삼백 겨울째 절반쯤 나와 있다');
    // Two things that could be done, and are thought about, and are not done.
    bot.waitFor('word:sol');
    expect(bot.say('sol')).toContain('너는 아직 말하지 않았다');
    expect(sim.p.cd['word:sol'] ?? 0).toBe(0);
    expect(bot.say('take the boy')).toContain('손을 거둔다');
    expect(bot.say('give the coal to the woman')).toContain('보지 못한다');
    // Her word, said with her; and the way home, given away.
    bot.waitFor('word:iska');
    bot.meet('kneeler');
    expect(bot.say('iska')).toContain('입술이 멎는다');
    expect(bot.say('breathe on the coal')).toContain('하나와, 하나가 안을 수 있는 만큼을 데려간다');
    expect(bot.say('sol')).toContain('말할 사람은 더는 없다');
    expect(bot.say('give the coal to the woman')).toContain('두 무릎 자국');
    expect(has('ember')).toBe(false);
    expect(sim.rs.actors.length).toBe(0);
    expect(sim.state.flags['winter.broken']).toBe(true);
    expect(sim.state.flags[questKey('north')]).toBe(7);

    // It is a very long way back on foot. The thaw goes south faster.
    bot.exit('s');
    bot.exit('s');
    expect(bot.log.join(' ')).toContain('가늘고 놀라운 비');
    bot.exit('s');
    bot.exit('s');
    expect(sim.state.room).toBe('northgate');
    expect(bot.say('look')).toContain('긴 근무를 마친 사내들처럼');
    bot.travel('hangtree');
    expect(bot.say('look')).toContain('침대처럼 무른 눈 속으로');
    bot.waitFor('word:orun');
    expect(bot.say('orun')).toContain('뚜껑');
    bot.walkTo(204, 140, 12);
    expect(bot.say('open chest')).toContain('은화 일흔 닢');
    expect(has('torc')).toBe(true);
    // The barrow, where a place was kept swept.
    bot.travel('barrow');
    bot.waitFor('word:orun');
    expect(bot.say('look')).toContain('마을 전체가 여기 올라왔다');
    expect(bot.say('orun')).toContain('쓸어 둔 자리는 더 이상 비어 있지 않다');

    // Hollowmere, and the end of the bench nearest the door.
    bot.travel('village');
    expect(bot.say('look')).toContain('잔치 냄새');
    expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(0);
    bot.door('hall');
    expect(bot.log.join(' ')).toContain('문 닫아');
    expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(7);
    bot.walkTo(80, 162, 14);
    expect(bot.say('sit down')).toContain('너 없이 돌아왔더군');
    expect(has('ember')).toBe(true);
    const silver = sim.p.gold;
    expect(bot.say('drink the cup')).toContain('과제 완료: 바람이 멈추는 곳.');
    expect(sim.state.flags['home.cup']).toBe(true);
    expect(sim.p.gold).toBe(silver);
    bot.meet('marta');
    expect(bot.say('ask the elder about the cup')).toContain('네 거야');
    bot.door('village');
    expect(bot.say('look')).toContain('처마마다 물방울');
    expect(sim.rs.actors.filter((a) => a.kind === 'npc').length).toBe(4);
    expect(bot.say('deeds')).toBe('');

    // Loose ends, for every last point: Fenn hears where his stone was, and sells his last books; the cache by the watchtower.
    bot.travel('tarn');
    bot.door('hut');
    bot.meet('fenn');
    expect(bot.say('talk to fenn')).toContain('문 저편에');
    sim.p.gold = Math.max(sim.p.gold, 60);
    for (const book of ['mend', 'frost', 'ward']) {
      if (sim.p.spells.includes(book)) continue;
      // A full pack takes no books: what the road home filled it with is put down first.
      while (!sim.fits(`tome${book[0].toUpperCase()}${book.slice(1)}`) && has('pelt')) bot.say('drop pelt');
      bot.say(`buy ${book}`);
      bot.say('read tome');
      bot.say('return the books to fenn');
    }
    expect(sim.p.spells.sort()).toEqual(['flame', 'frost', 'light', 'mend', 'ward']);
    bot.door('tarn');
    bot.travel('tower');
    bot.say('orun');
    bot.walkTo(150, 160, 12);
    expect(bot.say('open chest')).toContain('은화 마흔 닢');

    // Nothing the content offers has been left undone.
    for (const q of Object.values(content.quests)) if (!q.repeats) expect(sim.state.flags[questKey(q.id)], q.name).toBe(q.done);
    for (const id of awardsOnOffer().keys()) expect(sim.state.scored, id).toContain(id);
    expect(sim.state.score).toBeGreaterThan(pointsOnOffer());
  }, 120000);
});

describe('beyond the map', () => {
  it('can be walked, fought through and walked back from', () => {
    const bot = new Bot(game('farm', 160, 140));
    const { sim } = bot;
    // Kitted out as someone who has finished the first saga would be.
    sim.give('longsword');
    sim.give('mail');
    sim.give('potion', 6);
    sim.teach('word:iska');
    sim.p.maxHp = sim.p.hp = 90;
    sim.p.skills.blade.lv = 20;
    bot.fight();
    const visited: string[] = [];
    for (let i = 0; i < 3; i++) {
      bot.exit('e');
      visited.push(sim.state.room);
      bot.fight();
      if ((sim.room.things ?? []).some((t) => t.id === 'cache')) {
        const chest = sim.room.things!.find((t) => t.id === 'cache')!;
        bot.walkTo(chest.x, chest.y + 4, 14);
        expect(bot.say('open chest')).toContain('silver');
      }
    }
    // Off the east edge of the valley, one ring further out each time.
    expect(visited).toEqual(['wild_3_0', 'wild_4_0', 'wild_5_0']);
    expect(sim.state.score).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < 3; i++) bot.exit('w');
    expect(sim.state.room).toBe('farm');
  });
});

