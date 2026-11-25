// Assembles the game's data into one Content record. Nothing here is code the engine depends on:
// swap this file's contents and the same engine runs a different game.

import type { CharSpec, Cond, Content, Effect, EnemyDef, ItemDef, PerkDef, QuestDef, RoomDef, Rule, SpellDef, WordDef } from '../engine/types';
import { chars } from './data/cast';
import { hall, hut, inn } from './data/rooms/inside';
import { bellmere, dolmen, hangtree } from './data/rooms/far';
import { hanging, hollow, northgate, oldroad, windend } from './data/rooms/north';
import { barrow, camp, farm, ford, pinewood, ridge, tarn, tower, village } from './data/rooms/world';
import { frontier } from './data/frontier';
import { music } from './data/music';
import { fallbacks, intro, text } from './data/text';
import { vocab } from './data/vocab';

const hero: CharSpec = {
  skin: 'skin', hair: 'blond', hairStyle: 'short', tunic: 'red', legs: 'leather', boots: 'fur', collar: 'fur', cloak: 'green',
};

const tome = (id: string, spell: string, name: string, look: string, learned: string): ItemDef => ({
  id, weight: 2, name, nouns: ['tome', spell], kind: 'tome', look,
  use: [{ teach: spell }, { run: 'study', arg: 20 }, { score: spell === 'flame' ? 5 : 2, id: `spell.${spell}` }, { say: learned }, { note: `팁: CAST ${spell.toUpperCase()}로 사용한다.` }],
});

