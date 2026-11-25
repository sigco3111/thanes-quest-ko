// The country beyond the map. These are the settings and the wording the engine's generator
// draws on; the screens themselves are made as the player walks into them.

import type { FrontierDef, SightDef } from '../../engine/types';

// Things written by hand that stand, once each, somewhere out in the generated country. None is
// needed for anything. Each has something to read, something to try, and something that only
// ORUN shows. (No score is given for any of them: they are found, not earned.)
const near = (id: string) => ({ near: id });
const sights: SightDef[] = [
  {
    id: 'kettle', name: '차가운 야영지', biomes: ['pines', 'deadwood', 'mere'], minDepth: 1,
    seen: '누군가 한때 여기 야영했다. 오래 식은 돌 화덕 자리, 그 위에 아직 매달린 무쇠 솥.',
    prop: { t: 'campfire', v: 'cold' },
    when: [{ if: [{ flag: 'sight.kettle' }], prop: { t: 'campfire', v: 'kettle' } }],
    thing: {
      nouns: ['hearth', 'inn'], try: ['light fire'],
      look: '그저께 나뭇가지 삼각대 아래 그을린 돌 화덕 자리, 거기 뚜껑이 얼어붙은 무쇠 솥이 매달려 있다. 안에 있던 것은 아직 그대로다. 이 불을 지핀 사람은 끓기 전에 돌아올 작정이었다.',
      lookWhen: [{ if: [{ flag: 'sight.kettle' }], look: '불은 꺼져 가고 솥은 비었다. 둘 다 최대한 처음 본 대로 둔다, 혹시 모르니.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The snow gives up its footprints. One pair of boots, round and round the fire, as a person walks who is keeping warm and waiting. Then, once, straight off into the trees, at a run. They do not come back the same way. They do not come back.' }] },
      { on: ['light hearth', 'light inn', 'use hearth', 'light', 'cast flame'], if: [{ flag: 'sight.kettle' }], do: [{ say: '타고 있다. 저절로 꺼지게 둔다. 누군가 아직 연기를 볼지 모른다.' }] },
      {
        on: ['light hearth', 'light inn', 'use hearth', 'light', 'cast flame'], if: [near('kettle')],
        do: [{ set: 'sight.kettle' }, { heal: 20 }, { sound: 'take' }, { say: '나뭇가지가 첫 불꽃에 붙는다. 여기선 불길이 얌전하다. 쭈그려 앉아 기다리고, 잠시 뒤 솥이 딱딱거리다 노래하기 시작한다. 차다. 검고, 우러나고, 몇 겨울은 된. 전부 마신다. 그 시간 동안 이 불에 돌아올 사람이 기다려지고, 그건 너다.' }],
      },
      { on: ['drink inn', 'open inn', 'drink'], if: [{ flag: 'sight.kettle' }], do: [{ say: '비었다. 네가 그렇게 했다.' }] },
      { on: ['drink inn', 'open inn', 'drink'], do: [{ say: '뚜껑이 얼어붙었고, 그 아래는 갈색 얼음 덩어리다. 불이 필요하다.' }] },
      { on: ['take inn', 'take hearth'], do: [{ say: '돌아올 사람의 것이다.' }] },
    ],
  },
  {
    id: 'fingerpost', name: '이정표', biomes: ['open', 'pines'], minDepth: 1,
    seen: '이정표가 서 있다, 눈으로 보아 길이 만나지 않는 곳에.',
    prop: { t: 'signpost' },
    thing: { nouns: ['sign'], try: ['read sign'], look: '팔 셋 달린 참나무 기둥, 하나하나 뾰족하게 깎고 깊이 새겼다. 이름들은 닳았지만 아직 읽힌다.' },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. Under the snow at the foot of the post lies a fourth arm, snapped off short. It says THE GATE. Under that, in the hand that carved all the rest: NO FURTHER.' }] },
      {
        on: ['read sign', 'pet sign'], if: [near('fingerpost'), { not: { flag: 'sight.fingerpost' } }],
        do: [{ set: 'sight.fingerpost' }, { run: 'study', arg: 12 }, { say: '한 팔은 홀로미어라 하고, 대충 맞는 쪽을 가리킨다. 하나는 나룻배라 하고, 강이 없는 해 뜨는 쪽을 가리킨다. 세 번째는 엘드마르크, 사흘. 그 아래 누군가 나중에 더 작게 새겼다. 이제는 아니다.' }],
      },
      { on: ['read sign', 'pet sign'], if: [near('fingerpost')], do: [{ say: 'HOLLOWMERE. THE FERRY. ELDMARK, THREE DAYS; and under it, NOT ANY MORE.' }] },
      { on: ['read sign'], do: [{ say: '여기서는 읽을 수 없다.' }] },
      { on: ['take sign', 'push sign', 'pull sign', 'attack sign'], do: [{ say: '홀로미어에 지붕이 생기기보다 오래 같은 세 방향을 가리켜 왔다. 일을 하게 둔다.' }] },
    ],
  },
  {
    id: 'roadstone', name: '길의 돌', biomes: ['open', 'pines'], minDepth: 2, side: 'n',
    seen: '다듬은 돌이 눈 속에 서 있다, 바위라기엔 너무 반듯한.',
    prop: { t: 'stone', h: 22 },
    thing: { nouns: ['menhir'], try: ['read stone'], look: '허리 높이의 돌, 네 면이 반듯하게 다듬어지고, 앞면에 선 하나가 새겨져 있다, 높은 곳에서 본 길처럼. 숫자도 없다. 이름도 없다.' },
    rules: [
      {
        on: 'orun', if: [{ flag: 'winter.broken' }],
        do: [{ say: "ORUN. 젖은 눈이 유리가 되고, 그 아래 길이 있다. 판석을 깐, 자로 잰 듯 곧은, 북으로 가는. 그 위에, 많은 겨울 아래, 발자국들. 여자의 것, 성큼성큼, 곁에 아이의 것. 여기서 작은 발자국들은 아직 따라가고 있다. 어디서 멈추는지 너는 안다." }],
      },
      { on: 'orun', do: [{ say: "ORUN. 눈이 유리가 되고, 그 아래 길이 있다. 판석을 깐, 자로 잰 듯 곧은, 수레 너비의, 북으로 가는. 그 위에, 많은 겨울 아래, 발자국들. 여자의 것, 성큼성큼, 곁에 아이의 것. 여기서 작은 발자국들은 아직 따라가고, 아직 곧게 가고 있다." }] },
      {
        on: ['read menhir', 'pet menhir', 'read inscription'], if: [near('roadstone'), { not: { flag: 'sight.roadstone' } }],
        do: [{ set: 'sight.roadstone' }, { run: 'study', arg: 12 }, { say: '새겨진 선에 손바닥을 댄다. 룬이 아니고, 아무것도 가르쳐 주지 않는다. 자신을 따라 가리킬 뿐이다. 남으로, 홀로미어의 연기 쪽, 그리고 북으로, 아무도 가지 않는 쪽.' }],
      },
      { on: ['read menhir', 'pet menhir', 'read inscription'], if: [near('roadstone')], do: [{ say: 'A line, cut deep, pointing south and north. That is all it has to say.' }] },
      { on: ['read menhir', 'pet menhir', 'read inscription'], do: [{ say: 'You are not close enough.' }] },
    ],
  },
  {
    id: 'sledge', name: '썰매', biomes: ['open', 'mere'], minDepth: 2,
    seen: '짐 실은 썰매가 눈더미에 얼어붙어 있다, 곁에 아무도 없이.',
    prop: { t: 'sledge' },
    thing: {
      nouns: ['sledge'], try: ['open sledge'],
      look: '긴 여정을 위해 싣고 버려진 썰매. 침구, 교유통, 그리고 모든 것 위에 동여맨 요람. 멍에는 부러진 게 아니라 잘렸다. 끌던 것은 풀어 준 것이다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The drift clears like breath off glass. The sledge came out of the east, a long way, from somewhere that is not there any more. From here three pairs of feet go on without it, toward the valley: two large, and one small, walking very close between them. They were still walking when the tracks give out.' }] },
      { on: ['look sledge', 'open sledge', 'take sledge', 'use sledge'], if: [{ flag: 'sight.sledge' }, near('sledge')], do: [{ say: '한 번 뒤져 봤다. 한 번이면 족했다.' }] },
      {
        on: ['look sledge', 'open sledge', 'take sledge', 'use sledge'], if: [near('sledge')],
        do: [{ set: 'sight.sledge' }, { gold: 8 }, { give: 'toyhorse' }, { sound: 'take' }, { say: '도둑이 된 기분으로 뒤진다. 이불들, 꽁꽁 얼어. 버터가 그대로 든 교유통. 요람 안, 이불 아래, 은화 여덟 닢 든 지갑과, 네 손 길이의 말, 참을성 있는 누군가가 소나무로 깎은. 귀 하나가 씹혔다. 은화는 가져간다, 돌아올 사람이 없으니. 말은 가져간다, 여기 혼자 두는 건 아닌 것 같아서.' }],
      },
      { on: ['push sledge', 'pull sledge'], do: [{ say: '주발까지 얼어붙었다. 여기서 더는 가지 않는다.' }] },
    ],
  },
  {
    id: 'watcher', name: '지켜보는 이', biomes: ['open', 'crags'], minDepth: 3,
    seen: '사람 형상이 눈 위에 홀로 서 있다, 골짜기를 향해. 움직이지 않는다.',
    prop: { t: 'snowman', ramp: 'grey' },
    thing: {
      nouns: ['snowman'], try: ['look snowman'],
      look: '눈 사람, 정성껏, 오래가게 지었다. 단단히 다지고, 물로 겉을 얼리고, 두 번 이상 고쳤다. 목에 회색 담요 조각을 두르고, 골짜기를 향해 있다. 이렇게 먼 곳에서 심심해서 이런 걸 짓는 사람은 없다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 그의 발치, 눈 아래, 납작한 돌 다섯이 일렬로 놓여 있다, 하나하나 이름이 긁혀 있고 날짜는 없다. 여기 땅은 한 길 깊이로 얼어 삽을 받을 리 없었다. 누군가 대신 할 수 있는 일을 하고, 그를 그 위에 세웠다, 고향을 향하게.' }] },
      { on: ['talk snowman', 'thank snowman'], do: [{ say: '안녕하신가 인사한다. 최소한의 예의다. 그는 계속 골짜기를 지켜본다.' }] },
      { on: ['attack snowman', 'push snowman', 'take snowman', 'pull snowman'], do: [{ say: '왠지는 모르겠지만, 차라리 묘비를 넘어뜨리겠다 싶다.' }] },
      { on: ['pet snowman', 'use snowman'], if: [near('watcher')], do: [{ say: '어깨에 지난 폭풍이 할퀸 무른 자리가 있다. 다시 단단히 다지고, 적시고, 얼게 둔다. 그는 또 겨울 하나를 서 있을 거다. 더 짧은 겨울이겠지.' }] },
    ],
  },
  {
    id: 'fishhole', name: 'The Fishing Hole', biomes: ['mere'], minDepth: 1,
    seen: 'Somebody has cut a hole in the ice at the edge of the mere, and left a rod standing in it.',
    prop: { t: 'icehole' },
    thing: {
      nouns: ['hole'], try: ['pull rod'],
      look: 'A hole the width of a bucket, cut through ice as thick as your arm is long, with a hazel rod wedged upright beside it and the line still down. It has skinned over. The rod bends a little, now and then, by itself.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The ice goes clear. The pike is there, a yard down, exactly as long as the boot, looking up at you. Behind it on the mud lies the other boot of the pair. A smaller pike is looking out of that one.' }] },
      { on: ['pull hole', 'take hole', 'use hole', 'fish', 'fish hole', 'pull'], if: [{ flag: 'sight.fishhole' }], do: [{ say: 'The line is down again and the hole is skinning over. The pike can have the rest of the winter.' }] },
      {
        on: ['pull hole', 'take hole', 'use hole', 'fish', 'fish hole', 'pull'], if: [near('fishhole')],
        do: [{ set: 'sight.fishhole' }, { gold: 4 }, { sound: 'take' }, { say: 'You break the skin of ice and haul. It comes up slowly, hand over hand, fighting like a wet blanket, and it is a boot. A good boot. There is a pike in it, which has plainly been living there, and which regards you with the outrage of a householder. You tip it back, and it takes the bait with it as it goes. In the toe of the boot, tied in a rag, are four silver. You feel you have been paid to go away.' }],
      },
      { on: ['swim', 'swim hole', 'enter hole', 'jump hole'], do: [{ say: 'It is the width of a bucket. You are not.' }] },
    ],
  },
  {
    id: 'stray', name: 'The Stray', biomes: ['open', 'crags', 'pines'], minDepth: 2,
    seen: 'There are sheep tracks in the snow here, a long way from any fold.',
    when: [{ if: [{ not: { flag: 'sight.stray' } }], prop: { t: 'sheep', seed: 3 } }],
    thing: {
      nouns: ['sheep'], try: ['pet sheep'],
      look: 'A ewe, thin, rimed with frost to the knees, and alive, against all sense. There is a mark burned into her fleece: a G in a ring. She is looking at you as if you were late.',
      lookWhen: [{ if: [{ flag: 'sight.stray' }], look: 'A trodden place in the snow where a sheep stood for longer than a sheep should have to.' }],
    },
    rules: [
      { on: 'orun', if: [{ not: { flag: 'sight.stray' } }], do: [{ say: 'ORUN. Her tracks unwind behind her across the snow: days of them, in a slow, stubborn spiral, and at the end of every turn she has stopped and stood facing the same way. Toward the valley. Toward home.' }] },
      { on: ['attack sheep', 'shoot sheep'], if: [{ not: { flag: 'sight.stray' } }], do: [{ say: 'She has walked through a week of wolves to get this far. You are not going to be the thing that stops her.' }] },
      {
        on: ['pet sheep', 'take sheep', 'use sheep', 'talk sheep', 'push sheep', 'pull sheep'], if: [{ not: { flag: 'sight.stray' } }, near('stray')],
        do: [{ set: 'sight.stray' }, { give: 'ewe' }, { sound: 'take' }, { say: 'You hold out a hand. She considers it, and you, and the alternative, which is more of this. Then she walks over and leans on your leg with her whole weight. It appears that you now have a sheep.' }],
      },
    ],
  },
  {
    id: 'sleeper', name: "The Sleeper's Hollow", biomes: ['crags', 'pines'], minDepth: 3,
    seen: 'There is a long hump under the snow here that the wind has not drifted the way it has drifted everything else.',
    when: [{ if: [{ not: { flag: 'sight.sleeper' } }], prop: { t: 'hump' } }],
    thing: {
      nouns: ['hump'], try: ['listen to the hump'], reach: 40,
      look: 'A long, low hump of snow in the lee of the rocks. In the top of it is a hole the size of a fist, with frost furred all round the rim. As you watch, a little steam comes out. Then, after a long while, a little more.',
      lookWhen: [{ if: [{ flag: 'sight.sleeper' }], look: 'A trampled hollow, where something very large was asleep until you came along.' }],
    },
    rules: [
      { on: 'orun', if: [{ not: { flag: 'sight.sleeper' } }], do: [{ say: 'ORUN. The snow goes clear as water. It is a bear, as you had begun to think: white, enormous, nose under one paw. What you had not thought of is the two smaller humps tucked in against her, each about the size of a dog, each with its nose under one paw as well. You let the word go, very quietly.' }] },
      { on: ['listen', 'listen hump', 'smell hump'], if: [{ not: { flag: 'sight.sleeper' } }], do: [{ say: 'You bring your ear near the hole. Something very large is breathing in there, slowly, about four times a minute. It sounds contented. You would like to keep it that way.' }] },
      { on: ['pet hump'], if: [{ not: { flag: 'sight.sleeper' } }, near('sleeper')], do: [{ say: 'You pat the snow, gently. Nothing happens. You have patted a sleeping bear and lived, and nobody is ever going to believe you.' }] },
      {
        on: ['attack hump', 'push hump', 'dig hump', 'open hump', 'use hump', 'shout', 'shout hump', 'sing', 'jump hump', 'climb hump', 'enter hump'], if: [{ not: { flag: 'sight.sleeper' } }, near('sleeper')],
        do: [{ set: 'sight.sleeper' }, { spawn: 'bear', x: 22, y: -8 }, { sound: 'hurt' }, { say: 'This turns out to be a mistake that can be made exactly once. The hump stands up. It goes on standing up for some time. It is white, it is the size of a hay-wain, and until a moment ago it had no quarrel with anybody.' }],
      },
      { on: ['listen', 'listen hump', 'pet hump', 'attack hump', 'dig hump'], do: [{ say: 'There is nobody home, and you know why.' }] },
    ],
  },
  {
    id: 'shuthouse', name: 'The Shut House', biomes: ['open', 'pines'], minDepth: 2,
    seen: 'A house stands here by itself, drifted to the eaves, with no smoke at its roof.',
    prop: { t: 'hall', w: 60, v: 'cold' },
    thing: {
      nouns: ['hall', 'door'], reach: 60, try: ['open door', 'sleep'],
      look: 'A turf-roofed house of logs, drifted to the eaves. The door is frozen into its frame: a skin of ice runs right round it, like the seal on a jar. No smoke, and no tracks but yours.',
      lookWhen: [{ if: [{ flag: 'sight.shuthouse' }], look: 'A turf-roofed house of logs, drifted to the eaves, with its door standing a hand open. Inside: one room, a cold hearth, a chair, and the man in the chair. His boots are side by side by the door.' }],
    },
    rules: [
      { on: 'orun', if: [{ flag: 'sight.shuthouse' }], do: [{ say: 'ORUN. Under the hearthstone there is a crock, and in the crock, as dry as the day it was put there, a double handful of seed corn. He kept back his spring. And on the lintel, inside, cut with a knife, small: his winters here, in fives. They stop at thirty-one.' }] },
      { on: 'orun', do: [{ say: 'ORUN. The logs go thin as horn. There is one room in there, and a chair drawn up to a cold hearth, and somebody sitting in it who does not turn round.' }] },
      {
        on: 'veth', if: [near('shuthouse'), { not: { flag: 'sight.shuthouse' } }],
        do: [{ set: 'sight.shuthouse' }, { sound: 'door' }, { say: 'VETH. The ice round the door lets go all at once, like a held breath, and the door swings in.\n\nInside there is one room, a cold hearth, and a man in a chair in front of it, with his boots off and set side by side by the door, as a man sets them who has come in for the night. He has been dead some winters. He is the only one of the dead you have met out here who is where he was left.' }],
      },
      { on: 'veth', if: [{ not: { flag: 'sight.shuthouse' } }], do: [{ say: 'The word goes out across the snow, and the house does not hear it. You would need to be nearer the door.' }] },
      {
        on: ['sleep', 'sleep hall', 'enter hall', 'enter door', 'enter', 'open door'], if: [{ flag: 'sight.shuthouse' }, { quiet: true }, near('shuthouse')],
        do: [{ run: 'rest' }, { say: 'You sleep on his floor, out of the wind, with the door pushed to. He does not seem to mind the company. In the morning you are whole again. You set his boots straight, which they were already, and shut the door behind you as well as it will shut.' }],
      },
      { on: ['sleep', 'sleep hall', 'enter hall', 'enter door', 'enter'], if: [{ flag: 'sight.shuthouse' }], do: [{ say: 'Not with something at your heels, and not from over here.' }] },
      { on: ['open door', 'push door', 'pull door', 'knock door', 'enter hall', 'enter door', 'attack door', 'sleep', 'sleep hall'], do: [{ say: 'The door is frozen into its frame, all the way round. You put your shoulder to it, and then your boot. It has been shut a great deal longer than you have been pushing.' }, { note: 'It wants opening by something stronger than a shoulder.' }] },
      { on: ['take hall', 'light hearth', 'light'], if: [{ flag: 'sight.shuthouse' }], do: [{ say: 'There is wood laid on his hearth, and you have a flint. You leave it. It is his fire, and he let it go out.' }] },
    ],
  },
  {
    id: 'skates', name: 'The Skating Stake', biomes: ['mere'], minDepth: 2,
    seen: 'Somebody has driven a stake into the bank of the mere and hung a pair of skates on it.',
    prop: { t: 'post', v: 'skates' },
    thing: {
      nouns: ['skates'], try: ['skate'],
      look: "A pair of skates made from a horse's shin-bones, ground flat underneath and bored at each end for thongs, hanging from a nail in a stake at the edge of the ice. Cut into the stake, in letters a child could read: BORROW THEM. HANG THEM BACK.",
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The snow lifts off the mere like a sheet off a table, and the ice under it is written all over with skating: long sure curves, and loops, and figures of eight, and small wobbling lines that go nowhere much, and here and there a scuffed place where somebody sat down. They lie one under another, winter under winter, as deep as you can see. Every one of those people hung the skates back.' }] },
      { on: ['skate', 'skate skates', 'skate tarn', 'use skates', 'equip skates', 'take skates'], if: [{ flag: 'sight.skates' }, near('skates')], do: [{ say: 'You go round once more, with more style and less sitting down. It does not get any less good. You hang them back.' }] },
      {
        on: ['skate', 'skate skates', 'skate tarn', 'use skates', 'equip skates', 'take skates'], if: [near('skates')],
        do: [{ set: 'sight.skates' }, { heal: 10 }, { say: 'You strap them on over your boots and push off. For a long, bad moment you and the mere disagree about which way is up. Then you have it, and you go round, and round again, faster, arms out and the wind in your teeth, and for a while you are rather good at this, which is a pity, because there is nobody out here to see. Then you sit down hard, as everybody does in the end. You are warmer than you have been in days. You hang them back on the stake.' }],
      },
      { on: ['attack skates', 'drop skates'], do: [{ say: 'BORROW THEM, the stake says. HANG THEM BACK. It does not say anything about that, and you feel it would have.' }] },
    ],
  },
  {
    id: 'lamp', name: 'The Lamp Tree', biomes: ['deadwood'], minDepth: 2,
    seen: 'High in one of the dead trees, from a limb of its own, hangs a lantern.',
    prop: { t: 'deadtree', h: 58, seed: 7, v: 'lantern' },
    when: [{ if: [{ flag: 'sight.lamp' }], prop: { t: 'deadtree', h: 58, seed: 7, v: 'lamplit' } }],
    thing: {
      nouns: ['lamp', 'light'], try: ['light the lantern'],
      look: 'A horn lantern on an iron hook, hung from a limb higher than you can reach from the ground. It has been out a long time, and the stub of candle in it is the colour of old teeth. It was hung up there to be seen from a long way off, by somebody coming home in the dark.',
      lookWhen: [{ if: [{ flag: 'sight.lamp' }], look: 'The lantern is burning, high in the dead tree, where it shows over the drifts. It is not much of a light. It is a good deal more than none.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The grey bark goes thin as paper, and under it, running up the trunk, is a line of old nail-holes, each a hand above the one before. The snow came deeper every winter, and every winter somebody climbed up and moved the lantern higher, so that it would still show over the drifts. The lowest hole is at the height of your knee. The highest is the one it hangs from now. Nobody has moved it since.' }] },
      { on: ['light lamp', 'light light', 'light tree', 'use lamp', 'use light', 'light', 'cast flame'], if: [{ flag: 'sight.lamp' }], do: [{ say: 'It is burning. Leave it be. Whoever it was for, it can be seen a long way off again.' }] },
      {
        on: ['light lamp', 'light light', 'light tree', 'use lamp', 'use light', 'light', 'cast flame'], if: [near('lamp')],
        do: [{ set: 'sight.lamp' }, { sound: 'take' }, { say: 'You go up the trunk, which allows it under protest, and get the lantern open with one hand and a spark into it with the other. The stub catches. Out here, flames behave. You climb down and stand back to look. It is not much of a light, but then it was never meant for you.' }],
      },
      { on: ['climb tree', 'climb lamp', 'climb light', 'climb'], if: [near('lamp')], do: [{ say: 'You go up as far as the lantern and look out over the drifts, the way it does. Nobody is coming. You climb down again.' }] },
      { on: ['take lamp', 'take light', 'pull lamp'], do: [{ say: 'You leave it where it can be seen. That was the whole idea of it.' }] },
    ],
  },
  {
    id: 'wishes', name: 'The Wishing Stones', biomes: ['shrine'], minDepth: 3,
    seen: 'Outside the ring somebody has heaped a second, smaller cairn, of flat stones with writing on them.',
    prop: { t: 'cairn', seed: 41 },
    thing: {
      nouns: ['wishes'], try: ['make a wish'],
      look: 'A knee-high heap of pebbles and flat stones, and every one has a few words scratched on it. They are wishes. The ones on top say LESS SNOW, and LESS SNOW, and A DOG, and LESS SNOW, and SPRING. ANY SPRING. I AM NOT FUSSY.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The heap goes clear as water to the frozen ground, and you can read every stone in it. Near the top they ask for less snow. Further down they ask for an early spring, and further still for a mild winter. At the very bottom, on stones worn nearly smooth, in letters nobody has cut for three hundred winters, they ask for a fine day for the wedding, and good weather for the hay.' }] },
      { on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [{ flag: 'sight.wishes' }, near('wishes')], do: [{ say: 'One stone each seems to be the custom. You have had yours.' }] },
      {
        on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [{ flag: 'winter.broken' }, near('wishes')],
        do: [{ set: 'sight.wishes' }, { say: 'You find a flat stone and begin to scratch LESS SNOW on it, out of habit, and then you stop. There is rain on the back of your hand. You turn the stone over, scratch THANK YOU on the other side instead, and set it on the top, that side up.' }],
      },
      {
        on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [near('wishes')],
        do: [{ set: 'sight.wishes' }, { say: 'You find a flat stone, scratch LESS SNOW on it with the point of your knife, and set it on the top with the others. It is what everybody else asked for. It seems only right to add your voice.' }],
      },
      { on: ['read wishes', 'read inscription'], if: [near('wishes')], do: [{ say: 'LESS SNOW. LESS SNOW. A DOG. LESS SNOW. SPRING. ANY SPRING. I AM NOT FUSSY. The ones further down are worn, and harder to make out.' }] },
      { on: ['take wishes', 'attack wishes', 'push wishes'], do: [{ say: 'You leave them be. They are not yours, and some of them may still be waiting.' }] },
    ],
  },
  {
    id: 'ferry', name: 'The Ferry Post', biomes: ['mere'], minDepth: 3, side: 'e',
    seen: 'A black post stands at the edge of the ice, with a horn hung on it by a cord.',
    prop: { t: 'post', v: 'horn' },
    thing: {
      nouns: ['ferry', 'ale', 'fence', 'sign', 'rope'], try: ['blow the horn'],
      look: "A post as thick as a man, black with old tar, with an iron ring for a mooring rope and a cow's horn hung beside it on a cord. Burned into the wood, in letters big enough to read from the far side of the water: BLOW FOR THE FERRY. There is no river here. There is the mere, frozen, and beyond it the east.",
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The ice goes clear as a window. A rope runs from the iron ring down into the water and away east along the bottom, straight as a rule, further than you can see. Below the post, on a short line, lies the ferry: a broad flat boat, sitting upright on the mud. Its last ferryman made it fast before he went, properly, the way he always had, ready for a crossing in the morning.' }] },
      { on: ['blow ale', 'blow ferry', 'use ale', 'use ferry'], if: [{ flag: 'sight.ferry' }, near('ferry')], do: [{ say: 'You blow again. The ice hears you out, politely.' }] },
      {
        on: ['blow ale', 'blow ferry', 'use ale', 'use ferry'], if: [near('ferry')],
        do: [{ set: 'sight.ferry' }, { say: 'You put the horn to your mouth and blow. It gives a long, low note that goes out across the ice and keeps on going for longer than seems likely. Then you wait, because that is what the post tells you to do. The ferry does not come. You had not really thought it would, and you find you are a little disappointed in it all the same.' }],
      },
      { on: ['take ale', 'take ferry', 'pull ferry', 'push ferry', 'pull rope', 'take rope'], do: [{ say: 'The horn belongs to the post, and the post has been standing here a good deal longer than you. Somebody may want the ferry yet.' }] },
      { on: ['read ferry', 'read sign', 'read inscription'], do: [{ say: 'BLOW FOR THE FERRY.' }] },
    ],
  },
  {
    id: 'rota', name: "The Reavers' Rota", biomes: ['camp'], minDepth: 4,
    seen: 'By the fire-pit a board is nailed to a post, and somebody has been writing on it.',
    prop: { t: 'signpost' },
    thing: {
      nouns: ['rota', 'sign'], try: ['read the board'],
      look: 'A split board nailed to a post, cut all over with names and duties in at least three hands, none of them good. Reavers, it turns out, keep a rota.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. Behind the tents, under a foot of snow, where somebody buried it in a hurry and then stamped on the place, lies a cooking-pot. Its bottom is burned clean through, and something black is welded to the inside of it that may once have been a stew. You now know why not Ulf.' }] },
      {
        on: ['read rota', 'read sign', 'read inscription'], if: [near('rota')],
        do: [{ say: 'WATCH: ULF. KETIL. ULF. GRIM. WOOD: KETIL. GRIM. ULF. KETIL. THE POT: GRIM. KETIL. GRIM. KETIL. NOT ULF. Under that, in a second hand: WHY NOT ULF. Under that, in a third, cut very deep: YOU KNOW WHY.' }],
      },
      { on: ['read rota', 'read sign', 'read inscription'], do: [{ say: '여기서는 읽을 수 없다.' }] },
      { on: ['take rota', 'take sign', 'pull rota'], do: [{ say: 'You leave it where it is. Somebody has to keep them organised.' }] },
      { on: ['attack rota', 'attack sign'], do: [{ say: 'It has done nothing to you. It has done a great deal to Ulf.' }] },
    ],
  },
  {
    id: 'oven', name: 'The Bread Oven', biomes: ['ruin'], minDepth: 4,
    seen: 'Among the fallen stones one thing still stands whole: a domed oven of fired clay.',
    prop: { t: 'oven' },
    when: [{ if: [{ flag: 'sight.oven' }], prop: { t: 'oven', v: 'lit' } }],
    thing: {
      nouns: ['oven', 'food'], try: ['light the oven'],
      look: 'A bread oven as round as a beehive and as high as your chest, built of clay and fired as hard as a pot by years of use. Everything else that stood here has fallen down. The oven has not so much as cracked. There is a loaf inside it, and kindling laid ready at the back.',
      lookWhen: [{ if: [{ flag: 'sight.oven' }], look: 'The oven is lit and drawing well, and warmth comes out of its mouth like a slow breath. The loaf is still in there, minding its own business.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: "ORUN. The snow goes to glass. Under it lie the floors of a dozen houses, set round the oven in a ring, every door facing it, and from every doorstep a path is worn into the stone, straight to the oven's mouth. One fire, and all of them shared it, every morning, for as long as there was anything to bake." }] },
      { on: ['light oven', 'light hearth', 'use oven', 'light', 'cast flame'], if: [{ flag: 'sight.oven' }], do: [{ say: 'It is lit. Stand by it a while. That is what it is for.' }] },
      {
        on: ['light oven', 'light hearth', 'use oven', 'light', 'cast flame'], if: [near('oven')],
        do: [{ set: 'sight.oven' }, { heal: 15 }, { sound: 'take' }, { say: 'The kindling was laid a very long time ago and is as dry as paper. It catches at the first spark, the oven draws the way it was built to, and after a while warmth comes out of its mouth like a slow breath. You stand in front of it with your hands out, as people stood here every morning, and are warm. You leave the loaf where it is. It has waited a long time for this.' }],
      },
      { on: ['warm', 'warm oven', 'sit oven'], if: [{ flag: 'sight.oven' }, near('oven')], do: [{ say: 'You stand by the oven until your fingers remember what they are for.' }] },
      { on: ['enter oven', 'climb oven'], do: [{ say: 'It was built for bread, and you are the wrong shape.' }] },
      { on: ['eat food', 'take food', 'eat oven'], do: [{ say: 'It has been bread for a long time, and stone for a good deal longer. You would need different teeth.' }] },
      { on: ['take oven', 'push oven', 'attack oven'], do: [{ say: 'It has outlasted a whole village. It can outlast you.' }] },
    ],
  },
  {
    id: 'lookout', name: 'The Lookout', biomes: ['crags'], minDepth: 5,
    seen: 'Iron pegs have been driven into the face of one crag, one above another, like the rungs of a ladder.',
    prop: { t: 'crag', w: 40, h: 64, seed: 17, v: 'pegs' },
    thing: {
      nouns: ['pegs'], try: ['climb the pegs'],
      look: 'A spur of grey rock with iron pegs hammered into its face a stride apart, all the way up to a ledge. The pegs are worn bright on top by hands and boots, and rusted underneath. Somebody climbed this often, and not for the exercise.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The snow on the ledge above blows clear, and the rock there is scratched all over with small pictures in rows: each one a roof, with a line of smoke going up from it. Somebody who lived out here climbed up, winter after winter, to count the smoke of home. The first rows have twenty roofs. The last has eleven. After that nobody came up to count.' }] },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [{ flag: 'winter.broken' }, near('lookout')],
        do: [{ say: 'You go up the pegs, which are wet, and haul yourself onto the ledge. The whole country lies below you, going grey and brown at the edges, and at the far end of it is Hollowmere: eleven threads of smoke going up, and bending now, because there is a wind. You sit and look at it for a while before you climb down.' }],
      },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [{ flag: 'hearth.lit' }, near('lookout')],
        do: [{ say: 'You go up the pegs, which are colder than iron has any right to be, and haul yourself onto the ledge. The whole country you have crossed lies below you, white and folded, and at the far end of it, so small you nearly miss it, is Hollowmere, with smoke going straight up from all eleven of its roofs. It is a fine thing to see from a long way off. You sit and look at it for a while before you climb down.' }],
      },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [near('lookout')],
        do: [{ say: 'You go up the pegs, which are colder than iron has any right to be, and haul yourself onto the ledge. The whole country you have crossed lies below you, white and folded, and at the far end of it, so small you nearly miss it, one thread of smoke is going up. That is Hollowmere: one fire, and somebody keeping it in. You watch it for a while, to be sure, before you climb down.' }],
      },
      { on: ['take pegs', 'pull pegs'], do: [{ say: 'They were driven in to stay, and they have.' }] },
    ],
  },
  {
    id: 'door', name: 'The Door', biomes: ['open'], minDepth: 6,
    seen: 'A door stands by itself in the snow, shut, in a frame with no house round it.',
    prop: { t: 'doorway' },
    thing: {
      nouns: ['door', 'inscription'], try: ['knock on the door', 'open the door', 'read the notches'],
      look: 'Two oak posts and a lintel, set deep in the ground, with the door still hung between them on leather hinges, and shut. There is no house. There is no wall. On one post a row of notches climbs from knee height to shoulder height, with names cut beside them. You cannot tell which side was the inside.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. On the far side of the same post, low down, where a grown-up would have to kneel to see them, is a fourth row of notches, very close together. There is no name beside these, only a small scratched picture of a dog.' }] },
      { on: ['knock door', 'knock'], if: [near('door')], do: [{ say: 'You knock. It seems only polite. Nobody answers, as you knew nobody would, but you notice you were listening all the same.' }] },
      { on: ['open door', 'enter door', 'push door'], if: [{ flag: 'sight.door' }, near('door')], do: [{ say: 'In, and out again. It is the same snow on both sides.' }] },
      {
        on: ['open door', 'enter door', 'push door'], if: [near('door')],
        do: [{ set: 'sight.door' }, { say: 'You lift the latch, step through, and shut the door behind you. You are standing in the snow, exactly as cold as you were a moment ago, on the other side of nothing. You wipe your boots anyway.' }],
      },
      {
        on: ['read inscription', 'read door'], if: [near('door')],
        do: [{ say: "Three names, cut with a knife: EYVIND, SIGRUN, and LITTLE ODA. Their notches climb the post a hand at a time, a year at a time, LITTLE ODA's fastest of all. The last three were cut on the same day, deeper than the rest, the way people do who want to remember exactly how tall everybody was. Nobody took the door. It is a hard thing to carry, a door." }],
      },
      { on: ['read inscription', 'read door'], do: [{ say: 'You are not close enough to read it.' }] },
      { on: ['take door', 'attack door', 'close door'], do: [{ say: 'It is somebody\'s door, even now. You leave it shut, the way they did.' }] },
    ],
  },
  {
    id: 'pedlar', name: "The Pedlar's Cairn", biomes: ['open', 'pines', 'crags'], minDepth: 3,
    seen: 'A carrying-frame of bent ash leans against a cairn here, as if somebody had set it down to get their breath.',
    prop: { t: 'cairn', seed: 23 },
    thing: {
      nouns: ['frame'], try: ['read the frame', 'take the frame'],
      look: "A pedlar's frame: two uprights of ash, bent and pegged, with a shelf at the foot and straps of plaited hide worn dark by somebody's shoulders. It leans against a cairn of flat stones, waist high. There are words burned into the crossbar.",
      lookWhen: [{ if: [{ flag: 'sight.pedlar' }], look: 'A cairn of flat stones, waist high, with a pale stripe down one side where a frame leaned against it for a long time.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. The cairn goes clear as ice, and every flat stone in it has a word or two scratched on it, all in the same hand, the oldest at the bottom. BELLS. RED CLOTH. NEEDLES, THREE HUNDRED. THE GOOD KETTLE. A long way up, smaller: HER CHAIR. And on the top stone, last of all, the scratches hardly deeper than the frost: THE FRAME. I GO ON LIGHTER.' }] },
      {
        on: ['read frame', 'read inscription'], if: [near('pedlar')],
        do: [{ say: 'Burned into the crossbar, in careful capitals: ELDMARK TO THE COAST AND BACK, FORTY WINTERS. Under it, cut later and less carefully with a knife: TAKE IT, IF YOU HAVE FURTHER TO GO THAN I DO.' }],
      },
      { on: ['read frame', 'read inscription'], do: [{ say: '여기서는 읽을 수 없다.' }] },
      { on: ['take frame', 'use frame', 'equip frame', 'pull frame'], if: [{ flag: 'sight.pedlar' }], do: [{ say: 'It is on your back already, where it was asked to go.' }] },
      {
        on: ['take frame', 'use frame', 'equip frame', 'pull frame'], if: [near('pedlar')],
        do: [{ set: 'sight.pedlar' }, { give: 'frame' }, { sound: 'take' }, { say: 'You lift it. It is lighter than it looks, the way good work is. You shrug the straps on, and the frame settles across your back as if it remembered the shape of one, and your pack rides up onto its shelf with room to spare. Somebody walked forty winters under this. You have some way to go yet.' }],
      },
    ],
  },
];

