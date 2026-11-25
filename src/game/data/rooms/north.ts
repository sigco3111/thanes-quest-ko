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
    { zone: 'curtain', if: [HELD, { not: { flag: 'still.path1' } }], do: [{ goto: 'windend', x: 160, y: 112, dir: 'up' }, { say: '여기서 눈은 벽처럼 빽빽하다. 하늘 한 면의 눈이 내리는 도중에 멎은 것. 어깨를 댄다. 밀리지 않는다. 송이 하나하나가 못처럼 박혀, 돌아갈 수도, 비켜주지도 않는다.' }, { note: '어깨보다 강한 무언가로 밀어내야 한다.' }] },
    {
      on: 'veth', if: [HELD, { not: { flag: 'still.path1' } }],
      do: [{ set: 'still.path1' }, { sound: 'door' }, { score: 3, id: 'still.path1' }, { say: 'VETH라고 말하자 매달린 눈 사이로 길이 밀려 열린다. 송이들이 군중처럼 비켜서고, 밀린 자리에 머문다. 그 길을 걸을 수 있다.' }],
    },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. 길은 이미 열려 있다. 단어가 그 아래로 내려가고, 무언가에 닿는 소리는 들리지 않는다.' }] },
    { on: 'iska', if: [HELD], do: [{ say: 'ISKA. 말해도 아무것도 바뀌지 않는다. 그리고 이해한다. 이미 말해지고 있기 때문이다. 여기 모든 것이 그 단어 안에 있다. 네 것은 호수에 부은 잔의 물처럼 스며든다. 하지만 손에서 온기가 빠지는 건 마찬가지다.' }] },
    { on: 'sol', if: [HELD], do: [{ say: 'SOL. 단어가 이어지는 동안 그림자가 생긴다. 네 것, 그리고 작은 것 만 개, 매달린 송이마다 하나씩. 그러고는 사라지고, 아무것도 움직이지 않았다.' }] },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. 발자국이 보인다, 여기서는 눈 아래 손바닥 깊이뿐. 그녀의 것, 그리고 작은 것들, 끌리기 시작했다.' }] },
    { on: ['push snow', 'attack snow', 'take snow', 'pet snow'], if: [HELD], do: [{ say: '엄지와 검지로 송이 하나를 잡는다. 공중에 박힌 못을 잡는 것과 같다. 나오지 않는다.' }] },
    ...noFire(['windend'])!,
  ],
};