const items: Record<string, ItemDef> = {
  log: { id: 'log', weight: 0, keep: '공들여 골랐고, 누구의 화로를 위한 것인지 안다.', name: '마른 통나무', nouns: ['log'], kind: 'misc', look: '속까지 잘 마른, 쪼갠 소나무 통나무와 거기서 쪼갠 부싯깃 한 움큼. 잘 타야 할 텐데. 여기서는 아무것도 잘 타지 않는다.' },
  flint: {
    id: 'flint', weight: 0, keep: '할라의 것이고, 아흐레 동안 그 전 아홉 해보다 더 많이 쳐졌다. 눈 속에 버리는 게 아니라 돌려줄 것이다.', name: '부싯돌과 강철', nouns: ['flint'], kind: 'misc',
    look: '가죽끈에 매단 부싯돌과 강철 곡편. 엄지가 닿는 자리가 반질반질하다. 할라가 아흐레 동안 시시각각 쳐댔다.',
    use: [{ cmd: 'light hearth' }],
  },
  coals: {
    id: 'coals', weight: 0, keep: '홀로미어의 마지막 불에서 나온 숯 세 개. 눈 속에 내려놓을 수는 없다.', name: '숯 담은 뿔', nouns: ['coals'], kind: 'misc',
    look: "점토로 마개한 소뿔. 안에 할라의 화로에서 나온 숯 세 개가 들었다. 아직 붉다. 그녀는 계속 그러리라 생각하지 않는 눈치였다.",
  },
  bottle: {
    id: 'bottle', weight: 0, keep: '모피 아래 누운 아이를 위한 것이다. 장로의 홀 말고는 갈 곳이 없다.', name: '검은 병', nouns: ['bottle', 'tonic'], kind: 'misc',
    look: "돌병이다. 마개가 있고 루나의 가마 열기가 아직 남았다. 추위가 빼앗은 것을 되돌려 놓는다. 아이가 삼킬 수만 있다면.",
    use: [{ say: '네가 마실 것이 아니다. 서리버섯 세 개와 긴 밤이 들어갔고, 일곱 살 아이를 위한 것이다.' }],
  },
  ring: {
    id: 'ring', weight: 0, keep: '낄 때만큼 쉽게 빠지지는 않는다.', name: '놋쇠 반지', nouns: ['ring'], kind: 'misc',
    look: '수수한 놋쇠 반지. 오래됐고, 수많은 손에 반질반질하게 닳았다. 마르타의 손가락에 있었고, 그 전에는 간직되고 있었다. 잘 맞는다.',
    don: [{ say: '마르타가 끼워 준 자리, 네 손가락에 있다. 돌려 본다. 안팎이 반질반질하게 닳아 있다.' }],
  },
  hatchet: { id: 'hatchet', weight: 4, icon: 'hatchet', name: '손도끼', nouns: ['hatchet'], kind: 'weapon', power: 4, look: '날이 이 빠진 목재 손도끼. 부싯깃용으로 만들어졌지만, 무엇을 쪼개든 상관하지 않는다.' },
  sword: { id: 'sword', weight: 6, name: '철검', nouns: ['sword'], kind: 'weapon', power: 7, look: '수수한 철, 잘 관리됐다. 오드가 용광로가 꺼지기 전에 만들었고, 그게 보인다. 모든 선이 성마르다.' },
  bow: { id: 'bow', weight: 4, name: '사냥 활', nouns: ['bow'], kind: 'bow', power: 5, look: "토케의 주목 활. 바닥날 줄 모르는 화살통이 딸려 오는데, 묻지 않기로 했다." },
  longsword: { id: 'longsword', weight: 8, name: '강철 장검', nouns: ['sword', 'longsword'], kind: 'weapon', power: 10, look: '철이 아니라 강철. 더 밝고, 더 길고, 움직이고 싶어하는 것처럼 균형이 잡혔다. 오드가 조용히 자랑하는 물건이다.' },
  mail: { id: 'mail', weight: 20, name: '사슬 갑옷', nouns: ['mail'], kind: 'armor', power: 25, look: '리벳 박은 고리로 엮은 갑옷. 어린 양만큼 무겁고, 맞는 것의 사 분의 일을 튕겨낸다.' },
  token: { id: 'token', weight: 1, name: '늑대송곳니 부적', nouns: ['token', 'trinket'], kind: 'trinket', mods: { dmg: 12 }, look: "가죽끈에 꿴 늑대 송곳니. 구멍을 뚫고 한 줄을 새겼다. 건 사람은 그 덕에 더 세게 쳤거나, 그렇게 믿었는데, 싸움에서는 같은 말이다." },
  torc: { id: 'torc', weight: 2, name: '쇠 목고리', nouns: ['torc', 'trinket'], kind: 'trinket', mods: { armor: 8 }, look: '꼬아 만든 쇠 목고리. 무겁고 차갑다. 사슬 갑옷이 가리지 못하는 한 방을 막으려고 만들어졌다.' },
  hearthstone: { id: 'hearthstone', weight: 1, name: '화로돌', nouns: ['hearthstone', 'trinket'], kind: 'trinket', mods: { regen: 14 }, look: '누군가가 일 년 하루를 불 속에 둔 강 조약돌. 아직 따뜻하다. 상처에 대고 있으면, 살이 온전했던 때를 기억해 내는 것 같다.' },
  brooch: { id: 'brooch', weight: 1, name: '달은 브로치', nouns: ['brooch', 'trinket'], kind: 'trinket', mods: { mana: 70 }, look: '빛을 간직한 무언가의 조각을 박은, 창백한 은 망토 핀. 주문이 건 사람에게는 있어야 할 때보다 빨리 돌아온다.' },
  harefoot: { id: 'harefoot', weight: 1, name: '토끼발', nouns: ['harefoot', 'trinket'], kind: 'trinket', mods: { stamina: 50 }, look: "끈에 매단 흰 토끼발. 행운과 폐활량을 위한 것. 전 주인은 둘 중 하나가 다했던 모양이다." },
  antlers: { id: 'antlers', weight: 1, name: '수사슴뿔 부적', nouns: ['antlers', 'trinket'], kind: 'trinket', mods: { stamina: 40, regen: 10 }, look: "흰 사슴의 뿔에서 취한 뾰족이. 끈을 꿸 구멍이 뚫려 있다. 건 사람은 남들처럼 지치지 않고, 걸으며 조금씩 아문다." },
  ember: {
    id: 'ember', weight: 0, keep: '제 손을 두고 오는 한이 있어도. 집으로 가는 길이다.', name: '화로 불씨', nouns: ['ember'], kind: 'misc',
    look: "작은 뿔 상자. 안에는 재를 깔고 장로의 화로에서 나온 숯 하나. 숯은 제 화로를 안다. 숨을 불어넣으면 그곳으로 데려다준다. 단 한 사람과, 한 사람이 들 만큼만. 상자가 손 안에서 따뜻하다. 아는 한, 너를 어디든 데려다주는 물건은 만들어진 적이 없다.",
    use: [{ run: 'emberHome' }],
    offer: { label: '숯에 숨 불어넣기', say: 'use ember', if: [{ quiet: true }, { afield: true }] },
  },
  glove: { id: 'glove', weight: 0, keep: '누군가를 위해 만들어졌고, 너는 그에게 전할 뿐이다.', name: '회색 장갑', nouns: ['glove'], kind: 'misc', look: "좋은 회색 양모로 뜬 남자 장갑, 왼쪽. 아주 오래전 누군가 정성껏 떴고, 한 번도 쓰이지 않았다.", don: [{ say: '사십 년 전, 특정한 한 손을 위해 떠졌고, 네 손은 그 손이 아니다. 다시 접어 넣는다.' }] },
  spear: { id: 'spear', weight: 10, name: '멧돼지 창', nouns: ['spear'], kind: 'weapon', power: 12, look: "이바르의 멧돼지 창. 네 손목만한 물푸레나무 자루에 버들잎 같은 칼날. 너보다 훨씬 큰 것들을 세운 적이 있다." },
  bearcloak: { id: 'bearcloak', weight: 10, name: '그레이백 망토', nouns: ['bearcloak'], kind: 'armor', power: 35, look: "그레이백 가죽 망토. 회색 털이 바깥으로, 브레카가 힘줄로 꿰맸다. 사슬 갑옷만큼 칼을 튕기면서 무게는 절반. 아직 곰 냄새가 희미하게 난다." },
  tonic: {
    id: 'tonic', weight: 1, name: '루나의 토닉', nouns: ['tonic'], kind: 'potion', consumed: true,
    look: '엄지만 한 병에 검은 것이 들고 밀랍으로 막았다. 루나 말로는 추위가 빼앗은 것을 되돌려 놓고, 되돌아간 채로 있게 한단다.',
    use: [{ run: 'tonic' }, { say: '우물 바닥 맛이다. 잠시 뼈 하나하나가 느껴진다. 그러고는 전보다 단단해진 느낌이다.' }],
  },
  bearskin: { id: 'bearskin', weight: 15, icon: 'pelt', name: '흰 곰 가죽', nouns: ['bearskin'], kind: 'misc', look: '설웅의 가죽. 눈더미만큼 하얗고 문짝만큼 무겁다. 추위 속에서 자야 하는 사람에게는 진짜 은 값을 한다.' },
  toyhorse: {
    id: 'toyhorse', weight: 0, keep: '눈 속에 혼자 두는 게 아닌 것 같았다. 지금도 그렇다.', name: '깎은 말', nouns: ['horse'], kind: 'misc',
    look: '손 길이만 한 말. 참을성 있는 누군가가 소나무로 깎았다. 귀 한쪽이 씹혔다. 아주 작은 누군가에게.',
    don: [{ say: '말이다. 모자가 아니다.' }],
  },
  ewe: {
    id: 'ewe', weight: 0, keep: '온몸으로 네 다리에 기대며 두고 가기를 거부한다. 기다리는 사람이 있다.', name: '길 잃은 암양', nouns: ['sheep'], kind: 'misc',
    look: "업힌다기보다 동행하는 쪽에 가깝다. 털에 고름의 표시가 있고, 네 걸음 속도에 대한 의견이 있다.",
  },
  cheese: {
    id: 'cheese', weight: 1, name: '고름의 치즈', nouns: ['cheese'], kind: 'food', consumed: true,
    look: '천에 싼 작고 단단한 치즈. 오래된 양초 색. 양 냄새가 강하고, 가진 게 없으면서도 건네는 누군가의 냄새가 난다.',
    use: [{ heal: 12 }, { say: '단단하고, 노랗고, 눈물이 날 만큼 시다. 풀 죽은 암양 세 마리의 젖으로 만들었고, 네가 먹어 본 최고의 치즈다.' }],
  },
  venison: {
    id: 'venison', weight: 5, plural: '사슴고기 다리', name: '사슴고기 다리', nouns: ['venison'], kind: 'food', consumed: true,
    look: '붉은 사슴의 뒷다리. 벌써 꽁꽁 얼었다. 할라라면 은을 낼 것이다. 네 위장도 그럴 것이다.',
    use: [{ heal: 16 }, { say: '사냥꾼들처럼 얇게 썰어 반쯤 언 채로 먹는다. 북쪽에 온 뒤로 가장 잘 먹은 한 끼다.' }],
  },
  herb: {
    id: 'herb', weight: 1, name: '서리버섯', nouns: ['herb'], kind: 'food', consumed: true,
    look: '눈 아래, 바람을 피한 땅에 나는 작고 창백한 버섯. 쓰지만, 아픈 데에 좋다.',
    use: [{ heal: 8 }, { say: '찬 흙과 오래된 동전 맛. 그래도 몸 안의 무언가가 풀린다.' }],
  },
  pelt: { id: 'pelt', weight: 3, icon: 'pelt', name: '늑대 가죽', nouns: ['pelt'], kind: 'misc', look: '겨울 털이 빽빽한 회색 늑대 가죽. 마을에서 누군가 은을 줄 것이다.' },
  shield: { id: 'shield', weight: 6, name: '둥근 방패', nouns: ['shield'], kind: 'shield', look: '가죽을 씌운 오리나무에 쇠 중심돌. 아직 그림이 없다. 자격을 얻어라.' },
  torch: {
    id: 'torch', weight: 1, icon: 'torch', name: '송진 횃불', nouns: ['torch'], kind: 'misc',
    look: '송진 적신 천을 감은 막대기. 불씨를 기다린다.',
    use: [{ run: 'lightTorch' }],
  },
  potion: {
    id: 'potion', weight: 1, name: '붉은 물약', nouns: ['potion'], kind: 'potion', consumed: true,
    look: '마개 있는 플라스크에 붉은 것. 쇠와 여름 냄새가 난다.',
    use: [{ heal: 25 }, { say: '화로의 느낌이 나는 맛이다. 상처가 가신다.' }],
  },
  grain: { id: 'grain', weight: 0, keep: '고름의 봄 전부가 그 자루에 있다. 그의 마루 말고는 내려놓지 않는다.', name: '씨곡물 자루', nouns: ['grain'], kind: 'misc', look: "원 안의 G자를 지져 새긴 무거운 자루. 고름의 봄 전부가 여기 있다." },
  amulet: { id: 'amulet', weight: 0, keep: '한 번 얼음 속에 들어갔다. 그의 손에 닿기 전까지는 다시 내려놓지 않는다.', name: '은 부적', nouns: ['amulet'], kind: 'misc', look: '은 사슬에 달린 문스톤. 얼음 속 사십 년도 흐리지 못했다. 희미하게 따뜻하다.',
    don: [{ say: '사슬을 들어 올리려다, 할 수 없음을 깨닫는다. 단 한 번, 한 쌍의 손이 한 목에 걸어 준 것이다. 너는 그것을 집에 전할 뿐이다.' }],
  },
  // What the pack is carried in. Each lets a Thane carry more, for good.
  trappack: {
    id: 'trappack', weight: 0, carry: 20, keep: '브레카가 알 것이다. 어쩐지 능선 두 개 너머에서도 알 것이다.', name: '브레카의 배낭', nouns: ['pack'], kind: 'misc', icon: 'sack', don: [{ say: '브레카가 끈을 조여 준 뒤로 한 번도 벗은 적 없이 네 등에 있다.' }],
    look: '털을 안쪽으로 한 회색 늑대 가죽 배낭. 등에 버들 틀을 꿰매고 가슴 끈이 있다. 늑대 여섯 마리가 들었다. 높이 밀착해서 메어지고, 전 것보다 훨씬 많이 들어가는데도 한 번도 불평하지 않는다.',
  },
  frame: {
    id: 'frame', weight: 0, carry: 15, keep: '누군가 너보다 마흔 겨울을 먼저 멨다. 너도 몇 해는 할 수 있다.', name: '행상인의 짐틀', nouns: ['frame'], kind: 'misc', icon: 'sack', don: [{ say: '이미 네 등에 있고, 네 배낭이 그 위에 얹혀 있다.' }],
    look: '구부려 못 박은 물푸레나무 기둥 두 개, 발받이 선반, 누군가의 어깨에 시커멓게 닳은 꼰 가죽 끈. 가로대에 지져 새겼다: 엘드마르크에서 해안까지 왕복, 마흔 겨울. 이제 네 배낭이 그 위에 얹힌다. 자리가 남는다.',
  },
  tomeFlame: tome('tomeFlame', 'flame', '그을린 책', '가장자리가 그슬린 책. 표지에는 이렇게 쓰여 있다: 화염(FLAME), 그리고 뜻을 담는 법.', '글자들이 기어다니다가 자리를 잡는다. 문득, 불에 말을 거는 법을 이해한다. 대부분 어조의 문제다.'),
  tomeFrost: tome('tomeFrost', 'frost', '옅은 푸른 책', '창백한 가죽 장정의 책. 만지면 차갑다. 서리(FROST): 느려짐에 대하여.', '읽는 동안 입김이 난다. 책을 덮어도 추위가 손에 남아, 기다린다.'),
  tomeMend: tome('tomeMend', 'mend', '작은 초록 책', '만져져 부드러워진 작은 초록 책. 치유(MEND): 되돌려 놓는 일에 대하여.', '주문이라기보다 규칙이 있는 친절이다. 어느새 그 규칙을 알게 됐다.'),
  tomeLight: tome('tomeLight', 'light', '가는 하얀 책', '가는 하얀 책. 빛(LIGHT): 작고 상냥한 주문.', '방보다 페이지가 더 밝은 것 같다. 고개를 들어도, 그 빛의 조금이 따라온다.'),
  tomeWard: tome('tomeWard', 'ward', '회색 책', '회색 철포 장정의 책. 결계(WARD): 다가오는 것에 맞서.', '주위의 공기가 굳어지는 걸 고려하며, 부탁받기를 기다리는 것이 느껴진다.'),
};

