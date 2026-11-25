// Hand-made places far out in the wild: three landmarks, east, north and south.

import type { RoomDef } from '../../../engine/types';

export const far = (hz: number, seed: number): RoomDef['scene']['layers'] => [
  { t: 'sky', horizon: hz },
  { t: 'mountains', base: hz + 3, height: 52, seed, far: true },
  { t: 'mountains', base: hz + 5, height: 28, seed: seed + 1 },
  { t: 'treeline', y: hz + 4, seed: seed + 2, shade: 0.34, hmin: 5, hvar: 6, spacing: 5 },
  { t: 'snow', from: hz + 4 },
];

export const bellmere: RoomDef = {
  id: 'bellmere',
  mark: 'mere',
  music: 'barrow',
  name: '가라앉은 종',
  look: '넓은 호수, 끝에서 끝까지 회색으로 얼었다. 한가운데 커다란 청동 종의 초록 어깨가 기울어 얼음에 붙들려 있다. 한때 여기 마을이나 나룻배나 예배당이 있었다, 종을 원한 무언가가. 종만 남았다. 여기선 아무것도 움직이지 않는다, 늑대조차. 한가운데로 가면 얼음이 얇은 얼음답게 유리처럼 맑아진다.',
  scene: {
    kind: 'outdoor', horizon: 64, walkTop: 94,
    layers: [...far(64, 501), { t: 'ice', x: 160, y: 138, rx: 118, ry: 24 }, { t: 'tufts', count: 12, seed: 504 }],
    props: [
      { t: 'bell', x: 160, y: 137, r: 26 },
      { t: 'pine', x: 30, y: 104, h: 62, seed: 505 },
      { t: 'pine', x: 284, y: 102, h: 56, seed: 506 },
      { t: 'pine', x: 246, y: 100, h: 44, seed: 507 },
      { t: 'boulder', x: 24, y: 154, r: 8, seed: 508 },
      { t: 'boulder', x: 300, y: 160, r: 7, seed: 509 },
      { t: 'pine', x: 310, y: 186, h: 90, seed: 510 },
    ],
  },
  zones: [{ id: 'thin', x0: 104, y0: 127, x1: 216, y1: 149 }],
  things: [
    { id: 'ice', nouns: ['tarn', 'water'], x: 160, y: 138, reach: 400, look: '물가는 회색이고 한가운데로 갈수록 맑아져 아주 아래까지 보인다. 종은 얼음 아래로 위에 보이는 것보다 훨씬 멀리 이어진다. 다른 형체들도. 아마 서까래, 그리고 벽 같은 무언가.' },
    // Its reach stays inside the thin ice: the bell cannot be rung from the edge of it.
    { id: 'bell', nouns: ['bell', 'inscription'], x: 160, y: 140, reach: 18, try: ['ring bell', 'read bell'], look: '녹슨 청동, 얼음 위로 드러난 부분이 사람 키만 하고, 아래에 적어도 그만큼 더. 손바닥만 한 글자들이 테두리에 새겨져 있다.' },
    { id: 'trees', nouns: ['tree'], x: 30, y: 106, reach: 400, look: '물가에 소나무 몇 그루. 뿌리가 오래된 다듬돌들을 땅에서 들어 올렸다.' },
    { id: 'snow', nouns: ['snow', 'ground'], x: 160, y: 160, reach: 400, look: '얼음 위로 얇게 날렸다. 종에 쌓인 곳은 초록 빛이 난다.' },
    { id: 'sky', nouns: ['sky', 'mountain'], x: 160, y: 100, reach: 400, look: '넓은 회색 하늘, 종을 울릴 만한 것이 아무것도 없는.' },
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.bellmere' } }], do: [{ set: 'seen.bellmere' }, { score: 5, id: 'seen.bellmere' }] },
    { zone: 'thin', if: [{ not: { flag: 'bell.frozen' } }], do: [{ die: '열두 걸음쯤 나갔을 때 얼음이 말하고, 듣고 싶은 말이 아니다. 그 아래 물이 여기선 깊고, 종은 오래도록 벗을 기다렸다.' }] },
    { on: 'iska', if: [{ flag: 'bell.frozen' }], do: [{ say: '호수는 얼 수 있는 만큼 단단하다. 아주 아래에서 무언가가 끽 소리를 낸다.' }] },
    { on: 'orun', do: [{ say: "ORUN. 얼음이 맑아진다, 바닥까지. 그 아래 지붕들이 있다. 거리 하나 분의, 마룻대까지, 종 발치로 이어지는. 더 멀리, 호수가 가장 깊은 곳에, 작고 어두운 형체들이 바닥을 따라 일렬로, 일정한 간격으로 놓여 있다, 줄로 묶여 얼음을 건너는 사람들의 간격으로. 종이 그들을 불러들였다. 단어를 거둔다, 기쁘게." }] },
    { on: 'iska', do: [{ set: 'bell.frozen' }, { score: 3, id: 'bell.frozen' }, { say: 'ISKA. 단어가 서리가 되어 호수 위로 퍼지고, 그 아래 얼음이 긴 신음으로 하얗게 두꺼워진다. 이제 너를 받쳐 주겠다, 종까지.' }] },
    { on: ['cast frost'], if: [{ knows: 'frost' }, { not: { flag: 'bell.frozen' } }], do: [{ set: 'bell.frozen' }, { score: 3, id: 'bell.frozen' }, { say: '추위에 추위를 쏟아붓는다. 얼음이 신음하고, 하얗게 되고, 끝에서 끝까지 두꺼워진다.' }] },
    { on: ['read bell', 'read inscription', 'look inscription'], if: [{ near: 'bell' }], do: [{ say: '테두리에 새겨져 있다, 손바닥만 한 글자로. 내가 그들을 불러들였다. 내가 그들을 집으로 불렀다. 대답은 없었다.' }] },
    { on: ['read bell', 'read inscription'], do: [{ say: '테두리에 글자가 있지만 물가에서는 읽을 수 없다.' }] },
    { on: ['attack bell', 'push bell', 'pet bell', 'use bell', 'knock bell', 'veth'], if: [{ near: 'bell' }, { flag: 'bell.rung' }], do: [{ sound: 'word' }, { say: '다시 울린다, 더 낮고 짧게. 할 말은 했다.' }] },
    {
      on: ['attack bell', 'push bell', 'pet bell', 'use bell', 'knock bell', 'veth'], if: [{ near: 'bell' }],
      do: [
        { set: 'bell.rung' }, { sound: 'word' }, { run: 'attune' }, { score: 10, id: 'bell.rung' },
        { say: '종을 친다. 잠시 아무 일도 없고, 네가 어리석게 느껴진다. 그러다 그것이 말한다. 한 음, 너무 깊어서 듣기 전에 장화 아래 얼음으로 먼저 느낀다. 호수와 물가와 그 너머 언덕들로 퍼져 나가고, 멈추지 않는다. 어딘가에서 아직 울리고 있다.\n\n일부가 남는다. 네 가슴뼈 뒤, 단어들이 사는 곳에 가라앉은 게 느껴진다, 자리를 넓히며.' },
        { note: '네 마나가 전보다 깊어졌다.' },
      ],
    },
    { on: ['attack bell', 'push bell', 'use bell', 'knock bell'], do: [{ say: '곁에 서 있어야 하는데, 한참 멀리 있다.' }] },
    { on: ['take bell', 'pull bell'], do: [{ say: '집만큼 무겁고 호수에 얼어붙어 있다. 그래도 당겨 본다, 생색으로.' }] },
    { on: ['swim', 'swim tarn', 'skate', 'skate tarn', 'fish', 'fish tarn'], do: [{ say: '여기선 안 된다. 이 물이 품은 것이 무엇이든, 오래 품어 왔고, 나눌 생각은 없어 보인다.' }] },
  ],
};

