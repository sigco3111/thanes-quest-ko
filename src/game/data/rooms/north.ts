// The road north: the gate in the last wall, and what lies beyond it. Five screens, one beyond
// another, each reached only from the one before:
//
//   hollow       where she kneels
//   hanging      the hanging snow
//   windend      where the wind stops
//   oldroad      the stone nobody living has read
//   northgate    two towers, and the guards nobody came to relieve
//
// Past the gate nothing is generated: the wall it stands in runs on east and west without end
// (`northWall` in data/frontier.ts).

import type { Cond, RoomDef, ThingDef } from '../../../engine/types';
import { far } from './far';

/** The word has ended: the snow has come down, and there is weather again. */
const BROKEN: Cond = { flag: 'winter.broken' };
const HELD: Cond = { not: BROKEN };

/** The same white ground and white sky all the way: the mountains are behind, here. */
const waste = (hz: number, seed: number): RoomDef['scene']['layers'] => [{ t: 'whiteout', horizon: hz }, { t: 'mountains', base: hz + 3, height: 12, seed, far: true }, { t: 'snow', from: hz + 2 }];

/** Nothing burns in the still country, and the coal will not wake. */
const noFire = (ids: string[]): RoomDef['rules'] => [
  { on: ['light', 'light *', 'use flint', 'use flint *', 'cast flame'], if: [HELD], do: [{ say: '여기선 아무것도 타지 않는다. 부싯쇠를 치면 불꽃이 작은 붉은 씨앗처럼 공중에 매달리고, 매달린 채로 어두워진다.' }] },
  { on: ['warm', 'warm *'], if: [HELD], do: [{ say: '여기엔 몸을 녹일 만한 것이 없다. 아주 오래전부터 없었다.' }] },
  { on: ['listen', 'listen *'], if: [HELD, { at: ids }], do: [{ say: '아무것도. 바람도 없다. 네 눈꺼풀 소리가 들린다.' }] },
];

const stillSky = (held: string, broken: string): ThingDef => ({ id: 'sky', nouns: ['sky', 'weather', 'mountain'], x: 160, y: 60, reach: 400, look: held, lookWhen: [{ if: [BROKEN], look: broken }] });

