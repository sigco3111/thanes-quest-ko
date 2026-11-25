// Interiors: the Elder's hall, the inn, and the hermit's hut.

import type { Cond, RoomDef, Rule } from '../../../engine/types';

const firstVisit = (id: string, points = 1): Rule => ({ enter: true, if: [{ not: { flag: `seen.${id}` } }], do: [{ set: `seen.${id}` }, { score: points, id: `seen.${id}` }] });

const FL = 96;
const LIT: Cond = { flag: 'hearth.lit' };
const COLD: Cond = { not: LIT };
/** Either feast: the night the hearth was lit, or the one held for the thaw. */
const FEAST: Cond = { any: [{ flag: 'hall.feast' }, { flag: 'hall.thaw' }] };
const NOFEAST: Cond = { not: FEAST };

const LAY = ['use log', 'use log hearth', 'use hearth', 'give log hearth', 'drop log hearth', 'use log pallet'];
const STRIKE = ['light hearth', 'light', 'light log', 'use flint', 'use flint hearth', 'use flint log', 'light hearth flint', 'attack flint', 'light flint'];
const OFFER = ['give flint elder', 'give elder flint', 'give flint', 'use flint elder', 'equip flint elder', 'equip flint'];
const SIT = ['sit', 'sit bench', 'sit table', 'sit cup', 'use bench', 'sit door'];
const DRINK = ['drink cup', 'take cup', 'use cup', 'eat cup', 'drink table', 'take table', 'drink', 'drink ale'];

/**
 * Fenn sells and takes back his books wherever he happens to be: in the corner of the inn while
 * the fires are out, on the shore of the tarn, or at home.
 */
export const fennRules: Rule[] = [
  { on: ['buy frost'], if: [{ near: 'fenn', d: 80 }, { has: 'tomeFrost' }], do: [{ say: '"그건 갖고 있어. 두 번 읽는다고 더 차가워지지 않아."' }] },
  { on: ['buy frost'], if: [{ near: 'fenn', d: 80 }, { gold: 20 }], do: [{ gold: -20 }, { give: 'tomeFrost' }, { sound: 'take' }, { say: '은화 스무 닢. 펜이 옅은 푸른 가죽 장정의 책을 내민다. 잡으면 차갑다. "서리. 맞은 것을 느려지게 하지, 그리고 상냥하게 하진 않아."' }] },
  { on: ['buy mend'], if: [{ near: 'fenn', d: 80 }, { has: 'tomeMend' }], do: [{ say: '"그건 이미 갖고 있어."' }] },
  { on: ['buy mend'], if: [{ near: 'fenn', d: 80 }, { gold: 15 }], do: [{ gold: -15 }, { give: 'tomeMend' }, { sound: 'take' }, { say: '작은 초록 책에 은화 열다섯 닢, 만져서 부드러워졌다. "치유. 결국 배울 가치가 있는 유일한 주문이지."' }] },
  { on: ['buy ward'], if: [{ near: 'fenn', d: 80 }, { has: 'tomeWard' }], do: [{ say: '"그건 이미 갖고 있어."' }] },
  { on: ['buy ward'], if: [{ near: 'fenn', d: 80 }, { gold: 25 }], do: [{ gold: -25 }, { give: 'tomeWard' }, { sound: 'take' }, { say: '은화 스물다섯 닢. 회색 철포 장정이다. "수호. 잠시 동안 너를 치는 것을 반으로 줄여 줘."' }] },
  { on: ['buy frost', 'buy mend', 'buy ward', 'buy tome', 'buy light', 'buy magic', 'learn magic'], if: [{ near: 'fenn', d: 80 }], do: [{ say: '"책은 은이야," 펜이 말한다. "치유는 열다섯, 서리는 스물, 수호는 스물다섯. 빛은 안 팔아. 빛은 내게 호의를 베푸는 사람에게 주지."' }] },
  // A book read is a book that can go back on the shelf.
  {
    on: ['give tome', 'give tome fenn', 'give fenn tome', 'sell tome', 'give shelf', 'give shelf fenn', 'use tome shelf', 'give tome shelf', 'drop tome shelf', 'store tome shelf'],
    if: [{ near: 'fenn', d: 80 }, { any: [{ has: 'tomeFlame' }, { has: 'tomeFrost' }, { has: 'tomeMend' }, { has: 'tomeLight' }, { has: 'tomeWard' }] }],
    do: [{ run: 'shelve' }],
  },
  {
    on: ['give amulet', 'give amulet fenn', 'give fenn amulet'], if: [{ near: 'fenn', d: 80 }, { has: 'amulet' }],
    do: [{ lose: 'amulet' }, { give: 'tomeLight' }, { score: 2, id: 'errand.start' }, { score: 8, id: 'errand.done' }, { say: '펜이 부적을 두 손으로 받아 들고 한참 아무 말이 없다. "사십 년을 매일 아침 물가에서 이걸 바라봤어," 마침내 그가 말한다. "이렇게 작았다는 걸 잊고 있었네." 그가 손을 오므린다. 그러고는, 뭔가를 들키기라도 한 듯 씩씩하게, 네 손에 얇은 흰 책을 쥐여 준다. "빛. 어두운 곳에서 필요할 게다."' }, { quest: 'errand', stage: 2 }, { muster: true }],
  },
];

