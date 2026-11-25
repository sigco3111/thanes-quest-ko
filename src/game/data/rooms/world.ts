// The eight outdoor screens of the valley, with a screen of road between each and the next (the
// roads are generated: see `valley` in data/frontier.ts), and the old watchtower, which stands
// two screens south of the ford, beyond the valley's mouth:
//
//   ridge      ·  barrow     ·  tarn
//      ·       ·     ·       ·    ·
//   pinewood   ·  village    ·  farm
//      ·       ·     ·       ·    ·
//   camp       ·  ford       ·    ·
//                    ·
//                  tower
//
// None has an exit to another; each opens onto the roads round it through its gates.

import type { Cond, LayerDef, RoomDef, Rule, ThingDef } from '../../../engine/types';
import { fennRules } from './inside';

const LIT: Cond = { flag: 'hearth.lit' };
const COLD: Cond = { not: LIT };
/** The thaw has reached Hollowmere. */
const THAW: Cond = { flag: 'thaw.home' };
/** Everybody is up at the hall: the night the hearth was lit, or the feast for the thaw. */
const FEAST: Cond = { any: [{ flag: 'hall.feast' }, { flag: 'hall.thaw' }] };
const HOME: Cond = { not: FEAST };

/** The usual winter backdrop. Seeds vary the skyline from screen to screen. */
function backdrop(hz: number, seed: number, near = true): LayerDef[] {
  return [
    { t: 'sky', horizon: hz },
    { t: 'mountains', base: hz + 3, height: 54, seed, far: true },
    ...(near ? [{ t: 'mountains', base: hz + 5, height: 30, seed: seed + 1 }] : []),
    { t: 'treeline', y: hz + 4, seed: seed + 2, shade: 0.34, hmin: 5, hvar: 6, spacing: 5 },
    { t: 'snow', from: hz + 4 },
    { t: 'treeline', y: hz + 9, seed: seed + 3, shade: 0.2, hmin: 7, hvar: 9, spacing: 7 },
  ];
}

const scenery = (snow: string, sky: string): ThingDef[] => [
  { id: 'snow', nouns: ['snow', 'ground'], x: 160, y: 140, reach: 400, look: snow },
  { id: 'mountains', nouns: ['mountain', 'sky'], x: 160, y: 100, reach: 400, look: sky },
];

const firstVisit = (id: string, points = 2): Rule => ({ enter: true, if: [{ not: { flag: `seen.${id}` } }], do: [{ set: `seen.${id}` }, { score: points, id: `seen.${id}` }] });

// ---------------------------------------------------------------------------------------------