export const northgate: RoomDef = {
  id: 'northgate',
  mark: 'gate',
  music: 'barrow',
  name: '관문',
  look: '보이는 마지막 성벽이 북쪽을 가로질러 뻗어 있고, 그 유일한 틈에 관문이 서 있다. 네모난 탑 둘, 사이에 문은 없다. 틈 안에, 일렬로, 더 이상 아무도 이름을 알지 못하는 어느 왕국의 경비병들이 있다. 뼛속까지 서리인 채, 여전히 초소에 서 있다.',
  lookWhen: [
    { if: [BROKEN], look: '북쪽 성벽의 유일한 틈에 네모난 탑 둘이 서 있고, 길이 그 사이로 난다. 탑의 문들이 열려 있다. 안에서 죽은 경비병들이 돌에 등을 대고 일렬로 앉아 있다, 긴 근무를 마친 사내들처럼. 가는 비가 내린다.' },
    { if: [{ flag: 'gate.open' }], look: '북쪽 성벽의 유일한 틈에 네모난 탑 둘이 서 있고, 사이의 길이 열려 있다. 경비병들은 탑의 어둠 속으로 돌아갔다. 관문 너머 옛길이 북쪽으로 이어지고, 그 위에 발자국은 없다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 60, walkTop: 112,
    layers: [...far(60, 601), { t: 'path', w: 12, pts: [[160, 172], [160, 150], [160, 126], [160, 112]] }, { t: 'tufts', count: 8, seed: 604 }],
    props: [
      { t: 'scarp', x: 0, y: 0, v: 'n', w: 64, seed: 61 },
      { t: 'tower', x: 112, y: 122, w: 40, h: 96, seed: 62 },
      { t: 'tower', x: 208, y: 122, w: 40, h: 96, seed: 63 },
      { t: 'boulder', x: 52, y: 150, r: 9, seed: 605 },
      { t: 'boulder', x: 272, y: 156, r: 7, seed: 606 },
      { t: 'deadtree', x: 292, y: 140, h: 44, seed: 607 },
    ],
  },
  exits: { n: 'oldroad' },
  holds: { n: '죽은 경비병들이 길을 막는다. 아무도 통과시키지 말라는 명령으로 여기 배치됐고, 달리 들은 바가 없다.' },
  spawns: [
    { id: 'guard1', kind: 'gateguard', x: 136, y: 128, level: 1, if: [{ not: { flag: 'gate.open' } }] },
    { id: 'guard2', kind: 'gateguard', x: 152, y: 132, level: 1, if: [{ not: { flag: 'gate.open' } }] },
    { id: 'guard3', kind: 'gateguard', x: 168, y: 132, level: 1, if: [{ not: { flag: 'gate.open' } }] },
    { id: 'guard4', kind: 'gateguard', x: 184, y: 128, level: 1, if: [{ not: { flag: 'gate.open' } }] },
  ],
  things: [
    {
      id: 'gate', nouns: ['gap', 'tower', 'door'], x: 160, y: 118, reach: 400, look: '짜 맞춘 돌의 네모난 탑 둘, 사이에 길이 나 있고 각 탑 발치에 어두운 문이 있다. 세운 이들은 오래가게 지었고, 떠났고, 소식 전하는 걸 잊었다.',
      lookWhen: [{ if: [BROKEN], look: '짜 맞춘 돌의 네모난 탑 둘. 문들이 열려 있고, 벽을 타고 물이 흐른다.' }],
    },
    {
      id: 'watch', nouns: ['guard'], x: 160, y: 124, reach: 400, hidden: true,
      look: '탑 안, 어둠 속에 있다, 단어가 그들을 보낸 곳. 안에서 서리의 빛이 일렬로 보이고, 움직이지 않는다.',
      lookWhen: [{ if: [BROKEN], look: '죽은 경비병들이 돌에 등을 대고 일렬로 앉아 있다, 남은 창을 무릎에 얹고. 긴 근무를 마친 사내들처럼, 마침내 해임을 전해 들은.' }],
    },
    { id: 'wall', nouns: ['scarp', 'mountain'], x: 160, y: 100, reach: 400, look: '깎아지른 암벽, 보이는 한 동쪽으로 서쪽으로, 그 안에 이 틈 하나뿐. 존재하는 마지막 성벽이다. 너머의 하늘은 다른 하얀색이다.' },
    { id: 'snow', nouns: ['snow', 'ground', 'path'], x: 160, y: 150, reach: 400, look: '옛길이 눈 밑에서 관문까지 이어진다. 이 겨울 그것을 밟은 것은 너뿐이다. 보아하니 그 전 겨울들에도 한참 동안 아무도.' },
    stillSky('성벽 북쪽의 하늘은 아주 하얗고, 아주 고르다. 아무것도 움직이지 않는다. 여기 서 있으면 바람이 멎는 곳이 보인다.', '성벽 너머에 날씨가 있다, 누구의 일생에도 처음으로. 구름이, 움직이고, 비가 나온다.'),
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.northgate' } }], do: [{ set: 'seen.northgate' }, { score: 5, id: 'seen.northgate' }] },
    {
      enter: true, if: [{ not: { flag: 'gate.open' } }, { not: { flag: 'gate.met' } }],
      do: [{ set: 'gate.met' }, { say: '관문은 펜이 말한 곳에 있다. 보이는 마지막 성벽의 틈에 네모난 탑 둘, 그리고 그 사이에, 일렬로, 더 이상 아무도 이름을 알지 못하는 어느 왕국의 경비병들. 뼛속까지 서리인 채, 여전히 초소에 서 있다, 교대하러 온 사람이 없는 사내들처럼.\n\n네가 길을 올라오자 그들이 일제히 고개를 돌려 너를 보고, 남은 창을 든다.' }],
    },
    { enter: true, if: [{ flag: 'gate.open' }], do: [{ show: 'watch' }] },
    // The sun's name turns them; it does not relieve them. They stand aside for the ring.
    {
      on: 'sol', if: [{ not: { flag: 'gate.open' } }, { not: { has: 'ring' } }],
      do: [
        { set: 'gate.asked' },
        { say: '태양의 이름을 말한다.\n\n그들은 견디지 못한다. 일제히 얼굴을 돌린다. 단어가 공기에서 사라지면 되돌리고, 서 있던 곳에 서 있다. 누군가 그들을 여기 배치했고, 단어는 그 누군가가 아니다.\n\n가장 가까운 하나가 네 손을 보고 있다. 그 위에는 아무것도 없다.' },
      ],
    },
    {
      on: 'sol', if: [{ not: { flag: 'gate.open' } }],
      do: [
        { set: 'gate.open' }, { run: 'guardsGo' }, { show: 'watch' }, { sound: 'door' }, { score: 10, id: 'gate.open' }, { quest: 'north', stage: 4 },
        { say: '태양의 이름을 말한다.\n\n그들은 견디지 못한다. 얼굴을 돌리고 탑의 어둠 속으로 돌아가고, 사이의 길이 열린다.' },
      ],
    },
    { on: 'sol', if: [BROKEN], do: [{ say: 'SOL. 탑 안에서 아무도 움직이지 않는다. 그들은 이미 전해 들었다, 단어보다 큰 무언가에게.' }] },
    { on: 'sol', do: [{ say: 'SOL. 탑의 어둠 속에서 일렬의 사내들이 벽 쪽으로 얼굴을 돌리는 소리가 난다.' }] },
    { on: 'iska', if: [{ not: { flag: 'gate.open' } }], do: [{ say: 'ISKA. 그들은 선 자리에서 멎는다. 하지만 원래 어디 가던 중도 아니었다. 단어가 놓아주면 정확히 원래대로다. 멈춤은 이들에게 새소식이 아니다.' }] },
    { on: 'veth', if: [{ not: { flag: 'gate.open' } }], do: [{ say: 'VETH. 가장 가까운 하나가 창 길이만큼 튕겨 나간다. 일어나서, 서두르지 않고, 일렬의 제자리로 걸어 돌아간다.' }] },
    { on: ['enter tower', 'enter door', 'open door', 'climb tower', 'knock door'], if: [BROKEN], do: [{ say: '문 앞에 잠시 선다. 그들은 벽을 따라 일렬로 앉아 있고, 하나는 고개를 돌에 젖혔다. 들어가지 않는다. 그들의 경비실이고, 그들은 근무를 마쳤다.' }] },
    { on: ['enter tower', 'enter door', 'open door', 'climb tower', 'knock door'], do: [{ say: '문 안은 어둡고, 어둠 속의 것은 어둠의 것이다. 너는 길에 머문다.' }] },
    { on: ['climb scarp', 'climb gap', 'climb'], do: [{ say: '암벽은 깎아지르고 얼음이 발려 있다. 관문이 있다. 그게 그것의 존재 이유다.' }] },
  ],
};

export const oldroad: RoomDef = {
  id: 'oldroad',
  mark: 'stone',
  music: 'barrow',
  name: '옛길',
  look: '관문 너머 옛길이 북쪽으로 곧게 이어진다, 아무도 밟지 않은 눈 아래. 길가에 돌이 하나, 날씨에 거의 닳아 평평해진 룬 문자가 새겨져 있다. 성벽과 두 탑은 네 뒤에 있다. 앞의 하늘은 하얗고, 고르고, 아주 조용하다.',
  lookWhen: [
    { if: [BROKEN], look: '옛길이 관문에서 북쪽으로 난다, 회색으로 무르며 곳곳에 석판이 드러나는 눈 아래. 길가에 닳은 룬의 돌이 서 있다. 바람이 있고, 비가 섞였다.' },
    { if: [{ flag: 'road.prints' }], look: '관문 너머 옛길이 북쪽으로 곧게 이어진다. 길가에 돌이 하나, 거의 닳아 평평해진 룬 문자가 새겨져 있다. 길의 눈 아래, 여러 겨울 깊이에, 발자국이 있다. 여인의 것, 그리고 아이의 것. 북쪽으로 간다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 62, walkTop: 92,
    layers: [...waste(62, 611), { t: 'path', w: 12, pts: [[160, 172], [160, 140], [160, 110], [160, 90]] }, { t: 'tufts', count: 6, seed: 614 }],
    props: [
      { t: 'boulder', x: 40, y: 150, r: 7, seed: 615 },
      { t: 'boulder', x: 286, y: 132, r: 9, seed: 616 },
      { t: 'deadtree', x: 60, y: 118, h: 40, seed: 617 },
    ],
    when: [
      { if: [{ not: { knows: 'word:orun' } }], props: [{ t: 'stone', x: 214, y: 134, h: 42, v: 'a', seed: 9 }] },
      { if: [{ knows: 'word:orun' }], props: [{ t: 'stone', x: 214, y: 134, h: 42, v: 'a', seed: 9, lit: 1 }] },
    ],
  },
  exits: { s: 'northgate', n: 'windend' },
  haven: true,
  things: [
    { id: 'stone', nouns: ['menhir', 'rune'], x: 214, y: 136, reach: 34, try: ['read rune'], look: '옛길 가의 선돌, 날씨에 거의 닳아 평평해진 룬 문자가 새겨져 있다. 산 사람이 읽은 지 아주 오래됐다. 발치의 눈에는 신발이 닿은 적이 없다.' },
    {
      id: 'prints', nouns: ['tracks'], x: 160, y: 130, reach: 60, hidden: true,
      look: '발자국, 길의 눈 아래, 여러 겨울 깊이. 여인의 것, 보폭이 길다. 그리고 곁에, 길 이쪽저쪽을 오락가락하는, 오래 걸어온 아이의 걸음답게. 아이의 것. 네 뒤 관문에서 길을 따라 올라와, 북쪽으로 간다.',
      lookWhen: [{ if: [BROKEN], look: '해빙이 옛 눈을 층층이 가라앉혔고, 발자국도 함께 가고 있다. 하루면 물이 될 거다.' }],
    },
    { id: 'road', nouns: ['path', 'snow', 'ground'], x: 160, y: 150, reach: 400, look: '길. 발밑 감촉으로 석판이 깔렸고, 수레 너비만큼 넓다. 자로 잰 듯 곧게 북쪽으로 난다. 한때 누군가 사람들이 이리로 다니길 바랐고, 실제로 많이 다녔다.' },
    { id: 'wall', nouns: ['scarp', 'gap', 'tower'], x: 160, y: 168, reach: 400, look: '성벽과 관문의 두 탑이 네 뒤에 있다, 아무도 보지 않는 쪽에서 본 모습으로.' },
    stillSky('하얗고, 고르다, 성벽에서 시야 끝까지. 관문보다 바람이 적다. 조금 더 가면, 보아하니, 아예 없다.', '구름, 낮고 회색이고 급히 남쪽으로 간다, 삼백 년의 지각을 만회하려는 듯.'),
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.oldroad' } }], do: [{ set: 'seen.oldroad' }, { score: 3, id: 'seen.oldroad' }] },
    { enter: true, if: [{ flag: 'road.prints' }], do: [{ show: 'prints' }] },
    {
      on: ['read menhir', 'read rune', 'pet menhir', 'pet rune', 'look rune'], if: [{ near: 'stone' }, { not: { knows: 'word:orun' } }],
      do: [
        { teach: 'word:orun' }, { run: 'study', arg: 40 }, { sound: 'word' }, { score: 10, id: 'word.orun' },
        { say: '관문 너머, 옛길 가에, 거의 닳아 평평해진 룬의 돌이 있다, 산 사람이 아주 오래 읽지 않은. 너는 읽고, 손을 얹은 채 길에 한참 서서, 펜과, 육십 년과, 그가 지나지 못한 관문 너머의 이것에 대해 생각한다.\n\n단어는 ORUN. 숨겨진 것을 보여 준다.' },
        { note: '팁: ORUN을 입력해 단어를 말한다.' },
      ],
    },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], if: [{ near: 'stone' }], do: [{ say: '룬 문자가 이제 희미하게 빛난다. 가진 걸 너에게 줬다.' }] },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], do: [{ say: '충분히 가까이 있지 않다.' }] },
    {
      on: 'orun', if: [{ not: { flag: 'road.prints' } }],
      do: [
        { set: 'road.prints' }, { show: 'prints' }, { score: 5, id: 'road.prints' }, { quest: 'north', stage: 5 },
        { say: '길을 향해 말한다.\n\n길 위 눈이 차가운 유리의 입김처럼 엷어지고, 그 아래, 여러 겨울 깊이에, 발자국이 있다. 여인의 것, 보폭이 길고, 곁에 이리저리 기웃하는 아이의 것. 네 뒤 관문에서 길을 따라 올라와 북쪽으로 간다, 네가 가는 쪽으로, 아무도 가지 않는 쪽으로.' },
      ],
    },
    { on: 'orun', do: [{ say: 'ORUN. 발자국은 그대로다. 그녀의 것, 보폭이 길고, 곁에 작은 것들, 기웃거리며. 북쪽.' }] },
    { on: ['follow tracks', 'follow'], if: [{ flag: 'road.prints' }], do: [{ say: '북쪽으로, 길 한가운데로 간다. 길도 그렇다.' }] },
    ...noFire(['oldroad'])!.slice(1, 2),
  ],
};