export const hall: RoomDef = {
  id: 'hall',
  music: 'hearth',
  name: "원로의 회당",
  look: "원로의 회당은 광장보다 안이 더 춥다. 벽 안쪽에 서리가 긴 흰 깃털로 자라 있고, 깃털이 모두 한쪽으로 기운다, 물살 속 풀처럼. 저쪽 끝 난로를 향해. 불은 없다. 그 앞에 판상 침대가 있고, 곁 걸상에 여인이 앉아 있다. 긴 탁자에는 문에 가까운 끝에 놓인 잔 하나뿐이다.",
  lookWhen: [
    { if: [{ flag: 'hall.thaw' }], look: '회당이 소음과 빛과 잔치 냄새로 가득하다. 홀로미어 사람 모두가 긴 탁자에 있고, 문을 너무 자주 여닫아 걸쇠가 따뜻하다. 문에 가까운 탁자 끝에 긴의자 한자리가 비어 있고, 잔이 놓여 있다.' },
    { if: [{ flag: 'hall.feast' }], look: '회당이 가득하고, 따뜻하고, 시끄럽다. 홀로미어 전부가 담요 차림으로 들어와, 꺼지지 않는 불 앞에 서서, 그걸 피운 사람을 구경한다. 벽의 서리가 사라지고 젖은 자국만 남았다. 아무도 집에 갈 서두름이 없다.' },
    { if: [{ flag: 'marta.stopped' }, COLD], look: '추위가 회당에서 빠져나갔다, 웅덩이에서 물이 빠지듯. 벽의 서리 가장자리가 무르다. 난로에 불쏘시개가 놓였다. 마르타가 소녀에게 두 손을 얹고, 입술은 멎었고, 너를 보고 있다.' },
    { if: [LIT], look: "기가 걸린 긴 회당, 따뜻하다. 강돌로 쌓은 큰 난로가 끝에서 끝까지 타고 있다. 양옆에 침대가 차려져 있다. 하나는 일곱 살 소녀용, 하나는 높은 자리 가까이, 너를 위한 것. 문에 가까운 긴 탁자 끝에 잔 하나가 서 있다, 채워진 채 손대지 않고." },
  ],
  scene: {
    kind: 'indoor', walkTop: 104, ambient: 0.5,
    layers: [{ t: 'interior', floor: FL, wall: 'log' }, { t: 'hallroof', y: 30 }],
    props: [
      { t: 'doorway', x: 60, y: FL },
      { t: 'banner', x: 92, y: 38, ramp: 'purple' },
      { t: 'banner', x: 228, y: 38, ramp: 'red' },
      { t: 'shield', x: 24, y: 56, r: 10, ramp: 'red' },
      { t: 'shield', x: 286, y: 40, r: 8, ramp: 'blue' },
      { t: 'highseat', x: 258, y: 110 },
      { t: 'bookcase', x: 298, y: FL, w: 30, h: 46, v: 'few' },
      { t: 'bench', x: 80, y: 156, w: 70 },
    ],
    lights: [{ x: 112, y: 122, r: 34, i: 0.5, kind: 'warm' }],
    when: [
      // Cold: frost on the walls, a pallet before the dead hearth, and a stool beside it.
      { if: [COLD], props: [{ t: 'greathearth', x: 160, y: FL }, { t: 'rime', x: 0, y: 1, w: FL, h: 30 }, { t: 'bed', x: 150, y: 124, ramp: 'cream' }, { t: 'stool', x: 196, y: 126 }] },
      // Lit: a bed on either side of it.
      {
        if: [LIT],
        props: [{ t: 'greathearth', x: 160, y: FL, lit: 1 }, { t: 'bench', x: 262, y: 160, w: 52, v: 'bed' }, { t: 'bed', x: 118, y: 127, ramp: 'cream' }],
        lights: [{ x: 160, y: 92, r: 110, i: 1.3, kind: 'warm' }],
      },
      { if: [NOFEAST], props: [{ t: 'longtable', x: 92, y: 142, w: 110 }] },
      { if: [FEAST], props: [{ t: 'longtable', x: 92, y: 142, w: 110, v: 'feast' }] },
      { if: [{ flag: 'hall.rug' }], props: [{ t: 'bearskin', x: 254, y: 124 }] },
    ],
  },
  doors: [{ x0: 52, y0: 105, x1: 68, y1: 107, to: 'village', x: 69, y: 124, dir: 'down' }],
  zones: [{ id: 'leaving', x0: 40, y0: 105, x1: 80, y1: 114 }],
  npcs: [
    // By the pallet until the fire is lit; at the far end of the table for the thaw feast; otherwise by her hearth.
    { char: 'marta', x: 204, y: 124, dir: 'left', if: [COLD] },
    { char: 'marta', x: 222, y: 120, wander: [196, 118, 236, 128], if: [LIT, { not: { flag: 'hall.thaw' } }] },
    { char: 'marta', x: 216, y: 150, dir: 'left', if: [{ flag: 'hall.thaw' }] },
    // Sitting up in it: drawn behind the bed, so that it covers her to the waist.
    { char: 'tova', x: 110, y: 123, dir: 'down', if: [LIT] },
    { char: 'halla', x: 30, y: 130, dir: 'right', if: [{ flag: 'hall.feast' }] },
    { char: 'halla', x: 132, y: 160, dir: 'left', if: [{ flag: 'hall.thaw' }] },
    { char: 'sigga', x: 144, y: 152, dir: 'up', if: [FEAST] },
    { char: 'odd', x: 170, y: 160, dir: 'up', if: [FEAST] },
    { char: 'gorm', x: 196, y: 152, dir: 'up', if: [FEAST] },
    { char: 'toke', x: 236, y: 140, dir: 'left', if: [FEAST] },
  ],
  things: [
    {
      id: 'hearth', nouns: ['hearth'], x: 160, y: 106, reach: 44, try: ['lay the log on the hearth', 'light fire'],
      look: '소 한 마리를 통째로 구울 수 있는 난로다. 불은 없고, 재는 아흐레 차갑다. 벽의 서리가 사방에서 그것을 향해 기운다, 아니면 그 앞에 누워 있는 것을 향해.',
      lookWhen: [
        { if: [LIT], look: '소 한 마리를 통째로 구울 수 있는 난로, 멈춘 적 없다는 듯 타고 있다. 네가 놓은 불이다. 홀로미어의 누구도 네가 그걸 잊게 두지 않을 거다, 가장 다정한 방식으로.' },
        { if: [{ flag: 'hall.laid' }], look: '난로에 불쏘시개가 놓였다, 놓여야 할 대로. 불씨 가지, 그 위로 마른 통나무. 불꽃이 필요하다, 그리고 그 불꽃이 살게 두어야 한다.' },
      ],
    },
    {
      id: 'pallet', nouns: ['tova', 'girl', 'pallet'], x: 152, y: 124, reach: 40,
      look: '판상 침대 위, 홀로미어의 모든 가죽 같은 것 밑에 일곱 살쯤의 소녀가 똑바로 누워 입을 조금 벌리고 있다, 무슨 말을 하려다 방해받은 것처럼. 속눈썹에 서리가 앉았다. 그녀의 어느 부분도 전혀 움직이지 않는다.',
      lookWhen: [{ if: [{ flag: 'marta.stopped' }], look: "숨이 그녀에게서 나왔다. 길고 가는 흰 실타래, 동짓날 시작한 숨의 끝. 가슴이 움직이지 않는다. 마르타의 손이 그 위에 있다." }],
    },
    {
      id: 'rime', nouns: ['rime'], x: 160, y: 100, reach: 400, look: '서리, 벽 안쪽에 긴 흰 깃털로 자랐다. 깃털이 모두 한쪽으로 기운다, 물살 속 풀처럼. 난로 앞 판상 침대를 향해.',
      lookWhen: [{ if: [{ flag: 'marta.stopped' }], look: '서리 깃털 가장자리가 물러졌다. 네가 보는 동안 하나가 벽에서 떨어진다.' }],
    },
    { id: 'stool', nouns: ['stool'], x: 196, y: 126, reach: 40, look: '세 다리 걸상, 판상 침대 가까이 끌어다 놓았다. 그녀는 아흐레를 여기 앉아 있다.' },
    { id: 'throne', nouns: ['throne'], x: 258, y: 112, reach: 40, look: "원로의 의자, 매듭 조각에 황동 마감. 원로 외에 앉는 사람이 없다." },
    { id: 'banner', nouns: ['banner'], x: 160, y: 106, reach: 400, look: '기 두 폭, 자주와 빨강, 각기 금색 마름모. 홀로미어의 표지다. 아주 가만히 걸려 있다.' },
    {
      id: 'table', nouns: ['table'], x: 104, y: 144, reach: 44, look: '긴 탁자, 문에 가까운 끝에 놓인 잔 하나뿐. 여기서 잔치가 열렸다. 탁자는 기억한다, 얼룩을 보면 안다.',
      lookWhen: [
        { if: [{ flag: 'hall.thaw' }], look: '긴 탁자가 만들어진 목적을 하고 있다. 빵, 수프, 고름의 첫 치즈, 그리고 긴의자에 앉은 홀로미어 사람 모두. 문에 가까운 끝에 한자리가 비어 있고, 그 앞에 잔이 있다.' },
        { if: [{ flag: 'hall.feast' }], look: '누군가 술통을 찾아냈고 다른 누군가는 뿔잔들을 찾아냈고, 긴 탁자가 만들어진 목적을 하고 있다. 문에 가까운 끝에 그 잔이 서 있고, 오늘 밤에도 그 앞 긴의자가 말끔히 비어 있다.' },
      ],
    },
    // The cup that nobody drinks, at the end of the table nearest the door.
    {
      id: 'cup', nouns: ['cup'], x: 78, y: 142, reach: 34, try: ['drink from the cup'],
      look: '문에 가까운 긴 탁자 끝의 평범한 뿔잔, 안의 맥주가 꽁꽁 얼었다. 그 앞 긴의자에 아무도 앉지 않는다.',
      lookWhen: [
        { if: [{ flag: 'home.cup' }], look: '문 곁 탁자 끝의 평범한 뿔잔, 채워져 있다. 네 것이다. 네가 여기 오기 한참 전부터 네 것이었던 것 같다.' },
        { if: [{ flag: 'hall.thaw' }], look: '아무도 마시지 않는 잔. 할라가 오늘 아침 채웠다, 잔칫날마다 그러듯, 가진 것 중 가장 좋은 것으로.' },
        { if: [LIT], look: '문에 가까운 긴 탁자 끝의 평범한 뿔잔, 가장자리까지 채워진 채 손대지 않았다. 그 앞 긴의자에 아무도 앉지 않는다. 홀로미어의 누구에게든 누구 잔인지 물으면, 각기 다른 대답과 눈빛을 받을 거다.' },
      ],
    },
    {
      id: 'seat', nouns: ['bench'], x: 80, y: 156, reach: 34, try: ['sit down'],
      look: '문에 가까운 긴의자 끝. 들어온 사람이 누구라도 처음 앉을 자리. 아무도 앉지 않는다. 나무는 다른 곳만 닳았다.',
      lookWhen: [{ if: [{ flag: 'home.cup' }], look: '문에 가까운 긴의자 끝, 추위에서 들어온 사람이 처음 앉을 자리. 네 자리다.' }],
    },
    { id: 'shelf', nouns: ['shelf'], x: 296, y: 106, reach: 40, look: "마을 도서관 전부. 책 아홉 권, 셋은 양에 관한 것." },
    { id: 'door', nouns: ['door'], x: 60, y: 106, reach: 400, look: '나가는 길, 광장으로.' },
    { id: 'bench', nouns: ['bed'], x: 262, y: 162, reach: 44, hidden: true, try: ['sleep'], look: "원로의 난로 곁에 너를 위해 차려진 침대, 곰가죽이 덮여 있다. 불 건너편에 또 하나, 훨씬 작은. 둘 중 어느 것에 대해서도 아무도 말하지 않았다." },
  ],
  rules: [
    firstVisit('hall'),
    {
      enter: true, if: [COLD, { not: { flag: 'hall.sat' } }],
      do: [{ set: 'hall.sat' }, { say: '원로의 회당은 광장보다 안이 더 춥다. 벽 안쪽에 서리가 긴 흰 깃털로 자라 있고, 깃털이 모두 한쪽으로 기운다, 물살 속 풀처럼, 저쪽 끝 난로를 향해.\n\n너무 피곤해서 닿는 첫 자리, 문 곁 긴의자 끝에 앉는다.\n\n"거기 말고," 회당 저쪽 끝에서 여인이 말한다.\n\n일어선다. 이유는 말하지 않는다. 물어도 그녀는 말할 수 없을 거다.' }],
    },
    {
      enter: true, if: [COLD, { quest: 'hearth', is: 3 }, { knows: 'word:iska' }, { not: { flag: 'hall.heard' } }],
      do: [{ set: 'hall.heard' }, { say: '마르타는 네가 두고 온 그대로다, 걸상에, 소녀 가슴 위 가죽에 손을 평평히 얹고. 너는 병을 들고 문 안쪽에 서서 그녀의 입술이 움직이는 걸 본다, 이번에는 그것이 말하는 게 들린다.\n\n그 단어를 안다. 네 손가락이 기억한다.\n\n벽의 서리 깃털들을 본다, 모두 판상 침대 쪽으로 기운. 소녀를 본다, 내보내던 숨을 끝내지 못한, 끝내는 걸 허락받지 못한.' }],
    },
    {
      enter: true, if: [COLD, { quest: 'hearth', is: 3 }, { not: { knows: 'word:iska' } }, { not: { flag: 'hall.lips' } }],
      do: [{ set: 'hall.lips' }, { say: '마르타는 네가 두고 온 그대로다, 걸상에, 소녀 가슴 위 가죽에 손을 평평히 얹고. 입술이 움직인다. 이번에는 충분히 가까워서, 그게 단어라는 걸, 같은 단어를 되풀이한다는 걸 듣는다. 네가 아는 단어가 아니다.' }],
    },
    { enter: true, if: [LIT], do: [{ show: 'bench' }, { hide: 'pallet' }, { hide: 'stool' }, { hide: 'rime' }] },
    {
      enter: true, if: [LIT, { knows: 'word:sol' }, { not: { flag: 'hall.wiped' } }, NOFEAST],
      do: [{ set: 'hall.wiped' }, { say: '회당이 따뜻하고 연기와 수프 냄새가 난다. 마르타는 깁는 것에서 눈을 들지 않는다.\n\n"발 닦아라," 그녀가 말한다.\n\n토바가 난로 곁에 앉아 자주색 털실 뭉치를 갖고 있다, 마르타가 뜨개질을 가르치는 중이다, 서툴게. 마르타 자신의 목도리를 푼 것이다.' }],
    },
    {
      enter: true, if: [{ flag: 'hall.thaw' }, { not: { flag: 'home.door' } }],
      do: [{ set: 'home.door' }, { say: '문을 열자 추위가 너보다 먼저 들어간다.\n\n"문 닫아라," 탁자 저쪽 끝에서 마르타가, 눈도 들지 않고 말한다.\n\n닫는다.' }],
    },

    // --- The hearth. A fire is laid; it will not take while she is holding the child still; she has to be asked to stop.
    {
      on: LAY, if: [COLD, { has: 'log' }, { not: { flag: 'hall.laid' } }, { near: 'hearth', d: 70 }],
      do: [{ lose: 'log' }, { set: 'hall.laid' }, { sound: 'take' }, { say: '판상 침대 곁 차가운 난로에 무릎 꿇고, 불쏘시개를 놓는다, 조심스럽게, 놓여야 할 대로. 네가 쪼갠 불씨 가지, 그 위로 마른 통나무.\n\n마르타가 네가 하는 걸 지켜본다.\n\n"안 붙어," 그녀가 말한다.' }],
    },
    { on: LAY, if: [COLD, { has: 'log' }, { not: { flag: 'hall.laid' } }], do: [{ say: '난로에 충분히 가까이 있지 않다.' }] },
    { on: LAY, if: [COLD, { flag: 'hall.laid' }], do: [{ say: '놓였다, 제대로. 불꽃이 필요하다.' }] },
    { on: LAY, if: [COLD], do: [{ say: '회당의 장작은 속까지 젖었고 서리가 하얗다. 광장에 쪼갠 소나무 더미가 있고, 곁에 손도끼가 있다.' }] },
    {
      on: STRIKE, if: [COLD, { flag: 'marta.stopped' }, { has: 'flint' }],
      do: [
        { lose: 'bottle' }, { set: 'hearth.lit' }, { give: 'ring' }, { sound: 'win' }, { score: 25, id: 'hearth.done' }, { quest: 'hearth', stage: 5 },
        { set: 'hall.feast' }, { muster: true }, { show: 'bench' }, { hide: 'pallet' }, { hide: 'stool' }, { hide: 'rime' },
        { win: '부싯쇠를 친다. 불꽃이 부싯깃에 떨어지고 너는 몸을 굽혀 분다, 연기가 나고, 연기가 걸쭉해지고, 불꽃 하나가 그 속에서 일어선다.\n\n눕지 않는다. 불씨 가지를 먹는다. 통나무를 찾아 기어오른다.\n\n소녀의 가슴이 움직이지 않는다. 마르타의 손이 그 위에 있다.\n\n그러다 움직인다.\n\n네가 손 뻗는 걸 보기도 전에 마르타가 병을 열어 있다. 소녀의 고개를 젖히고 약을 입에 넣고, 토바가 삼키고, 기침하고, 얼굴을 찡그리고 운다, 가늘고 분하게, 동짓날 이후 홀로미어에서 누구든 낸 가장 좋은 소리다.\n\n마르타가 걸상에 다시 앉는다. 한참 불을 본다. 그러고는 자기 손가락에서 황동 반지를 뺀다, 이 겨울 손가락이 가늘어져 쉽게 빠진다, 네 손을 잡고, 네 손가락에 반지를 끼운다.\n\n"홀로미어의 테인이여," 그녀가 말한다.\n\n뒤에서 회당이 조용히 가득 찼다. 오는 소리를 듣지 못했다. 오드가 먼저, 그리고 모두가, 담요 차림으로, 붙을지 보려고 문 안에 모여 있다. 불이 으르렁댄다.' },
        { note: '붙는지 보러 온 사람들이다. 충분하면 문은 저기 있다.' },
      ],
    },
    { on: STRIKE, if: [COLD, { flag: 'marta.stopped' }], do: [{ say: '불 붙일 게 없다.' }] },
    {
      on: STRIKE, if: [COLD, { flag: 'hall.laid' }, { has: 'flint' }],
      do: [{ set: 'hall.tried' }, { say: '부싯쇠를 친다. 불꽃이 부싯깃에 떨어지고, 붙는다. 그러다 작은 불꽃이 납작하게 눕는다, 바람이 누르는 것처럼, 그리고 연기도 없이 꺼진다.\n\n"안 붙어," 마르타가 말한다, "내가—" 그러고 끝맺지 않는다.\n\n회당이 아주 조용하다.' }],
    },
    { on: STRIKE, if: [COLD, { has: 'flint' }], do: [{ say: '난로에는 아흐레 차가운 재뿐이다. 먼저 불쏘시개를 놓아야 한다. 속까지 마른 통나무와, 그것에서 쪼갠 불씨 가지. 광장에 장작더미가 있다.' }] },
    { on: STRIKE, if: [COLD], do: [{ say: '불 붙일 게 없다. 할라가 부싯돌을 갖고 있다. 아흐레째 목에 걸고 있다.' }] },
    { on: STRIKE, do: [{ say: '아주 잘 타고 있다. 그냥 둔다.' }] },
    {
      on: OFFER, if: [COLD, { flag: 'marta.stopped' }], do: [{ say: '그녀가 멈췄다. 이제 네가 붙일 차례다.' }],
    },
    {
      on: OFFER, if: [COLD, { has: 'flint' }, { flag: 'hall.laid' }, { knows: 'word:iska' }, { quest: 'hearth', is: 3 }],
      do: [
        { set: 'marta.stopped' }, { quest: 'hearth', stage: 4 }, { sound: 'word' },
        { say: '할라의 부싯돌을 그녀에게 내민다. 그녀의 난로니까.\n\n받지 않는다. 소녀에게 얹은 두 손을 거두지 않는다.\n\n"내가 멈추면," 마르타가 말한다, "얘는 숨을 내뱉어. 동짓날부터 계속 내뱉는 중이야. 그리고 여기엔 들이마실 불이 없어." 병을 보고, 불쏘시개를 보고, 너를 본다. "그리고 안 붙으면?"\n\n할 말이 없다. 너는 빈손으로 여기 왔다. 부싯쇠를 한 번 쳐서, 그녀가 불꽃을 보게 한다.\n\n그녀가 너를 오래 본다. 없어도 아쉽지 않을 사람을. 그러고는 토바를 내려다본다.\n\n"내가 멈추면," 그녀가 말한다. "그 전에는 안 돼."\n\n그녀가 멈춘다.\n\n아무 일도 없다가, 뭔가가 일어난다. 수문을 들어 올리면 웅덩이에서 물이 빠지듯 회당에서 추위가 빠져나간다. 벽의 서리 깃털 가장자리가 무르다. 토바의 숨이 그녀에게서 나온다, 길고 가는 흰 실타래. 동짓날 시작한 숨의 끝.' },
      ],
    },
    { on: OFFER, if: [COLD, { has: 'flint' }, { flag: 'hall.laid' }, { knows: 'word:iska' }], do: [{ say: '부싯돌을 그녀에게 내민다. 그녀의 난로니까.\n\n받지 않는다. "내가 멈추면 얘는 숨을 내뱉어," 마르타가 말한다. "폐의 냉증을 앓는데, 앗아간 걸 돌려놓을 게 없어." 부싯돌도, 너도 보지 않는다. "병을 가져와."' }] },
    { on: OFFER, if: [COLD, { has: 'flint' }, { flag: 'hall.laid' }], do: [{ say: '부싯돌을 내민다. 마르타가 그것을 보고, 너를 본다. "안 붙어," 그녀가 말하고, 입술은 계속 움직인다. 그 입술이 뭐라 하는지 안다면, 네가 그녀에게 무엇을 요구하는지도 알 것 같은 기분이다.' }] },
    { on: OFFER, if: [COLD, { has: 'flint' }], do: [{ say: '부싯돌을 내민다. 마르타가 난로를 본다, 아흐레 차가운 재뿐인, 그러고는 너를 보고, 아무 말도 하지 않는다.' }] },
    { on: OFFER, if: [LIT, { has: 'flint' }], do: [{ say: '"그건 할라 거야," 마르타가 말한다. "그리고 다시는 보고 싶지 않대."' }] },
    // Nobody walks out between her stopping and the spark.
    { zone: 'leaving', if: [{ flag: 'marta.stopped' }, COLD], do: [{ goto: 'hall', x: 120, y: 126, dir: 'right' }, { say: '문에 손을 얹는다. 뒤에서 마르타가 아무 말도 하지 않는다. 돌아본다.' }] },
    // The bottle.
    { on: ['give bottle', 'give bottle elder', 'give elder bottle', 'use bottle table', 'drop bottle', 'drop bottle table', 'use bottle'], if: [COLD, { has: 'bottle' }, { flag: 'marta.stopped' }], do: [{ say: '아직 안 된다. 먼저 숨을 들이마셔야 한다. 그런데 이 회당엔 들이마실 만한 게 없다.' }] },
    { on: ['give bottle tova', 'give tova bottle', 'give bottle girl', 'use bottle tova', 'use bottle girl'], if: [COLD, { has: 'bottle' }], do: [{ say: '병을 들고 한쪽 무릎을 꿇는다. 소녀의 입이 조금 벌어져 있다. 들어가는 것도 나오는 것도 없다.\n\n"삼키지 못해," 마르타가 말한다. "탁자에 둬라."' }] },
    { on: ['give bottle', 'give bottle elder', 'give elder bottle', 'use bottle table', 'drop bottle', 'drop bottle table', 'use bottle'], if: [COLD, { has: 'bottle' }], do: [{ say: '병을 내민다. 마르타가 받지 않는다. 가죽에서 손을 떼야 하니까. "탁자에," 그녀가 말한다. 그래서 곁에 둔다, 빨리 꺼낼 수 있는 곳에.' }] },
    { on: ['talk tova', 'talk girl', 'pet tova', 'pet girl', 'pet pallet', 'take tova', 'take girl', 'kiss tova'], if: [COLD], do: [{ say: '손을 내민다. 마르타의 눈이 올라오고, 너는 손을 거둔다. 하지만 충분히 가까워서 알았다. 아이에게서 나오는 온기가 전혀 없고, 들어가는 것도 없다.' }] },
    { on: ['talk elder'], if: [COLD, { flag: 'hall.laid' }, { not: { flag: 'marta.stopped' } }, { quest: 'hearth', is: 3 }, { knows: 'word:iska' }], do: [{ cmd: 'give flint elder' }] },
    // Words spoken in the hall while she is saying hers.
    { on: 'iska', if: [COLD], do: [{ set: 'hall.said' }, { say: 'ISKA. 회당 건너에서 마르타의 고개가 돌아간다, 오십 년간 아무도 쓰지 않은 이름으로 불린 것처럼. 잠시 네 단어의 추위와 그녀의 추위가 방 안에 함께 있고, 네가 보는 동안 벽의 서리가 손가락 너비만큼 자란다.\n\n"하지 마," 마르타가 말한다. 그녀가 부탁하는 걸 들은 유일한 말이다.' }] },
    { on: 'veth', if: [COLD], do: [{ say: 'VETH. 판상 침대의 가죽이 들리고, 마르타의 자유로운 손이 뚜껑처럼 그 위로 내려온다. 그녀가 너를 본다. 더 할 말이 없다는 걸 깨닫는다.' }] },
    { on: ['veth', 'iska', 'sol'], do: [{ say: '"이 지붕 아래서는 안 돼," 마르타가 돌아보지도 않고 말한다. "이 지붕은 단어라면 족해."' }] },

    // --- The night the hearth is lit. Making for the door ends it: the hall empties, and Marta has something to hand over.
    {
      zone: 'leaving', if: [{ flag: 'hall.feast' }],
      do: [
        { set: 'hall.feast', to: false }, { muster: true }, { give: 'ember' }, { sound: 'quest' }, { goto: 'hall', x: 236, y: 150, dir: 'up' },
        { say: '그날 밤늦게, 회당이 비고 불이 아침까지 갈 붉음으로 가라앉았을 때, 마르타가 화집게로 숯 하나를 꺼내 작은 뿔 상자에 떨어뜨리고 뚜껑을 닫는다.\n\n"숯은 자기 난로를 알아," 그녀가 말한다. "그거에 입김을 불면 어디 있든 이 난로로 데려다줄 게다. 너 하나, 그리고 품에 안을 수 있는 만큼. 재채기는 하지 말고."\n\n상자를 두 손으로 받는다. 따뜻하다. 네가 아는 한, 너를 어디로든 데려다주는 물건은 만들어진 적이 없다.\n\n손가락의 반지를 돌려 본다. 오래됐고, 수많은 손에 매끈하게 닳았다.\n\n"오래된 칭호야, 테인," 마르타가 말한다. "이 회당이 세워지기 전부터 홀로미어에는 없었어. 원로는 있을 때를 위해 반지를 곁에 두지." 그녀가 불을 본다. "나 이전의 원로가 내게 그 반지와 빗자루를 주고, 나를 고분에 데려가서, 깨끗이 쓸린 채 아무도 없는 자리를 보여 줬어. 계속 쓸어 두라고 했지. 누구를 위한 건지는 그녀도 몰랐어. 나는 사십 년을 쓸었어."\n\n그녀가 일어서고, 무릎에서 소리가 난다.\n\n"반지는 네가 가져라," 마르타가 말한다. "빗자루는 내가 간직할 테니."' },
        { note: '난로 곁에 너를 위한 침대가 차려졌다.' },
      ],
    },
    // --- The feast for the thaw, and the end of the bench nearest the door.
    {
      on: SIT, if: [{ flag: 'hall.thaw' }, { flag: 'coal.given' }, { not: { flag: 'home.sat' } }],
      do: [
        { set: 'home.sat' }, { give: 'ember' }, { gold: 80 }, { sound: 'quest' },
        { say: '너는 아주 피곤해서, 닿는 첫 자리에 앉는다. 문에 가장 가까운 긴의자 끝, 추위에서 들어온 사람이 처음 앉을 곳에. 네 앞에 그 잔이 있다. 할라가 오늘 아침 채웠다, 잔칫날마다 그러듯, 가진 것 중 가장 좋은 것으로.\n\n할라가 주전자를 들고 탁자를 따라 온다. 너를 보고, 손이 버릇대로 잔으로 향한다, 치우려고.\n\n"그냥 둬," 마르타가 말한다.\n\n그녀가 이제 눈을 들었다. 일어서서 회당 한 길이를 걸어온다, 홀로미어 전부가 보는 가운데, 잔 곁에 두 가지를 내려놓는다. 하나는 지갑, 골짜기 모든 가구가 넣은 온갖 것들로 울퉁불퉁하다. 다른 하나는 작은 뿔 상자, 만지면 따뜻하다.\n\n"너 없이 돌아왔더군," 마르타 콜드핸드가 말한다. "다시는 그러지 마."\n\n그녀는 자리로 돌아간다.' },
      ],
    },
    {
      on: SIT, if: [{ flag: 'hall.thaw' }, { flag: 'sol.said' }, { not: { flag: 'home.sat' } }],
      do: [
        { set: 'home.sat' }, { set: 'home.done' }, { set: 'marta.thaw' }, { gold: 80 }, { heal: 10 }, { score: 5, id: 'thaw.marta' }, { quest: 'north', stage: 8 }, { sound: 'quest' },
        { win: '너는 아주 피곤해서, 닿는 첫 자리에 앉는다. 문에 가장 가까운 긴의자 끝. 네 앞에 그 잔이 있다.\n\n할라가 주전자를 들고 탁자를 따라 온다. 너를 보고, 손이 버릇대로 잔으로 향해, 네 앞에서 치우고, 그 자리에 뿔잔 맥주를 내려놓는다.\n\n마르타가 눈을 들었다. 회당 한 길이를 걸어와, 네 손 곁에 지갑을 내려놓는다, 골짜기 모든 가구가 넣은 온갖 것들로 울퉁불퉁한.\n\n"뭐였어?" 그녀가 말한다. "그 위에서."\n\n너는 말한다. 발자국, 움푹 팬 곳, 눈 위에 평평히 얹은 손들, 황동 반지. 네가 한 말과, 얼굴을 손으로 가리고 하얀 속으로 사라진 것. 마르타는 선 채로 전부 듣는다.\n\n"저런 반지라," 마침내 그녀가 말한다. 네 손을 보고, 소년에 대해 다시는 묻지 않는다. "그럼 빗자루에 대해 조금 더 알게 됐네." 이미 꼿꼿한 등을 편다. "겨울이 꺾였어, 테인. 먹어라."\n\n그녀는 자리로 돌아간다.' },
      ],
    },
    { on: SIT, if: [{ flag: 'home.sat' }, { flag: 'hall.thaw' }], do: [{ say: '앉아 있다. 잔이 네 앞에 있다.' }] },
    { on: SIT, if: [{ flag: 'home.cup' }], do: [{ say: '문에 가까운 긴의자 끝에 앉는다. 네 자리다. 잔이 채워져 있다.' }] },
    { on: SIT, if: [{ flag: 'marta.thaw' }], do: [{ say: '문에 가까운 긴의자 끝에 앉는다. 아무도 말하지 않는다. 잔이 늘 서 있던 곳으로 도로 놓였다, 네 손이 닿지 않는 손바닥 너비 밖.' }] },
    { on: ['sit throne'], do: [{ say: '마르타가 너를 본다. 너는 그저 조각을 감상하고 있었다는 걸 깨닫는다.' }] },
    { on: SIT, do: [{ say: '"거기 말고," 마르타가 말한다.\n\n이유는 말하지 않는다. 물어도 그녀는 말할 수 없을 거다.' }] },
    {
      on: DRINK, if: [{ flag: 'hall.thaw' }, { flag: 'home.sat' }, { flag: 'coal.given' }, { not: { flag: 'home.cup' } }],
      do: [
        { set: 'home.cup' }, { set: 'home.done' }, { set: 'marta.thaw' }, { heal: 40 }, { score: 30, id: 'home.cup' }, { score: 5, id: 'thaw.marta' }, { quest: 'north', stage: 8 }, { sound: 'win' },
        { win: '아무도 마시지 않는 잔을 집어 들고, 마신다, 전부.\n\n그러자 할라가 다시 채운다.' },
      ],
    },
    { on: DRINK, if: [{ flag: 'hall.thaw' }, { flag: 'coal.given' }, { not: { flag: 'home.sat' } }], do: [{ cmd: 'sit bench' }] },
    { on: DRINK, if: [{ flag: 'home.cup' }], do: [{ heal: 6 }, { say: '마신다. 할라가 가진 가장 좋은 것이다. 잔을 내려놓기도 전에 누군가 채워 넣었다.' }] },
    { on: DRINK, if: [LIT], do: [{ say: '"그건 말고," 마르타가 돌아보지도 않고 말한다. "그건 주인이 있을 자의 것이야."' }] },
    { on: DRINK, do: [{ say: '안의 맥주가 꽁꽁 얼었다. "그리고 네 것도 아니야," 마르타가 돌아보지도 않고 말한다. "내가 알아낸 한, 누구의 것도 아니지. 그냥 둬라."' }] },
    // Once the feast for the thaw has had what it was held for, it ends when the Thane goes out.
    { zone: 'leaving', if: [{ flag: 'hall.thaw' }, { flag: 'home.done' }], do: [{ set: 'hall.thaw', to: false }] },
    {
      on: 'orun',
      do: [{ say: 'ORUN. 탁자가 닳은 흔적을 내준다. 잔 아래 판이 얕은 원으로 닳았고, 그 둘레로 점점 흐릿하게, 겹쳐 놓인, 다른 탁자들의 다른 잔들의 원들이 있다, 이것보다 오래된, 회당보다 오래된. 언제나 같은 자리에. 문에 가장 가까운 끝, 추위에서 들어온 사람이 처음 앉을 곳에.' }],
    },
    {
      on: ['give bearskin elder', 'give elder bearskin', 'give bearskin', 'use bearskin', 'drop bearskin'], if: [LIT, { has: 'bearskin' }, { not: { flag: 'hall.rug' } }],
      do: [{ lose: 'bearskin' }, { set: 'hall.rug' }, { gold: 20 }, { heal: 10 }, { sound: 'take' }, { say: '흰 곰가죽을 원로의 의자 앞에 펼친다. 마르타가 한참 본다. "우리 아버지도 저런 게 있었어," 그녀가 말한다. "내가 아홉 살이던 겨울, 장화로 바뀌었지." 시험 삼아 발을 올리고, 얼굴이 네가 들어 본 적 없는 무언가를 한다. "은화 스무 닢. 대장장이에게 얼마 줬는지 말하지 마. 못도 같은 값을 원할 테니."' }],
    },
    { on: ['sleep', 'sleep *'], if: [FEAST], do: [{ say: '홀로미어 전부가 침대를 둘러싸고 있는데? 구경만 할 거다.' }] },
    {
      on: ['sleep', 'sleep *'], if: [LIT, { not: { flag: 'hall.slept' } }],
      do: [{ set: 'hall.slept' }, { run: 'rest' }, { say: '움직이지 않고 아홉 시간을 자고, 따뜻하게 깬다, 그게 가능하다는 걸 잊고 있었다.\n\n아침에는 모든 지붕에서 연기가 난다. 오드의 대장간이 으르렁대고, 오드는 그것에게 쇠에 대해 말하고 있다. 할라는 하루하룻밤을 잔다. 원로도, 의자에서, 아무도 그렇다고 말하지 않는다. 난로 건너편 침대에서, 토바가 네게 이름이 있냐고 묻고, 없다는 걸 받아들이고, 직접 지어 준다, 여러 번, 전부 적절하지 않은.\n\n그래도 여전히 누구도 기억 못 하는 가장 추운 겨울이다. 날마다 더 추워진다.' }],
    },
    { on: ['sleep', 'sleep *'], if: [LIT], do: [{ run: 'rest' }, { say: '원로의 난로 곁 침대에서 자고, 따뜻하게 깬다. 불 건너편에서 작은 누군가가 이미 깨어, 네가 깨길 기다리고 있었다.' }] },
    { on: ['sleep', 'sleep *'], do: [{ say: '이 회당에 누우면 다시 일어나지 못할 거다. 여기 서리조차 네가 서 있는 곳에서 멀리 기운다.' }] },
    { on: ['warm', 'warm *', 'sit hearth'], if: [LIT], do: [{ say: '불 앞에 서서 스며들게 한다. 익숙해질 만한 것이다.' }] },
    { on: ['read tome', 'take tome', 'look tome', 'read shelf'], do: [{ say: '아무거나 하나 펼친다. 양에 관한 것이다. 다음 것도 그렇다.' }] },
  ],
};