const robber: Effect[] = [{ add: 'bandits.killed', n: 1 }, { gold: 3 }, { chance: 0.25, do: [{ give: 'potion', took: '붉은 물약을 지니고 있었다.' }] }];

const enemies: Record<string, EnemyDef> = {
  wolf: {
    id: 'wolf', name: '늑대', nouns: ['wolf'], ai: 'wolf', hp: 14, dmg: 5, speed: 2.1,
    spec: { body: 'wolf', skin: 'fur', hair: 'fur', hairStyle: 'short', tunic: 'fur', legs: 'fur', boots: 'fur' },
    look: '마르고, 회색이고, 온전히 너에게 몰두하고 있다. 갈비뼈가 드러난다. 겨울은 모두에게 혹독했다.',
    kills: '늑대는 배고팠고 너는 느렸다. 봄이면, 네가 쓰러진 자리에 푸른 것이 자랄 것이다.',
    death: [{ add: 'wolves.killed', n: 1 }, { chance: 0.6, do: [{ give: 'pelt', took: '가죽을 벗겨 가져간다.' }] }],
  },
  bandit: {
    id: 'bandit', name: '도적', nouns: ['bandit'], ai: 'melee', hp: 22, dmg: 6, speed: 1.2,
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'hood', beard: true, tunic: 'grey', legs: 'leather', boots: 'fur', cloak: 'leather', armed: true },
    look: '훔친 망토를 걸친 인상이 거친 사내. 훔친 검을 제 돈 주고 산 것처럼 쥐고 있다.',
    kills: '도적은 네 주머니를 뒤지고, 거의 아무것도 찾지 못하고, 괜히 건드렸다 싶어 잠시 후회한다.',
    death: [...robber],
  },
  archer: {
    id: 'archer', name: '도적 궁수', nouns: ['bandit'], ai: 'archer', hp: 14, dmg: 5, speed: 1,
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'hood', tunic: 'green', legs: 'leather', boots: 'fur', cloak: 'green' },
    look: '단궁을 든 마른 도적. 거리를 유지하고 있고, 계속 그럴 작정이다.',
    kills: '마지막 화살이 어디서 날아왔는지는 끝내 알지 못한다.',
    death: [...robber],
  },
  wight: {
    id: 'wight', name: '걷는 망자', nouns: ['wight'], ai: 'wight', undead: true, hp: 34, dmg: 9, speed: 0.75,
    hail: '대답하지 않는다. 네 냄새를 맡았을 때 어딘가로 가던 중이었고, 너를 끝내고 나면 다시 그곳으로 갈 것이다.',
    spec: { skin: 'wight', hair: 'white', hairStyle: 'short', beard: true, tunic: 'rock', legs: 'rock', boots: 'rock', cloak: 'fur', eyes: 'glow', hunch: true, armed: true, bias: -1, outline: 'ice', ragged: true },
    look: '수염에 서리가 낀 죽은 자. 오랫동안 같은 곳을 향해 걸으면서 조금도 가까워지지 못한 사람의 걸음이다. 아무도 묻어 주지 않았다. 땅이 삽질하기에 너무 단단했다.',
    kills: '죽은 것은 차갑고, 이내 모든 것이 차갑다. 잠시 후 너는 다시 일어난다. 머리에 서리를 얹고, 너에게도 갈 곳이 있음을 깨닫는다.',
    death: [{ gold: 6 }, { note: '쓰러져 조용히 눕는다. 일단은. 몸에는 오래된 은이 있었다.' }],
  },
  deer: {
    id: 'deer', name: '붉은 사슴', nouns: ['stag'], ai: 'prey', hp: 5, dmg: 0, speed: 2.5,
    spec: { body: 'deer', size: 1.15, skin: 'leather', hair: 'leather', hairStyle: 'short', tunic: 'leather', legs: 'leather', boots: 'leather' },
    look: '붉은 수사슴. 눈을 긁어 아래 것을 찾고 있다. 아직 너를 못 봤다. 보는 순간, 다른 곳에 있을 것이다.',
    kills: '',
    death: [{ set: 'deer.killed' }, { give: 'venison', took: '사슴고기. 오늘 밤은 족장처럼 먹는다.' }],
  },
  whitehart: {
    id: 'whitehart', name: '흰 사슴', nouns: ['stag', 'whitehart'], ai: 'prey', hp: 13, dmg: 0, speed: 2.9,
    spec: { body: 'deer', size: 1.4, skin: 'cream', hair: 'cream', hairStyle: 'short', tunic: 'cream', legs: 'cream', boots: 'cream' },
    look: '눈더미처럼 흰 사슴. 사슴이 가질 자격 있는 키보다 반은 더 크다. 고개를 들고 너를 똑바로 본다. 두려움 없이. 무언가를 청하러 온 이를 보는 왕처럼.',
    kills: '',
    death: [{ give: 'antlers' }, { give: 'venison', n: 2 }, { set: 'hart.killed' }, { say: '흰 사슴이 네 화살을 맞은 채로 십여 걸음을 달리다가, 아주 천천히, 무릎을 꿇는다. 칼을 꺼내기까지 오래도록 그 위에 서 있었다. 이 나라의 사냥꾼들은 평생 한 번도 보지 못하고 산다.' }],
  },
  bear: {
    id: 'bear', name: '설웅', nouns: ['bear'], ai: 'melee', reach: 30, hp: 48, dmg: 11, speed: 1.1,
    spec: { body: 'bear', size: 1.5, skin: 'cream', hair: 'cream', hairStyle: 'short', tunic: 'cream', legs: 'cream', boots: 'cream' },
    look: '눈더미 색 곰에, 모루 같은 머리. 네가 오기까지 자고 있었다. 그 사실을 알려 주고 싶어 한다.',
    kills: '곰은 서두르지 않는다. 그럴 필요가 없으니까. 끝나고는 다시 자러 간다.',
    death: [{ give: 'bearskin', took: '커다란 흰 가죽을 벗겨 가져간다.' }],
  },
  greyback: {
    id: 'greyback', name: '그레이백', nouns: ['bear', 'greyback'], ai: 'melee', reach: 34, hp: 110, dmg: 15, speed: 1.2,
    spec: { body: 'bear', size: 1.85, skin: 'fur', hair: 'fur', hairStyle: 'short', tunic: 'fur', legs: 'fur', boots: 'fur' },
    look: '건초 수레만 한 회색 곰. 눈썹에서 턱까지 하얀 흉터가 가로지른다. 여섯 겨울을 덫을 털었고, 후회하게 된 적은 한 번도 없다.',
    kills: '그레이백은 남의 덫 줄에서 가져간 것들의 목록에 너를 추가한다.',
    death: [{ quest: 'greyback', stage: 2 }, { score: 6, id: 'greyback.kill' }, { set: 'goal.greyback', to: false }, { run: 'mark', arg: 'brekka' }, { say: '그레이백이 무너지는 벽처럼 쓰러진다. 잠시 바위틈이 고요하다. 그러고는 어디선가 까마귀가 모두에게 알리기 시작한다.' }],
  },
  rimewalker: {
    id: 'rimewalker', name: '서리행자', nouns: ['rimewalker'], ai: 'wight', undead: true, reach: 27, hp: 52, dmg: 12, speed: 0.95,
    spec: { skin: 'ice', hair: 'white', hairStyle: 'long', tunic: 'ice', legs: 'ice', boots: 'snow', cloak: 'snow', eyes: 'glow', armed: true, outline: 'ice', size: 1.2, ragged: true },
    look: '여기서 얼어 죽고도 눈치채지 못한 무언가. 얼음이 갑옷처럼 그 위에 자랐고, 그것은 얼음 안을 걷는다.',
    kills: '서리행자가 거의 상냥하게 손을 얹는다. 서리가 어깨로 스며들어 네가 놀라기도 전에 심장에 닿는다.',
    death: [{ gold: 10 }, { note: '떨어뜨린 항아리처럼 깨진다. 조각 속에 은이 있다.' }, { chance: 0.3, do: [{ give: 'potion' }] }],
  },
  chief: {
    id: 'chief', name: '약탈자 두목', nouns: ['reaver', 'bandit'], ai: 'melee', reach: 24, hp: 58, dmg: 10, speed: 1.3,
    spec: { skin: 'skin', hair: 'red', hairStyle: 'long', beard: true, tunic: 'red', legs: 'leather', boots: 'fur', cloak: 'fur', collar: 'fur', armed: true, size: 1.15 },
    look: '다른 놈들보다 크고, 더 잘 먹었고, 남의 좋은 망토를 걸쳤다. 나머지는 무엇을 하든 먼저 그를 본다.',
    kills: '두목은 네 망토에 칼을 닦고, 망토가 마음에 든다고 결론 내리고, 그것도 가져간다.',
    death: [{ add: 'bandits.killed', n: 1 }, { gold: 14 }, { give: 'potion', took: '은과 붉은 물약을 지니고 있었다.' }],
  },
  // The guards of the north gate. They are not to be beaten: whatever is knocked down gets up again.
  gateguard: {
    id: 'gateguard', name: '관문 경비', nouns: ['guard', 'wight'], ai: 'wight', undead: true, reach: 27, hp: 90, dmg: 13, speed: 0.9,
    hail: '대답하지 않는다. 문이 너를 보듯 너를 본다. 교대하러 온 사람도 없었고, 가도 좋다고 말해 준 사람도 없었다.',
    spec: { skin: 'ice', hair: 'white', hairStyle: 'short', beard: true, tunic: 'metal', legs: 'rock', boots: 'rock', cloak: 'ice', eyes: 'glow', armed: true, outline: 'ice', size: 1.15, ragged: true },
    look: '이제 아무도 이름을 모르는 왕국 경비다. 뼛속까지 서리가 들었고, 남은 창을 들고 아직 초소에 있다. 교대를 오지 않은 사람의 얼굴이다.',
    kills: '경비는 배치된 일을 했다. 그러고는 줄 속 제 자리로 돌아가고, 너에게도 줄 끝자리가 마련된다.',
    death: [{ run: 'guardRises' }],
  },
};