export const windend: RoomDef = {
  id: 'windend',
  mark: 'open',
  music: 'barrow',
  name: '바람이 멎는 곳',
  hung: 50,
  look: '바람이 멎었다. 여기저기 눈송이가 네 얼굴 높이 공중에 매달려 있다, 고정되어, 돌아가야 한다. 북쪽으로 갈수록 더 빽빽하고, 더 빽빽해져, 벽이 된다. 너머, 시야의 아주 끝에, 탑들과 눈 밑 마을의 지붕들이 있고, 그 어느 위에도 연기가 없다.',
  lookWhen: [
    { if: [BROKEN], look: '눈이 내린다, 크고 젖고 느리게, 바람이 옆으로 몰고 있다. 매달린 나라에서 걸어 나와 바람 속으로. 멀리 북쪽에 탑들과 마을의 지붕들이 있다, 눈이 미끄러져 내리며 회색이 되어 가는.' },
    { if: [{ flag: 'still.path1' }], look: '바람이 멎었다. 눈송이들이 공중에 매달려 있다, 고정되어, 각자 있던 자리에. 북쪽으로는 벽처럼 빽빽하다. 그 벽을 뚫고 네 너비의 길이 나 있다, 단어가 밀어낸 자리. 너머, 시야의 아주 끝에, 탑들과 마을의 지붕들이 있다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 58, walkTop: 86,
    layers: [...waste(58, 621), { t: 'tufts', count: 4, seed: 624 }],
    props: [
      { t: 'boulder', x: 70, y: 140, r: 8, seed: 625 },
      { t: 'deadtree', x: 262, y: 128, h: 46, seed: 626 },
    ],
    when: [
      { if: [HELD, { not: { flag: 'still.path1' } }], props: [{ t: 'hangsnow', x: 0, y: 100, h: 78, seed: 3 }] },
      { if: [HELD, { flag: 'still.path1' }], props: [{ t: 'hangsnow', x: 0, y: 100, h: 78, w: 22, seed: 3 }] },
    ],
  },
  exits: { s: 'oldroad', n: 'hanging' },
  haven: true,
  zones: [{ id: 'curtain', x0: 0, y0: 86, x1: 320, y1: 100 }],
  things: [
    {
      id: 'flakes', nouns: ['snow'], x: 160, y: 110, reach: 400, look: '송이마다 멎었을 때 있던 자리에 매달려 있다. 내리지도, 흩날리지도. 손을 내밀어도 비켜주지 않는다. 못처럼 박혀 있다. 북쪽으로는 너무 빽빽해서 사이를 지날 수 없다.',
      lookWhen: [
        { if: [BROKEN], look: '눈. 내리고, 쌓이고, 그대로 있다가, 얼마 지나 녹는다. 너는 그걸 인정하고 싶은 것보다 오래 서서 본다.' },
        { if: [{ flag: 'still.path1' }], look: '네 단어가 만든 길이 매달린 눈 사이로 열려 있다, 네 너비만큼, 벽은 나머지처럼 고정되어. 닫히지 않는다.' },
      ],
    },
    { id: 'town', nouns: ['village', 'tower', 'roof'], x: 160, y: 60, reach: 400, look: '탑들, 눈 밑 마을의 지붕들, 아주 멀리. 그 어느 위에도 연기가 없다. 그 위의 눈은 아주 오래전부터 내리는 도중이다.', lookWhen: [{ if: [BROKEN], look: '마을, 멀리, 삼백 겨울 만에 처음으로 지붕에서 눈이 미끄러지는. 아무도 살지 않는다. 누군가 다시 살지도.' }] },
    { id: 'tracks', nouns: ['tracks', 'path', 'ground'], x: 160, y: 150, reach: 400, look: '발자국이 계속된다, 북쪽으로. 여기선 눈 표면에 더 가깝다. 그 위에 내린 눈이 더 적다.', lookWhen: [{ if: [BROKEN], look: '젖은 눈, 네 발자국만 있고 남의 것은 없다.' }] },
    stillSky('하얗고, 고요하다. 날씨가 전혀 없다.', '회색이고, 낮고, 움직인다. 네가 본 가장 좋은 하늘이다.'),
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.windend' } }], do: [{ set: 'seen.windend' }, { score: 3, id: 'seen.windend' }] },
    {
      enter: true, if: [HELD, { not: { flag: 'still.told' } }, { flag: 'tower.still' }],
      do: [{ set: 'still.told' }, { say: '들어왔는지는 바람이 멎어서 안다.\n\n잦아드는 게 아니다. 멎는다, 망루에서 눈이 멎은 것처럼. 조금 더 가면 눈도 멎어, 매달린다. 처음엔 여기저기 몇 송이뿐, 네 얼굴 높이 공중에 고정되어, 돌아가야 한다. 그 사이로, 멀리 앞에, 시야의 아주 끝에, 탑들과 눈 밑 마을의 지붕들이 있고, 그 어느 위에도 연기가 없다.' }],
    },
    {
      enter: true, if: [HELD, { not: { flag: 'still.told' } }],
      do: [{ set: 'still.told' }, { say: '들어왔는지는 바람이 멎어서 안다.\n\n잦아드는 게 아니다. 멎는다. 조금 더 가면 눈도 멎어, 매달린다. 처음엔 여기저기 몇 송이뿐, 네 얼굴 높이 공중에 고정되어, 돌아가야 한다. 그 사이로, 멀리 앞에, 시야의 아주 끝에, 탑들과 눈 밑 마을의 지붕들이 있고, 그 어느 위에도 연기가 없다.' }],
    },
    {
      enter: true, if: [BROKEN, { not: { flag: 'still.rain' } }],
      do: [{ set: 'still.rain' }, { say: '겨울이 꺾이고, 해빙이 네가 걷는 것보다 빨리 남쪽으로 간다. 매달린 나라에서 걸어 나와 바람 속으로, 바람에서 걸어 나와 가늘고 놀라운 비 속으로.' }],
    },
    { zone: 'curtain', if: [HELD, { not: { flag: 'still.path1' } }], do: [{ goto: 'windend', x: 160, y: 112, dir: 'up' }, { say: 'Here the snow hangs as thick as a wall: a whole sky of it, stopped in the middle of falling. You put your shoulder to it. It does not give. Each flake is as fixed as a nail, and will not be gone round, and will not move aside.' }, { note: 'It wants pushing aside by something stronger than a shoulder.' }] },
    {
      on: 'veth', if: [HELD, { not: { flag: 'still.path1' } }],
      do: [{ set: 'still.path1' }, { sound: 'door' }, { score: 3, id: 'still.path1' }, { say: 'VETH라고 말하자 매달린 눈 사이로 길이 밀려 열린다. 송이들이 군중처럼 비켜서고, 밀린 자리에 머문다. 그 길을 걸을 수 있다.' }],
    },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. The path is open already. The word goes down it, and you do not hear it come to anything.' }] },
    { on: 'iska', if: [HELD], do: [{ say: 'ISKA. You say it, and nothing changes; and you understand that this is because it is being said already. Everything here is inside that word. Yours goes into it like a cup of water into a lake. But the warmth goes out of your hands just the same.' }] },
    { on: 'sol', if: [HELD], do: [{ say: 'SOL. For the length of the word there are shadows: yours, and ten thousand small ones, one under every hanging flake. Then they are gone, and nothing has moved.' }] },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. The footprints show, a hand\'s depth under the snow here and no more: hers, and the small ones, which have begun to drag.' }] },
    { on: ['push snow', 'attack snow', 'take snow', 'pet snow'], if: [HELD], do: [{ say: 'You take hold of a flake between finger and thumb. It is like taking hold of a nail driven into the air. It does not come.' }] },
    ...noFire(['windend'])!,
  ],
};