export const inn: RoomDef = {
  id: 'inn',
  music: 'hearth',
  name: '케틀 앤 헬름',
  look: '홀로미어 전부가 여관의 큰방에 있다. 담요 차림으로, 긴의자에, 바닥에, 난로에 닿지 않을 만큼 가깝게. 불은 작고 낮고, 납작하게 누워 있다, 바람이 누르는 것처럼, 바람은 없는데. 여인 하나가 그 앞 걸상에 앉아 나뭇가지를 하나씩 먹인다. 여기는 사람 냄새 말고는 아무 냄새도 안 난다.',
  lookWhen: [{ if: [LIT], look: '여관. 방 하나, 카운터, 탁자, 모퉁이에 하룻밤 단위로 빌려주는 침대. 불이 애걸받지 않고 탄다. 맥주, 젖은 양모, 빵 냄새, 그리고 문질러 닦인 냄새가 난다.' }],
  scene: {
    kind: 'indoor', walkTop: 104, ambient: 0.6,
    layers: [{ t: 'interior', floor: FL, wall: 'log' }, { t: 'boards', from: 22, floor: FL }, { t: 'joists', y: 18 }],
    props: [
      { t: 'boxbed', x: 31, y: FL, w: 58, h: 66 },
      { t: 'doorway', x: 160, y: FL },
      { t: 'pegs', x: 198, y: 46, w: 40 },
      { t: 'bookcase', x: 252, y: FL, w: 46, h: 52, v: 'bottles' },
      { t: 'caskrack', x: 298, y: FL },
      { t: 'hang', x: 66, y: 18, h: 3, v: 'sausages' },
      { t: 'hang', x: 138, y: 18, h: 4, v: 'onions' },
      { t: 'hang', x: 176, y: 18, h: 2, v: 'herbs' },
      { t: 'hang', x: 232, y: 18, h: 6, v: 'kettle' },
      { t: 'hang', x: 270, y: 18, h: 5, v: 'helm' },
      { t: 'counter', x: 250, y: 132, w: 92 },
      { t: 'barrel', x: 306, y: 114 },
      { t: 'longtable', x: 74, y: 146, w: 60 },
      { t: 'stool', x: 112, y: 152 },
      { t: 'stool', x: 36, y: 154 },
    ],
    lights: [{ x: 250, y: 104, r: 46, i: 0.45, kind: 'warm' }],
    when: [
      // The last fire in the valley, kept in by hand, with a stool before it; after the hearth is lit, a fire like any other.
      { if: [COLD], props: [{ t: 'fireplace', x: 104, y: FL, w: 50, v: 'inn' }, { t: 'stool', x: 128, y: 116 }, { t: 'bearskin', x: 190, y: 158 }], lights: [{ x: 104, y: 98, r: 56, i: 0.7, kind: 'warm' }] },
      { if: [LIT], props: [{ t: 'fireplace', x: 104, y: FL, w: 50, v: 'inn', lit: 1 }], lights: [{ x: 104, y: 98, r: 80, i: 1, kind: 'warm' }] },
    ],
  },
  doors: [{ x0: 152, y0: 105, x1: 168, y1: 107, to: 'village', x: 252, y: 120, dir: 'down' }],
  npcs: [
    { char: 'halla', x: 132, y: 118, dir: 'left', if: [COLD] },
    { char: 'halla', x: 250, y: 114, if: [LIT, { not: FEAST }] },
    { char: 'gorm', x: 62, y: 124, dir: 'right', if: [COLD] },
    { char: 'toke', x: 206, y: 122, dir: 'left', if: [COLD] },
    { char: 'fenn', x: 286, y: 152, dir: 'left', if: [COLD] },
  ],
  things: [
    {
      id: 'hearth', nouns: ['hearth'], x: 104, y: 106, reach: 40, look: '작은 불, 바람이 켜진 듯 장작 위에 납작하게 누워 있다. 골짜기에서 동짓날에 꺼지지 않은 유일한 불, 오직 할라가 꺼뜨리지 않았기 때문이다.',
      lookWhen: [{ if: [LIT], look: '좋은 불, 다른 것들처럼 저 혼자 탄다. 할라가 아직도 몇 분마다 그걸 본다, 버릇으로, 그러고는 다시 돌아본다, 흡족하게.' }],
    },
    { id: 'children', nouns: ['girl', 'boy'], x: 190, y: 156, reach: 40, hidden: true, look: '아이 둘, 외투 하나에 들어가 잠들어 있다, 곰가죽 위, 허락된 만큼 난로 가까이. 하나가 다른 하나의 귀를 잡고 있다.' },
    { id: 'counter', nouns: ['counter'], x: 250, y: 132, reach: 44, look: '판자 카운터, 하얗게 문질러 닦았다. 뒤에는. 다친 이를 위한 붉은 약, 어둠을 위한 송진 횃불, 그리고 나머지 전부를 위한 맥주.' },
    { id: 'barrel', nouns: ['barrel', 'ale'], x: 306, y: 116, reach: 40, look: '맥주통. 홀로미어에서 바닥나지 않은 유일한 것이다.' },
    { id: 'bed', nouns: ['bed'], x: 31, y: 106, reach: 40, look: '가죽 이불 딸린 벽침대. 하룻밤에 은화 네 닢, 벼룩은 무료.' },
    {
      id: 'chest', nouns: ['chest'], x: 44, y: 112, reach: 30, icon: 'chest', store: true, try: ['open chest'],
      look: "침대 발치의 판자 상자, 걸쇠는 있고 자물쇠는 없다, 투숙객 물건용. 홀로미어에서는 아무도 훔치지 않는다. 절반은 덕성 때문이고, 절반은 저녁까지 모두가 알 테니까.",
    },
    { id: 'table', nouns: ['table'], x: 74, y: 148, reach: 44, look: '탁자 하나. 단골들이 이름을 새겼다. 여럿이 줄 그어 지워졌다.' },
    { id: 'shelf', nouns: ['shelf'], x: 252, y: 106, reach: 400, look: '병들, 단지들, 밀랍 마개 붉은 약 한 줄.' },
    { id: 'door', nouns: ['door'], x: 160, y: 106, reach: 400, look: '나가는 길, 광장으로.' },
  ],
  rules: [
    firstVisit('inn'),
    { enter: true, if: [COLD], do: [{ show: 'children' }] },
    { enter: true, if: [LIT], do: [{ hide: 'children' }] },
    { on: ['talk girl', 'talk boy', 'pet girl', 'pet boy', 'take girl'], if: [COLD], do: [{ say: '잠들어 있다, 외투 하나에. 그냥 둔다. 오늘 둘 중 누구에게도 가장 따뜻한 순간이다.' }] },
    { on: ['warm', 'warm *'], if: [COLD], do: [{ say: '다들 하는 만큼 뒤에서 손을 내민다. 얻을 건 별로 없다. 아무도 더 가까이 가지 않는다. 불에서 빼앗는 일이 될 테니.' }] },
    { on: ['warm', 'warm *'], do: [{ say: '감각이 돌아올 때까지 불에 손을 쪼인다, 아프다, 그러다 아프지 않다, 무엇보다 좋다.' }] },
    { on: 'iska', if: [COLD], do: [{ say: 'ISKA. 할라의 불이 호통 맞은 개처럼 장작 위로 납작하게 주저앉고, 잠시 너는 죽인 줄 안다. 네가 입을 다물기도 전에 할라가 걸상에서 일어나 너와 난로 사이를 가로막는다. 아무 말도 하지 않는다. 그럴 필요가 없다.\n\n방 안 누구도 숨을 내쉬기까지 한참 걸린다. 모퉁이에서, 책을 낀 노인이 아주 주의 깊게 너를 보고 있다.' }] },
    { on: ['veth', 'iska', 'sol', 'orun'], do: [{ say: '"여기서는 안 돼," 할라가 돌아보지도 않고, 술주정뱅이를 수도 없이 내쫓은 여자의 목소리로 말한다. "그게 뭐든. 나는 불이 하나뿐이고 아끼거든."' }] },
    { on: ['light hearth', 'light', 'use flint'], if: [COLD], do: [{ say: '붙어 있다. 그게 그 불을 두고 할 수 있는 말의 전부고, 가까이 가는 사람은 할라뿐이다.' }] },
    { on: ['buy potion'], if: [{ gold: 6 }], do: [{ gold: -6 }, { give: 'potion' }, { sound: 'take' }, { say: '은화 여섯 닢. 할라가 붉은 약을 건넨다. "목마를 때 말고 다쳤을 때 먹어."' }] },
    { on: ['buy potion'], do: [{ say: '"약 하나에 은화 여섯 닢," 할라가 말한다, "그리고 너한텐 여섯 닢이 없지."' }] },
    { on: ['buy torch'], if: [{ has: 'torch' }], do: [{ say: '"횃불 하나면 충분해."' }] },
    { on: ['buy torch'], if: [{ gold: 3 }], do: [{ gold: -3 }, { give: 'torch' }, { sound: 'take' }, { say: '송진 횃불에 은화 세 닢. "어두운 데 쓰라고," 할라가 말한다. "밖에 지하실들이 있대, 옛 탑들 아래."' }, { note: '팁: 볼 필요가 있을 때 횃불에 불을 붙여라.' }] },
    { on: ['buy torch'], do: [{ say: '"은화 세 닢," 할라가 말한다. 너는 세 닢이 없다.' }] },
    { on: ['buy food', 'eat food', 'eat'], if: [{ gold: 1 }], do: [{ gold: -1 }, { heal: 6 }, { say: '은화 한 닢에 보리가 든 갈색 무언가 한 그릇. 대체로 뜨겁다, 지금은 그게 음식이 될 수 있는 가장 좋은 상태다.' }] },
    { on: ['buy food', 'eat food'], do: [{ say: '"스튜는 은화 한 닢," 할라가 말한다. "냄새는 공짜야."' }] },
    { on: ['buy ale', 'drink ale', 'buy'], if: [{ gold: 1 }], do: [{ gold: -1 }, { heal: 4 }, { say: '은화 한 닢에 뿔잔 맥주 하나. 밍밍하고 시고, 네게 꼭 필요한 것이다.' }] },
    { on: ['buy ale', 'drink ale', 'buy'], do: [{ say: '"은 없으면 맥주도 없어," 할라가 말한다, 박정하지 않게.' }] },
    { on: ['sell venison', 'give venison', 'give venison halla'], if: [{ has: 'venison' }], do: [{ lose: 'venison' }, { gold: 4 }, { sound: 'take' }, { say: '"사슴고기!" 할라가 넙다리를 아기처럼 두 손에 들어 무게를 단다. "은화 네 닢, 오늘 밤 제대로 된 스튜가 나오겠는데."' }] },
    { on: ['sell herb', 'give herb', 'give herb halla'], if: [{ has: 'herb' }], do: [{ lose: 'herb' }, { gold: 2 }, { sound: 'take' }, { say: '"서리버섯!" 네가 포장을 풀기도 전에 할라가 은화 두 닢을 꺼냈다. "스튜 살리겠는데. 더 가져와."' }] },
    // While the fires are out Gorm is here, and so is where his grain comes home to.
    { on: ['give grain', 'give grain gorm', 'give gorm grain', 'use grain', 'use grain gorm', 'drop grain'], if: [{ has: 'grain' }, { near: 'gorm' }], do: [{ cmd: 'talk to gorm' }] },
    { on: ['give sheep', 'give sheep gorm', 'give gorm sheep', 'use sheep gorm'], if: [{ has: 'ewe' }, { near: 'gorm' }], do: [{ say: '고름이 양을 보고, 너를 보고, 다시 양을 본다, 둘 중 하나가 실재하지 않을지 모른다는 듯. "브린," 그가 말한다. "브린이야." 반쯤 일어서다가, 할라를 생각하고, 다시 앉는다. "여기선 안 돼. 우리로 데려가. 곧 갈게."' }] },
    { on: ['give flint halla', 'give halla flint', 'give flint'], if: [LIT, { has: 'flint' }], do: [{ say: '"가져," 할라가 말한다. "사는 동안 다시는 그걸 치고 싶지 않아."' }] },
    { on: ['sleep', 'sleep bed', 'buy bed', 'use bed'], if: [{ gold: 4 }], do: [{ gold: -4 }, { run: 'rest' }, { say: '은화 네 닢. 자기 의견이 있는 가죽 밑에서 쓰러진 나무처럼 잔다. 아침에 너는 다시 온전하고, 살짝 물렸을 뿐이다.' }] },
    { on: ['sleep', 'sleep bed', 'buy bed', 'use bed'], do: [{ say: '"침대는 은화 네 닢," 할라가 말한다. "바닥은 공짜, 문도 공짜야."' }] },
    ...fennRules,
  ],
};