export const hanging: RoomDef = {
  id: 'hanging',
  mark: 'open',
  music: 'barrow',
  name: '매달린 눈',
  hung: 420,
  look: '이제 전부가 그것이다. 아무도 기억하지 못할 만큼 오래 내리는 도중인 하늘 한 면의 눈, 네 발도 보이지 않을 만큼 빽빽한. 까마귀가 네 위에 매달려 있다, 날개를 반쯤 편 채, 누구의 할머니가 태어나기 전에 시작한 날갯짓의 꼭대기에서. 발자국은 계속된다. 너는 네 너비의 길을 걷고 있고, 그것은 바로 앞에서 끝난다.',
  lookWhen: [
    { if: [BROKEN], look: '눈이 내린다, 그저 내리고, 바람이 몰아간다. 까마귀가 매달렸던 곳엔 공기뿐이다. 네가 따라온 발자국은 그 밑으로 사라졌다. 네 것도 보는 동안 채워지고 있다.' },
    { if: [{ flag: 'still.path2' }], look: '하늘 한 면의 눈이 네 주위에 매달려 있다, 멎은 채로, 네 발도 보이지 않을 만큼 빽빽하게. 그 사이로, 북쪽으로, 네 단어가 만든 길이 난다. 까마귀가 네 위에 날개를 반쯤 편 채 매달려 있다. 길 위쪽에서 작고 마른 소리가 들려온다, 되풀이되어, 하나와 다음 사이에 틈이 전혀 없이.' },
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
      id: 'raven', nouns: ['raven'], x: 160, y: 70, reach: 400, look: '까마귀, 길 위 공중에 날개를 반쯤 편 채 매달려 있다, 날갯짓의 꼭대기에서. 한쪽 눈이 너를 향한다. 삼백 겨울째 어딘가로 가는 중이다.',
      lookWhen: [{ if: [BROKEN], look: '사라졌다. 눈과 함께 공중에서 떨어졌다가, 몸을 가다듬고, 북쪽으로 날아갔다, 투덜거리며.' }],
    },
    {
      id: 'tracks', nouns: ['tracks', 'path', 'ground'], x: 160, y: 140, reach: 400,
      look: '이제 발자국은 눈 위에 있다, 가장자리가 선명하다, 오늘 아침 생긴 것처럼. 여기, 마을에서 한참 못 미쳐, 작은 것들이 멎는다. 큰 것들은 계속된다, 더 깊이, 뭔가를 안고 있는 것처럼.',
      lookWhen: [{ if: [BROKEN], look: '젖은 눈, 젖은 눈 속으로 내린다. 쓰인 것은 너뿐이다.' }],
    },
    {
      id: 'flakes', nouns: ['snow'], x: 160, y: 110, reach: 400, look: '공기가 공기보다 눈인 만큼 빽빽하게 매달려 있다. 내리는 것이 없다. 삼백 겨울 동안 내린 것이 없다.',
      lookWhen: [{ if: [BROKEN], look: '눈. 내리고, 바람이 몰아간다.' }],
    },
    stillSky('보이지 않는다. 올려다보는 한 오직 눈뿐, 매달린.', '다시 하늘이 있다. 회색이고, 움직인다.'),
  ],
  rules: [
    { enter: true, if: [{ not: { flag: 'seen.hanging' } }], do: [{ set: 'seen.hanging' }, { score: 3, id: 'seen.hanging' }] },
    {
      enter: true, if: [HELD, { not: { flag: 'still.deep' } }],
      do: [{ set: 'still.deep' }, { say: '그러다 전부가 된다. 아무도 기억하지 못할 만큼 오래 내리는 도중인 하늘 한 면의 눈, 네 발도 보이지 않을 만큼 빽빽한. 까마귀가 네 위에 날개를 반쯤 편 채 매달려 있다, 누구의 할머니가 태어나기 전에 시작한 날갯짓의 꼭대기에서.\n\n발자국은 계속된다, 이제 눈 표면에 가깝고, 그러다 그 위에, 가장자리가 선명하다, 오늘 아침 생긴 것처럼. 얼마 후, 마을에서 한참 못 미쳐, 작은 것들이 멎고, 큰 것들은 더 깊이 계속된다, 그녀가 뭔가를 안고 있는 것처럼.' }],
    },
    { zone: 'curtain', if: [HELD, { not: { flag: 'still.path2' } }], do: [{ goto: 'hanging', x: 160, y: 112, dir: 'up' }, { say: '네 단어가 만든 길이 여기서 끝난다, 매달린 눈의 벽에서. 밀리지 않는다. 혀가 준비되면, 다시 말해야 한다.' }] },
    {
      on: 'veth', if: [HELD, { not: { flag: 'still.path2' } }],
      do: [{ set: 'still.path2' }, { sound: 'door' }, { score: 3, id: 'still.path2' }, { say: 'VETH. 눈이 비켜서고, 비켜선 채 머물고, 길이 북쪽으로 이어진다.\n\n그러다 듣는다, 무엇을 보기 전에. 작고 마른 소리, 되풀이되어, 추운 밤 얼음이 가라앉는 소리처럼, 하나와 다음 사이에 틈이 전혀 없이.' }],
    },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. 길은 열려 있다. 그 위쪽에서, 작고 마른 소리가 박자를 놓치지 않는다.' }] },
    { on: 'iska', if: [HELD], do: [{ say: 'ISKA. 네 것은 여기서 이미 말해지고 있는 단어 속으로 들어가, 그 안에서 사라진다. 까마귀는 깃털 하나 가다듬지도 않는다.' }] },
    { on: 'sol', if: [HELD], do: [{ say: 'SOL. 단어가 이어지는 동안 매달린 눈이 안쪽에서 밝아진다, 송이 하나하나, 양초 가득한 방처럼. 그러고는 다시 하얘지고, 아무것도 움직이지 않았다. 다른 단어를 말하는 이는 이것을 들을 만큼 가까이 있지 않다.' }] },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. 여기 숨겨진 건 없다. 발자국은 눈 위에 있다, 글씨처럼 선명하게. 작은 것들이 멎고, 큰 것들이 가라앉는 곳.' }] },
    { on: ['listen', 'listen *'], if: [HELD, { flag: 'still.path2' }], do: [{ say: '작고 마른 소리, 되풀이되어, 추운 밤 얼음이 가라앉는 소리처럼, 하나와 다음 사이에 틈이 전혀 없이. 목소리다. 한 단어를 말하고 있다.' }] },
    { on: ['take raven', 'pet raven', 'push raven', 'attack raven', 'talk raven'], if: [HELD], do: [{ say: '네 손이 닿는 곳보다 조금 높이 매달려 있다, 둘 다에게 다행이다. 눈이 너를 따라오지 않는다. 삼백 겨울 전에 보던 것을 아직 보고 있다.' }] },
    { on: ['push snow', 'attack snow', 'take snow', 'pet snow'], if: [HELD], do: [{ say: '못으로 된 벽을 미는 것과 같다.' }] },
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
  name: '움푹한 곳',
  hung: 420,
  look: '그녀가 눈 웅덩이에 무릎 꿇고 있다. 서리가 가죽처럼 어깨를 덮었다. 두 손은 앞의 눈더미에 평평히 펴 얹혀 있고, 입술이 움직이고 있다. 올려다보는 한 사방에, 눈이 매달려 있다.',
  lookWhen: [
    { if: [BROKEN, { flag: 'coal.given' }], look: '눈 웅덩이가 있고, 두 무릎 자국이 있고, 네가 있다. 그 안으로 눈이 내리고 있다. 하루면 누가 무릎 꿇었는지 보여 줄 것이 아무것도 없을 거다.' },
    { if: [BROKEN, { flag: 'boy.home' }], look: '눈 웅덩이가 있고, 두 무릎 자국이 있고, 그 앞에 더 작은 웅덩이가 있다. 둘 다로 눈이 내리고 있다.' },
    { if: [BROKEN], look: '눈 웅덩이가 있고, 두 무릎 자국이 있다. 그 앞에 어린 소년이 옆으로 웅크려 누워 있고, 그 위로 눈이 내리고 있다. 그는 숨을 다 내뱉었다. 발자국 하나가 하얀 속으로 북쪽으로 난다, 아무도 없는 곳으로.' },
    { if: [{ flag: 'hollow.joined' }], look: '너는 그녀 곁 웅덩이에 무릎 꿇고 있다. 그녀의 입술이 멈췄다. 너를 보고, 네 손을 보고, 그 위의 반지를 보고 있다. 눈은 여전히 매달려 있다, 하늘 한 면 전부, 이제는 너만이 떠받치고 있다. 네 단어가 가고 있다.' },
    { if: [{ flag: 'hollow.seen' }], look: '그녀가 눈 웅덩이에 무릎 꿇고, 두 손을 눈더미에 평평히 펴 얹고, 입술이 움직이고 있다. 그 손 아래, 눈 아래, 어린 소년이 옆으로 웅크려 누워 그녀를 향해 있다, 입 앞에 숨이 매달려 있다. 절반쯤 나온 채, 끝나지 않은.' },
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
      id: 'drift', nouns: ['snow', 'ground'], x: 160, y: 136, reach: 400, try: ['kneel beside her', 'give the coal to her'], look: '그녀의 손 아래 눈더미. 누군가의 등에 손을 얹어 숨 쉬는 걸 느끼듯 얹고 있다.',
      lookWhen: [
        { if: [BROKEN], look: '눈, 웅덩이 속으로 내리며, 채우며.' },
        { if: [{ flag: 'hollow.seen' }], look: '단어가 닦아 낸 곳에서 눈더미가 창처럼 맑다. 그가 그 아래 있다, 옆으로 웅크려, 그녀를 향해.' },
      ],
    },
    {
      id: 'boy', nouns: ['boy', 'breath'], x: 160, y: 138, reach: 40, hidden: true,
      look: '어린 소년, 그녀의 손 아래 옆으로 웅크려, 그녀를 향해, 입을 조금 벌리고. 입술 앞에, 공중에 매달려, 그의 숨이 있다. 작은 흰 구름, 절반쯤 나온 채, 끝나지 않은. 삼백 겨울째 절반쯤 나와 있다.',
      lookWhen: [{ if: [BROKEN], look: '어린 소년, 눈이 채우는 웅덩이에 옆으로 웅크려 있다. 그는 숨을 다 내뱉었다. 무게가 없다, 여기서도 보인다.' }],
    },
    {
      id: 'ring', nouns: ['ring'], x: 160, y: 128, reach: 400, look: '그녀의 한 손에 황동 반지가 있다, 오래되고, 매끈하게 닳은.\n\n너는 네 손을 본다.',
      lookWhen: [{ if: [BROKEN], look: '손가락의 반지를 돌려 본다. 오래되고, 수많은 손에 매끈하게 닳았다. 너는 전보다 한 사람을 더 안다.' }],
    },
    { id: 'town', nouns: ['village', 'tower', 'roof'], x: 160, y: 56, reach: 400, look: '마을은 여전히 멀다. 탑들, 눈 밑 지붕들, 연기 없음. 그녀가 그를 데려가던 곳은 그곳이었다. 여기까지 왔다.' },
    stillSky('눈, 매달려, 무언가가 있는 한 위로.', '회색. 움직인다. 그리고 그 안에 까마귀, 멀리 북쪽, 제 일 보러 가는 중.'),
  ],
  rules: [
    {
      enter: true, if: [HELD, { not: { flag: 'hollow.found' } }],
      do: [
        { set: 'hollow.found' }, { score: 5, id: 'hollow.found' }, { quest: 'north', stage: 6 },
        { say: '그녀가 눈 웅덩이에 무릎 꿇고 있다.\n\n추위가 그녀를 무릎 꿇은 그 시간 그대로 지켰고, 나이를 알 수 없다. 서리가 가죽처럼 어깨를 덮었다. 눈이 떠져 있고 하얗다. 두 손은 앞의 눈더미에 평평히 펴 얹혀 있다, 누군가의 등에 손을 얹어 숨 쉬는 걸 느끼듯, 그리고 입술이 움직이고 있다. 홀로미어에 회당이 생긴 때보다 오래 움직여 왔다. ISKA, ISKA, ISKA를 말하고 있다, 숨 사이 틈도 없이, 죽은 이는 지치지 않으니까, 기다릴 필요도 없으니까.\n\n그녀의 한 손에 황동 반지가 있다.\n\n너는 네 손을 본다.' },
      ],
    },
    { enter: true, if: [{ any: [{ flag: 'hollow.seen' }, { flag: 'sol.said' }] }, { not: { flag: 'coal.given' } }, { not: { flag: 'boy.home' } }], do: [{ show: 'boy' }] },
    // What is under her hands.
    {
      on: 'orun', if: [HELD, { not: { flag: 'hollow.seen' } }],
      do: [{ set: 'hollow.seen' }, { show: 'boy' }, { score: 5, id: 'hollow.seen' }, { say: '혀가 준비되면 ORUN을 말하고, 그녀 앞 눈더미가 창처럼 맑아진다. 그녀의 손 아래 어린 소년이 옆으로 웅크려 누워 그녀를 향해 있고, 입을 조금 벌렸다. 입술 앞에, 공중에 매달려, 그의 숨이 있다. 작은 흰 구름, 절반쯤 나온 채, 끝나지 않은. 삼백 겨울째 절반쯤 나와 있다.' }],
    },
    { on: 'orun', if: [HELD], do: [{ say: 'ORUN. 그는 그대로다. 그녀도 그대로다.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 여기 숨겨진 건 더는 없다.' }] },

    // The sun's name. It is thought about before it is said; said twice, it is said.
    { on: 'say sol', if: [HELD, { flag: 'hollow.joined' }], do: [{ say: '혀 위에 태양의 이름이 있고, 말할 사람은 더는 없다. 그녀는 멈췄다. 반지를 보고 있다.' }] },
    {
      on: 'say sol', if: [HELD, { not: { flag: 'hollow.sol' } }, { flag: 'hollow.seen' }],
      do: [{ set: 'hollow.sol' }, { say: '혀 위에 태양의 이름이 있다. 거기서 따뜻하다, 숯처럼.\n\n그게 무슨 일을 할지 안다. 그녀는 견디지 못할 거다. 단어가 멈추고, 눈이 내리고, 바람이 시작되고, 이 겨울 다음의 겨울마다 전보다 조금씩 자상해질 거다. 소년은 여기서, 아무도 없이, 숨을 끝낼 거고, 그녀인 무언가가 얼굴을 손으로 가리고 하얀 속으로 사라질 거다, 경비병들이 관문에서 간 것처럼.\n\n너는 아직 말하지 않았다.' }],
    },
    {
      on: 'say sol', if: [HELD, { not: { flag: 'hollow.sol' } }],
      do: [{ set: 'hollow.sol' }, { say: '혀 위에 태양의 이름이 있다. 거기서 따뜻하다, 숯처럼.\n\n그게 무슨 일을 할지 안다. 그녀는 견디지 못할 거다. 단어가 멈추고, 눈이 내리고, 바람이 시작되고, 이 겨울 다음의 겨울마다 전보다 조금씩 자상해질 거다. 그리고 그녀인 무언가가 얼굴을 손으로 가리고 하얀 속으로 사라질 거다, 경비병들이 관문에서 간 것처럼, 그녀의 손 아래 있는 것을 여기, 아무도 없이, 두고.\n\n너는 아직 말하지 않았다.' }],
    },
    {
      on: 'sol', if: [HELD],
      do: [
        { set: 'sol.said' }, { set: 'winter.broken' }, { run: 'winterBreaks' }, { muster: true }, { show: 'boy' }, { quest: 'north', stage: 7 }, { sound: 'door' },
        { say: '태양의 이름을 말한다.\n\n그녀는 견디지 못한다. 입술이 멎는다. 삼백 겨울 만에 처음으로 눈에서 손을 떼고, 얼굴을 가린다. 그러고는 그녀인 무언가가 그대로 하얀 속으로 사라진다, 빠르지 않게, 경비병들이 관문에서 간 것처럼. 돌아보지 않는다.\n\n하늘의 눈 전부가 한꺼번에 내려온다. 긴 한숨 같은 소리로 내려온다, 삼백 년치가, 바람이 그 밑에서 일어 옆으로 몰고, 까마귀가 공중에서 떨어졌다가, 몸을 가다듬고, 북쪽으로 날아간다, 투덜거리며.\n\n웅덩이에서, 소년의 숨이 나가기를 끝낸다. 그 곁에는 너뿐이다.\n\n짐 속에서 뿔 상자가 따뜻해졌다.' },
      ],
    },
    { on: 'sol', do: [{ say: 'SOL. 들을 사람이 여기 없다. 해는 어차피 뜬다.' }] },

    // Her word, said with her.
    {
      on: 'iska', if: [HELD, { not: { flag: 'hollow.joined' } }, { flag: 'hollow.seen' }],
      do: [
        { set: 'hollow.joined' }, { score: 10, id: 'hollow.joined' }, { goto: 'hollow', x: 184, y: 130, dir: 'left' },
        { say: '눈 속에서 그녀 곁에 무릎 꿇는다.\n\n그러고는 그녀의 단어를 함께 말한다. 너의 ISKA를 그녀의 곁 추위 속에 놓는다, 소년 위에, 그것이 너에게서 빠지는 걸, 온기가 뒤따르는 걸 느낀다. 손에서, 발에서, 네 한가운데서, 누군가 실에 감아 뽑아내듯. 한 단어가 이어지는 동안 그를 붙드는 사람이 둘이다.\n\n그녀의 입술이 멎는다.\n\n그 뒤의 침묵은 네가 들은 어떤 침묵보다 크다. 눈은 여전히 매달려 있다, 이제는 너만이 떠받치고. 하늘 한 면 전부가, 단어 하나에. 천천히, 봄 연못의 얼음 갈라지는 소리로, 그녀가 고개를 돌려 너를 보고, 네 손을 보고, 그 위의 반지를 본다.\n\n뿔 상자를 꺼내 열자, 안의 숯은 여전히 회색이고 침침하다, 네가 무언가를 붙들고 있으니까. 네 단어가 가고 있다. 입 안에서 옅어지는 게 느껴진다, 돌에서 마지막 열기가 빠지듯, 그리고 다시는 말할 수 없음을 안다, 한참 동안은, 제시간에는.' },
      ],
    },
    {
      on: 'iska', if: [HELD, { not: { flag: 'hollow.joined' } }],
      do: [
        { set: 'hollow.joined' }, { score: 10, id: 'hollow.joined' }, { goto: 'hollow', x: 184, y: 130, dir: 'left' },
        { say: '눈 속에서 그녀 곁에 무릎 꿇는다.\n\n그러고는 그녀의 단어를 함께 말한다. 너의 ISKA를 그녀의 곁 추위 속에 놓는다, 그녀가 손 아래 둔 그것이 무엇이든 위에, 그것이 너에게서 빠지는 걸, 온기가 뒤따르는 걸 느낀다. 손에서, 발에서, 네 한가운데서, 누군가 실에 감아 뽑아내듯. 한 단어가 이어지는 동안 그것을 붙드는 사람이 둘이다.\n\n그녀의 입술이 멎는다.\n\n그 뒤의 침묵은 네가 들은 어떤 침묵보다 크다. 눈은 여전히 매달려 있다, 이제는 너만이 떠받치고. 하늘 한 면 전부가, 단어 하나에. 천천히, 봄 연못의 얼음 갈라지는 소리로, 그녀가 고개를 돌려 너를 보고, 네 손을 보고, 그 위의 반지를 본다.\n\n뿔 상자를 꺼내 열자, 안의 숯은 여전히 회색이고 침침하다, 네가 무언가를 붙들고 있으니까. 네 단어가 가고 있다. 입 안에서 옅어지는 게 느껴진다, 돌에서 마지막 열기가 빠지듯, 그리고 다시는 말할 수 없음을 안다, 한참 동안은, 제시간에는.' },
      ],
    },
    { on: 'iska', do: [{ say: 'ISKA. 네 앞에 내리던 눈이 멎고, 한 단어가 이어지는 동안 매달린다. 그러고는 다시 내려온다.' }] },

    // The coal: the way home. It takes one, and what one can carry.
    {
      on: GIVE, if: [HELD, { flag: 'hollow.joined' }, { has: 'ember' }],
      do: [
        { lose: 'ember' }, { set: 'coal.given' }, { set: 'winter.broken' }, { run: 'winterBreaks' }, { muster: true }, { hide: 'boy' }, { score: 25, id: 'winter.coal' }, { quest: 'north', stage: 7 }, { sound: 'win' },
        { say: '상자를 그녀의 손에 넣어 준다.\n\n단어가 끝난다.\n\n하늘의 눈 전부가 한꺼번에 내려온다. 긴 한숨 같은 소리로 내려온다, 삼백 년치가, 바람이 그 밑에서 일어 옆으로 몬다, 까마귀가 공중에서 떨어졌다가, 몸을 가다듬고, 북쪽으로 날아간다, 투덜거리며. 소년의 숨이 나가기를 끝낸다.\n\n그녀의 손에서 숯이 깬다. 회색에서 붉게, 주황으로, 냄새가 상자에서 올라온다. 이탄과 소나무 연기와 수프와 젖은 양모. 한쪽 끝에 불이 있고 다른 쪽 끝에 문이 있는 회당의 냄새. 아주 오래 움직이지 않던 무언가가 그녀의 얼굴에서 움직인다.\n\n그러고는 그녀가 그를 안아 올린다. 처음엔 뻣뻣하게, 그러다 뻣뻣하지 않게, 천 번은 그랬을 방식으로, 그를 품에 넣고, 몸에 대고, 열린 상자 위로 고개를 숙인다, 추운 아침 여자가 난로에 몸을 숙여 불을 깨우듯. 숨을 불어넣는다.\n\n그러고는 네 앞에 눈 웅덩이와 두 무릎 자국과 너만 남는다.' },
        { say: '너는 태양의 이름을 말하지 않았다. 어차피 해는 뜬다.\n\n너는 지금까지 중 가장 먼 곳에 있다, 가진 건 황동 반지 하나뿐, 돌아가기엔 걸어서 아주 먼 길. 걷기 시작한다.' },
      ],
    },
    { on: GIVE, if: [HELD, { has: 'ember' }], do: [{ say: '상자를 그녀에게 내민다. 보지 못한다. 아무것도 보지 못한다. 손은 눈 위에, 입술은 움직이고, 상자 속 숯은 늙은 눈처럼 침침하다. 저 단어가 말해지는 동안 여기선 아무것도 깨지 않는다.' }] },
    { on: ['use ember', 'blow ember', 'open ember', 'light ember', 'warm ember', 'pet ember'], if: [HELD, { flag: 'hollow.joined' }, { has: 'ember' }], do: [{ say: '상자를 열어 손에 들고 있다. 네 것이다. 원로의 난로와 그 곁 침대, 그리고 네게 자꾸 이름을 지어 주려는 아이에게로 가는 길. 하나와, 하나가 안을 수 있는 만큼을 데려간다.\n\n그녀의 손을 본다.' }] },
    // What the hero could do, and knows better than to.
    {
      on: TAKE, if: [HELD, { not: { flag: 'hollow.joined' } }, { flag: 'hollow.seen' }],
      do: [{ say: '네가 직접 데려갈 수도 있다. 무게가 없을 거다. 숯에 숨을 불면 그의 숨이 다하기 전에 원로의 난로에 그를 안고 서 있을 거고, 그녀는 텅 빈 눈 위에 손을 얹은 채 여기 무릎 꿇고, 아무것도 아닌 것 위에 단어를 말하겠지, 세상이 차가울 동안 내내.\n\n손을 거둔다.' }],
    },
    { on: TAKE, if: [HELD, { flag: 'hollow.joined' }], do: [{ say: '그는 네가 안아 갈 사람이 아니다. 그녀가 너를 보고 있다. 그녀의 손은 비어 있고, 네 손에는 상자가 있다.' }] },
    // If the sun's name was said, he is left; and he can still be carried home.
    {
      on: TAKE, if: [{ flag: 'sol.said' }, { not: { flag: 'boy.home' } }, { has: 'ember' }, { near: 'boy', d: 60 }],
      do: [
        { set: 'boy.home' }, { set: 'marta.asked' }, { hide: 'boy' }, { sound: 'word' }, { run: 'emberReady' }, { goto: 'hall', x: 160, y: 124, dir: 'down' },
        { say: '웅덩이에서 그를 일으켜 안는다. 무게가 없다. 하나와, 하나가 안을 수 있는 만큼을 데려간다. 뿔 상자를 열자, 안의 숯이 깨어 있고, 숨을 불어넣는다.\n\n그러자 너는 원로의 난로돌 위에 서 있다, 저녁 한창에, 삼백 겨울 늦게 숨을 다한 어린 소년을 안고. 마르타가 떨어뜨린 그릇이 멈추기 전에 일어서 있다. 소년을 보고, 너를 보고, 아직 아무것도 묻지 않는다. 난로 건너편 침대에서 토바가 말한다. "내 이불 줘도 돼."\n\n나중에 너는 마르타에게 나머지를 말한다. 발자국, 웅덩이, 눈 위에 평평히 얹힌 손들, 황동 반지. 네가 한 말, 그리고 얼굴을 손으로 가리고 하얀 속으로 사라진 것.\n\n"저런 반지라," 마르타가 말한다. 오래 조용하다. "쓸어 둔 자리가 있어. 그 애 하나를 위해 쓴 게 아니었지. 그 애가 갖겠고, 나는 나머지를 계속 쓸겠어."' },
      ],
    },
    { on: TAKE, if: [{ flag: 'sol.said' }, { not: { flag: 'boy.home' } }], do: [{ say: '그 아래로 손을 넣는다. 무게가 없다. 어디든 걸어서 열나흘, 그리고 눈이 내린다. 걷는 것 말고 다른 귀가 방법이 필요하다.' }] },
    // Other things people try.
    { on: her(['attack kneeler', 'push kneeler', 'pull kneeler']), if: [HELD], do: [{ say: '아니.' }] },
    { on: her(['pet kneeler', 'kiss kneeler', 'warm kneeler']), if: [HELD], do: [{ say: '서리를 통해 그녀의 어깨에 손을 얹는다. 그녀에게서 나오는 온기가 전혀 없고, 들어가는 것도 없다. 전에 한 번 느낀 적 있다, 회당에서, 홀로미어의 모든 가죽 밑의 아이에게서.' }] },
    { on: ['take ring', 'pet ring'], if: [HELD], do: [{ say: '그녀의 것이다. 네 것과 같다. 황동, 오래됨, 수많은 손에 매끈하게 닳음. 그녀의 손도 그중에 있었다.' }] },
    { on: her(['give ring', 'give ring kneeler', 'use ring']), if: [HELD], do: [{ say: '그녀는 있다. 같은 반지다. 애초에 하나뿐이었다. 나중에 누군가 다른 하나를 곁에 두었다, 다시 테인이 있을 때를 위해.' }] },
    { on: ['listen', 'listen *'], if: [HELD, { not: { flag: 'hollow.joined' } }], do: [{ say: 'ISKA, ISKA, ISKA. 작고 마른 소리, 추운 밤 얼음이 가라앉는 소리처럼, 하나와 다음 사이에 틈이 전혀 없이.' }] },
    { on: ['listen', 'listen *'], if: [HELD], do: [{ say: '아무것도. 삼백 겨울 만에 처음 있는 침묵이고, 그것을 떠받치는 건 너뿐이다.' }] },
    { on: 'veth', if: [HELD], do: [{ say: 'VETH. 매달린 눈이 웅덩이에서 한 걸음 물러나, 그대로 머문다. 그녀는 눈을 들지 않는다. 그런 종류의 붙듦이 아니다.' }] },
    { on: her(['pray', 'sit', 'pray kneeler', 'sit kneeler']), if: [HELD, { not: { flag: 'hollow.joined' } }], do: [{ say: '눈 속에서 그녀 곁에 무릎 꿇는다. 고개를 돌리지 않는다. 손은 눈더미 위에, 입술은 움직이고 있다. 단어를 안다. 이제 충분히 가까워서, 함께 말할 수 있다.' }] },
    // Nobody walks away from a sky they are holding up.
    { zone: 'away', if: [HELD, { flag: 'hollow.joined' }], do: [{ goto: 'hollow', x: 184, y: 130, dir: 'left' }, { say: '너는 하늘을 떠받치고 있고, 그녀가 너를 보고 있다. 일어나지 않는다.' }] },
    ...noFire(['hollow'])!.slice(0, 2),
  ],
};