export const frontier: FrontierDef = {
  seed: 4127,
  // The valley: nine places, with a screen of road between each and the next.
  grid: {
    ridge: [-2, -2], barrow: [0, -2], tarn: [2, -2],
    pinewood: [-2, 0], village: [0, 0], farm: [2, 0],
    camp: [-2, 2], ford: [0, 2],
    // A morning beyond the valley's mouth, on the south road.
    tower: [0, 4],
    // Landmarks, far out. The Giant's Table is beyond the first wall.
    bellmere: [5, -1],
    hangtree: [0, -5],
    dolmen: [1, 8],
    // The gate in the north wall, and the road beyond it. Nothing else lies north of the wall.
    northgate: [0, -10], oldroad: [0, -11], windend: [0, -12], hanging: [0, -13], hollow: [0, -14],
  },
  // The barrow's mound closes off its north side; every other edge opens onto the valley's roads
  // or the country beyond.
  gates: {
    ridge: 'nsew', barrow: 'sew', tarn: 'nsew',
    pinewood: 'nsew', village: 'nsew', farm: 'nsew',
    camp: 'nsew', ford: 'nsew', tower: 'nsew',
    bellmere: 'nsew', hangtree: 'nsew', dolmen: 'nsew',
    // The gate's north side is its own road; the places beyond it open onto nothing but each other.
    northgate: 'sew', oldroad: '', windend: '', hanging: '', hollow: '',
  },
  valley: {
    reach: 2,
    odds: { pines: 4, open: 4, mere: 3 },
    music: 'valley',
    // The four roads into Hollowmere are too near its doors for wolves.
    quiet: 1,
    called: {
      village: 'Hollowmere', barrow: 'the barrow', tarn: 'the tarn', ridge: 'the ridge', pinewood: 'the pinewood',
      farm: "Gorm's farm", camp: 'the bandit camp', ford: 'the ford',
    },
  },
  music: 'wild',
  calm: 'haven',
  under: 'barrow',
  odds: { pines: 26, open: 12, mere: 10, ruin: 10, camp: 9, crags: 11, deadwood: 9, shrine: 6, steading: 7 },
  life: {
    pines: [['wolf', 'wolf', 'wolf'], ['wolf', 'wolf', 'bear'], ['bear', 'wolf', 'wolf', 'bear']],
    open: [['wolf', 'wolf'], ['wolf', 'bear'], ['bear', 'rimewalker']],
    mere: [['wolf', 'wolf'], ['wolf', 'wolf', 'bear']],
    ruin: [['bandit', 'archer'], ['wight', 'wight', 'bandit'], ['wight', 'rimewalker', 'wight']],
    camp: [['bandit', 'archer', 'bandit'], ['bandit', 'archer', 'chief'], ['chief', 'archer', 'bandit', 'archer']],
    crags: [['wolf', 'bear'], ['bear', 'wolf'], ['bear', 'rimewalker', 'bear']],
    deadwood: [['wight'], ['wight', 'wight'], ['rimewalker', 'wight', 'wight']],
    shrine: [[]],
    // A wolf crossing a valley road by day, now and then. Nothing walks there after dark.
    valley: [['wolf']],
    // What walks in any country after dark.
    night: [['wight'], ['wight'], ['rimewalker']],
    crypt: [['wight'], ['wight', 'wight'], ['wight', 'rimewalker', 'wight']],
    steading: [['wolf', 'wolf'], ['bandit', 'archer'], ['bandit', 'chief', 'archer']],
  },
  folk: ['brekka', 'ivar', 'runa'],
  // Runa lives out past the old watchtower: the next screen down the south road is her steading.
  folkPast: { runa: 'tower' },
  kinds: { '0,5': 'steading' },
  // The second wall is the last on its north side: it runs on without end, and has one gate.
  northWall: 10,
  haunts: [{ kind: 'greyback', near: 'brekka', biome: 'crags', if: [{ quest: 'greyback', is: 1 }] }],
  herb: 'herb',
  game: { pines: 'deer', open: 'deer', mere: 'deer' },
  rareGame: { kind: 'whitehart', odds: 0.12, minDepth: 3 },
  trinkets: ['token', 'torc', 'hearthstone', 'brooch', 'harefoot'],
  sights,
  // Near home, a good deal of the country has nothing in it but snow and quiet; far out, very
  // little does. A reaver camp is never empty.
  quiet: {
    odds: { pines: 0.55, open: 0.6, mere: 0.55, crags: 0.45, ruin: 0.25, camp: 0, deadwood: 0.15, steading: 0.3 },
    far: 0.35,
    farDepth: 10,
    music: 'valley',
  },
  // Walls of rock round the valley's country, one beyond another, each crossed only at a pass that
  // somebody holds. The first stands a long day's walking out: past every place with a name.
  marches: {
    rings: [6, 10, 15, 21, 28, 36, 45],
    passes: 2,
    holds: [
      {
        id: 'reavers',
        life: [['bandit', 'archer', 'bandit'], ['chief', 'archer', 'bandit'], ['chief', 'archer', 'bandit', 'archer'], ['chief', 'chief', 'archer', 'archer']],
        first: ['Toll', 'Reaver', 'Ransom', "Robbers'", "Thieves'"],
        look: 'This is the only way %s through the wall for miles, and reavers hold it: a barricade of piled stones, a fire behind it, and a toll that is whatever you are carrying.',
        held: 'The reavers are between you and the gap, and they are not moving aside. Nobody goes through while one of them is standing.',
        open: 'The last of the reavers goes down. The gap is open, and it will stay open: word gets about, and nobody else will want to sit in it.',
      },
      {
        id: 'pack',
        life: [['wolf', 'wolf', 'wolf'], ['bear', 'wolf', 'wolf'], ['bear', 'bear', 'wolf', 'wolf'], ['bear', 'bear', 'bear', 'wolf']],
        first: ['Wolf', 'Grey', 'Fang', 'Howling', 'Den'],
        look: 'The only way %s through the wall is a narrow gap, and something has made its den in the throat of it. The snow is trodden flat and spotted with old blood, and there are bones.',
        held: 'They will not let you by. Every time you make for the gap, something with teeth is there first.',
        open: 'Nothing is left alive in the gap. The way through the wall is open now, and the bones in it are all that says what lived here.',
      },
    ],
  },
  text: {
    deadRestSeen: 'One of the dead has sat down here, at the side of the way, facing north, and does not get up as you pass.',
    deadRest: 'One of the dead, sitting where it stopped, with its back against a drift and its face to the north: the way it was going. It does not get up. It has the look of somebody who walked a long way to hear a thing, and has heard it.',
    deadRestNouns: ['wight'],
    pines: {
      first: ['The Hollow', 'The Crowding', 'The Silent', 'The Leaning', 'The Black', 'The Winter', 'The Listening', 'The Wolf', 'The Hare', 'The Owl', 'The Deep', 'The Fox', 'The Raven', 'The Snow-Bent', 'The Long'],
      second: ['Pines', 'Wood', 'Stand', 'Thicket', 'Boughs', 'Firs', 'Holt', 'Grove', 'Shaw', 'Brake'],
      look: [
        'Pines close in on every side, their lower boughs bowed to the snow.',
        'A stand of old firs. The snow under them is pocked where their loads have fallen.',
        'Trees, and more trees, and the sense of something moving just beyond the nearest of them.',
      ],
    },
    open: {
      first: ['The White', 'The Long', 'The Bare', 'The Wind-Cut', 'The Empty', 'The Far', 'The Crow', 'The Blind', 'The Hungry', 'The Wide'],
      second: ['Reach', 'Fell', 'Field', 'Shoulder', 'Waste', 'Mile', 'Lea', 'Flat', 'Moor'],
      look: [
        'Open snow, scoured into ridges by the wind. There is nowhere here to hide, for you or for anything else.',
        'A wide white fell under a wide white sky. Your tracks are the only marks on it. So far.',
        'Bare ground, drifted smooth. The mountains watch from a distance and offer no opinion.',
      ],
    },
    mere: {
      first: ['Greywater', 'Stillwater', 'Reedglass', 'Crow', 'Hollow', 'Blind', 'Heron', 'Otter', 'Black', 'Lost', 'Moon'],
      second: ['Mere', 'Pool', 'Tarn', 'Water', 'Lough', 'Sump'],
      look: [
        'A pond lies frozen in a dip of the ground, reeds standing stiff along its edge.',
        'Ice, grey as a blind eye, with dead reeds round it. Nothing has drunk here since autumn.',
        'A small frozen water, drifted over at the edges. It creaks to itself now and then.',
      ],
    },
    ruin: {
      first: ['The Broken', 'The Old', 'The Leaning', 'The Forgotten', 'The Crow-Kept', 'The Last'],
      second: ['Watch', 'Stones', 'Ward', 'Marker', 'Teeth', 'Vigil'],
      look: [
        'Old stonework stands here, half buried, set up by people nobody remembers for reasons nobody knows.',
        'Something was built here once. What is left of it stands in the snow and waits to fall down.',
        'Worked stone among the drifts. Somebody still comes here: the snow is trodden.',
      ],
    },
    camp: {
      first: ["Cutpurse", "Reaver's", 'Ash', "Wolf's-Head", 'Smoke', "Thief's"],
      second: ['Hollow', 'Camp', 'Rest', 'Fire', 'Dell'],
      look: [
        'A camp in a fold of the ground: hide tents, a fire, and the smell of people who have not washed since the leaves fell.',
        'Tents, a fire pit, gnawed bones. Whoever lives here does not grow what they eat.',
        'A rough camp. Its owners heard you coming a long way off.',
      ],
    },
    crags: {
      first: ['The Grey', 'The Split', 'The Raven', 'The Frost-Bit', 'The Hungry', 'The Bare', 'The Bear', 'The Eagle', 'The Broken', 'The High'],
      second: ['Crags', 'Teeth', 'Tor', 'Scar', 'Knuckles', 'Shelf', 'Stair', 'Jaw'],
      look: [
        'Bare rock breaks out of the snow here in grey teeth, taller than a house. The wind has scoured the ground between them.',
        'Crags. Their ledges hold a little snow and a great many shadows, any one of which might have something in it.',
        'The ground rises into split and tumbled rock. Something has made a den here: you can smell it before you see it.',
      ],
    },
    deadwood: {
      first: ['The Dead', 'The Drowned', 'The Ashen', 'The Bone', 'The Hanging', 'The Pale', 'The Grey', 'The Burnt', 'The Whispering', 'The Widow'],
      second: ['Wood', 'Stand', 'Copse', 'Trees', 'Thicket', 'Grove', 'Holt'],
      look: [
        'Every tree here is dead: bare trunks, bare limbs, bark gone grey. No bird has perched in them for a long time.',
        'A wood that died standing. The snow lies on the branches in thin lines, like chalk on a slate.',
        'Dead trees, close together. It is too quiet, and the quiet has the feeling of being kept.',
      ],
    },
    shrine: {
      first: ['The Quiet', 'The Old', 'The Kept', 'The Listening', 'The Still'],
      second: ['Ring', 'Stones', 'Circle', 'Hallow', 'Moot'],
      look: [
        'A ring of low stones stands here with a cairn in its midst. The snow inside the ring is unmarked. Nothing has crossed it but you.',
        'Standing stones in a rough circle. The wind drops as you come near, the way talk stops in a room.',
        'Somebody raised these stones and heaped that cairn, and somebody still comes: there is a sprig of pine laid on top, fresh.',
      ],
    },
    steading: {
      first: ["Trapper's", 'The Lone', 'The Last', 'Smoke-Hole', 'The Lee'],
      second: ['Steading', 'Croft', 'Hut', 'Hold', 'Garth'],
      look: [
        'A single hut of logs stands here, a long way from any other roof, with a woodpile against its wall.',
        'One hut, one woodpile, one barrel: all that somebody thought worth building, this far out.',
        'A steading, small and stubborn, where the path gives out.',
      ],
    },
    pass: {
      first: ['Wind', 'High'],
      second: ['Gap', 'Hause', 'Nick', 'Gate', 'Pass', 'Notch', 'Throat'],
      look: [
        'The fell closes in on both hands here, and the snow underfoot has been packed hard by traffic.',
        'A cold wind comes through here without ever stopping, the way water goes through a sluice.',
        'Rock on both hands, and the sky a narrow strip between. Your footsteps come back to you off the stone.',
      ],
    },
    scarp: 'To the %s the land goes up in a wall of grey rock, sheer and glazed with ice, higher than the tallest pine.',
    scarpGap: 'A gap goes through it to the %s.',
    scarpLook: 'Grey rock, sheer, glazed with ice where meltwater has run down it and frozen. It runs on out of sight both ways. Somewhere along it there will be a way through. There always is, and there is always somebody sitting in it.',
    scarpClimb: 'You get a hand on the rock, and then a foot, and then the ice decides the matter for you. You sit in the snow at the bottom of it and think kindly of passes.',
    followed: 'It comes after you. Out here, a thing that has your scent does not give it up because you have gone out of its sight.',
    shaken: 'Whatever was after you stops short of this place, and after a while it turns away.',
    valley: {
      first: ['The Low', 'The Long', "Drovers'", "Shepherd's", 'The Sledge', 'Alder', 'Rowan', 'Birch', 'The Peat', "Hayward's", 'The Common'],
      second: ['Lane', 'Way', 'Track', 'Bottom', 'Brow', 'Holm', 'Path', 'Road'],
      look: [
        'A stretch of the valley between one place and the next. The snow is trodden into a path by boots and sledge-runners, all of them on their way somewhere else.',
        'Nobody lives here, but everybody passes through. The path is wide and packed hard, the way paths are that are walked every day.',
        'Quiet country between places with names. Wolf tracks cross the path now and then. They do not follow it.',
        'The valley floor, drifted deep on either side of a beaten path. The wind has been at the drifts, and somebody has been at the path with a shovel since.',
      ],
      snow: [
        'Trodden flat on the path and knee-deep either side of it.',
        'Snow, marked with boots, runners and the odd hoof, all going one way or the other along the path.',
      ],
      sky: [
        'The mountains round the valley, the same ones Hollowmere has looked at for as long as there has been a Hollowmere.',
        'A white sky, low over the valley, with more snow in it.',
      ],
      trees: [
        'Pines, heavy with snow. The lower boughs have been lopped for firewood as far up as a man can reach.',
        'Dark boughs, white loads, and now and then the thump of one letting go.',
      ],
    },
    road: 'The path runs %s.',
    crossroads: 'Two paths cross here. %s.',
    crypt: {
      first: ['The Low', 'The Sealed', 'The Cold', 'The Forgotten', 'The Drowned', 'The Nameless'],
      second: ['Vault', 'Crypt', 'Undercroft', 'Cellar', 'Hollow'],
      look: [
        'A vault under the old tower, and older than the tower. Niches line the wall. Something is heaped in the far corner, and a rune cut in the wall gives a little green light.',
        'The stair ends in a low chamber of coffins and dust. Whoever built the tower built it on top of this, and knew what they were sitting on.',
        'A burial vault. The air has not moved in a long time, and resents being asked to. Grave-goods glint at the far end, under a rune that glows like rot.',
      ],
    },
    snow: [
      'Snow, to the knee and deeper in the drifts. It squeaks underfoot.',
      'Clean snow, marked only by small tracks going about their own affairs.',
      'The crust holds for one step in three. The other two, you go in to the shin.',
    ],
    sky: [
      'Mountains you have no names for, under a sky that has seen it all before.',
      'The peaks out here are sharper, as if nobody had got round to wearing them down.',
      'A long way off, a line of white summits. They do not get any closer.',
    ],
    trees: [
      'Pines, heavy with snow, minding their own business.',
      'The trees here have never seen an axe. They look as if they know it.',
      'Dark boughs, white loads, and now and then the thump of one letting go.',
    ],
    deep: 'The cold has teeth out here, and whatever lives in it has grown to match.',
    waysAll: 'You could go on from here in any direction.',
    waysSome: 'You could go on from here most ways, though not all.',
    pond: 'A pond, frozen to the bottom. Reeds stand up out of the ice like a comb.',
    tower: 'A stump of a tower. Whoever it guarded against has long since stopped coming, or arrived.',
    stones: 'Old stones, set upright by someone with a reason. The runes on them have weathered to a rumour.',
    campQuiet: 'A camp with nobody in it. The fire is burning down, the tents hang open, and whatever these people took from other people is lying about for the snow to cover.',
    tents: 'A rough camp: hide tents, a fire pit, and the leavings of people who live by taking.',
    crag: 'Grey rock, split by frost into blocks and blades. High up, a ledge is littered with small bones.',
    deadtrees: 'Dead, every one. The bark comes away in your hand like wet paper, and there is frost under it.',
    shrineLook: 'A ring of weathered stones around a cairn. Small things have been left on it over the years: a bead, a bent coin, a twist of wool. The place has the stillness of a held breath.',
    shrineFar: 'You say a few words. From here the stones do not seem to hear them.',
    hutLived: 'A trapper\'s hut, low and tight, with smoke at the roof-hole and pelts stretched on frames by the door.',
    hutEmpty: 'A hut with its door hanging and snow drifted over the sill. Nobody has lit a fire here this winter. Somebody has been in since, though.',
    hutDoorLived: 'You put your head in. One room, one bed, a great many skins, and a smell of smoke and tallow. Its owner would rather talk out here.',
    hutDoorEmpty: 'Inside there is a cold hearth, a broken stool and a drift of snow. Whoever lived here took what they could carry.',
    waymark: 'A waymark: flat stones piled chest-high, with a rag on a stick. An arrow scratched on the top stone points %s. Under it someone has cut a small kettle, or possibly a helmet.',
    chest: 'A small chest, half drifted over. Somebody meant to come back for it.',
    chestOpen: 'You break the frozen hasp. Inside, %s silver in a rotted purse.',
    chestEmpty: '비었다. 네가 그렇게 했다.',
    herb: 'Frostcaps: small pale mushrooms pushing up through the snow where the ground is sheltered. Halla puts them in her stew, when she can get them.',
    herbTake: 'You pick the frostcaps and fold them into a rag. They smell of cold earth.',
    bones: 'Somebody sat down here to rest and never got up. The snow has kept them tidy. A pack lies under one arm.',
    bonesSearch: 'You ease the pack free, with an apology. Inside: %s silver, a flint, and a letter the damp has made unreadable. You leave the flint and the letter.',
    bonesEmpty: 'You have taken what there was. Let them rest.',
    wall: 'A length of wall, mortared once, now held up mostly by habit. The courses are dressed and close. Whoever laid them did not mean it to be a ruin.',
    pillars: 'Drums of grey stone, notched round and round with a tally that goes on longer than seems reasonable.',
    stairBelow: 'The stair is behind you, under the arch. That is the only way out, and it goes up.',
    waymarkStone: 'You find a flat stone and set it on top. That is the custom: the next traveller will know that someone came this way, and lived.',
    shrineTake: 'You leave the offerings where they lie. Some debts are not worth taking on.',
    firstStep: 'You are off the edge of every map but your own. MAP shows it.',
    stair: 'In the doorway a stair goes down under it, into the dark.',
    stairWalk: 'The stair goes down into the dark under the tower. Walk in at the doorway, if you are going, and take a light.',
    cryptTreasure: 'Grave-goods, heaped where they were left: arm-rings, a cup, coin gone green with age.',
    cryptTake: 'You take what will carry: %s silver in old coin and hack-silver. It is very cold to the touch.',
    cryptTrinket: 'Among the coin your fingers close on something that is not coin: %s. It has lain here a long time, waiting to be of use to somebody.',
    cryptWake: 'The last coin is hardly in your pack when stone grinds on stone behind you. The lids are moving. They were not asleep. They were waiting to see what you would do.',
    cryptTrap: 'A flagstone sinks a finger\'s width under your boot, and something old and sharp comes out of the wall at knee height. It has been waiting a very long time to do that, and it has lost none of its enthusiasm.',
    cryptTaken: 'You have had the best of it. The rest is too heavy, or too closely watched.',
    cryptRune: 'A rune cut into the wall, giving a faint green light. It is not one of the great words. It is a name, perhaps, or a warning.',
    cryptRead: 'You trace the rune, and it gives up a little of what it knows: not a word of power, only a glimpse of how such words are made. You understand the old tongue a shade better than you did.',
    cryptReadAgain: 'It has nothing more to tell you.',
    cryptCoffins: 'Stone coffins and burial niches. You have learned not to lift lids.',
    cryptWayOut: 'The stair back up to the snow.',
  },
};