export const hangtree: RoomDef = {
  id: 'hangtree',
  mark: 'dead',
  music: 'wild',
  name: '목매다는 나무',
  look: '회당만 한 죽은 참나무가 언덕에 홀로 서 있고, 가지에서 밧줄들이 매달려 있다. 열두 개, 그 이상, 끝마다 올가미. 어떤 올가미는 비어 있지 않다. 아래에 약탈자들이 천막을 쳤다, 나무가 깃발인 것처럼.',
  lookWhen: [
    { if: [{ flag: 'winter.broken' }, { flag: 'tree.cut' }], look: '회당만 한 죽은 참나무가 언덕에 홀로 서 있고, 잘린 밧줄들이 가지에서 매달려 물을 떨군다. 아래에 바르게 눕힌 죽은 이들이 침대처럼 무른 눈 속으로 가라앉았다.' },
    { if: [{ quiet: true }, { flag: 'tree.cut' }], look: '회당만 한 죽은 참나무가 언덕에 홀로 서 있고, 잘린 밧줄들이 가지에서 매달려 있다. 아래, 눈 속에 바르게 눕혀, 네가 내린 죽은 이들이 있다. 천막은 비었고, 불은 꺼져 간다.' },
    { if: [{ quiet: true }], look: '회당만 한 죽은 참나무가 언덕에 홀로 서 있고, 밧줄들이 가지에서 매달려 있고, 전부 비지는 않았다. 아래 천막들은 이제 비었고, 불은 꺼져 간다. 위에서 아무것도 돌지 않는다. 그럴 바람이 없다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 62, walkTop: 96,
    layers: [...far(62, 521), { t: 'path', w: 10, pts: [[160, 172], [150, 148], [130, 134]] }, { t: 'tufts', count: 10, seed: 524 }],
    props: [
      { t: 'deadtree', x: 174, y: 122, h: 112, seed: 14, v: 'ropes' },
      { t: 'tent', x: 70, y: 122, w: 46 },
      { t: 'tent', x: 262, y: 120, w: 42 },
      { t: 'campfire', x: 110, y: 152 },
      { t: 'boulder', x: 230, y: 158, r: 8, seed: 525 },
      { t: 'barrel', x: 40, y: 150 },
      { t: 'pine', x: 12, y: 186, h: 92, seed: 526 },
      { t: 'pine', x: 308, y: 186, h: 96, seed: 527 },
    ],
  },
  spawns: [
    { id: 'treechief', kind: 'chief', x: 130, y: 140, level: 2 },
    { id: 'treebandit', kind: 'bandit', x: 220, y: 146, level: 2 },
    { id: 'treearcher', kind: 'archer', x: 60, y: 140, level: 2 },
  ],
  things: [
    { id: 'oak', nouns: ['tree', 'rope'], x: 174, y: 126, reach: 40, try: ['cut rope'], look: '참나무, 백 년 전에 죽고 쇠처럼 단단하다. 밧줄은 더 새것이다. 어떤 건 아주 새것. 올가미 안의 것은 자세히 보지 않는다. 하나하나가 같은 쪽을 향해 매달려 있다는 것만 알 만큼만.',
      lookWhen: [{ if: [{ flag: 'tree.cut' }], look: '참나무, 백 년 전에 죽고 쇠처럼 단단하다, 잘린 밧줄 열두 개가 매달려 있다. 이제 다시 나무일 뿐이다.' }],
    },
    {
      id: 'laid', nouns: ['wight', 'bones'], x: 150, y: 150, reach: 60, hidden: true, look: '네가 내린 죽은 이들, 눈 속에 바르게, 나란히, 손을 모아 눕혔다. 이름은 아무도 몰랐다. 모두 북쪽을 향해 매달려 있었다.',
      lookWhen: [{ if: [{ flag: 'winter.broken' }], look: '바르게 눕힌 죽은 이들이 침대처럼 무른 눈 속으로 가라앉았다. 일어날 생각은 없어 보인다.' }],
    },
    { id: 'tents', nouns: ['tent', 'hearth', 'barrel'], x: 70, y: 126, reach: 400, look: '약탈자들의 천막, 불, 무언가의 통. 그들은 여기 산다, 저것 아래. 사람에게 무슨 짓을 하는지 궁금하다.' },
    { id: 'roots', nouns: ['ground', 'snow'], x: 174, y: 130, reach: 400, look: '나무 주변 눈은 단단히 짓밟혔다. 큰 뿌리 두 개 사이는 짓밟혔다가 다시 평평하게 다듬어졌다, 눈치채길 원하지 않는 누군가에 의해.' },
    { id: 'hoard', nouns: ['chest'], x: 204, y: 134, reach: 28, icon: 'chest', hidden: true, try: ['open chest'], look: '상자, 뿌리 사이에 파묻고 덮었다. 약탈자들 자신의 몫, 서로에게서 숨긴.' },
    { id: 'sky', nouns: ['sky', 'mountain'], x: 160, y: 100, reach: 400, look: '까마귀, 아주 많이, 나무 꼭대기를 빙빙 돈다. 열매가 열린다는 걸 배웠다.' },
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.hangtree' } }], do: [{ set: 'seen.hangtree' }, { score: 5, id: 'seen.hangtree' }] },
    { on: ['climb tree', 'climb rope', 'jump tree'], do: [{ die: '가능하다는 걸 증명하려고 가장 가까운 밧줄을 타고 올라간다. 가능하다. 내려올 두 번째 밧줄에 손을 뻗었을 때 올가미의 용도를, 그리고 얼마나 잘 묶였는지를 알게 된다.' }] },
    { on: ['chop rope', 'take rope', 'attack rope', 'pull rope', 'chop tree'], if: [{ quiet: false }], do: [{ say: '주인들이 너와 그것 사이에 서 있고, 네가 어딜 보는지 눈치챘다.' }] },
    { enter: true, if: [{ flag: 'tree.cut' }], do: [{ show: 'laid' }] },
    { on: ['chop rope', 'take rope', 'attack rope', 'pull rope', 'chop tree'], if: [{ flag: 'tree.cut' }], do: [{ say: '위에는 밧줄밖에 남지 않았다.' }] },
    { on: ['chop rope', 'take rope', 'attack rope', 'pull rope', 'chop tree'], if: [{ near: 'oak', d: 60 }], do: [{ set: 'tree.cut' }, { show: 'laid' }, { score: 2, id: 'tree.ropes' }, { say: '죽은 이들을 내린다, 닿는 모든 이를, 눈 속에 바르게 눕힌다. 오래 걸린다. 아무도 고마워하지 않을 거다.\n\n모두 북쪽을 향해 매달려 있었다, 바람이 돌린 것처럼. 하지만 저 위에서 움직인 건 오래전부터 없었다.' }] },
    { on: ['chop rope', 'take rope', 'attack rope', 'pull rope', 'chop tree'], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: 'orun', if: [{ not: { flag: 'tree.cache' } }], do: [{ set: 'tree.cache' }, { show: 'hoard' }, { score: 4, id: 'tree.cache' }, { say: 'ORUN. 뿌리 사이 짓밟힌 곳이 정체를 드러낸다. 뚜껑, 위에 손바닥 깊이의 눈을 덮은.' }] },
    { on: ['dig', 'dig ground', 'dig snow', 'look ground'], if: [{ not: { flag: 'tree.cache' } }], do: [{ say: '뿌리 사이 단단한 눈을 손으로 긁는다. 뭔가 있다, 확실하다. 하지만 가장자리를 찾을 수 없다. 손가락보다 나은 수단으로 드러내야 한다.' }] },
    { on: ['open chest', 'take chest', 'look chest'], if: [{ flag: 'tree.looted' }], do: [{ say: '비었다. 약탈자들이 골짜기를 털었고, 너는 약탈자들을 털었다. 까마귀들은 이게 아주 우스운 모양이다.' }] },
    { on: ['open chest', 'take chest', 'look chest'], if: [{ flag: 'tree.cache' }, { near: 'hoard' }], do: [{ set: 'tree.looted' }, { gold: 70 }, { give: 'torc' }, { give: 'potion', n: 2 }, { sound: 'take' }, { score: 5, id: 'tree.looted' }, { say: '젖은 가죽 주머니에 은화 일흔 닢, 붉은 약 두 병, 꼰 틈에 남의 머리카락이 아직 낀 철 목걸이. 전부 가져간다. 목걸이는 먼저 눈으로 씻는다.' }] },
  ],
};

export const dolmen: RoomDef = {
  id: 'dolmen',
  mark: 'stone',
  music: 'wild',
  name: "The Giant's Table",
  look: "Two stones the height of a house, and a third laid across them like a lintel, stand alone on a bare rise. Whoever raised them was either very many or very large. The snow under the capstone has never been snowed on.",
  lookWhen: [{ if: [{ night: true }], look: "Two stones the height of a house and a third laid across them, black against the stars. Under the capstone, where by day there was only bare rock, a rune has lit: dull red, like a coal seen through a hand." }],
  scene: {
    kind: 'outdoor', horizon: 70, walkTop: 100,
    layers: [...far(70, 541), { t: 'tufts', count: 8, seed: 544 }],
    props: [
      { t: 'boulder', x: 60, y: 150, r: 9, seed: 545 },
      { t: 'boulder', x: 262, y: 156, r: 7, seed: 546 },
      { t: 'stone', x: 40, y: 122, h: 30, v: 'c', seed: 547 },
      { t: 'stone', x: 286, y: 126, h: 34, v: 'a', seed: 548 },
      { t: 'pine', x: 308, y: 186, h: 88, seed: 549 },
    ],
    when: [
      // The rune shows after dark, and for good once it has been read.
      { if: [{ not: { knows: 'word:sol' } }, { night: false }], props: [{ t: 'dolmen', x: 160, y: 124, w: 76, h: 56, seed: 6 }] },
      { if: [{ any: [{ knows: 'word:sol' }, { night: true }] }], props: [{ t: 'dolmen', x: 160, y: 124, w: 76, h: 56, seed: 6, v: 'lit' }] },
    ],
  },
  spawns: [
    { id: 'tablewarden1', kind: 'rimewalker', x: 110, y: 140, level: 2, when: 'night', respawn: 4000 },
    { id: 'tablewarden2', kind: 'wight', x: 214, y: 144, level: 2, when: 'night', respawn: 4000 },
  ],
  things: [
    { id: 'table', nouns: ['table', 'menhir', 'boulder'], x: 160, y: 128, reach: 400, look: 'The capstone alone must weigh as much as the Elder\'s hall. It has lain up there, level as a board, since before anybody was counting winters.' },
    {
      id: 'rune', nouns: ['rune', 'inscription'], x: 160, y: 130, reach: 36, try: ['read rune'],
      look: 'Under the capstone the rock has been cut back to make a smooth face, as if for a rune; but there is no rune on it. Lower down, scratched small and much later, in letters you can read: IT SHOWS ITSELF WHEN THE SUN IS GONE.',
      lookWhen: [{ if: [{ night: true }], look: 'A rune, alight on the smooth face under the capstone, like a coal seen through a hand. It was not there by day. Below it, the later scratching: IT SHOWS ITSELF WHEN THE SUN IS GONE.' }],
    },
    { id: 'stones', nouns: ['tree'], x: 40, y: 124, reach: 400, look: 'Nothing grows up here. The two small stones on either side of the rise are the nearest thing to trees: markers, perhaps, to say that you have come far enough.' },
    { id: 'snow', nouns: ['snow', 'ground'], x: 160, y: 150, reach: 400, look: 'Wind-packed, except beneath the capstone, where the ground is bare and dry and oddly warm.' },
    { id: 'sky', nouns: ['sky', 'mountain'], x: 160, y: 100, reach: 400, look: 'From this rise you can see a very long way in every direction, and in every direction there is more of it.' },
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.dolmen' } }], do: [{ set: 'seen.dolmen' }, { score: 5, id: 'seen.dolmen' }] },
    { on: ['read rune', 'pet rune', 'read inscription', 'pet inscription'], if: [{ knows: 'word:sol' }], do: [{ say: 'The rune burns on, whether the sun is up or not, now that it has been read. It has given you what it had.' }] },
    { on: ['read rune', 'pet rune', 'read inscription', 'pet inscription'], if: [{ not: { near: 'rune' } }], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: ['read rune', 'pet rune', 'read inscription', 'pet inscription'], if: [{ night: false }], do: [{ say: 'You run your hand over the smooth face under the capstone. Bare rock. If there was ever a rune here, it is not here now. The scratching underneath says: IT SHOWS ITSELF WHEN THE SUN IS GONE.' }] },
    {
      on: ['read rune', 'pet rune', 'read inscription', 'pet inscription'],
      do: [
        { teach: 'word:sol' }, { run: 'study', arg: 40 }, { sound: 'word' }, { score: 10, id: 'word.sol' },
        { say: 'You lie on your back on the frozen ground and put your palm flat against it, and it is warm. In all that country it is the only warm stone there is.\n\nThe word is SOL, and it tastes like summer, which you do not remember ever having had.' },
        { quest: 'north', stage: 3 }, { set: 'goal.gate', to: 'northgate' }, { note: 'The gate in the north is marked on your map.' },
        { note: 'Tip: type SOL to speak the word.' },
      ],
    },
    { on: ['climb table', 'climb menhir', 'climb boulder', 'climb'], do: [{ die: 'You get up one of the uprights by fingertips and bad judgement, and stand on the capstone, lord of all you survey. It is the wind that takes you off it. It is a very long way down, onto very old rock.' }] },
    { on: ['sit', 'sit table', 'sleep', 'wait'], do: [{ say: 'You sit a while under the capstone, out of the wind. It is a good place to wait for something. People have plainly waited here before: the rock is worn where they sat.' }] },
    { on: ['push table', 'push menhir', 'pull table'], do: [{ say: 'You lean on it. It has stood through everything the sky could think of for longer than there have been people to lean on it.' }] },
  ],
};