const spells: Record<string, SpellDef> = {
  flame: { id: 'flame', name: '화염', cost: 6, kind: 'bolt', power: 8, shot: 'flame' },
  frost: { id: 'frost', name: '서리', cost: 7, kind: 'bolt', power: 4, shot: 'frost' },
  mend: { id: 'mend', name: '치유', cost: 8, kind: 'heal', power: 14 },
  light: { id: 'light', name: '빛', cost: 4, kind: 'light', power: 1800 },
  ward: { id: 'ward', name: '결계', cost: 8, kind: 'ward', power: 240 },
};

const words: Record<string, WordDef> = {
  veth: { id: 'word:veth', verb: 'veth', kind: 'push', cooldown: 300 },
  iska: { id: 'word:iska', verb: 'iska', kind: 'freeze', cooldown: 600 },
  orun: { id: 'word:orun', verb: 'orun', kind: 'reveal', cooldown: 200 },
  sol: { id: 'word:sol', verb: 'sol', kind: 'smite', cooldown: 500 },
};

// Perks: what practice earns. Each is named here; what it does is written where it applies in
// the engine (combat.ts, magic.ts, sim.ts) and looked up by id.
const perks: PerkDef[] = [
  { id: 'riposte', skill: 'blade', lv: 12, name: '되치기', text: '공격을 쳐낸 직후에 가하는 일격이 두 배 강하게 꽂힌다.' },
  { id: 'reach', skill: 'blade', lv: 25, name: '긴 손길', text: '팔의 전체 길이를 쓰는 법을 익혔다. 휘두름이 더 멀리 닿는다.' },
  { id: 'bulwark', skill: 'block', lv: 10, name: '보루', text: '가드가 더 많이 막고, 유지하는 데 숨이 덜 든다.' },
  { id: 'steady', skill: 'block', lv: 20, name: '꾸준한 전진', text: '가드를 올린 채로 천천히 걸을 수 있다.' },
  { id: 'quickdraw', skill: 'archery', lv: 10, name: '빠른 시위', text: '화살을 메기고 쏘는 것이 거의 두 배 빠르다.' },
  { id: 'heavyshot', skill: 'archery', lv: 20, name: '무거운 화살', text: '화살이 적을 밀쳐낼 만큼 강하게 꽂힌다.' },
  { id: 'thrift', skill: 'sorcery', lv: 10, name: '절약', text: '주문의 소모가 사 분의 일 줄어든다.' },
  { id: 'wildfire', skill: 'sorcery', lv: 20, name: '들불', text: '탄이 꽂힌 자리에서 터져, 가까이 선 것들을 휘감는다.' },
  { id: 'secondwind', skill: 'mending', lv: 10, name: '두 번째 숨', text: '스스로를 고치면 숨도 돌아온다.' },
  { id: 'vigor', skill: 'mending', lv: 20, name: '왕성함', text: '싸움 중에도 상처가 천천히 아문다.' },
  { id: 'executioner', skill: 'blade', lv: 40, name: '마무리 일격', text: '이미 반쯤 쓰러진 적에게는 모든 일격이 사 분의 일 더 강하다.' },
  { id: 'ironarm', skill: 'block', lv: 35, name: '쇠팔', text: '가드를 올려도 숨이 들지 않고, 쳐낸 적은 절반 더 오래 무방비다.' },
  { id: 'hawkeye', skill: 'archery', lv: 35, name: '매의 눈', text: '화살이 사 분의 일 더 강하게 꽂힌다.' },
  { id: 'deepwell', skill: 'sorcery', lv: 35, name: '깊은 우물', text: '마나가 두 배 빨리 돌아온다.' },
  { id: 'hale', skill: 'mending', lv: 35, name: '튼튼함', text: '물약, 음식, 치유가 모두 절반 더 회복시킨다.' },
  { id: 'oldtongue', skill: 'lore', lv: 40, name: '옛말', text: '룬어가 훨씬 빨리 돌아온다.' },
  { id: 'echo', skill: 'lore', lv: 12, name: '메아리', text: '룬어를 읊으면 주문에도 조금의 힘이 돌아온다.' },
  { id: 'longvoice', skill: 'lore', lv: 25, name: '긴 목소리', text: '룬어가 더 멀리 퍼지고 절반 더 오래 지속된다.' },
];