export const hut: RoomDef = {
  id: 'hut',
  music: 'hearth',
  name: "은둔자의 오두막",
  look: '방 하나, 대부분 책, 밖의 물가만큼 춥다. 난로는 꺼져 쓸려 있다. 여기 사는 사람은 살릴 가치가 있는 책들을 챙겨 불 있는 곳으로 갔다.',
  lookWhen: [
    { if: [LIT, { quest: 'errand', is: 2 }], look: '아늑한 방 하나, 대부분 책. 난로에 불이 탄다. 늙은 펜은 탁자 하나, 침대 하나, 벽보다 많은 선반을 둔다. 그리고 창가의 못에, 빛이 닿는 곳에, 은 사슬의 월장석이 걸려 있다.' },
    { if: [LIT], look: '아늑한 방 하나, 대부분 책, 난로에 불이 타고 앞에는 아무도 없다. 펜은 탁자 하나, 침대 하나, 벽보다 많은 선반을 둔다. 그는 물가에 내려가 있다.' },
  ],
  scene: {
    kind: 'indoor', walkTop: 104, ambient: 0.46,
    layers: [{ t: 'interior', floor: FL, wall: 'log' }, { t: 'earthfloor', floor: FL }, { t: 'thatchroof', y: 20 }],
    props: [
      { t: 'bookcase', x: 24, y: FL, w: 46, h: 76, v: 'deep', seed: 1 },
      { t: 'bookcase', x: 72, y: FL, w: 46, h: 76, v: 'deep', seed: 2 },
      { t: 'bookcase', x: 122, y: FL, w: 44, h: 76, v: 'deep', seed: 3 },
      { t: 'hutwindow', x: 226, y: 62, w: 24, h: 26 },
      { t: 'doorway', x: 262, y: FL },
      { t: 'bookcase', x: 298, y: FL, w: 44, h: 76, v: 'deep', seed: 4 },
      { t: 'hang', x: 228, y: 20, h: 2, v: 'herbs' },
      { t: 'hang', x: 258, y: 20, h: 6, v: 'herbs' },
      { t: 'bookstack', x: 220, y: 62, h: 2, seed: 5, v: 'on' },
      { t: 'bookstack', x: 48, y: 101, h: 4, seed: 6 },
      { t: 'bookstack', x: 102, y: 102, h: 6, seed: 7 },
      { t: 'bookstack', x: 214, y: 100, h: 3, seed: 8 },
      { t: 'bookstack', x: 290, y: 101, h: 5, seed: 9 },
      { t: 'rug', x: 176, y: 122, w: 34, h: 8 },
      { t: 'threshold', x: 262, y: 101, w: 30 },
      { t: 'longtable', x: 112, y: 142, w: 56, v: 'bare' },
      { t: 'writing', x: 98, y: 143 },
      { t: 'bed', x: 250, y: 160, ramp: 'blue' },
      { t: 'bookstack', x: 266, y: 161, r: 15, h: 3, seed: 3, v: 'on' },
    ],
    lights: [{ x: 226, y: 48, r: 22, i: 0.35, kind: 'glow' }],
    when: [
      { if: [COLD], props: [{ t: 'fireplace', x: 176, y: FL, w: 54, v: 'hut' }] },
      { if: [LIT], props: [{ t: 'fireplace', x: 176, y: FL, w: 54, v: 'hut', lit: 2 }], lights: [{ x: 176, y: 100, r: 96, i: 1.2, kind: 'warm' }, { x: 106, y: 122, r: 24, i: 0.35, kind: 'warm' }] },
      // After he has it back, his wife's amulet hangs on a nail by the window.
      { if: [{ quest: 'errand', is: 2 }], props: [{ t: 'amulet', x: 244, y: 38 }] },
    ],
  },
  doors: [{ x0: 254, y0: 105, x1: 270, y1: 107, to: 'tarn', x: 262, y: 116, dir: 'down' }],
  // He is at home only once he has stopped going down to the shore.
  npcs: [{ char: 'fenn', x: 196, y: 124, wander: [150, 120, 230, 132], if: [LIT, { quest: 'errand', is: 2 }] }],
  things: [
    { id: 'tome', nouns: ['tome'], x: 122, y: 143, lift: 16, reach: 34, icon: 'tome', take: 'tomeFlame', takeSay: '그을린 책을 집어 든다. 그는 좋아한 적 없다고 했다.', look: '가장자리가 그슬린 책이 탁자 위에 펼쳐져 있다.' },
    {
      id: 'hearth', nouns: ['hearth'], x: 176, y: 106, reach: 40, look: '꺼진 난로, 쓸려 있고, 재는 양동이에. 여기 사는 사람은 남들의 불이 꺼진 그날 밤에 나갔고, 정리정돈하며 나갔다.',
      lookWhen: [{ if: [LIT], look: '제대로 된 불, 꾸준하고 뜨겁다, 뭘 기대하는지 들은 게 분명한 난로에서.' }],
    },
    { id: 'shelf', nouns: ['shelf'], x: 70, y: 106, reach: 50, look: '책이 두 겹, 여섯 가지 문자로. 자물쇠 달린 것도 있다. 하나에는 이빨 자국이 있다, 안쪽에서.' },
    { id: 'table', nouns: ['table'], x: 112, y: 144, reach: 44, look: '잉크, 촛농 토막, 머그잔, 그리고 불이 꺼졌을 때 주인이 읽고 있던 것.' },
    { id: 'bed', nouns: ['bed'], x: 250, y: 162, reach: 40, look: "은둔자의 침대. 잔 흔적은 없어 보인다. 읽은 흔적은 있다." },
    { id: 'door', nouns: ['door'], x: 262, y: 106, reach: 400, look: '나가는 길, 산호수로.' },
  ],
  rules: [
    firstVisit('hut'),
    { on: ['warm', 'warm *'], if: [LIT], do: [{ say: '은둔자의 불에 몸을 녹인다. 아주 좋은 불이다.' }] },
    { on: ['light hearth', 'light', 'use flint'], if: [COLD], do: [{ say: '바구니에 불씨 가지가 있다, 치밀한 누군가가 준비해 둔. 불꽃을 튀긴다. 불꽃이 일어나고, 납작하게 눕고, 꺼진다.' }] },
    ...fennRules,
    { on: ['buy', 'buy *', 'learn'], if: [{ not: { near: 'fenn', d: 400 } }], do: [{ say: '여긴 네게 뭘 팔 사람이 없다. 책들이 선반에서 너를 본다.' }] },
    { on: ['sleep', 'sleep bed'], if: [{ near: 'fenn', d: 400 }], do: [{ say: '"그건 내 침대요," 펜이 말한다, "언젠가 필요할 수도 있어."' }] },
    { on: ['sleep', 'sleep bed'], do: [{ say: '남의 침대다, 그리고 책이 들어 있다.' }] },
  ],
};