export const ford: RoomDef = {
  id: 'ford',
  mark: 'water',
  music: 'valley',
  name: '강 여울',
  look: '검은 강이 얼음 제방 사이로 흐른다, 얼기엔 너무 빠르고 건너기엔 너무 차다. 판자 다리가 북쪽으로 이어진다, 휘기엔 너무 차가운 공기 속으로 곧게 올라가는 잿빛 연기 한 가닥을 향해. 길 옆에 이정표가 기울어 있다.',
  lookWhen: [
    { if: [THAW], look: '검은 강이 썩은 얼음 제방 사이로 시끄럽게 흐른다, 얼음 판이 통째로 물살에 내려간다. 판자 다리가 북쪽으로 이어진다, 열한 지붕의 연기를 향해. 길 옆에 이정표가 기울어 있다.' },
    { if: [LIT], look: '검은 강이 얼음 제방 사이로 흐른다, 얼기엔 너무 빠르고 건너기엔 너무 차다. 판자 다리가 북쪽으로 이어진다, 열한 지붕의 연기를 향해. 길 옆에 이정표가 기울어 있다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 60, walkTop: 86,
    layers: [
      ...backdrop(60, 71),
      { t: 'river', y: 126, w: 11, seed: 7 },
      { t: 'path', w: 12, pts: [[160, 172], [160, 150]] },
      { t: 'path', w: 12, pts: [[160, 102], [163, 84]] },
      { t: 'tufts', count: 26, seed: 72 },
    ],
    props: [
      { t: 'bridge', x: 160, y: 126, h: 50 },
      { t: 'pine', x: 40, y: 92, h: 60, seed: 71 },
      { t: 'pine', x: 250, y: 90, h: 54, seed: 72 },
      { t: 'pine', x: 300, y: 94, h: 66, seed: 73 },
      { t: 'signpost', x: 196, y: 158 },
      { t: 'boulder', x: 100, y: 160, r: 8, seed: 74 },
      { t: 'pine', x: 26, y: 184, h: 92, seed: 75 },
      { t: 'pine', x: 296, y: 186, h: 98, seed: 76 },
    ],
  },
  things: [
    { id: 'river', nouns: ['river', 'water'], x: 160, y: 126, reach: 400, look: '빠르고, 검고, 시끄럽다. 얼음 판들이 화물처럼 실려 간다.' },
    { id: 'bridge', nouns: ['bridge'], x: 160, y: 126, reach: 400, look: '통나무 두 개 위에 쪼갠 통나무를 얹은 다리. 만든 사람도 믿지 않았다. 난간이 있다.' },
    { id: 'sign', nouns: ['sign'], x: 196, y: 158, reach: 34, try: ['read sign'], look: '적혀 있다. 홀로미어, 북쪽. 아래에 다른 필체로. "그 외 모든 곳: 각자 책임."' },
    { id: 'trees', nouns: ['tree'], x: 160, y: 100, reach: 400, look: '양쪽 제방의 소나무들, 네가 다리를 시험하는 걸 보려는 듯 기울어 있다.' },
    ...scenery('제방의 눈은 단단히 껍질 졌다. 걸을 때마다 장화가 뚫고 들어간다.', '여기 북쪽의 산들은 끝내지 못한 일이 있는 표정이다.'),
  ],
  rules: [
    {
      enter: true, if: [{ has: 'bottle' }, { not: { flag: 'ford.wolves' } }],
      do: [{ set: 'ford.wolves' }, { say: '돌아오는 길에 늑대가 너를 찾아냈다. 나무 사이에서 성긴 잿빛 줄로 나와 따라왔다, 늑대가 지키는 거리에서. 여기, 골짜기 언저리에서 그들은 멈춘다, 한꺼번에, 눈 속에 앉아, 그들 없이 내려가는 너를 지켜본다.\n\n이 골짜기는 아무것도 아무도 따라 들어오지 않는 곳이다.' }],
    },
    { on: ['read sign'], if: [{ near: 'sign' }], do: [{ say: '홀로미어, 북쪽. 아래에 다른 필체로. "그 외 모든 곳: 각자 책임."' }, { score: 1, id: 'sign' }] },
    { on: ['read sign'], do: [{ say: '여기서는 읽을 수 없다.' }] },
    { on: ['swim', 'swim river', 'enter river', 'jump river', 'swim water', 'enter water'], do: [{ die: '물에 들어간다. 강이 네 숨을, 그다음 발을, 그다음 나머지를 가져간다. 봄에, 한참 하류에서, 놀란 표정으로 발견된다.' }] },
    { on: ['drink water', 'drink river'], do: [{ say: '제방에서 한 움큼 떠 마신다. 이가 울릴 만큼 차다.' }] },
    { on: ['jump bridge', 'climb bridge'], do: [{ die: '아무도 다투지 않은 논점을 증명하려고 난간을 뛰어넘는다. 강이 그 논점도, 너도 받아들이고, 둘 다 간직한다.' }] },
    { on: ['fish', 'fish river'], do: [{ say: '한동안 물을 지켜본다. 은빛 무언가가 너를 지켜보고, 속지 않는다.' }] },
    { on: 'iska', do: [{ say: 'ISKA. 양 제방에서 얼음이 검은 물 위로 한꺼번에 뻗어 나가고, 세 번의 심장박동 동안 강이 멈춘다. 그러다 말이 파리를 털듯 몸을 떨고, 얼음이 판판이 하류로 떠내려간다. 어떤 것들은 얼기엔 너무 바쁘다.' }] },
    { on: 'veth', do: [{ say: 'VETH. 단어가 납작한 돌처럼 강 위를 튀어 건너 저쪽 제방 소나무의 눈을 털어 낸다. 다리가 삐걱인다, 자기도 듣고 있다는 걸 상기시키려는 듯.' }] },
    { on: 'orun', if: [{ not: { flag: 'orun.ford' } }], do: [{ set: 'orun.ford' }, { gold: 8 }, { sound: 'take' }, { say: 'ORUN. 강은 계속 강이다. 하지만 다리 아래, 눈길이 닿지 않을 두 통나무 사이에 끼어 무언가가 모습을 드러낸다. 지갑. 아주 오래전 서둘러 건너던 누군가가 떨어뜨린. 은화 여덟 닢, 까맣게 변했다. 막대기로 건져 올린다.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 여기서 너에게 숨는 것은 더는 없다. 강은 원래 없었다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const village: RoomDef = {
  id: 'village',
  mark: 'village',
  music: 'village',
  name: '홀로미어',
  look: "홀로미어. 지붕 열한 개, 연기는 하나에서. 마을의 아무것도 냄새가 나지 않는다. 우물은 두레박이 줄에 얼어붙었다. 장로의 회당은 서쪽에 눈 모자를 쓰고 웅크리고 있고, 층계에 사내가 앉아 있다. 여관은, 연기 나는 그 집, 그 동쪽에 서 있다. 광장에서 숄 세 겹의 여자가 반죽 판 옆에서 발을 굴리고 있다.",
  lookWhen: [
    { if: [{ flag: 'hall.thaw' }], look: "홀로미어, 처마마다 물이 떨어진다. 눈이 이엉에서 길고 무른 판으로 미끄러져 쿵 하고 떨어진다. 광장에는 마지막 좋은 눈으로 빚은 형상이 서 있다, 아주 꼿꼿한 등에 목에는 보라색 양털 조각. 인적은 없다. 회당에서 소리가, 빛이, 잔치 냄새가 새어 나온다." },
    { if: [{ flag: 'hall.feast' }], look: "밤의 홀로미어, 모든 문이 열려 있고 집에 사람이 없다. 다들 장로의 회당에 올라가 있다, 아흐레 만에 처음으로 연기구멍에 빛이 난다." },
    { if: [THAW], look: "홀로미어, 지붕마다 연기, 처마마다 물방울. 눈은 문 앞에서 물러나 광장을 갈색으로 젖게 했다. 장로의 회당은 서쪽, 여관은 그 동쪽. 대장간이 울리고, 우물 줄이 오가고, 두 아이가 마지막 좋은 눈으로 무언가를 빚고 있다." },
    { if: [{ flag: 'hearth.lit' }], look: "홀로미어, 모든 지붕에서 연기가 곧게 솟는다. 장로의 회당은 서쪽, 여관은 그 동쪽. 사이에서 대장장이의 풀무가 울리고, 사람들이 네가 지나가면 고개를 들어 끄덕인다. 누군가 우물의 눈을 쓸었다." },
  ],
  scene: {
    kind: 'outdoor', horizon: 70, walkTop: 92,
    layers: [
      ...backdrop(70, 3),
      { t: 'path', w: 13, pts: [[160, 172], [160, 150], [120, 134], [72, 120]] },
      { t: 'path', w: 11, pts: [[160, 150], [210, 130], [250, 116]] },
      { t: 'path', w: 10, pts: [[210, 130], [280, 138], [326, 140]] },
      { t: 'path', w: 10, pts: [[120, 134], [50, 136], [-6, 134]] },
      { t: 'path', w: 9, pts: [[160, 150], [166, 118], [168, 92]] },
      { t: 'tufts', count: 40, seed: 90 },
    ],
    props: [
      { t: 'pine', x: 150, y: 93, h: 48, seed: 2 },
      { t: 'pine', x: 184, y: 96, h: 56, seed: 3 },
      { t: 'pine', x: 314, y: 98, h: 64, seed: 7 },
      // The Elder's hall has no smoke at its roof until its hearth is lit; the inn's fire never went out.
      { t: 'hall', x: 14, y: 116, w: 112, v: 'cold' },
      { t: 'hall', x: 204, y: 112, w: 96 },
      { t: 'signpost', x: 236, y: 117 },
      { t: 'woodpile', x: 130, y: 117 },
      { t: 'well', x: 196, y: 152 },
      { t: 'anvil', x: 104, y: 152 },
      { t: 'barrel', x: 86, y: 150 },
      { t: 'boulder', x: 60, y: 162, r: 7, seed: 22 },
      { t: 'boulder', x: 290, y: 156, r: 8, seed: 23 },
      { t: 'fence', x: 8, y: 150, x1: 50, y1: 156 },
      { t: 'pine', x: 316, y: 186, h: 96, seed: 12 },
    ],
    when: [
      // Once the hearths will hold a flame again, the smith's forge is alight and the hall has smoke at its roof.
      { if: [{ flag: 'hearth.lit' }], props: [{ t: 'brazier', x: 68, y: 150 }, { t: 'hall', x: 14, y: 116, w: 112, v: 'smoke' }] },
      // When the winter breaks: wet thatch showing, the snow drawn back from the doors and the
      // well, and something being built out of what is left of it.
      // While the fires are out, Sigga's board of dough stands in the square.
      { if: [COLD], props: [{ t: 'table', x: 262, y: 160 }] },
      {
        if: [THAW],
        props: [
          { t: 'hall', x: 14, y: 116, w: 112, v: 'thaw' },
          { t: 'hall', x: 204, y: 112, w: 96, v: 'thaw' },
          { t: 'melt', x: 70, y: 124, w: 120, h: 12, seed: 3 },
          { t: 'melt', x: 250, y: 120, w: 104, h: 12, seed: 5 },
          { t: 'melt', x: 190, y: 156, w: 70, h: 16, seed: 8 },
          { t: 'melt', x: 96, y: 156, w: 76, h: 14, seed: 11 },
          { t: 'melt', x: 160, y: 138, w: 90, h: 20, seed: 14 },
          { t: 'melt', x: 30, y: 164, w: 50, h: 8, seed: 17 },
          { t: 'snowman', x: 252, y: 166, ramp: 'purple' },
        ],
      },
    ],
  },
  doors: [
    { x0: 61, y0: 117, x1: 77, y1: 119, to: 'hall', x: 60, y: 112, dir: 'down' },
    { x0: 244, y0: 113, x1: 260, y1: 115, to: 'inn', x: 160, y: 112, dir: 'down' },
  ],
  things: [
    {
      id: 'well', nouns: ['well', 'water'], x: 196, y: 154, reach: 36, look: '자그마한 지붕을 단 돌우물. 아득히 아래 물이 검고 완전히 고요하다.',
      lookWhen: [{ if: [THAW], look: '자그마한 지붕을 단 돌우물. 아득히 아래 물이 검고 움직이고, 오늘 올라온 두레박들에 우물가 돌이 젖어 있다.' }],
    },
    {
      id: 'bucket', nouns: ['bucket', 'rope'], x: 196, y: 154, reach: 36, look: '두레박은 줄에, 줄은 도르래에 얼어붙었다.',
      lookWhen: [{ if: [THAW], look: '줄이 움직이고, 두레박이 가득 차서 올라온다. 홀로미어에서는 아직 아무도 그게 질리지 않았다.' }],
    },
    {
      id: 'hall', nouns: ['hall', 'roof'], x: 69, y: 120, reach: 70, look: "장로의 회당. 오래된 통나무, 깊은 지붕, 액운을 막으려고 박공마다 교차된 들보. 지붕에 연기가 없다. 층계에 사내가 앉아 있다.",
      lookWhen: [
        { if: [THAW], look: "장로의 회당. 눈이 미끄러진 자리에 이엉이 검고 젖게 드러났고, 처마에서 반짝이는 실타래처럼 물이 흐른다." },
        { if: [{ flag: 'hearth.lit' }], look: "장로의 회당. 오래된 통나무, 깊은 지붕, 액운을 막으려고 박공마다 교차된 들보. 지붕에 다시 연기가 난다. 역시 효과가 있는 모양이다." },
      ],
    },
    {
      id: 'snowman', nouns: ['snowman'], x: 252, y: 164, reach: 34, hidden: true, look: '마지막 좋은 눈으로 빚은 형상. 눈은 돌멩이 두 개, 등은 아주 꼿꼿하고, 목에는 보라색 양털 조각. 장로다. 감히 말한 사람은 없다.',
    },
    {
      id: 'inn', nouns: ['inn', 'sign'], x: 252, y: 116, reach: 70, look: '여관. 간판에는 솥이, 혹은 투구가 그려져 있다. 홀로미어에서 연기 나는 유일한 지붕이고, 마을 모든 문에서 이 문으로 눈이 짓밟혀 있다.',
      lookWhen: [{ if: [LIT], look: '여관. 간판에는 솥이, 혹은 투구가 그려져 있다. 어느 쪽이든 "안은 따뜻함"을 뜻하는데, 더는 자랑이 아니다.' }],
    },
    {
      id: 'dough', nouns: ['dough', 'table'], x: 262, y: 162, reach: 36, hidden: true,
      look: "두 개의 걸상 위에 놓인 제빵 판. 열한 덩이어치 반죽이 모양 잡힌 채, 강돌처럼 새하얗게 굳어 있다. 하나가 다른 것들보다 한참 작다.",
    },
    { id: 'door', nouns: ['door'], x: 69, y: 120, reach: 400, look: '두 문이 광장을 마주한다. 서쪽에 회당, 동쪽에 여관. 둘 다 잠기지 않았다. 여기는 아무도 훔쳐 갈 게 남아 있지 않다.' },
    { id: 'shield', nouns: ['shield'], x: 36, y: 120, reach: 50, look: '회당 벽에 채색 방패가 걸려 있다, 사등분의 빨강과 하양. 살아 있는 누구보다 오래된 칠이다.' },
    { id: 'woodpile', nouns: ['woodpile'], x: 146, y: 120, reach: 34, try: ['take wood'], look: '긴 겨울을 예상한 사람의 정성으로 쌓인 쪼갠 소나무, 그리고 도마. 아흐레 동안 아무도 통나무를 가져가지 않았다. 가져가도 할 게 없었으니까.', lookWhen: [{ if: [LIT], look: '긴 겨울을 예상한 사람의 정성으로 쌓인 쪼갠 소나무. 이제 빠르게 줄고 있지만, 아무도 개의치 않는다.' }] },
    { id: 'hatchet', nouns: ['hatchet'], x: 172, y: 122, reach: 30, icon: 'hatchet', take: 'hatchet', takeSay: '언 눈에서 손도끼를 파낸다. 보는 사람은 없다. 이제 네 것이다, 물건이 네 것이 되는 방식으로.', look: '장작더미 옆에 버려진 손도끼, 반쯤 파묻혀 있다.' },
    {
      id: 'anvil', nouns: ['anvil', 'barrel', 'hearth'], x: 104, y: 154, reach: 34, look: "대장장이의 모루, 트인 곳의 그루터기 위에 놓였고, 옆에는 식은 대장간, 둘 다 사람이 없다. 작업대에 검과 방패가 놓여 있다, 불이 꺼지기 전에 완성된.",
      lookWhen: [{ if: [{ flag: 'hearth.lit' }], look: "대장장이의 모루가 울리고 있다. 옆의 대장간은 붙었고 그 뒤로 식지 않게 하고 있다. 오드가 잃어버린 시간을 만회하는 사람처럼 불을 먹인다." }],
    },
    {
      id: 'smoke', nouns: ['smoke'], x: 252, y: 116, reach: 400, look: "잿빛 한 가닥, 여관 지붕에서만, 휘기엔 너무 차가운 공기 속으로 곧게 올라간다.",
      lookWhen: [
        { if: [THAW], look: '모든 지붕의 연기, 이제는 휘어진다, 바람이 있으니까.' },
        { if: [LIT], look: '모든 지붕에서 진한 연기가 곧게 솟는다.' },
      ],
    },
    { id: 'trees', nouns: ['tree'], x: 170, y: 100, reach: 400, look: '눈에 짓눌린 소나무들. 마을 전에도 여기 있었고, 마을 후에도 있을 작정이다.' },
    { id: 'path', nouns: ['path'], x: 160, y: 150, reach: 400, look: '짓밟힌 진눈길들. 남쪽 여울로, 서쪽 소나무 숲으로, 동쪽 농장으로, 그리고 아무도 쓰지 않는 듯한 북쪽 길 하나.' },
    ...scenery('눈. 아주 많이 와 있고 더 올 예정이다.', '단단한 푸른 하늘 아래 하얀 봉우리들. 저 위 어딘가에서 바람이 연습 중이다.'),
  ],
  npcs: [
    { char: 'sigga', x: 236, y: 154, wander: [214, 150, 270, 162], if: [HOME] },
    // Kept indoors since autumn, and out at last.
    { char: 'girl', x: 240, y: 165, dir: 'right', if: [THAW, HOME] },
    { char: 'boy', x: 266, y: 164, dir: 'left', if: [THAW, HOME] },
    // On the hall step while his daughter lies inside; at his forge once it will light.
    { char: 'odd', x: 92, y: 126, dir: 'down', if: [COLD] },
    { char: 'odd', x: 124, y: 154, wander: [116, 152, 140, 158], if: [LIT, HOME] },
  ],
  rules: [
    firstVisit('village', 1),
    { enter: true, if: [COLD], do: [{ show: 'dough' }] },
    { enter: true, if: [LIT], do: [{ hide: 'dough' }] },
    { on: ['take dough', 'eat dough', 'take food', 'eat food'], if: [COLD], do: [{ say: '하나를 집어 든다. 강돌처럼 단단하고 차갑다. 판 위, 제자리에, 다른 것들과 함께 도로 놓는다.' }] },
    { on: ['take woodpile', 'take log', 'chop woodpile', 'chop log'], if: [LIT], do: [{ say: '홀로미어의 모든 화로에 불이 붙어 있고, 각각을 먹이는 일을 맡은 사람이 있다. 기분 상할 거다.' }] },
    { on: ['take woodpile', 'take log', 'chop woodpile', 'chop log'], if: [{ flag: 'hall.laid' }], do: [{ say: '불은 쌓여 있다. 더 많은 나무를 원하지 않는다. 살게 내버려 두길 원한다.' }] },
    { on: ['take woodpile', 'take log', 'chop woodpile', 'chop log'], if: [{ not: { has: 'log' } }, { near: 'woodpile' }], do: [{ give: 'log' }, { sound: 'take' }, { say: '더미를 뒤져 속까지 마른 통나무를 찾고, 도마 위에서 손도끼로 부엌을 쪼갠다.' }, { score: 1, id: 'log' }] },
    { on: ['take woodpile', 'take log'], if: [{ has: 'log' }], do: [{ say: '마른 통나무 하나와 거기서 쪼갠 부엌. 불을 쌓기에 충분하다.' }] },
    { on: ['take woodpile', 'take log'], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: ['knock door', 'open door'], do: [{ say: '홀로미어에는 잠긴 게 없다. 훔칠 만한 게 남은 사람도 없고, 있어도 저녁까지는 다 알 테니.' }] },
    { on: ['drink water', 'drink well', 'take water', 'use well', 'use bucket', 'pull rope'], if: [THAW], do: [{ say: '두레박을 끌어올려 손으로 마신다. 이가 울릴 만큼 차갑고, 네가 맛본 것 중 제일 좋다.' }, { heal: 3 }] },
    { on: ['drink water', 'drink well', 'take water', 'use well', 'use bucket', 'pull rope'], do: [{ say: '줄이 움직이지 않고 두레박이 올라오지 않는다. 겨울이 우물을 가졌고 돌려주지 않는다.' }] },
    { on: 'climb tree', do: [{ say: '맨 아래 가지에 장화를 올린다. 가지가 눈 전부를 네 목덜미에 쏟고, 너는 생각을 고쳐먹는다.' }] },
    { on: 'iska', if: [COLD], do: [{ say: 'ISKA. 광장에는 단어가 멈출 만큼 움직이는 게 없다. 빨래는 이미 판처럼 뻣뻣하다. 하지만 여관 위의 한 가닥 연기가 중간에서 꺾인다, 물살 속 갈대처럼, 한참 만에 펴진다.' }] },
    { on: 'iska', do: [{ say: 'ISKA. 광장의 모든 고개가 돌아간다. "한겨울에 그건 충분히 겪었어," 혼잣말이라기엔 큰 목소리가 말한다. 말하면서 아무도 회당 쪽을 보지 않는다.' }] },
    { on: 'veth', do: [{ say: 'VETH. 덧문이 쾅 닫히고, 지붕 세 채 건너에서 개가 놀라 짖고, 여관의 눈이 통째로 미끄러진다. 목격자가 더 적은 곳에서 연습하기로 결심한다.' }] },
    { on: 'sol', do: [{ say: 'SOL. 한 번 숨 쉬는 동안 홀로미어에 정오가 온다. 선명한 그림자, 밝은 지붕, 소리 내어 웃는 아이. 그러고는 다시 겨울. 하지만 한동안 사람들이 조금 더 꼿꼿이 선다.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 단어가 마을을 있는 그대로 보여 준다, 대체로 보이는 그대로다. 하지만 회당 박공 들보 아래에 붉은 실로 묶은 마가목 가지 묶음이 숨겨져 있다, 액운을 막으려고. 여관 문 위에도 하나. 그리고 아주 작고 아주 새것 하나가 우물 줄에 매달려 있다. 여기 누군가는 아직 믿고 있다. 너는 그게 기쁘다는 걸 발견한다.' }] },
    { enter: true, if: [THAW], do: [{ show: 'snowman' }] },
    // A horse found on a sledge a long way out, for somebody the right size for it.
    {
      on: ['give horse boy', 'give boy horse', 'give horse', 'give horse girl', 'give girl horse'], if: [{ has: 'toyhorse' }, { near: 'boy', d: 60 }],
      do: [{ lose: 'toyhorse' }, { set: 'boy.horse' }, { sound: 'take' }, { say: '남자아이가 말을 두 손으로 받아 씹힌 귀를 직업적 관심으로 살핀다. "누가 아꼈나 봐," 그가 말한다. 따뜻할 튜닉 안에 넣고, 한 손으로 눈 작업으로 돌아간다.' }],
    },
    { on: ['attack snowman', 'push snowman'], do: [{ say: '너는 홀로미어의 테인이다. 약간 놀랍게도, 그건 네가 그럴 수 없다는 뜻임을 깨닫는다.' }] },
    { on: ['use snowman', 'pet snowman', 'take snowman', 'take snow'], if: [THAW], do: [{ say: '눈사람 머리를 굴려 만든다. 소녀가 머리를 살펴보고 원로에게는 너무 작지만 너에게는 대략 맞다고 판정한다. 두 번째, 더 작은 형상에 올라가, 장로 팔꿈치 옆에 세워지고 막대기를 쥐게 된다.' }] },
    { on: ['read sign', 'read inn'], do: [{ say: '글자는 없고, 날씨에 잿빛이 된 그림뿐이다. 솥, 혹은 투구. 그린 사람은 그림보다 따뜻함에 더 강했던 모양이다. 케틀 앤 헬름이라고들 부른다, 안전한 쪽으로.' }] },
    { on: ['wish', 'wish well'], if: [{ near: 'well' }], do: [{ say: '우물에 기대어 소원을 빈다. 소원이 아주 깊이 내려가고 돌아오지 않는다. 전망이 좋다.' }] },
    { on: ['climb well', 'enter well', 'jump well'], do: [{ die: '얼마나 깊은지 보려고 우물에 들어간다. 네 키보다 깊고, 네 용기보다 차갑고, 줄을 들고 오는 사람은 없다.' }] },
    { on: ['buy sword', 'buy'], if: [{ near: 'odd' }, { has: 'sword' }], do: [{ say: '"칼이 있잖아. 부러질 때까지 그거 써," 오드가 말한다. "그러고 와."' }] },
    { on: ['buy sword', 'buy'], if: [{ near: 'odd' }, { gold: 25 }], do: [{ gold: -25 }, { give: 'sword' }, { sound: 'take' }, { score: 3, id: 'sword' }, { say: '철검에 은화 스물다섯 닢. "예쁘진 않아," 오드가 말한다. "예쁘라고 만든 게 아니야."' }] },
    { on: ['buy sword', 'buy'], if: [{ near: 'odd' }], do: [{ say: '"검은 은화 스물다섯 닢이야," 오드가 말한다, "그런데 너한테 스물다섯 닢은 없지."' }] },
    { on: ['buy shield'], if: [{ near: 'odd' }, { gold: 15 }, { not: { has: 'shield' } }], do: [{ gold: -15 }, { give: 'shield' }, { sound: 'take' }, { say: '은화 열다섯 닢으로 오리목과 가죽의 둥근 방패를 산다. "너랑 널 죽이고 싶은 것 사이에 두고 있어," 오드가 말한다. 그에게서 들은 가장 긴 연설이다.' }] },
    { on: ['buy shield'], if: [{ near: 'odd' }], do: [{ say: '"방패는 은화 열다섯 닢. 손님당 하나."' }] },
    { on: ['buy longsword'], if: [{ near: 'odd' }, { has: 'longsword' }], do: [{ say: '"내가 만든 건 그거 하나뿐이야," 오드가 말한다.' }] },
    { on: ['buy longsword'], if: [{ near: 'odd' }, { gold: 60 }], do: [{ gold: -60 }, { give: 'longsword' }, { sound: 'take' }, { say: '은화 예순 닢. 오드가 기름칠 천에서 장검을 풀어 자루부터 내민다. 이번에는 네 눈을 본다. "장작 패는 데 쓰지 마."' }] },
    { on: ['buy longsword'], if: [{ near: 'odd' }], do: [{ say: '"강철은 은화 예순 닢," 오드가 말한다. "한 달 걸렸어. 쉰아홉은 안 받아."' }] },
    { on: ['buy mail'], if: [{ near: 'odd' }, { has: 'mail' }], do: [{ say: '"바보 하나에 갑옷 하나면 충분해," 오드가 말한다.' }] },
    { on: ['buy mail'], if: [{ near: 'odd' }, { gold: 45 }], do: [{ gold: -45 }, { give: 'mail' }, { sound: 'take' }, { say: '은화 마흔다섯 닢으로 누군가의 것이었음이 분명한 사슬갑옷을 산다. "이거 입고 죽은 건 아니야," 오드가 말한다. "벗고 죽었지. 교훈으로 삼아."' }] },
    { on: ['buy mail'], if: [{ near: 'odd' }], do: [{ say: '"갑옷은 은화 마흔다섯 닢."' }] },
    { on: ['temper mail', 'temper bearcloak'], if: [{ near: 'odd' }, { flag: 'hearth.lit' }], do: [{ run: 'temper', arg: 'armor' }] },
    { on: ['temper', 'temper *'], if: [{ near: 'odd' }, { flag: 'hearth.lit' }], do: [{ run: 'temper', arg: 'weapon' }] },
    { on: ['temper', 'temper *'], if: [{ near: 'odd' }], do: [{ say: '"무슨 불로?" 오드가 말한다. "식은 건 못 다뤄. 부수기만 하지."' }] },
    {
      on: ['give pelt sigga', 'give sigga pelt', 'give pelt'], if: [{ near: 'sigga' }, { has: 'pelt' }, { not: { flag: 'sigga.mittens' } }],
      do: [{ lose: 'pelt' }, { set: 'sigga.mittens' }, { run: 'mittens' }, { sound: 'take' }, { say: '시가가 가죽을 받아 뒤집어 보고, 생고기 색이 된 네 손을 본다. "어두워지기 전에 와," 그녀가 말한다. 간다. 그녀가 벙어리장갑 한 켤레를 만들어 두었다, 털을 안으로, 칼자루를 쥘 수 있게 엄지를 붙여서. "고마워하지 마. 동상은 못 봐주겠어."' }, { note: '따뜻한 손: 조금 덜 빨리 지친다.' }],
    },
    { on: ['sell pelt', 'give pelt', 'give pelt odd'], if: [{ near: 'odd' }, { has: 'pelt' }], do: [{ lose: 'pelt' }, { gold: 3 }, { sound: 'take' }, { say: '오드가 가죽을 뒤집어 보고, 끙 소리를 내고, 네 손바닥에 은화 세 닢을 센다. "풀무 가죽이야," 그가 말한다. "다시 풀무가 필요해지면."' }] },
    { on: ['sell pelt'], if: [{ near: 'odd' }], do: [{ say: '"가죽 가져오면 은화 세 닢 줄게," 오드가 말한다.' }] },
    { on: ['sell trinket', 'sell token', 'sell torc', 'sell hearthstone', 'sell brooch', 'sell harefoot', 'sell antlers'], if: [{ near: 'odd' }], do: [{ run: 'sellTrinket' }] },
    { on: ['sell bearskin', 'give bearskin'], if: [{ near: 'odd' }, { has: 'bearskin' }], do: [{ lose: 'bearskin' }, { gold: 8 }, { sound: 'take' }, { say: '오드가 흰 털을 엄지로 쓸어 보고 거의 휘파람을 분다. "은화 여덟 닢. 어떻게 잡았는지는 안 물을게."' }] },
    // What Odd made he will buy back, for less than he sold it; what he did not make, he will not.
    { on: ['sell sword', 'give sword odd'], if: [{ near: 'odd' }, { has: 'sword' }], do: [{ run: 'buyBack', arg: 'sword=10' }] },
    { on: ['sell longsword', 'sell sword', 'give longsword odd'], if: [{ near: 'odd' }, { has: 'longsword' }], do: [{ run: 'buyBack', arg: 'longsword=25' }] },
    { on: ['sell mail', 'give mail odd'], if: [{ near: 'odd' }, { has: 'mail' }], do: [{ run: 'buyBack', arg: 'mail=18' }] },
    { on: ['sell shield', 'give shield odd'], if: [{ near: 'odd' }, { has: 'shield' }], do: [{ run: 'buyBack', arg: 'shield=6' }] },
    { on: ['sell hatchet', 'give hatchet odd'], if: [{ near: 'odd' }, { has: 'hatchet' }], do: [{ say: '"장작더미 거 말하는 거면, 본 적 없고, 돌려받고 싶지도 않아," 오드가 말한다. "찾은 데 둬. 누군가는 부엌을 쪼개야 하니까."' }] },
    { on: ['sell spear', 'sell bow', 'sell bearcloak', 'sell tome', 'sell flame', 'sell frost', 'sell mend', 'sell light', 'sell ward'], if: [{ near: 'odd' }], do: [{ say: '"내가 만든 게 아니고, 내가 안 만든 건 안 사," 오드가 말한다. "그러면 값을 알아야 하니까."' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const pinewood: RoomDef = {
  id: 'pinewood',
  mark: 'wood',
  music: 'wild',
  name: '소나무 숲',
  look: '늙은 소나무들이 길에 바싹 서 있다, 가지는 눈에 눌려 낮게 처졌다. 아주 조용하다, 참은 숨이 조용한 식으로. 길이 갈라진다. 북쪽은 오르막, 남쪽은 그늘로. 홀로미어는 동쪽이다.',
  scene: {
    kind: 'outdoor', horizon: 62, walkTop: 96,
    layers: [
      { t: 'sky', horizon: 62 },
      { t: 'mountains', base: 66, height: 44, seed: 21, far: true },
      { t: 'treeline', y: 70, seed: 31, shade: 0.34, hmin: 8, hvar: 10, spacing: 6 },
      { t: 'snow', from: 68 },
      { t: 'treeline', y: 80, seed: 32, shade: 0.2, hmin: 12, hvar: 14, spacing: 8 },
      { t: 'path', w: 11, pts: [[326, 132], [250, 134], [190, 130]] },
      { t: 'path', w: 10, pts: [[190, 130], [170, 110], [160, 94]] },
      { t: 'path', w: 11, pts: [[190, 130], [150, 150], [140, 172]] },
      { t: 'tufts', count: 30, seed: 41 },
    ],
    props: [
      { t: 'pine', x: 22, y: 100, h: 78, seed: 41 },
      { t: 'pine', x: 62, y: 98, h: 60, seed: 42 },
      { t: 'pine', x: 104, y: 104, h: 88, seed: 43 },
      { t: 'pine', x: 206, y: 100, h: 70, seed: 45 },
      { t: 'pine', x: 248, y: 98, h: 58, seed: 46 },
      { t: 'pine', x: 290, y: 104, h: 86, seed: 47 },
      { t: 'pine', x: 60, y: 158, h: 96, seed: 49 },
      { t: 'pine', x: 236, y: 166, h: 104, seed: 50 },
      { t: 'boulder', x: 106, y: 150, r: 10, seed: 51 },
      { t: 'boulder', x: 300, y: 158, r: 8, seed: 52 },
      { t: 'pine', x: 8, y: 184, h: 108, seed: 53 },
      { t: 'pine', x: 312, y: 186, h: 96, seed: 54 },
    ],
  },
  // With everybody else at the inn until the hearth is lit; and up at the hall for a feast.
  npcs: [{ char: 'toke', x: 276, y: 142, wander: [262, 138, 300, 150], if: [LIT, HOME] }],
  spawns: [
    { id: 'wolf1', kind: 'wolf', x: 40, y: 140, respawn: 2400 },
    { id: 'wolf2', kind: 'wolf', x: 90, y: 116, respawn: 2400 },
  ],
  things: [
    { id: 'trees', nouns: ['tree'], x: 160, y: 110, reach: 400, look: '보이는 만큼 멀리까지 소나무, 별로 멀지 않다. 무언가가 하나의 껍질을 높은 곳에서 벗겨 냈다. 바라는 것보다 높이.' },
    { id: 'tracks', nouns: ['tracks'], x: 180, y: 132, reach: 60, look: '발자국이 길을 가로지른다, 하나하나 네 손만 하다. 최근 것이고, 아주 많다.' },
    { id: 'path', nouns: ['path'], x: 190, y: 130, reach: 400, look: '동쪽은 마을로. 북쪽 길은 민둥 마루를 향해 오른다. 남쪽은 더 빽빽한 나무로 내려가고, 누군가 뭔가를 끌고 간 자국이 있다.' },
    { id: 'boulder', nouns: ['boulder'], x: 106, y: 150, reach: 50, look: '서리가 거의 반으로 쪼갠 바위.' },
    ...scenery('깊고, 깨끗하고, 네 것 아닌 발자국들이 찍혀 있다.', '나무가 허락하는 조금의 하늘은 차가운 쇳빛이다.'),
  ],
  rules: [
    firstVisit('pinewood'),
    {
      on: ['give potion toke', 'give toke potion', 'give potion', 'use potion toke'], if: [{ near: 'toke' }, { has: 'potion' }, { not: { flag: 'toke.mended' } }],
      do: [{ lose: 'potion' }, { set: 'toke.mended' }, { run: 'practise', arg: 'archery=90' }, { sound: 'take' }, { say: '토케가 병을 보고, 너를 보고, 이로 마개를 뽑아 단숨에 마신다. 붕대를 푼다. 물린 자리는 분홍 바늘자국으로 아물었다. 손을 편다, 천천히, 남의 손인 것처럼. "그래," 그가 말한다. "거기 서. 아니, 저기. 발 벌려. 팔로 당겼어. 등으로 당겨." 그에게서 들은 가장 긴 연설이고, 거의 한 시간 이어진다.' }, { note: '활솜씨가 전보다 한참 나아졌다.' }],
    },
    { on: 'climb tree', do: [{ say: '맨 아래 가지는 닿지 않을 만큼 높고, 껍질은 얼음으로 번들거린다.' }] },
    { on: 'listen', do: [{ say: '솔잎에 바람 소리. 그 아래, 멀리, 울부짖음일지도 네 신경일지도 모를 소리.' }] },
    { on: 'orun', if: [{ not: { flag: 'orun.pinewood' } }], do: [{ set: 'orun.pinewood' }, { give: 'venison' }, { sound: 'take' }, { say: 'ORUN. 소나무 가지 높은 곳, 열두 번은 지나쳤을 곳에 껍질로 싼 꾸러미가 매달려 있다. 사냥꾼의 비축, 늑대가 못 닿는 곳에. 훈제 사슴고기. 아마 토케 거다. 한 점만 가지고 나머지는 둔다, 거의 정직하게.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 숲에는 더 이상 비밀이 없거나, 기꺼이 내줄 비밀이 없다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const farm: RoomDef = {
  id: 'farm',
  mark: 'farm',
  music: 'valley',
  name: '고름의 농장',
  look: '낮은 농가, 건초더미 둘, 더 나은 겨울을 본 양 우리. 저편 밭은 한 자 깊이 눈 아래다. 마을은 서쪽, 오솔길은 북쪽 언 호수로 이어진다. 여기 있는 건 양뿐이다.',
  lookWhen: [
    { if: [THAW], look: '낮은 농가, 건초더미 둘, 고개를 든 양 우리. 밭의 눈은 잿빛으로 물렁해졌고, 이랑에는 갈색이 비친다. 마을은 서쪽, 오솔길은 북쪽 호수로 이어진다.' },
    { if: [LIT], look: '낮은 농가, 건초더미 둘, 더 나은 겨울을 본 양 우리. 저편 밭은 한 자 깊이 눈 아래다. 마을은 서쪽, 오솔길은 북쪽 언 호수로 이어진다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 68, walkTop: 90,
    layers: [
      ...backdrop(68, 51),
      { t: 'path', w: 11, pts: [[-6, 138], [70, 140], [150, 132], [228, 116]] },
      { t: 'path', w: 9, pts: [[150, 132], [176, 110], [180, 90]] },
      { t: 'path', w: 10, pts: [[150, 132], [170, 152], [176, 172]] },
      { t: 'tufts', count: 36, seed: 52 },
    ],
    props: [
      { t: 'pine', x: 300, y: 98, h: 66, seed: 61 },
      { t: 'pine', x: 20, y: 96, h: 54, seed: 62 },
      { t: 'hall', x: 196, y: 112, w: 78, v: 'cold' },
      { t: 'barrel', x: 284, y: 114 },
      { t: 'haystack', x: 110, y: 110, r: 15 },
      { t: 'haystack', x: 138, y: 116, r: 11 },
      { t: 'fence', x: 30, y: 122, x1: 96, y1: 120 },
      { t: 'fence', x: 28, y: 160, x1: 104, y1: 160 },
      { t: 'fence', x: 96, y: 122, x1: 106, y1: 158 },
      { t: 'sheep', x: 52, y: 142, seed: 1 },
      { t: 'sheep', x: 76, y: 134, seed: 2 },
      { t: 'sheep', x: 70, y: 152, seed: 4 },
      { t: 'boulder', x: 250, y: 156, r: 8, seed: 63 },
      { t: 'pine', x: 310, y: 184, h: 92, seed: 64 },
    ],
    when: [
      { if: [{ flag: 'hearth.lit' }], props: [{ t: 'hall', x: 196, y: 112, w: 78, v: 'smoke' }] },
      // A fourth ewe, if somebody has brought her home out of the wild.
      { if: [{ flag: 'farm.stray' }], props: [{ t: 'sheep', x: 96, y: 146, seed: 7 }] },
      // The thaw: the south field going soft, as Gorm says.
      {
        if: [THAW],
        props: [
          { t: 'hall', x: 196, y: 112, w: 78, v: 'thaw' },
          { t: 'melt', x: 236, y: 120, w: 96, h: 12, seed: 21 },
          { t: 'melt', x: 110, y: 160, w: 150, h: 14, seed: 24 },
          { t: 'melt', x: 250, y: 150, w: 110, h: 18, seed: 27 },
          { t: 'melt', x: 60, y: 122, w: 80, h: 10, seed: 30 },
        ],
      },
    ],
  },
  npcs: [{ char: 'gorm', x: 168, y: 142, wander: [140, 136, 200, 150], if: [LIT, HOME] }],
  things: [
    {
      id: 'sheep', nouns: ['sheep'], x: 100, y: 142, reach: 60, look: '암양 세 마리, 뭉쳐서 허공을 씹고 있다. 희망 없이 너를 본다.',
      lookWhen: [{ if: [{ flag: 'farm.stray' }], look: '암양 네 마리. 셋은 뭉쳐 있다. 넷째는 조금 떨어져 서 있다, 세상을 본 자답게.' }],
    },
    { id: 'fence', nouns: ['fence'], x: 100, y: 142, reach: 60, look: '양 우리. 손에 잡히는 대로 여러 번 고쳤다.' },
    { id: 'hay', nouns: ['haystack'], x: 124, y: 118, reach: 40, look: '눈 모자를 쓴 건초더미 둘. 작은 쪽은 뜯겼다. 겨울이 비축을 갉아먹고 있다.' },
    { id: 'house', nouns: ['hall', 'door', 'roof'], x: 236, y: 116, reach: 60, look: "고름의 농가. 문은 닫혔고 굴뚝은 차갑다. 그는 다들과 함께 여관에 내려가 있고, 하루 두 번 올라와 양을 돌본다.", lookWhen: [{ if: [LIT], look: "고름의 농가, 지붕에 다시 연기가 난다. 그는 여전히 나와서 양들과 하루를 보낸다. 사람은 동행에 익숙해지는 법이다." }] },
    { id: 'barrel', nouns: ['barrel'], x: 284, y: 116, reach: 34, look: '빈 씨앗 통. 아주 비었다. 긁어냈다.' },
    { id: 'trees', nouns: ['tree'], x: 300, y: 100, reach: 400, look: '밭 가장자리의 소나무 몇 그루, 거리를 두고 있다.' },
    ...scenery('이 아래 어딘가에 밭이 있다. 그건 믿어야 한다.', '여기는 하늘이 넓고, 그 어느 조각도 따뜻하지 않다.'),
  ],
  rules: [
    firstVisit('farm'),
    { on: ['pet sheep', 'kiss sheep', 'take sheep'], do: [{ say: '가장 가까운 암양이 온몸으로 너에게 기대고, 한숨 쉬고, 다시 눈을 멍하니 본다.' }] },
    { on: ['attack sheep'], do: [{ say: '고름에게 남은 건 얼마 없다. 그의 양은 건드리지 않는다.' }] },
    { on: ['give sheep', 'give sheep gorm', 'give gorm sheep', 'use sheep gorm'], if: [{ has: 'ewe' }, { near: 'gorm' }], do: [{ cmd: 'talk to gorm' }] },
    // Handing the sack over is the same as coming up and saying so.
    { on: ['give grain', 'give grain gorm', 'give gorm grain', 'use grain', 'use grain gorm', 'drop grain'], if: [{ has: 'grain' }, { near: 'gorm' }], do: [{ cmd: 'talk to gorm' }] },
    { on: ['give grain', 'give grain gorm', 'give gorm grain', 'use grain', 'use grain gorm'], if: [{ has: 'grain' }], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 잠시 눈이 유리처럼 투명해진다. 동쪽 밭의 이랑, 잃어버린 보습 날, 그리고 집 모퉁이에서 세 걸음, 뚜껑 덮인 단지가 있다. 고름의 저축이라면 저축인 것. 단어가 약해질 때까지 아주 열심히 딴 데를 본다.' }] },
    {
      on: ['give herb sheep', 'give sheep herb', 'use herb sheep', 'give herb'], if: [{ near: 'sheep', d: 70 }, { has: 'herb' }, { not: { flag: 'farm.ewe' } }],
      do: [{ lose: 'herb' }, { set: 'farm.ewe' }, { gold: 6 }, { sound: 'take' }, { say: '울타리 사이로 서리버섯을 내민다. 가장 가까운 암양이 그것과 너를, 전에 실망해 본 생물의 싫증으로 가늠하더니, 홀로미어에서 본 첫 진정한 열의로 먹어 치운다. 더 찾으려고 일어난다. 양이 누워 있던 곳, 짚에 눌려 붙어, 도적의 허리띠에서 떨어졌을 은화 여섯 닢 든 작은 지갑이 있다. 양은 그걸 원하지 않는 것 같다.' }],
    },
    { on: ['open door', 'knock door', 'enter hall', 'enter door'], do: [{ say: '사람이 없다. 고름은 여기 나와 있고, 들어가서 없어진 걸 세고 싶지 않은 사내처럼 보인다.' }] },
    { on: ['look haystack', 'take haystack'], if: [{ near: 'hay' }, { not: { flag: 'farm.hay' } }], do: [{ set: 'farm.hay' }, { gold: 2 }, { sound: 'take' }, { say: '건초더미에 물건을 숨긴다는 이론으로 건초에 팔을 밀어 넣는다. 은화 두 닢이 넝마에 묶여 있다. 누군가의 비상금. 고름을 찾아 두리번거리고, 그러고는 고름을 찾아 두리번거리지 않는다.' }] },
    { on: ['sleep haystack', 'enter haystack', 'climb haystack', 'jump haystack'], do: [{ say: '잠시 파고든다. 따뜻하고, 까칠하고, 암양 한 마리가 노골적인 경멸로 너를 보고 있다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const tower: RoomDef = {
  id: 'tower',
  mark: 'tower',
  name: '옛 망루',
  look: "옛 망루는 남쪽 길 위 언덕의 부러진 이다, 골짜기 어귀에서 아침 나절 너머. 곁에 사람 키만 한 돌이 서 있고, 면에 룬 문자가 깊이 새겨져 있고, 등에 눈이 쌓였다. 누군가 벽 바람그늘에 야영하고 있고, 불은 아직 타고 있다. 너는 이제 골짜기를 지났다.",
  scene: {
    kind: 'outdoor', horizon: 64, walkTop: 90,
    layers: [...backdrop(64, 81), { t: 'path', w: 10, pts: [[-6, 140], [80, 144], [170, 136], [216, 124]] }, { t: 'path', w: 9, pts: [[170, 136], [160, 110], [164, 90]] }, { t: 'path', w: 9, pts: [[170, 136], [164, 160], [160, 172]] }, { t: 'tufts', count: 28, seed: 82 }],
    props: [
      { t: 'tower', x: 222, y: 120, w: 52, h: 114, seed: 5 },
      { t: 'boulder', x: 262, y: 128, r: 9, seed: 83 },
      { t: 'boulder', x: 276, y: 136, r: 6, seed: 84 },
      { t: 'boulder', x: 184, y: 126, r: 6, seed: 85 },
      { t: 'campfire', x: 244, y: 146, v: 'kettle' },
      { t: 'pine', x: 30, y: 98, h: 64, seed: 86 },
      { t: 'pine', x: 300, y: 96, h: 56, seed: 87 },
      { t: 'pine', x: 20, y: 184, h: 90, seed: 88 },
      { t: 'pine', x: 304, y: 186, h: 96, seed: 89 },
    ],
    when: [
      { if: [{ not: { knows: 'word:iska' } }], props: [{ t: 'stone', x: 100, y: 132, h: 48, v: 'b', seed: 3 }] },
      { if: [{ knows: 'word:iska' }], props: [{ t: 'stone', x: 100, y: 132, h: 48, v: 'b', seed: 3, lit: 1 }] },
      // A fire of your own, by the stone, for as long as nobody says the word over it.
      { if: [{ flag: 'tower.fire' }], props: [{ t: 'campfire', x: 126, y: 146, v: 'kettle' }] },
    ],
    lights: [{ x: 244, y: 140, r: 30, i: 0.6, kind: 'warm' }],
  },
  spawns: [{ id: 'lookout', kind: 'archer', x: 270, y: 150 }],
  things: [
    { id: 'tower', nouns: ['tower', 'door'], x: 222, y: 124, reach: 50, look: '한때 이 길을 지켰다. 이제 윗 삼분의 일은 발밑에 널려 있고, 눈이 문 안으로 쌓였다.' },
    { id: 'stone', nouns: ['menhir', 'rune'], x: 100, y: 134, reach: 34, try: ['read rune'], look: '사람 키만 한 돌, 듣는 것처럼 기울어, 면에 룬 문자 하나가 깊이 새겨져 있다. 서리는 새긴 곳에만 모였다. 누군가 아주 오래전에 앞의 잔디를 파이게 했다, 앉은 아이 둘 크기쯤.' },
    {
      id: 'heather', nouns: ['heather', 'hearth'], x: 126, y: 148, reach: 30, try: ['light fire'],
      look: '죽은 히스, 갈색이고 마른, 돌 바람그늘의 눈 위로 솟아 있다. 한 줌이면 부싯깃이 되겠다.',
      lookWhen: [{ if: [{ flag: 'tower.fire' }], look: '네 불. 히스 한 줌과 마른 소나무 조금, 어려움이라는 걸 들어 본 적 없는 것처럼 타고 있다.' }],
    },
    { id: 'camp', nouns: ['camp'], x: 244, y: 148, reach: 34, look: "누군가의 야영지, 탑 벽 바람그늘에. 침낭, 냄비, 소나무 옹이 불, 잘 타고 있다. 이 나라에서 네가 본 불 중 살라고 애걸받지 않은 첫 불이다." },
    { id: 'cache', nouns: ['chest'], x: 150, y: 156, reach: 26, try: ['open chest'], icon: 'chest', hidden: true, look: '조금 전에는 없던 작은 철 테두리 상자. 혹은 있었는데 네가 못 봤거나.' },
    { id: 'rubble', nouns: ['boulder'], x: 262, y: 130, reach: 50, look: '무너진 돌들, 서 있을 거라 기대한 사람이 반듯하게 다듬은.' },
    { id: 'trees', nouns: ['tree'], x: 30, y: 100, reach: 400, look: '소나무들은 탑에서 물러나 있다. 나무는 기억한다.' },
    ...scenery('탑 주변이 짓밟혀 있다. 누군가 여기서 살고 있다.', '남쪽 하늘은 네가 지나온 길의 색이다.'),
  ],
  rules: [
    firstVisit('tower'),
    {
      on: ['read menhir', 'read rune', 'pet menhir', 'pet rune', 'look rune'], if: [{ near: 'stone' }, { not: { knows: 'word:iska' } }],
      do: [{ teach: 'word:iska' }, { run: 'study', arg: 30 }, { sound: 'word' }, { score: 8, id: 'word.iska' }, { say: '돌에 손을 얹고 읽는다.\n\n단어를 배운다기보다 이미 입 안에 있던 걸 발견하는 기분이다. ISKA다.' }, { note: '팁: ISKA를 입력해 단어를 말한다.' }],
    },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], if: [{ near: 'stone' }], do: [{ say: '룬 문자가 이제 희미하게 빛난다. 가진 걸 너에게 줬다.' }] },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], do: [{ say: '충분히 가까이 있지 않다.' }] },
    // Out here a fire lights. And then there is what the word does to it.
    { on: ['light hearth', 'light heather', 'light', 'use flint', 'use flint heather', 'light camp'], if: [{ flag: 'tower.fire' }], do: [{ say: '타고 있다. 그 위에 손을 쪼인다. 불이 뭔가를 돌려준다는 걸 잊고 있었다.' }] },
    {
      on: ['light hearth', 'light heather', 'light', 'use flint', 'use flint heather', 'light camp'], if: [{ has: 'flint' }],
      do: [{ set: 'tower.fire' }, { heal: 10 }, { sound: 'take' }, { say: '이제 골짜기를 지났고, 마른 히스 한 줌에 불꽃을 튀기자 평생 이 순간을 기다렸다는 듯 붙는다. 그 위에 손을 쪼인다.' }],
    },
    { on: ['light hearth', 'light heather', 'light camp'], do: [{ say: '불 붙일 게 없다. 하지만 누군가는 있다. 탑 벽 바람그늘에 불이 있다, 불이 타야 할 대로 타고 있다.' }] },
    {
      on: 'iska', if: [{ flag: 'tower.fire' }],
      do: [{ set: 'tower.fire', to: false }, { set: 'tower.still' }, { say: 'ISKA.\n\n네 앞에 내리던 눈이 멎는다. 떨어지는 게 아니다. 멎는다, 조각마다 있던 자리에, 병 속의 씨앗처럼 공중에 매달려. 손을 내밀어도 조각들이 비켜주지 않는다. 못처럼 박혀 있다. 네 불이 납작하게 눕더니, 연기도 없이 꺼지고, 손가락에서 온기가 실에 감겨 뽑히듯 빠져나간다.\n\n한 단어가 붙들기에 하늘 한 면의 눈은 너무 많고, 단어는 오래 붙들지 못한다. 눈이 다시 내리기 시작한다.\n\n확인하려고 단어를 다시 말하려 해도 나오지 않는다. 혀가 굵고 느리다, 하루 종일 말한 뒤의 혀처럼. 기다려야 한다.\n\n꺼진 불 곁에 앉아 기다리며, 눈이 매달렸던 곳을 보고, 그것에 대해 생각한다.' }],
    },
    {
      on: 'iska',
      do: [{ set: 'tower.still' }, { say: 'ISKA.\n\n네 앞에 내리던 눈이 멎는다. 떨어지는 게 아니다. 멎는다, 조각마다 있던 자리에, 병 속의 씨앗처럼 공중에 매달려. 손을 내밀어도 조각들이 비켜주지 않는다. 못처럼 박혀 있다. 탑 벽 저편에서, 야영 불이 장작 위로 납작하게 눕는다. 손가락에서 온기가 실에 감겨 뽑히듯 빠져나간다.\n\n한 단어가 붙들기에 하늘 한 면의 눈은 너무 많고, 단어는 오래 붙들지 못한다. 눈이 다시 내리기 시작하고, 야영 불이 몸을 일으킨다.\n\n확인하려고 단어를 다시 말하려 해도 나오지 않는다. 혀가 굵고 느리다, 하루 종일 말한 뒤의 혀처럼. 기다려야 한다.' }],
    },
    { on: ['warm', 'warm *'], do: [{ say: '그저 불인 불에 손을 쪼인다. 고개를 넘어온 뒤 처음으로 한쪽이 따뜻하다.' }] },
    { on: ['enter tower', 'enter door', 'climb tower', 'open door'], do: [{ say: '계단은 백 년 전에 무너졌다. 안에는 눈과 새 뼈와 아주 많은 하늘뿐이다.' }] },
    { on: 'orun', if: [{ not: { flag: 'tower.cache' } }], do: [{ set: 'tower.cache' }, { show: 'cache' }, { score: 6, id: 'cache' }, { say: 'ORUN. 단어가 유리에 닿은 숨결처럼 너에게서 나가고, 세상이 이음새를 드러낸다. 길가에, 눈에 반쯤 묻혀, 아무것도 없던 곳에 상자가 서 있다.' }] },
    { on: ['open chest', 'take chest', 'look chest'], if: [{ flag: 'tower.cache' }, { not: { flag: 'tower.looted' } }, { near: 'cache' }], do: [{ set: 'tower.looted' }, { gold: 40 }, { give: 'potion', n: 2 }, { sound: 'take' }, { say: "안에는. 은화 마흔 닢, 붉은 약 두 병, 그리고 쪽지. \"이걸 읽을 수 있다면 숨겨진 걸 볼 수 있다는 뜻이니 내 조언은 필요 없겠지. 돈은 가져가라.\"" }] },
    { on: ['open chest', 'take chest'], if: [{ flag: 'tower.looted' }], do: [{ say: '이제 쪽지 말고는 비었다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const camp: RoomDef = {
  id: 'camp',
  mark: 'camp',
  name: '도적 야영지',
  look: '소나무 사이 웅덩이에 가죽 천막 둘과 불. 상자 곁에 자루와 통이 쌓여 있고, 대부분 남의 낙인이 찍혀 있다. 길은 북쪽 소나무숲으로 오르고 동쪽 여울로 난다.',
  scene: {
    kind: 'outdoor', horizon: 60, walkTop: 92,
    layers: [
      { t: 'sky', horizon: 60 },
      { t: 'mountains', base: 64, height: 40, seed: 91, far: true },
      { t: 'treeline', y: 68, seed: 92, shade: 0.34, hmin: 8, hvar: 10, spacing: 6 },
      { t: 'snow', from: 66 },
      { t: 'treeline', y: 78, seed: 93, shade: 0.2, hmin: 12, hvar: 14, spacing: 8 },
      { t: 'path', w: 10, pts: [[326, 140], [240, 142], [170, 134]] },
      { t: 'path', w: 10, pts: [[170, 134], [150, 110], [144, 90]] },
      { t: 'tufts', count: 24, seed: 94 },
    ],
    props: [
      { t: 'pine', x: 20, y: 100, h: 76, seed: 95 },
      { t: 'pine', x: 196, y: 98, h: 62, seed: 96 },
      { t: 'pine', x: 240, y: 102, h: 80, seed: 97 },
      { t: 'pine', x: 296, y: 100, h: 68, seed: 98 },
      { t: 'tent', x: 70, y: 124, w: 50 },
      { t: 'tent', x: 126, y: 116, w: 40 },
      { t: 'campfire', x: 104, y: 144 },
      { t: 'barrel', x: 40, y: 146 },
      { t: 'barrel', x: 30, y: 152 },
      { t: 'fence', x: 180, y: 160, x1: 250, y1: 162 },
      { t: 'pine', x: 8, y: 186, h: 100, seed: 99 },
      { t: 'pine', x: 310, y: 186, h: 94, seed: 100 },
    ],
  },
  spawns: [
    { id: 'bandit1', kind: 'bandit', x: 90, y: 150 },
    { id: 'bandit2', kind: 'bandit', x: 130, y: 132 },
    { id: 'bandit3', kind: 'archer', x: 56, y: 140 },
  ],
  things: [
    { id: 'chest', nouns: ['chest'], x: 56, y: 158, reach: 30, try: ['open chest'], icon: 'chest', look: '철 테두리 상자, 뚜껑이 닫혀 있다. 도적들이 잠가 둘 가치가 있다고 여긴 것이 안에 있다.' },
    { id: 'tents', nouns: ['tent'], x: 80, y: 126, reach: 60, look: '가죽 천막들, 연기와 젖은 개 냄새가 악취다. 가을 이후 환기한 적이 없다.' },
    { id: 'fire', nouns: ['hearth'], x: 104, y: 146, reach: 40, look: '실제로 타는 불. 여기서는, 마을에서 멀어지면, 불길이 제 구실을 한다. 기억해 둘 가치가 있다.' },
    { id: 'barrels', nouns: ['barrel', 'grain'], x: 36, y: 152, reach: 40, look: '통과 자루에 농장 낙인이 새겨 있다. 원 안의 G.' },
    { id: 'trees', nouns: ['tree'], x: 240, y: 104, reach: 400, look: '사방이 울창한 소나무다. 발견되지 않기 좋은 곳.' },
    ...scenery('모닥불 주변이 진창으로 짓이겨졌다.', '연기 한 가닥이 웅덩이에서 올라와 야영지 전체를 들통낸다.'),
  ],
  rules: [
    firstVisit('camp'),
    { on: ['open chest', 'take chest', 'take grain', 'look chest'], if: [{ flag: 'camp.looted' }], do: [{ say: '상자는 비었다. 너는 꼼꼼했다.' }] },
    { on: ['open chest', 'take chest', 'take grain'], if: [{ quiet: true }, { near: 'chest' }], do: [{ set: 'camp.looted' }, { give: 'grain' }, { gold: 20 }, { give: 'potion' }, { sound: 'take' }, { score: 6, id: 'camp.chest' }, { say: '발로 뚜껑을 걷어 연다. G가 새겨진 씨앗 곡식 한 자루, 은화 스무 닢, 누군가 아껴 두던 붉은 약 한 병. 이제 다 네 것이다, 적어도 따질 사람은 남지 않았다.' }] },
    { on: ['open chest', 'take chest', 'take grain'], if: [{ quiet: true }], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: ['open chest', 'take chest', 'take grain'], do: [{ say: '주인들이 아직 아주 여기 있고, 네가 보는 걸 눈치챘다.' }] },
    { on: 'orun', if: [{ quiet: true }, { not: { flag: 'orun.camp' } }], do: [{ set: 'orun.camp' }, { gold: 12 }, { sound: 'take' }, { say: 'ORUN. 가까운 천막 덮개 아래 땅이 파였다가 다시 다져졌다. 도적 하나가 다른 둘을 털고 있었다. 양말 속 은화 열두 닢, 손바닥 깊이 묻혀 있다. 양말째 가져간다.' }] },
    { on: 'orun', if: [{ quiet: false }], do: [{ say: 'ORUN. 여기 숨겨진 것은 모습을 보였겠지만, 숨긴 사람들이 너를 죽이느라 바쁘다.' }] },
    { on: ['enter tent', 'sleep tent', 'look tent'], do: [{ say: '머리를 들이민다. 침낭, 갉아먹은 뼈, 그리고 한동안 잊지 못할 냄새.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const ridge: RoomDef = {
  id: 'ridge',
  mark: 'stone',
  name: '서쪽 능선',
  look: '나무 위 벌거벗은 능선, 바람이 쓸고 간다. 선돌이 날씨 쪽으로 기울어 꼭대기에 서 있고, 면에 룬 문자 하나가 새겨져 있다. 소나무숲은 남쪽 아래, 동쪽으로 능선은 큰 고분으로 이어진다.',
  scene: {
    kind: 'outdoor', horizon: 78, walkTop: 98,
    layers: [
      { t: 'sky', horizon: 78 },
      { t: 'mountains', base: 82, height: 76, seed: 101, far: true },
      { t: 'mountains', base: 86, height: 50, seed: 102 },
      { t: 'snow', from: 84 },
      { t: 'path', w: 9, pts: [[150, 172], [156, 150], [152, 132]] },
      { t: 'path', w: 9, pts: [[156, 150], [240, 140], [326, 136]] },
      { t: 'tufts', count: 14, seed: 103 },
    ],
    props: [
      { t: 'boulder', x: 60, y: 120, r: 12, seed: 104 },
      { t: 'boulder', x: 84, y: 128, r: 7, seed: 105 },
      { t: 'boulder', x: 250, y: 112, r: 10, seed: 106 },
      { t: 'boulder', x: 290, y: 158, r: 9, seed: 107 },
      { t: 'pine', x: 20, y: 184, h: 70, seed: 108 },
      { t: 'pine', x: 300, y: 104, h: 40, seed: 109 },
    ],
    when: [
      { if: [{ not: { knows: 'word:veth' } }], props: [{ t: 'stone', x: 152, y: 126, h: 58, v: 'a', seed: 2 }] },
      { if: [{ knows: 'word:veth' }], props: [{ t: 'stone', x: 152, y: 126, h: 58, v: 'a', seed: 2, lit: 1 }] },
    ],
  },
  spawns: [{ id: 'wolf3', kind: 'wolf', x: 260, y: 150, respawn: 2400 }],
  things: [
    { id: 'stone', nouns: ['menhir', 'rune'], x: 152, y: 128, reach: 36, try: ['read rune'], look: '네 키의 두 배, 마을이 겪은 겨울보다 더 많은 세월로 마을보다 오래됐다. 면에 룬 문자 하나가 새겨져 있다. 바람이 그것을 돌아가는 것 같다.' },
    { id: 'rocks', nouns: ['boulder'], x: 60, y: 122, reach: 60, look: '바람에 벗겨진 회색 암석, 바람받이쪽이 맨질하다.' },
    { id: 'trees', nouns: ['tree'], x: 160, y: 160, reach: 400, look: '이제 소나무숲은 네 아래다, 눈 덮인 어두운 바다.' },
    ...scenery('바람이 마루처럼 단단하게 다졌다.', '여기서는 골짜기 전체가 보인다. 마을, 강, 동쪽의 어두운 고분. 구할 수 있을 만큼 작아 보인다.'),
  ],
  rules: [
    firstVisit('ridge'),
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune', 'look rune'], if: [{ near: 'stone' }, { not: { knows: 'word:veth' } }], do: [{ teach: 'word:veth' }, { run: 'study', arg: 30 }, { sound: 'word' }, { score: 10, id: 'word.veth' }, { say: '룬 문자에 손바닥을 얹는다. 돌이 웅웅 울리고, 바람이 멎고, 단어 하나가 늘 있었다는 듯 마음에 서 있다. VETH. 열어라. 비켜라. 자리를 비워라.' }, { note: '팁: VETH를 입력해 단어를 말한다.' }] },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], if: [{ near: 'stone' }], do: [{ say: '룬 문자가 이제 희미하게 빛난다. 가진 걸 너에게 줬다.' }] },
    { on: ['read menhir', 'read rune', 'pet menhir', 'pet rune'], do: [{ say: '충분히 가까이 있지 않다.' }] },
    { on: 'orun', if: [{ not: { flag: 'orun.ridge' } }], do: [{ set: 'orun.ridge' }, { gold: 5 }, { run: 'study', arg: 20 }, { sound: 'take' }, { say: 'ORUN. 선돌 발치에서 다진 눈이 투명해지고, 그 아래 사천 년 동안 사람들이 두고 간 것들이 놓여 있다. 구슬, 뼈 빗, 강 조약돌처럼 매끈하게 닳은 동전들. 동전 다섯을 가져간다. 빗은 두고.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 돌은 이미 꿰뚫어 봐졌고, 그게 언짢은 것 같다.' }] },
    { on: ['push menhir', 'climb menhir', 'pull menhir'], do: [{ say: '사천 겨울을 버텨 서 있다. 이제 와서 제안을 들을 리 없다.' }] },
    { on: ['jump', 'jump mountain'], do: [{ die: '얼마나 깊은지 보려고 바람받이쪽에서 뛰어내린다. 답은. 충분히 깊다. 까마귀들이 고마워한다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

/** The woman with the ring came home by the coal, and Hollowmere has carried her up here. */
const CAME: Cond[] = [{ flag: 'coal.given' }, THAW];
/** Or the boy was carried home alone, and has been given the place that was kept swept. */
const LAID: Cond[] = [{ flag: 'boy.home' }, THAW];
const boyLaid = <T extends { if: Cond[] }>(came: T): T => ({ ...came, if: LAID });

export const barrow: RoomDef = {
  id: 'barrow',
  mark: 'barrow',
  music: 'barrow',
  name: '고분',
  look: '큰 언덕이 북쪽을 채운다, 언덕이기엔 너무 반듯하다. 고분, 홀로미어가 죽은 이를 두는 곳. 큰 돌이 문을 가로막고 서 있다. 앞의 눈은 신발 한 켤레에 짓밟혔다, 올라갔다 돌아오며. 마을은 남쪽이다.',
  lookWhen: [
    { if: CAME, look: '큰 언덕이 북쪽을 채운다. 고분, 홀로미어가 죽은 이를 두는 곳. 문을 가로막던 큰 돌이 옮겨졌다가, 얼마 전에, 도로 놓였고, 앞의 눈이 수많은 발에 짓밟혀 진창이 됐다. 마을 전체가 여기 올라왔다. 마을은 남쪽이다.' },
    { if: LAID, look: '큰 언덕이 북쪽을 채운다. 고분, 홀로미어가 죽은 이를 두는 곳. 문을 가로막던 큰 돌이 옮겨졌다가, 얼마 전에, 도로 놓였고, 앞의 눈이 수많은 발에 짓밟혀 진창이 됐다. 마을 전체가 여기 올라왔다. 마을은 남쪽이다.' },
    { if: [THAW], look: '큰 언덕이 북쪽을 채운다. 고분, 홀로미어가 죽은 이를 두는 곳. 큰 돌이 문을 가로막고 서 있다. 앞의 눈이 녹아 질척하고, 신발 자국 한 켤레만 남았다, 올라갔다 돌아오며. 마을은 남쪽이다.' },
  ],
  scene: {
    kind: 'outdoor', horizon: 66, walkTop: 118,
    layers: [...backdrop(66, 111, false), { t: 'path', w: 10, pts: [[166, 172], [160, 140], [160, 120]] }, { t: 'tufts', count: 8, seed: 112 }],
    props: [
      { t: 'mound', x: 160, y: 116, w: 250, h: 78 },
      { t: 'stone', x: 96, y: 136, h: 30, v: 'c', seed: 7 },
      { t: 'stone', x: 226, y: 138, h: 34, v: 'b', seed: 8 },
      { t: 'boulder', x: 40, y: 152, r: 8, seed: 113 },
      { t: 'boulder', x: 280, y: 156, r: 10, seed: 114 },
    ],
    when: [{ if: CAME, props: [{ t: 'melt', x: 160, y: 140, w: 70, h: 30, seed: 4 }] }, { if: LAID, props: [{ t: 'melt', x: 160, y: 140, w: 70, h: 30, seed: 4 }] }],
  },
  things: [
    {
      id: 'door', nouns: ['door'], x: 160, y: 120, reach: 34, look: '기둥돌 두 개 사이의 돌판 하나, 위에는 배만큼 긴 상인방. 옮기려면 마을 전체가 함께 매달려야 하고, 마을 전체가 여기 오는 일은 하나뿐이다.',
      lookWhen: [{ if: CAME, look: '큰 돌이 옮겨졌다가, 얼마 전에, 도로 놓였다. 가장자리를 둘러 서리가 깨져 있고, 진창에 굴대 자국이 있다.' }].flatMap((v) => [v, boyLaid(v)]),
    },
    { id: 'mound', nouns: ['barrow'], x: 160, y: 120, reach: 400, look: '고분. 누군가가 쌓은 언덕, 사람을 넣으려고. 그 아래 홀로미어의 사십 대가 누워 있다고 원로는 말한다, 그리고 나머지를 위한 자리도 남겨 두고.' },
    {
      id: 'prints', nouns: ['tracks'], x: 162, y: 140, reach: 60, look: "좁은 신발 한 켤레, 크기에 비해 보폭이 길다. 문까지 갔다가 돌아왔다, 아주 오래되지 않았다. 옆에는, 내내, 눈이 긁혀 있다, 가벼운 뭔가를 강모를 아래로 하고 나른 것처럼.",
      lookWhen: [{ if: CAME, look: '크고 작은 수많은 발, 모두 홀로미어의 것, 함께 올라가서 하나둘 돌아오는. 그리고 썰매 홈.' }].flatMap((v) => [v, boyLaid(v)]),
    },
    { id: 'stones', nouns: ['menhir'], x: 96, y: 138, reach: 60, look: '작은 돌 둘이 문지기처럼 길 양옆을 지킨다. 룬 문자는 닳아 읽을 수 없다.' },
    ...scenery('깨끗한 눈, 까닭 없이 오는 사람 없는 곳에.', '하늘조차 이곳과 거리를 두는 것 같다.'),
  ],
  rules: [
    firstVisit('barrow'),
    {
      on: 'orun', if: [...CAME, { not: { flag: 'barrow.looked' } }],
      do: [{ set: 'barrow.looked' }, { sound: 'quest' }, { score: 5, id: 'barrow.looked' }, { say: '문 앞에 서서 ORUN을 말한다.\n\n쓸어 둔 자리는 더 이상 비어 있지 않다. 손에 황동 반지를 낀 여인이 누워 있고, 그녀의 팔 안쪽에 어린 소년이 있고, 둘 위에 전에 본 적 있는 아이 이불이 덮여 있다, 원로의 난로 곁 판상 침대에서. 먼 길에서 돌아와, 눕고, 아침에도 어디 갈 것 같지 않은 사람들처럼 보인다.' }],
    },
    { on: 'orun', if: CAME, do: [{ say: 'ORUN. 그들은 그대로다. 반지 낀 여인, 팔 안쪽의 소년, 이불. 그 후 누군가 올라와 그들 주변을 쓸었다.' }] },
    { on: 'orun', if: LAID, do: [{ say: 'ORUN. 큰 돌이 뿔처럼 얇아지고, 뒤의 어둠이 형체를 내준다. 홀로미어의 죽은 이들, 사십 대가 발을 문 쪽으로 하고 줄지어 누워 있다. 쓸어 둔 자리에 어린 소년이 누워 있고, 전에 본 아이 이불이 덮여 있다, 원로의 난로 곁에서. 곁에 자리가 있다, 깨끗이 쓸려. 자작나무 빗자루가 모퉁이에 기대어 있다. 이번 주에 쓰였다.' }] },
    { on: 'orun', if: [{ flag: 'sol.said' }], do: [{ say: 'ORUN. 큰 돌이 뿔처럼 얇아지고, 뒤의 어둠이 형체를 내준다. 홀로미어의 죽은 이들, 사십 대가 발을 문 쪽으로 하고 줄지어 누워 있다. 그중 한 자리가 깨끗이 쓸려 있고, 아무도 없다. 자작나무 빗자루가 모퉁이에 기대어 있다. 이번 주에 쓰였다.' }] },
    { on: 'orun', do: [{ say: 'ORUN. 큰 돌이 뿔처럼 얇아지고, 뒤의 어둠이 형체를 내준다. 홀로미어의 죽은 이들, 사십 대가 발을 문 쪽으로 하고 줄지어 누워 있다. 그중 한 자리가 깨끗이 쓸려 있고, 아무도 없다.' }] },
    { on: 'veth', if: [{ near: 'door', d: 60 }], do: [{ say: 'VETH. 큰 돌이 제자리에서 손가락 너비만큼 흔들리고 도로 앉는다. 마을 전체가 함께 매달려 세운 것이니, 움직이려면 다시 그래야 한다. 그게 그것의 요점이다.' }] },
    { on: 'veth', do: [{ say: '단어가 눈 위로 퍼져 나가 사라진다.' }] },
    { on: ['open door', 'push door', 'pull door', 'knock door', 'enter barrow', 'enter door'], do: [{ say: '돌판에 어깨를 댄다. 움직이지 않는다. 죽은 이와, 그중 하나를 나르는 마을을 위한 문이다. 손 시린 사람 하나를 위한 문이 아니다.' }] },
    { on: ['follow tracks', 'look tracks'], if: [{ near: 'prints', d: 80 }, { not: THAW }], do: [{ say: '문까지 갔다가, 돌아옴. 누구든 돌 앞에 발뒤꿈치를 모으고 한참을 서 있었다. 그러고는, 긁힌 자국으로 보아, 문지방을 쓸었다.' }] },
    { on: ['dig', 'dig *'], do: [{ say: '여기 땅은 쇠처럼 단단하다, 삽 깊이도 창 깊이도 그보다 깊이도. 그래서 홀로미어에 고분이 있다. 더 먼 곳 사람들에겐 고분이 없고, 더 먼 곳 사람들은 묻혀 있지 않는다.' }] },
  ],
};

// ---------------------------------------------------------------------------------------------

export const tarn: RoomDef = {
  id: 'tarn',
  mark: 'mere',
  music: 'valley',
  name: '얼어붙은 산호수',
  look: "산 호수, 끝에서 끝까지 잿빛 녹색으로 얼었다. 은둔자의 오두막이 건너편 물가에 닫힌 채 서 있고, 지붕에 연기가 없다. 얼음 한가운데 작은 것이 반짝인다. 고분은 서쪽, 농장은 남쪽이다.",
  lookWhen: [
    { if: [LIT, { quest: 'errand', max: 1 }], look: "산 호수, 끝에서 끝까지 잿빛 녹색으로 얼었다. 은둔자의 오두막이 건너편 물가에 지붕 연기를 피우고 서 있다. 주인은 안에 없다. 그는 물가의 눈 위에 무릎 꿇고, 얼음을 내다보고 있다, 작은 것이 반짝이는 곳을. 고분은 서쪽, 농장은 남쪽이다." },
    { if: [LIT], look: "산 호수, 끝에서 끝까지 잿빛 녹색으로 얼었다. 은둔자의 오두막이 건너편 물가에 지붕 연기를 피우고 서 있다. 얼음 가장자리 눈에 두 무릎 자국이 있고, 아무도 안에 없다. 고분은 서쪽, 농장은 남쪽이다." },
  ],
  scene: {
    kind: 'outdoor', horizon: 66, walkTop: 90,
    layers: [...backdrop(66, 121), { t: 'ice', x: 124, y: 136, rx: 96, ry: 22 }, { t: 'path', w: 9, pts: [[260, 172], [262, 140], [256, 114]] }, { t: 'tufts', count: 16, seed: 122 }],
    props: [
      { t: 'hall', x: 222, y: 108, w: 76, v: 'cold' },
      { t: 'woodpile', x: 190, y: 109 },
      { t: 'pine', x: 30, y: 100, h: 66, seed: 123 },
      { t: 'pine', x: 70, y: 96, h: 50, seed: 124 },
      { t: 'pine', x: 150, y: 98, h: 58, seed: 125 },
      { t: 'boulder', x: 296, y: 150, r: 9, seed: 126 },
      { t: 'pine', x: 312, y: 186, h: 92, seed: 127 },
    ],
    when: [{ if: [LIT], props: [{ t: 'hall', x: 222, y: 108, w: 76, v: 'smoke' }] }],
  },
  doors: [{ x0: 254, y0: 109, x1: 270, y1: 111, to: 'hut', x: 262, y: 112, dir: 'down' }],
  // Every morning for forty years, until he has back what he was looking at.
  npcs: [{ char: 'fenn', x: 196, y: 146, dir: 'left', if: [LIT, { quest: 'errand', max: 1 }] }],
  zones: [{ id: 'thin', x0: 84, y0: 128, x1: 164, y1: 144 }],
  things: [
    // The amulet's reach stays inside the thin ice: from the very edge of it, it is still a hand too far.
    { id: 'ice', nouns: ['tarn'], x: 124, y: 136, reach: 400, look: '잿빛 녹색 얼음, 가장자리는 흐리고 한가운데는 거의 맑다, 가장 얇은 곳이다. 그 아래 어두운 물이 움직이는 게 보인다.' },
    { id: 'amulet', nouns: ['amulet'], x: 124, y: 137, reach: 14, icon: 'amulet', take: 'amulet', takeSay: '단단해진 얼음 위에 무릎 꿇고 마비된 손가락으로 부적을 쪼아 낸다. 안의 돌이 따뜻하다, 전혀 말이 안 된다.', look: '한가운데 표면에 얼어붙은, 사슬에 매단 뭔가. 눈동자처럼 빛을 받는다.' },
    { id: 'hut', nouns: ['hut', 'door', 'smoke'], x: 262, y: 114, reach: 400, look: "은둔자의 오두막, 낮고 튼실하다, 장작더미가 단정하고, 연기가 없다. 여기 사는 사람은 다들 간 곳으로 갔다.", lookWhen: [{ if: [LIT], look: "은둔자의 오두막, 낮고 튼실하다, 장작더미가 단정하고 연기가 꾸준하다." }] },
    { id: 'woodpile', nouns: ['woodpile'], x: 206, y: 112, reach: 34, look: '자작나무와 소나무, 처마까지 쌓였다. 여기 누군가는 겨울 걱정이 없다.' },
    { id: 'trees', nouns: ['tree'], x: 70, y: 100, reach: 400, look: '건너편 물가의 소나무들, 아무것에도 비치지 않는다.' },
    ...scenery('얼음 위로 얇게 날려, 호수가 멍처럼 비친다.', '사방의 봉우리들이 자기 반영을 보는 것처럼 호수를 굽어본다.'),
  ],
  rules: [
    firstVisit('tarn'),
    { zone: 'thin', if: [{ not: { flag: 'tarn.frozen' } }], do: [{ die: '얼음이 한 단어를 말한다, 쩌억, 그러고는 네가 뚫고 들어간다. 물이 너무 차가워 맞은 것 같다. 저녁이면 구멍이 다시 언다, 아문 상처처럼 깔끔하게.' }] },
    { on: 'iska', if: [{ flag: 'tarn.frozen' }], do: [{ say: '산호수는 이미 얼 수 있는 만큼 단단히 얼었다. 너에게 나무라듯 끼익 소리를 낸다.' }] },
    { on: 'iska', do: [{ set: 'tarn.frozen' }, { score: 5, id: 'tarn.frozen' }, { say: 'ISKA. 단어가 서리가 되어 입을 떠난다. 호수 위에서 얼음이 신음하고, 하얗게 되고, 느리게 닫히는 문 같은 소리로 끝에서 끝까지 두꺼워진다. 이제 말도 견디겠다.' }] },
    { on: ['cast frost', 'cast tarn'], if: [{ knows: 'frost' }, { not: { flag: 'tarn.frozen' } }], do: [{ set: 'tarn.frozen' }, { score: 5, id: 'tarn.frozen' }, { say: '추위에 추위를 쏟아붓는다. 얼음이 신음하고, 하얗게 되고, 끝에서 끝까지 두꺼워진다. 이제 말도 견디겠다.' }] },
    { on: ['take woodpile', 'take log'], if: [LIT], do: [{ say: '"저거 다 세어 뒀다," 어디선가 펜이 말한다. 더미는 건드리지 않는다.' }] },
    { on: ['take woodpile', 'take log'], do: [{ say: '자작나무인데, 얼어붙어 한 덩어리다. 누군가 남의 겨울을 쌓아 둔 것이다. 놔둔다.' }] },
    ...fennRules,
    { on: 'orun', do: [{ say: 'ORUN. 얼음이 닦이는 창처럼 맑아진다. 아주 아래, 물이 검은 곳에, 해초 더미일 수도 여인의 어깨걸이일 수도 있는 형체가 있다. 물가 가까이, 얼음 자체에 눌려, 사십 겨울을 같은 자리에 무릎 꿇어 파인 사내의 두 무릎 자국이 있다. 단어를 거둔다.' }] },
    { on: ['freeze', 'freeze tarn'], if: [{ flag: 'tarn.frozen' }], do: [{ say: '얼 수 있는 만큼 얼었다.' }] },
    { on: ['freeze', 'freeze tarn'], if: [{ knows: 'word:iska' }], do: [{ say: '그럴 단어를 너는 안다. 말하라.' }] },
    { on: ['freeze', 'freeze tarn'], do: [{ say: '뭐로? 겨울 자체의 단어든, 서리 주문이든 필요하다.' }] },
    { on: ['skate', 'skate tarn', 'attack tarn', 'fish', 'fish tarn', 'jump tarn'], if: [{ flag: 'tarn.frozen' }], do: [{ say: '이제 얼음이 돌 같다. 삐걱거리지도 않는다.' }] },
    { on: ['skate', 'skate tarn', 'attack tarn', 'jump tarn'], do: [{ die: '달려든다. 얼음이 너를 영광스러운 세 번의 심장 박동 동안 받쳐 준다, 유리처럼 맑은 곳까지, 그러고는 더는 받쳐 주지 않는다.' }] },
    { on: ['fish', 'fish tarn'], do: [{ say: '먼저 구멍을 뚫어야 하는데, 뚫을 만큼 얇은 유일한 곳이 너를 받쳐 주지 않을 곳이다.' }] },
    { on: ['swim', 'swim tarn', 'drink tarn', 'dig tarn'], do: [{ say: '가장자리까지 다 얼음이다. 물에 들어가려면 진짜 노력이 필요하다, 아니면 한가운데서 발 한 번 헛디디거나.' }] },
  ],
};