const quests: Record<string, QuestDef> = {
  hearth: {
    id: 'hearth', name: '차가운 화로', done: 5,
    stages: {
      1: "장로 마르타 콜드핸드가 광장 서쪽의 자기 홀로 너를 부른다.",
      2: "일곱 살 아이가 장로의 홀에, 홀로미어의 모든 모피를 덮고 누워 있다. 속눈썹에 서리가 낀 채로. 마르타는 약초할멈 루나가 만드는 검은 약 한 병을 원한다. 루나의 가옥은 홀로미어에서 {runa.way}, 낡은 망루 너머에 있다. 지도에 표시돼 있다. 여관의 할라가 부싯돌을 가지고 있다.",
      3: "루나의 검은 병이 있다. 아이가 삼킬 수만 있다면 나을 것이다. 장로의 홀로 가져가라.",
      4: '마르타가 멈췄다. 홀에는 숨 쉴 곁의 불이 없다.',
      5: "장로의 화로가 타오르고, 토바는 나아가고, 너는 홀로미어의 테인이다.",
    },
  },
  stores: {
    id: 'stores', name: '도둑맞은 봄', done: 2,
    stages: { 1: "도적들이 고름의 씨곡물을 가져갔다. 여울 너머 남서쪽에 진을 치고 있다.", 2: '고름이 곡물을 되찾았고, 봄이 올 것이다.' },
  },
  wolves: {
    id: 'wolves', name: '늑대의 겨울', done: 2,
    stages: { 1: '사냥꾼 토케는 늑대 세 마리를 원한다. 소나무 숲에 둘, 능선에 적어도 하나.', 2: '숲이 조용해졌고, 토케의 활은 네 것이다.' },
  },
  north: {
    id: 'north', name: '바람이 멈추는 곳', done: 8,
    stages: {
      1: '모든 지붕에서 연기가 오르는데도, 기억하는 한 가장 추운 겨울이다. 날마다 더 추워진다. 마르타가 못으로 내려가 펜에게 왜인지 물어보란다.',
      2: "펜이 너에게 계산을 맡겼다. 아이 하나, 말 하나, 방 하나, 그리고 꺼진 골짜기의 모든 불. 북쪽, 죽은 자들이 지키는 문 너머에서 바람이 멈추고, 해마다 그 멈춤이 가까워진다. 죽은 자들은 태양의 이름을 견디지 못한다. 그것은 남쪽 멀리, 첫 번째 벽 너머, 거인의 탁자 아래 새겨져 있고, 밤에만 드러난다. 지도에 표시돼 있다. (열고 미는 말 VETH는 서쪽 능선의 돌에 새겨져 있다.)",
      3: "태양의 이름을 얻었다. 문은 북쪽이다. 고분을 지나, 교수목을 지나, 첫 번째 벽을 지나, 보이는 마지막 벽에 있다. 지도에 표시돼 있다.",
      4: '문의 죽은 자들이 탑으로 돌아갔다. 북쪽 길이 열렸다. 아주 오랫동안 산 사람은 올라가지 않은 길이다.',
      5: "옛길의 눈 아래, 수많은 겨울 아래, 발자국이 있다. 걸음이 긴 여자의 것과, 그 옆에 아이의 것. 아무도 가지 않는 북쪽으로 간다. 너도 간다.",
      6: '그녀는 눈 웅덩이에 무릎 꿇고 두 손을 눈더미에 얹은 채 한 단어를, 숨 사이 없이, 말하고 있다. 홀로미어에 홀이 생기기보다 오래 전부터 말해 왔다.',
      7: '말이 끝났다. 하늘의 눈이 전부 내렸고, 바람이 분다. 홀로미어는 아주 멀리 남쪽이다.',
      8: '겨울이 깨졌다.',
    },
  },
  message: {
    id: 'message', name: '아직 죽지 않음', done: 3,
    stages: {
      1: '이바르 원글러브가 장로 마르타에게 자기가 죽지 않았다고 전해 달란다.',
      2: '마르타가 이바르에게 장갑을 보냈다. 그는 홀로미어에서 {ivar.way}의 {ivar.home}에 산다.',
      3: '이바르는 장갑을, 너는 그의 창을 얻었다.',
    },
  },
  greyback: {
    id: 'greyback', name: '그레이백', done: 3,
    stages: {
      1: "커다란 회색 곰이 브레카의 덫을 털고 있다. 그의 가옥에서 {greyback.way}의 {greyback.name}에 굴을 팠다.",
      2: '그레이백이 죽었다. 브레카는 홀로미어에서 {brekka.way}의 {brekka.home}에 산다.',
      3: "브레카가 그레이백 가죽으로 네 망토를 만들었다.",
    },
  },
  bounty: {
    id: 'bounty', name: '장로의 일' , done: 99, repeats: true,
    stages: { 1: '장로 마르타가 원한다: {bounty.what} {bounty.name}, 홀로미어에서 {bounty.way}. 지도에 표시돼 있다.', 2: '{bounty.name}에서 끝났다. 장로 마르타가 약속한 대로 줄 것이다.' },
  },
  errand: {
    id: 'errand', name: '얼음이 간직한 것', done: 2,
    stages: { 1: "펜의 부적이 못의 얇은 한가운데 얼어 있다. 너를 견디려면 얼음이 더 단단히 얼어야 한다.", 2: '펜이 사십 년 만에 부적을 되찾았다.' },
  },
};

/** Standing with one of the people who live out in the wild. */
const withFolk: Cond = { any: [{ near: 'brekka' }, { near: 'ivar' }, { near: 'runa' }] };