export const hanging: RoomDef = {
  id: 'hanging',
  mark: 'open',
  music: 'barrow',
  name: 'The Hanging Snow',
  hung: 420,
  look: 'It is all of it now: a whole sky of snow that has been in the middle of falling for longer than anyone can remember, so thick that you cannot see your own feet. A raven hangs above you with its wings half open, at the top of a beat it began before anybody\'s grandmother was born. The footprints go on. You are walking in a path as wide as you are, and it ends just ahead.',
  lookWhen: [
    { if: [BROKEN], look: 'Snow is falling: only falling, and a wind is taking it. Where the raven hung there is nothing but air. The footprints you followed are gone under it; your own are filling as you look.' },
    { if: [{ flag: 'still.path2' }], look: 'A whole sky of snow hangs round you, stopped, so thick that you cannot see your own feet; and through it, north, goes the path your word made. A raven hangs above you with its wings half open. From up the path comes a small dry sound, over and over, with no space at all between one and the next.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 54, walkTop: 86,
    layers: [...waste(54, 631)],
    props: [{ t: 'boulder', x: 250, y: 150, r: 7, seed: 635 }],
    when: [
      { if: [HELD, { not: { flag: 'still.path2' } }], props: [{ t: 'hangsnow', x: 0, y: 100, h: 90, seed: 5 }, { t: 'hangsnow', x: 0, y: 172, h: 60, w: 26, seed: 6 }] },
      { if: [HELD, { flag: 'still.path2' }], props: [{ t: 'hangsnow', x: 0, y: 100, h: 90, w: 22, seed: 5 }, { t: 'hangsnow', x: 0, y: 172, h: 60, w: 26, seed: 6 }] },
    ],
  },
  exits: { s: 'windend', n: 'hollow' },
  haven: true,
  zones: [{ id: 'curtain', x0: 0, y0: 86, x1: 320, y1: 100 }],
  things: [
    {
      id: 'raven', nouns: ['raven'], x: 160, y: 70, reach: 400, look: 'A raven, hanging in the air above the road with its wings half open, at the top of a beat. One eye is toward you. It has been on its way somewhere for three hundred winters.',
      lookWhen: [{ if: [BROKEN], look: 'Gone. It dropped out of the air when the snow did, and caught itself, and went off north, complaining.' }],
    },
    {
      id: 'tracks', nouns: ['tracks', 'path', 'ground'], x: 160, y: 140, reach: 400,
      look: 'The footprints are on top of the snow now, sharp at the edges, as if they had been made this morning. Here, a long way short of the town, the small ones stop. The large ones go on, deeper, as if she was carrying something.',
      lookWhen: [{ if: [BROKEN], look: 'Wet snow, falling into wet snow. Nothing is written in it but you.' }],
    },
    {
      id: 'flakes', nouns: ['snow'], x: 160, y: 110, reach: 400, look: 'It hangs so thick that the air is more snow than air. None of it is falling. None of it has fallen in three hundred winters.',
      lookWhen: [{ if: [BROKEN], look: 'Snow. It comes down, and the wind takes it.' }],
    },
    stillSky('You cannot see it. There is only the snow, hanging, as far up as you can look.', 'There is a sky again. It is grey, and it is moving.'),
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.hanging' } }], do: [{ set: 'seen.hanging' }, { score: 3, id: 'seen.hanging' }] },
    {
      enter: true, if: [HELD, { not: { flag: 'still.deep' } }],
      do: [{ set: 'still.deep' }, { say: 'Then it is all of it: a whole sky of snow that has been in the middle of falling for longer than anyone can remember, so thick that you cannot see your own feet. A raven hangs above you with its wings half open, at the top of a beat it began before anybody\'s grandmother was born.\n\nThe footprints go on, nearer the top of the snow now, and then on top of it, sharp at the edges, as if they had been made this morning. After a while, a long way short of the town, the small ones stop, and the large ones go on deeper, as if she was carrying something.' }],
    },
    { zone: 'curtain', if: [HELD, { not: { flag: 'still.path2' } }], do: [{ goto: 'hanging', x: 160, y: 112, dir: 'up' }, { say: 'The path your word made ends here, in a wall of hanging snow. It does not give. When your tongue is ready, you will have to say it again.' }] },
    {
      on: 'veth', if: [HELD, { not: { flag: 'still.path2' } }],
      do: [{ set: 'still.path2' }, { sound: 'door' }, { score: 3, id: 'still.path2' }, { say: 'VETH. The snow goes aside, and stays aside, and the path runs on north.\n\nThen you hear it, before you see anything: a small dry sound, over and over, like ice settling in a cold night, with no space at all between one and the next.' }],
    },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. The path is open. Up it, the small dry sound does not miss a beat.' }] },
    { on: 'iska', if: [HELD], do: [{ say: 'ISKA. Yours goes into the word that is already being said here, and is lost in it. The raven does not so much as settle a feather.' }] },
    { on: 'sol', if: [HELD], do: [{ say: 'SOL. For the length of the word the hanging snow is lit from inside, every flake of it, like a room full of candles. Then it is white again, and nothing has moved. Whoever is saying the other word is not near enough to hear this one.' }] },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. There is nothing hidden here. The prints are on the top of the snow, plain as writing: where the small ones stop, and the large ones sink.' }] },
    { on: ['listen', 'listen *'], if: [HELD, { flag: 'still.path2' }], do: [{ say: 'A small dry sound, over and over, like ice settling in a cold night, with no space at all between one and the next. It is a voice. It is saying one word.' }] },
    { on: ['take raven', 'pet raven', 'push raven', 'attack raven', 'talk raven'], if: [HELD], do: [{ say: 'It hangs a little higher than you can reach, which is as well for both of you. Its eye does not follow you. It is still looking at whatever it was looking at three hundred winters ago.' }] },
    { on: ['push snow', 'attack snow', 'take snow', 'pet snow'], if: [HELD], do: [{ say: 'It is like pushing at a wall of nails.' }] },
    ...noFire(['hanging'])!,
  ],
};

/** "The woman" is the baker's word everywhere else, so the parser hears it as hers: here it can only mean one person. */
const her = (patterns: string[]): string[] => patterns.flatMap((p) => (p.includes('kneeler') ? [p, p.replace('kneeler', 'sigga')] : [p]));

const GIVE = her(['give ember', 'give ember kneeler', 'give kneeler ember', 'use ember kneeler', 'drop ember', 'give ember boy']);
const TAKE = ['take boy', 'pull boy', 'pet boy', 'take boy ember', 'use ember boy'];

export const hollow: RoomDef = {
  id: 'hollow',
  mark: 'open',
  music: 'barrow',
  name: 'The Hollow',
  hung: 420,
  look: 'She is kneeling in a hollow in the snow. Frost has grown over her shoulders like a fur. Her hands are spread flat on the drift in front of her, and her lips are moving. All round, as far up as you can look, the snow hangs.',
  lookWhen: [
    { if: [BROKEN, { flag: 'coal.given' }], look: 'There is a hollow in the snow, and the print of two knees, and you. Snow is falling into it. In a day there will be nothing here to show where anybody knelt.' },
    { if: [BROKEN, { flag: 'boy.home' }], look: 'There is a hollow in the snow, and the print of two knees, and a smaller hollow in front of them. Snow is falling into both.' },
    { if: [BROKEN], look: 'There is a hollow in the snow, and the print of two knees. In front of them a small boy lies curled on his side, with the snow coming down on him. He has finished his breath. A track goes off north into the white, where nobody is.' },
    { if: [{ flag: 'hollow.joined' }], look: 'You are kneeling beside her in the hollow. Her lips have stopped. She is looking at you, and at your hand, and at the ring on it. The snow still hangs, the whole sky of it, held up now by nothing but you. Your word is going.' },
    { if: [{ flag: 'hollow.seen' }], look: 'She is kneeling in a hollow in the snow, with her hands spread flat on the drift, and her lips moving. Under her hands, under the snow, a small boy lies curled on his side, facing her, with his breath hanging in front of his mouth: halfway out of him, and not finished.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 54, walkTop: 96,
    layers: [...waste(54, 641), { t: 'ice', x: 160, y: 132, rx: 46, ry: 10 }],
    props: [{ t: 'boulder', x: 60, y: 150, r: 6, seed: 645 }],
    when: [
      { if: [{ any: [{ flag: 'hollow.seen' }, { flag: 'sol.said' }] }, { not: { flag: 'coal.given' } }, { not: { flag: 'boy.home' } }], props: [{ t: 'hump', x: 160, y: 138, w: 22, h: 6 }] },
      { if: [HELD], props: [{ t: 'hangsnow', x: 0, y: 100, h: 90, seed: 7 }] },
    ],
  },
  exits: { s: 'hanging' },
  haven: true,
  zones: [{ id: 'away', x0: 0, y0: 160, x1: 320, y1: 172 }],
  npcs: [{ char: 'kneeler', x: 160, y: 126, dir: 'down', if: [HELD] }],
  things: [
    {
      id: 'drift', nouns: ['snow', 'ground'], x: 160, y: 136, reach: 400, try: ['kneel beside her', 'give the coal to her'], look: 'The drift under her hands. She has them on it the way you would put your hands on somebody\'s back, to feel them breathing.',
      lookWhen: [
        { if: [BROKEN], look: 'Snow, falling into a hollow, and filling it.' },
        { if: [{ flag: 'hollow.seen' }], look: 'The drift is clear as a window where the word wiped it. He is under it, curled on his side, facing her.' },
      ],
    },
    {
      id: 'boy', nouns: ['boy', 'breath'], x: 160, y: 138, reach: 40, hidden: true,
      look: 'A small boy, curled on his side under her hands, facing her, with his mouth a little open. In front of his lips, hanging in the air, is his breath: a small white cloud, halfway out of him, not finished. It has been halfway out of him for three hundred winters.',
      lookWhen: [{ if: [BROKEN], look: 'A small boy, curled on his side in a hollow the snow is filling. He has finished his breath. He weighs nothing; you can see that from here.' }],
    },
    {
      id: 'ring', nouns: ['ring'], x: 160, y: 128, reach: 400, look: 'On one of her hands is a brass ring, old, and worn smooth.\n\nYou look at your own hand.',
      lookWhen: [{ if: [BROKEN], look: 'You turn the ring on your finger. It is old, and worn smooth by a good many hands. You know one more of them than you did.' }],
    },
    { id: 'town', nouns: ['village', 'tower', 'roof'], x: 160, y: 56, reach: 400, look: 'The town is still a long way off: towers, and roofs under snow, and no smoke. Wherever she was taking him, it was there. She got this far.' },
    stillSky('Snow, hanging, as far up as there is anything.', 'Grey. Moving. And a raven in it, a long way north, going about its business.'),
  ],
  rules: [
    {
      enter: true, if: [HELD, { not: { flag: 'hollow.found' } }],
      do: [
        { set: 'hollow.found' }, { score: 5, id: 'hollow.found' }, { quest: 'north', stage: 6 },
        { say: 'She is kneeling in a hollow in the snow.\n\nThe cold has kept her as she was the hour she knelt down, and she might be any age. Frost has grown over her shoulders like a fur. Her eyes are open and white. Her hands are spread flat on the drift in front of her, the way you would put your hands on somebody\'s back to feel them breathing, and her lips are moving. They have been moving for longer than Hollowmere has had a hall. She is saying ISKA, ISKA, ISKA, without a breath between, because the dead do not get tired, and do not have to wait.\n\nOn one of her hands is a brass ring.\n\nYou look at your own hand.' },
      ],
    },
    { enter: true, if: [{ any: [{ flag: 'hollow.seen' }, { flag: 'sol.said' }] }, { not: { flag: 'coal.given' } }, { not: { flag: 'boy.home' } }], do: [{ show: 'boy' }] },
    // What is under her hands.
    {
      on: 'orun', if: [HELD, { not: { flag: 'hollow.seen' } }],
      do: [{ set: 'hollow.seen' }, { show: 'boy' }, { score: 5, id: 'hollow.seen' }, { say: 'When your tongue is ready you say ORUN, and the drift in front of her clears like a window. Under her hands a small boy lies curled on his side, facing her, with his mouth a little open. In front of his lips, hanging in the air, is his breath: a small white cloud, halfway out of him, not finished. It has been halfway out of him for three hundred winters.' }],
    },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. He is as he was. So is she.' }] },
    { on: 'orun', do: [{ say: 'ORUN. There is nothing hidden here any more.' }] },

    // The sun's name. It is thought about before it is said; said twice, it is said.
    { on: 'say sol', if: [HELD, { flag: 'hollow.joined' }], do: [{ say: 'You have the sun\'s name on your tongue, and nobody left to say it to. She has stopped. She is looking at the ring.' }] },
    {
      on: 'say sol', if: [HELD, { not: { flag: 'hollow.sol' } }, { flag: 'hollow.seen' }],
      do: [{ set: 'hollow.sol' }, { say: 'You have the sun\'s name on your tongue. It is warm there, like a coal.\n\nYou know what it would do. She would not bear it. The word would stop, and the snow would come down, and the wind would start, and every winter after this one would be a little kinder than the last. The boy would finish his breath out here, with nobody, and whatever she is would go off into the white with its hands over its face, the way the guards went from the gate.\n\nYou have not said it.' }],
    },
    {
      on: 'say sol', if: [HELD, { not: { flag: 'hollow.sol' } }],
      do: [{ set: 'hollow.sol' }, { say: 'You have the sun\'s name on your tongue. It is warm there, like a coal.\n\nYou know what it would do. She would not bear it. The word would stop, and the snow would come down, and the wind would start, and every winter after this one would be a little kinder than the last. And whatever she is would go off into the white with its hands over its face, the way the guards went from the gate, and leave whatever is under her hands out here, with nobody.\n\nYou have not said it.' }],
    },
    {
      on: 'sol', if: [HELD],
      do: [
        { set: 'sol.said' }, { set: 'winter.broken' }, { run: 'winterBreaks' }, { muster: true }, { show: 'boy' }, { quest: 'north', stage: 7 }, { sound: 'door' },
        { say: 'You say the sun\'s name.\n\nShe cannot bear it. Her lips stop. She takes her hands off the snow, for the first time in three hundred winters, and puts them over her face; and whatever she is goes off into the white like that, not fast, the way the guards went from the gate. She does not look back.\n\nAll the snow in the sky comes down at once. It comes down with a sound like a long sigh, three hundred years of it, and the wind gets up under it and blows it sideways, and the raven drops out of the air, and catches itself, and flaps away north, complaining.\n\nIn the hollow, the boy\'s breath finishes going out of him. There is nobody with him but you.\n\nIn your pack the horn box has gone warm.' },
      ],
    },
    { on: 'sol', do: [{ say: 'SOL. Nobody is here to hear it. The sun is coming up anyway.' }] },

    // Her word, said with her.
    {
      on: 'iska', if: [HELD, { not: { flag: 'hollow.joined' } }, { flag: 'hollow.seen' }],
      do: [
        { set: 'hollow.joined' }, { score: 10, id: 'hollow.joined' }, { goto: 'hollow', x: 184, y: 130, dir: 'left' },
        { say: 'You kneel down beside her in the snow.\n\nThen you say her word with her. You put your own ISKA into the cold beside hers, over the boy, and feel it go out of you, and the warmth go after it: out of your hands, out of your feet, out of the middle of you, as if somebody were drawing it off on a thread. For the space of one word there are two people holding him.\n\nHer lips stop.\n\nThe silence afterward is larger than any you have ever heard. The snow still hangs, held up now by nothing but you: the whole sky of it, on one word. Slowly, with a sound like ice cracking on a pond in spring, she turns her head and looks at you, and at your hand, and at the ring on it.\n\nYou take out the horn box and open it, and the coal in it is as grey and dull as before, because you are holding something still. Your word is going. You feel it thin in your mouth like the last heat going out of a stone, and you know you cannot say it again, not for a long while, not in time.' },
      ],
    },
    {
      on: 'iska', if: [HELD, { not: { flag: 'hollow.joined' } }],
      do: [
        { set: 'hollow.joined' }, { score: 10, id: 'hollow.joined' }, { goto: 'hollow', x: 184, y: 130, dir: 'left' },
        { say: 'You kneel down beside her in the snow.\n\nThen you say her word with her. You put your own ISKA into the cold beside hers, over whatever it is she has under her hands, and feel it go out of you, and the warmth go after it: out of your hands, out of your feet, out of the middle of you, as if somebody were drawing it off on a thread. For the space of one word there are two people holding it.\n\nHer lips stop.\n\nThe silence afterward is larger than any you have ever heard. The snow still hangs, held up now by nothing but you: the whole sky of it, on one word. Slowly, with a sound like ice cracking on a pond in spring, she turns her head and looks at you, and at your hand, and at the ring on it.\n\nYou take out the horn box and open it, and the coal in it is as grey and dull as before, because you are holding something still. Your word is going. You feel it thin in your mouth like the last heat going out of a stone, and you know you cannot say it again, not for a long while, not in time.' },
      ],
    },
    { on: 'iska', do: [{ say: 'ISKA. The snow that is falling in front of you stops, and hangs, for as long as one word lasts. Then it comes on down.' }] },

    // The coal: the way home. It takes one, and what one can carry.
    {
      on: GIVE, if: [HELD, { flag: 'hollow.joined' }, { has: 'ember' }],
      do: [
        { lose: 'ember' }, { set: 'coal.given' }, { set: 'winter.broken' }, { run: 'winterBreaks' }, { muster: true }, { hide: 'boy' }, { score: 25, id: 'winter.coal' }, { quest: 'north', stage: 7 }, { sound: 'win' },
        { say: 'You put the box into her hands.\n\nThe word ends.\n\nAll the snow in the sky comes down at once. It comes down with a sound like a long sigh, three hundred years of it, and the wind gets up under it and blows it sideways, and the raven drops out of the air, and catches itself, and flaps away north, complaining. The boy\'s breath finishes going out of him.\n\nIn her hands the coal wakes. It goes from grey to red to orange, and the smell comes up out of the box, peat and pine-smoke and broth and wet wool: the smell of a hall with a fire at one end and a door at the other. Something moves in her face that has not moved in a very long time.\n\nAnd she gathers him up. Stiffly at first, and then not stiffly, the way she must have done it a thousand times, she gets him into her arms, and holds him against her, and bends her head over the open box the way a woman bends over a hearth on a cold morning to blow it awake. She breathes on it.\n\nThen there is a hollow in the snow in front of you, and the print of two knees, and you.' },
        { say: 'You did not say the sun\'s name. It comes up anyway.\n\nYou are further from anywhere than you have ever been, with nothing but a brass ring, and it is a very long way back on foot. You start walking.' },
      ],
    },
    { on: GIVE, if: [HELD, { has: 'ember' }], do: [{ say: 'You hold the box out to her. She does not see it. She does not see anything. Her hands are on the snow, and her lips are moving, and the coal in the box is as dull as an old eye. Nothing wakes here while that word is being said.' }] },
    { on: ['use ember', 'blow ember', 'open ember', 'light ember', 'warm ember', 'pet ember'], if: [HELD, { flag: 'hollow.joined' }, { has: 'ember' }], do: [{ say: 'You have the box open in your hand. It is yours. It is the way back to the Elder\'s hearth, and the bed beside it, and a child who keeps trying to give you a name. It takes one, and what one can carry.\n\nYou look at her hands.' }] },
    // What the hero could do, and knows better than to.
    {
      on: TAKE, if: [HELD, { not: { flag: 'hollow.joined' } }, { flag: 'hollow.seen' }],
      do: [{ say: 'You could take him yourself. He would weigh nothing. You would breathe on the coal and be at the Elder\'s hearth with him in your arms before his breath was done, and she would kneel here with her hands on the empty snow, saying her word over nothing, for as long as there is a world to be cold in.\n\nYou take your hands back.' }],
    },
    { on: TAKE, if: [HELD, { flag: 'hollow.joined' }], do: [{ say: 'He is not yours to carry. She is looking at you. Her hands are empty, and yours have a box in them.' }] },
    // If the sun's name was said, he is left; and he can still be carried home.
    {
      on: TAKE, if: [{ flag: 'sol.said' }, { not: { flag: 'boy.home' } }, { has: 'ember' }, { near: 'boy', d: 60 }],
      do: [
        { set: 'boy.home' }, { set: 'marta.asked' }, { hide: 'boy' }, { sound: 'word' }, { run: 'emberReady' }, { goto: 'hall', x: 160, y: 124, dir: 'down' },
        { say: 'You get him up out of the hollow. He weighs nothing. It takes one, and what one can carry. You open the horn box, and the coal in it is awake, and you breathe on it.\n\nThen you are standing on the Elder\'s hearthstone, in the middle of supper, with a small boy in your arms who finished his breath three hundred winters late. Marta is on her feet before the bowl she dropped has stopped rolling. She looks at the boy, and at you, and asks nothing yet. Tova, in the bed on the other side of the hearth, says: "He can have my blanket."\n\nLater you tell Marta the rest: the footprints, the hollow, the hands flat on the snow, the brass ring; what you said, and what went off into the white with its hands over its face.\n\n"A ring like that one," says Marta. She is quiet for a long time. "There is a place swept. It was swept for more than him. He shall have it, and I shall go on sweeping the rest."' },
      ],
    },
    { on: TAKE, if: [{ flag: 'sol.said' }, { not: { flag: 'boy.home' } }], do: [{ say: 'You get your hands under him. He weighs nothing. It is fourteen days to anywhere, on foot, and snowing. You would need another way home than walking.' }] },
    // Other things people try.
    { on: her(['attack kneeler', 'push kneeler', 'pull kneeler']), if: [HELD], do: [{ say: 'No.' }] },
    { on: her(['pet kneeler', 'kiss kneeler', 'warm kneeler']), if: [HELD], do: [{ say: 'You put your hand on her shoulder, through the frost. There is no warmth coming off her at all, and none going in. You have felt that once before, in a hall, with a child under every fur in Hollowmere.' }] },
    { on: ['take ring', 'pet ring'], if: [HELD], do: [{ say: 'It is hers. It is the same as yours: brass, old, worn smooth by a good many hands. Hers were among them.' }] },
    { on: her(['give ring', 'give ring kneeler', 'use ring']), if: [HELD], do: [{ say: 'She has one. It is the same ring. There was only ever the one; somebody kept another by, afterwards, for when there should be a Thane again.' }] },
    { on: ['listen', 'listen *'], if: [HELD, { not: { flag: 'hollow.joined' } }], do: [{ say: 'ISKA, ISKA, ISKA: a small dry sound, like ice settling in a cold night, with no space at all between one and the next.' }] },
    { on: ['listen', 'listen *'], if: [HELD], do: [{ say: 'Nothing. It is the first silence there has been here in three hundred winters, and you are the only thing holding it up.' }] },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. The hanging snow goes back from the hollow a pace, and stays there. She does not look up. It is not that kind of holding.' }] },
    { on: her(['pray', 'sit', 'pray kneeler', 'sit kneeler']), if: [HELD, { not: { flag: 'hollow.joined' } }], do: [{ say: 'You kneel down beside her in the snow. She does not turn her head. Her hands are on the drift, and her lips are moving. You know the word. You are near enough, now, to say it with her.' }] },
    // Nobody walks away from a sky they are holding up.
    { zone: 'away', if: [HELD, { flag: 'hollow.joined' }], do: [{ goto: 'hollow', x: 184, y: 130, dir: 'left' }, { say: 'You are holding up the sky, and she is looking at you. You do not get up.' }] },
    ...noFire(['hollow'])!.slice(0, 2),
  ],
};