const rules: Rule[] = [
  { cleared: true, do: [{ run: 'bountyCheck' }] },
  { on: ['price', 'price *'], if: [{ near: 'odd' }, { flag: 'hearth.lit' }], do: [{ say: '"검은 스물다섯. 방패는 열다섯. 사슬 갑옷은 마흔다섯. 강철은 예순. 단련은 마흔부터 시작해서 오른다. 철은 좋게 만들수록 더 어려워지니까," 오드가 말한다.' }] },
  { on: ['price', 'price *'], if: [{ near: 'odd' }], do: [{ say: '"검은 스물다섯. 방패는 열다섯. 사슬 갑옷은 마흔다섯. 강철은 예순. 자격을 갖춘 사람에게는," 오드가 말한다.' }] },
  { on: ['price', 'price *'], if: [{ near: 'halla' }], do: [{ say: '"맥주는 은화 한 닢. 스튜도 마찬가지. 붉은 물약은 여섯, 횃불은 셋, 침대는 하룻밤에 넷이야," 할라가 말한다. "어제랑 똑같아."' }] },
  { on: ['price', 'price *'], if: [{ near: 'fenn' }], do: [{ say: '"치유는 은화 열다섯, 서리는 스물, 결계는 스물다섯이오," 펜이 말한다. "지식이 이렇게 싼 적은 없었는데, 그래도 대부분에게는 비싸오."' }] },
  { on: ['price', 'price *'], if: [withFolk], do: [{ say: '"물약은 은화 일곱이요. 늑대 가죽에는 넷, 곰 가죽에는 열, 서리버섯에는 둘을 주오."' }] },
  { on: ['price', 'price *'], do: [{ say: '여기서는 아무도 팔지 않는다.' }] },
  { on: ['heal', 'heal *'], if: [{ knows: 'mend' }], do: [{ say: '그것엔 주문이 있지 않은가. 시전만 하면 된다.' }] },
  { on: ['heal', 'heal *'], do: [{ say: '붉은 물약이면 되고, 침대에서의 하룻밤도, 찾을 수만 있다면 성소의 돌들도 그렇다.' }] },
  { on: ['brew', 'brew *'], do: [{ say: '솥도 없고, 꺼지지 않는 불도 없고, 어떤 버섯이 다른 종류인지도 모른다.' }] },
  { on: ['hide', 'hide *'], do: [{ say: '늑대 코가 못 찾을 숨을 곳은 없다. 목덜미에 눈을 넣은 채 다시 일어선다.' }] },
  { on: ['follow', 'follow *'], do: [{ say: '한참을 따라간다. 자취가 다른 자취와 교차하고, 그것은 또 세 번째와, 그리고 전부 네 것이었다.' }] },
  { on: ['skin', 'skin *'], do: [{ say: '가져갈 만한 가죽이면 가져간다. 너를 먹으려 한 것에 감상적이지 않는 법을 배웠다.' }] },
  { on: ['light camp', 'light hearth'], if: [{ not: { has: 'flint' } }], do: [{ say: '마른 나무가 없고, 여기서 피우는 불은 이빨 가진 모든 것에게 켜 놓은 창가의 등불이다. 계속 걷거나, 지붕을 찾는 게 낫다.' }] },
  { on: ['sleep camp'], do: [{ say: '마른 나무가 없고, 여기서 피우는 불은 이빨 가진 모든 것에게 켜 놓은 창가의 등불이다. 계속 걷거나, 지붕을 찾는 게 낫다.' }] },
  { on: ['light snow', 'take snow', 'drop snow', 'attack snow'], do: [{ say: '눈덩이를 뭉치고, 던질 사람을 둘러보고, 관두기로 한다.' }] },
  { on: ['enter village', 'enter hall'], do: [{ say: '먼 길이고, 아무도 대신 걸어 주지 않는다. 지도가 길을 보여준다.' }] },
  { on: ['blow ember', 'pet ember', 'light ember', 'warm ember', 'open ember'], if: [{ has: 'ember' }], do: [{ run: 'emberHome' }] },
  // The thaw comes south behind whoever ended the winter.
  { enter: true, if: [{ flag: 'winter.broken' }, { not: { flag: 'thaw.home' } }], do: [{ run: 'thawComes' }] },
  // Three coals from Halla's fire never get as far as the bridge.
  { enter: true, if: [{ has: 'coals' }, { not: { at: ['village', 'inn', 'hall'] } }], do: [{ lose: 'coals' }, { say: "뿔을 열어 들여다본다. 할라의 화로에서 온 숯 세 개는 전부 새까맣게 식었다. 그녀 말대로, 다리에 이르기 전에 죽어 있었다. 눈 속에 쏟아 버린다." }] },
  { on: ['blow', 'blow *'], do: [{ say: '숨을 내쉰다. 입김이 잠시 공기에 머물고, 얼까 고민하다가, 흩어진다.' }] },
  { on: ['temper', 'temper *'], do: [{ say: '그것은 대장장이의 일이고, 대장장이는 홀로미어의 오드뿐이다.' }] },
  // Trade at the lone steadings.
  { on: ['buy potion', 'buy'], if: [withFolk, { gold: 7 }], do: [{ gold: -7 }, { give: 'potion' }, { sound: 'take' }, { say: '은화 일곱 닢이 오가고, 모피 아래에서 붉은 물약이 나온다. "효과는 있소. 뭐가 들었는지는 묻지 마시오."' }] },
  { on: ['buy potion', 'buy'], if: [withFolk], do: [{ say: '"물약은 은화 일곱이요. 여기를 돌아다니는 사람들에게 외상은 없소. 돌아오지 않는 경향이 있어서."' }] },
  { on: ['sell pelt', 'give pelt'], if: [withFolk, { has: 'pelt' }], do: [{ lose: 'pelt' }, { gold: 4 }, { sound: 'take' }, { say: '가죽이 털도 가죽결도 검사받고, 온전하다는 판정을 받는다. 은화 네 닢.' }] },
  { on: ['sell bearskin', 'give bearskin'], if: [withFolk, { has: 'bearskin' }], do: [{ lose: 'bearskin' }, { gold: 10 }, { sound: 'take' }, { say: '"그걸 잡았다고? 당신이?" 긴 눈빛, 그러고는 은화 열 닢을 새로운 존경을 담아 센다.' }] },
  { on: ['sell herb', 'give herb'], if: [withFolk, { has: 'herb' }], do: [{ lose: 'herb' }, { gold: 2 }, { sound: 'take' }, { say: '서리버섯에 은화 두 닢. "솥에 넣게. 겨울은 길고 토끼는 질렸소."' }] },
  { on: ['buy tonic', 'buy herb tonic', 'buy tonic herb', 'light tonic'], if: [{ near: 'runa' }, { has: 'herb', n: 3 }], do: [{ lose: 'herb', n: 3 }, { give: 'tonic' }, { sound: 'take' }, { score: 3, id: 'tonic' }, { say: '루나가 서리버섯 세 개를 받아 작은 절구에 항아리 속 검은 것과 함께 찧고, 결과물을 네 엄지만 한 병에 붓는다. "앉아서 마셔."' }] },
  { on: ['buy tonic', 'buy herb tonic', 'buy tonic herb', 'light tonic'], if: [{ near: 'runa' }], do: [{ say: '"서리버섯 세 개면 토닉을 끓여 주지," 루나가 말한다. "두 개는 안 돼. 두 개로는 해 봤어."' }] },
  { on: ['sell *', 'sell'], if: [withFolk], do: [{ say: '"가죽, 곰 가죽, 서리버섯이요. 다른 건 쓸 데도, 둘 데도 없소."' }] },
  { on: ['sell pelt', 'sell bearskin'], do: [{ say: '여기서는 아무도 사지 않는다. 홀로미어의 대장장이 오드가 가죽을 산다.' }] },
  { on: ['sell herb'], do: [{ say: '여기서는 아무도 사지 않는다. 여관의 할라가 스튜에 쓰겠다고 받을 것이다.' }] },
  { on: ['sell venison', 'give venison'], if: [withFolk, { has: 'venison' }], do: [{ lose: 'venison' }, { gold: 4 }, { sound: 'take' }, { say: '"사슴! 잎이 진 뒤로 토끼만 먹었소." 은화 네 닢과, 진심 어린 감사의 눈빛.' }] },
  { on: ['sell venison'], do: [{ say: '여기서는 아무도 사지 않는다. 여관의 할라가 신선한 고기에는 돈을 낼 것이다.' }] },
  { on: ['pet stag', 'take stag', 'talk stag', 'kiss stag'], do: [{ say: '네가 한 걸음 다가서면, 그것은 서른 걸음 멀어진다.' }] },
  { on: 'look self', do: [{ say: '뒤의 길이 앞의 동전보다 많은 방랑자. 네 망토는 더 나은 겨울을 보았다.' }] },
  { on: ['light torch', 'use torch'], if: [{ has: 'torch' }], do: [{ run: 'lightTorch' }] },
  { on: ['light torch', 'use torch'], do: [{ say: '횃불이 없다. 여관에서 할라가 판다.' }] },
  // Fire, anywhere nothing in particular is waiting to be lit.
  { on: ['light *', 'light', 'use flint', 'use flint *'], if: [{ has: 'flint' }, { afield: false }, { not: { flag: 'hearth.lit' } }], do: [{ say: '마른 이끼 한 줌에 강철을 쳐서 불을 붙인다. 붙는다. 그러고는 작은 불꽃이 바람도 없는데 바람에 눌리듯 납작하게 눕더니, 연기도 없이 꺼진다.' }] },
  { on: ['light *', 'light', 'use flint', 'use flint *'], if: [{ has: 'flint' }], do: [{ say: '불똥을 튀긴다. 붙기는 하겠다. 하지만 여기서 태우고 싶은 것은 없고, 여기서의 불은 이빨 가진 모든 것에게 켜 놓은 등불이다.' }] },
  { on: ['light *', 'light'], do: [{ say: '불 붙일 것도 없고, 그것도 고마워하지 않을 것이다.' }] },
  { on: ['use ring', 'look ring', 'take ring'], if: [{ has: 'ring' }], do: [{ say: '손가락의 반지를 돌려 본다. 오래됐고, 수많은 손에 반질반질하게 닳았다.' }] },
  { on: ['dance', 'dance *'], do: [{ say: '몇 걸음 춤을 춘다. 박수 치는 사람도 없지만, 말리는 사람도 없다.' }] },
  { on: ['sing', 'sing *'], do: [{ say: '아는 한 절을 부른다. 메아리가 조금 나아지게 해 준다.' }] },
  { on: ['pray', 'pray *'], do: [{ say: '듣고 있을 누군가에게 몇 마디를 올린다. 추위는 그대로지만, 마음은 조금 낫다.' }] },
  { on: ['jump', 'jump *'], do: [{ say: '점프했다. 다시 내려왔다. 사가는 아직 무관심하다.' }] },
  { on: ['sleep', 'sleep *'], do: [{ say: '여기 누우면 못 일어날지도 모른다. 침대를 찾아라. 여관에 있다.' }] },
  { on: 'wait', if: [{ flag: 'winter.broken' }], do: [{ say: '시간이 흐른다. 어디선가 무언가가 물방울을 떨어뜨린다.' }] },
  { on: 'wait', do: [{ say: '시간이 흐른다. 여전히 춥다.' }] },
  { on: ['shout', 'shout *'], do: [{ say: '목소리가 산 쪽으로 굴러간다. 저 위의 무언가가 들었는지도 모른다.' }] },
  { on: ['listen', 'listen *'], if: [{ flag: 'winter.broken' }], do: [{ say: '바람, 그리고 그 아래 물. 얼음 밑에서 방울지고, 흐르고, 혼잣말한다.' }] },
  { on: ['listen', 'listen *'], do: [{ say: '바람, 그리고 그 아래 눈 가라앉는 소리.' }] },
  { on: ['smell', 'smell *'], do: [{ say: '나무 연기와 소나무. 추위에도 냄새가 있다는 걸 배우는 중이다.' }] },
  { on: ['sit', 'sit *'], do: [{ say: '잠시 앉는다. 추위가 소문처럼 몸을 타고 올라와, 다시 선다.' }] },
  { on: 'xyzzy', do: [{ say: '속 빈 목소리가 아무 말도 하지 않는다. 잘못 찾아온 사가다.' }] },
  { on: ['sell', 'sell *'], do: [{ say: '홀로미어에는 네 물건에 낼 여윳돈이 없다. 자기 것을 팔고 싶어할 뿐이다.' }] },
  { on: ['chop', 'chop *'], do: [{ say: '찍을 필요도 없고, 고마워하지도 않을 것이다.' }] },
  { on: ['wish', 'wish *'], do: [{ say: '짧고 간절하게 빌었다. 아무것도 변하지 않는다. 늘 그런 약속이다.' }] },
  { on: ['warm', 'warm *'], if: [{ flag: 'winter.broken' }], do: [{ say: '습관적으로 손가락에 입김을 불다가, 필요 없었음을 깨닫는다.' }] },
  { on: ['warm', 'warm *'], do: [{ say: '손가락에 입김을 분다. 차가운 채다. 모든 것이 차가운 채다.' }] },
  { on: ['bye', 'bye *'], do: [{ say: '끄덕인다. 끄덕임은 공짜다.' }] },
  { on: ['yes', 'no'], do: [{ say: '아무도 묻지 않았다. 하지만 네 입장은 기록해 두겠다.' }] },
  { on: ['curse', 'curse *'], do: [{ say: '네 할머니가 들었다면 부끄러워하셨을 것이다. 산은 더 한 것도 들었다.' }] },
  { on: ['learn', 'learn *'], do: [{ say: '주문은 책을 읽어 배운다. READ 하나 하면 된다. 룬어는 그것을 품은 선돌을 읽어 배운다.' }] },
  { on: ['freeze', 'freeze *'], do: [{ say: '이미 충분히 얼었다. 여기 모든 것이.' }] },
  { on: ['skate', 'skate *'], do: [{ say: '여기에는 미끄러질 만큼 매끈한 것이 없다.' }] },
  { on: ['fish', 'fish *'], do: [{ say: '낚싯줄도, 바늘도, 인내심도 없다. 물고기들은 안전하다.' }] },
  { on: ['block', 'block *'], do: [{ say: 'Shift를 누르고 있으면 가드가 올라간다. 정면에서 오는 것만 막으니, 일격을 향해 몸을 돌려라. 적이 힘을 모으며 금색 !가 보일 때 올리면, 일격이 통째로 쳐내진다.' }] },
  { on: ['run', 'run *'], do: [{ say: '이미 눈이 허락하는 한 빨리 가고 있다.' }] },
  { on: ['say', 'say *'], do: [{ say: '말해 본다. 찬 공기가 말을 삼킨다. (누군가에게 말하려면 TALK TO.)' }] },
  { on: ['kiss *', 'pet sigga', 'pet elder', 'pet halla'], do: [{ say: '다시 생각해 관둔다. 오늘 한 일 중 가장 현명하다.' }] },
  { on: ['pet wolf', 'kiss wolf'], do: [{ say: '그것은 그에 대한 의견이 있고, 표현할 이빨도 있다.' }] },
  { on: ['attack sigga', 'attack elder', 'attack odd', 'attack halla', 'attack fenn', 'attack toke', 'attack gorm', 'attack girl', 'attack boy'], do: [{ say: '사방으로 일주일 안쪽에서 너를 들여준 유일한 사람들이다. 맞을 짓을 한 것을 쳐라.' }] },
  { on: ['attack', 'attack *'], do: [{ say: '여기에는 맞아야 할 것이 없다. 시간을 두라.' }] },
  { on: ['thank *', 'thank'], do: [{ say: '예의는 공짜다. 딱 네가 치를 수 있는 값이다.' }] },
  { on: ['buy', 'buy *'], do: [{ say: '여기서는 아무도 그것을 팔지 않는다.' }] },
  { on: ['give *', 'give * *'], do: [{ say: '여기서는 아무도 그것을 원하지 않는다.' }] },
  { on: ['open *', 'close *', 'push *', 'pull *', 'climb *', 'enter *', 'knock *', 'dig', 'dig *'], do: [{ say: '해 본다. 차가운 손 말고는 얻는 게 없다.' }] },
  { on: ['eat snow', 'eat *'], do: [{ say: '배는 고프지만, 그 정도는 아니다. 아직은.' }] },
  { on: ['swim', 'swim *'], do: [{ say: '여기에는 헤엄칠 것이 없다. 감사하게 여겨라.' }] },
  { on: ['read *', 'read'], do: [{ say: '알아볼 수 있게 쓰인 것은 아무것도 없다.' }] },
];

// What a skald would sing of. Only the ones done are ever shown, so the list can grow without end.
const deeds: Content['deeds'] = [
  { text: '맨몸으로 북쪽을 걸어와, 연기 오르는 한 채의 지붕을 향해 내려갔다.' },
  { if: [{ knows: 'word:iska' }], text: '낡은 망루 옆 돌에서 ISKA를 읽고, 한 단어가 이어지는 동안 하늘의 눈 전부를 그 위에 얹었다.' },
  { if: [{ flag: 'wolves.killed', min: 3 }], text: '소나무 숲을 조용하게 했고, 그 대가로 활을 받았다.' },
  { if: [{ quest: 'stores', is: 2 }], text: "여울 너머의 도적들에게서 고름의 씨곡물을 되찾았다." },
  { if: [{ quest: 'errand', is: 2 }], text: '한마디 말로 못을 얼리고, 얼음이 간직했던 것을 펜에게 돌려주었다.' },
  { if: [{ flag: 'hearth.lit' }], text: "장로가 멈췄을 때 화로에 불을 놓고 불씨를 튀겼고, 홀로미어의 테인으로 불렸다." },
  { if: [{ flag: 'farm.stray' }], text: "고름의 네 번째 암양을 황야에서 집으로 데려왔다." },
  { if: [{ flag: 'boy.horse' }], text: '눈 속 썰매에서 깎은 말을 건져 와, 주인이 될 사람을 찾아주었다.' },
  { if: [{ flag: 'bounty.n', min: 1 }], text: "황야에서 장로의 일을 했다. 지금까지 끝낸 일: {bounty.n}." },
  { if: [{ quest: 'message', is: 3 }], text: '마르타 콜드핸드의 장갑을 사십 년 늦게 이바르 원글러브에게 전했다.' },
  { if: [{ quest: 'greyback', min: 2 }], text: '여섯 겨울 동안 덫을 털던 그레이백을 죽였다.' },
  { if: [{ flag: 'tonic' }], text: "Drank Runa's tonic, and kept it down." },
  { if: [{ has: 'trappack' }], text: '늑대 여섯 마리의 가죽을 브레카에게 가져갔고, 배낭이 되어 다시 메고 나왔다.' },
  { if: [{ has: 'frame' }], text: "Took up a pedlar's frame where he set it down, having further to go than he did." },
  { if: [{ knows: 'word:veth' }], text: '서쪽 능선의 돌에서 VETH를 읽었다.' },
  { if: [{ flag: 'sight.shuthouse' }], text: "Opened a dead man's door with a word, and slept a night out of the wind." },
  { if: [{ flag: 'bell.rung' }], text: '가라앉은 종을 울렸다. 대답을 오래 기다린 종이었다.' },
  { if: [{ knows: 'word:sol' }], text: "Waited for dark at the Giant's Table, and read what only shows then." },
  { if: [{ flag: 'tree.cut' }], text: '교수목 아래의 죽은 자들을 베어 내리고, 곧게 뉘었다.' },
  { if: [{ flag: 'tree.looted' }], text: '교수목 아래의 도적들을 털었다.' },
  { if: [{ flag: 'gate.open' }], text: "Said the sun's name at the north gate, to guards nobody ever came to relieve." },
  { if: [{ knows: 'word:orun' }], text: '늙은이가 지나지 못하는 문 너머에서, 산 사람이 읽은 적 없는 돌의 ORUN을 읽었다.' },
  { if: [{ flag: 'coal.given' }], text: '한 번의 숨 동안 하늘 전체를 한 단어에 얹었고, 집으로 가는 길을 건네주었다.' },
  { if: [{ flag: 'sol.said' }], text: "Said the sun's name in the hollow, and ended a winter three hundred years long." },
  { if: [{ flag: 'home.cup' }], text: '아무도 마시지 않는 잔을 마셨다.' },
  { if: [{ flag: 'hart.killed' }], text: '대부분의 사냥꾼이 보지도 못하는 흰 사슴을 쓰러뜨렸다.' },
  { if: [{ flag: 'deer.killed' }], text: '제 저녁거리를 사냥해 쓰러뜨렸다.' },
  { if: [{ flag: 'kills', min: 1 }], text: '{kills}의 적을 쓰러뜨리고, 매번 걸어 나왔다.' },
];

const roomList: RoomDef[] = [ford, village, pinewood, farm, tower, camp, ridge, barrow, tarn, hall, inn, hut, bellmere, hangtree, dolmen, northgate, oldroad, windend, hanging, hollow];

export const content: Content = {
  title: "테인의 모험",
  tagline: '북쪽의 타이핑 어드벤처',
  saveVersion: 2,
  flags: { 'temper.weaponCost': 40, 'temper.armorCost': 40 },
  start: { room: 'ford', x: 160, y: 160, dir: 'up' },
  hero,
  vocab,
  rooms: Object.fromEntries(roomList.map((r) => [r.id, r])),
  chars,
  items,
  enemies,
  quests,
  spells,
  words,
  perks,
  frontier,
  rules,
  // A pack holds thirty-five to begin with; a deeper wind adds five for every level put into stamina.
  carry: { base: 35, stamina: 0.5 },
  music,
  cues: { title: 'valley', battle: 'battle', fallback: 'wild', night: 'night', boss: 'doom' },
  // Where the wind stops, the snow does not fall at all; and once the winter has broken it is only weather.
  calm: [{ flag: 'winter.broken' }],
  rest: [{ flag: 'winter.broken' }],
  text,
  hints: [
    { if: [{ flag: 'home.cup' }], text: '겨울이 깨졌고, 문에서 가장 가까운 벤치 끝에 네 자리가 있다. 장로에게는 늘 일이 있고, 대장장이는 늘 은을 원하며, 지도에는 여전히 무엇보다 빈칸이 많다.' },
    { if: [{ flag: 'winter.broken' }, { flag: 'sol.said' }, { flag: 'marta.thaw' }], text: '겨울이 깨졌다. 장로에게는 늘 일이 있고, 대장장이는 늘 은을 원하며, 지도에는 여전히 무엇보다 빈칸이 많다.' },
    { if: [{ flag: 'winter.broken' }], text: '겨울이 깨지고 있고, 해빙은 네가 걷는 것보다 빨리 남쪽으로 간다. 멀리 열한 지붕에 연기가 있고, 한쪽 끝에 불이 있고 다른 쪽 끝에 문이 있는 홀이 있다.' },
    { if: [{ flag: 'hearth.lit' }, { quest: 'north', max: 0 }], text: "너는 홀로미어의 테인이다. 손가락에 반지, 뿔 상자에 숯. 여전히 날마다 추워진다. 마지막으로 그녀의 불 곁에 있을 때, 장로에게 더 할 말이 있었다." },
    { if: [{ flag: 'hearth.lit' }], text: '너는 홀로미어의 테인이다. 물으면 장로에게는 늘 일이 있고, 오드는 네 칼을 단련해 주며, 골짜기 너머에는 아직 찾지 못한 사람들과 장소들이 있다.' },
    { if: [{ flag: 'marta.met' }], text: '홀로미어의 모든 사람이 한 방에 있다. 대부분 할 말이 있고, 한두 명은 원하는 것이 있다.' },
    { text: '한 지붕에서 연기가 오른다. 그 아래 누가 있든, 여기서 무슨 일이 있었는지 알 것이다.' },
  ],
  deeds,
  fallbacks,
  intro,
};

