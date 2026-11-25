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
    id: 'fishhole', name: '낚시 구멍', biomes: ['mere'], minDepth: 1,
    seen: '누군가 호수 가장자리 얼음에 구멍을 뚫고 낚싯대를 세워 두었다.',
    prop: { t: 'icehole' },
    thing: {
      nouns: ['hole'], try: ['pull rod'],
      look: '양동이 너비의 구멍, 팔 길이만큼 두꺼운 얼음을 뚫은, 곁에 개암나무 낚싯대가 세워 꽂혀 있고 줄은 아직 내려가 있다. 살얼음이 얼었다. 낚싯대가 가끔, 저절로, 조금 휜다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 얼음이 맑아진다. 강꼬치고기가 있다, 한 길 아래, 장화와 정확히 같은 길이로, 너를 올려다본다. 그 뒤 바닥 흙에 짝의 다른 장화가 놓여 있다. 더 작은 강꼬치고기가 그 안에서 내다보고 있다.' }] },
      { on: ['pull hole', 'take hole', 'use hole', 'fish', 'fish hole', 'pull'], if: [{ flag: 'sight.fishhole' }], do: [{ say: '줄은 다시 내려갔고 구멍은 살얼음이 얼고 있다. 남은 겨울은 강꼬치고기가 갖는다.' }] },
      {
        on: ['pull hole', 'take hole', 'use hole', 'fish', 'fish hole', 'pull'], if: [near('fishhole')],
        do: [{ set: 'sight.fishhole' }, { gold: 4 }, { sound: 'take' }, { say: '살얼음을 깨고 당긴다. 천천히 올라온다, 두 손을 번갈아, 젖은 이불처럼 버티며, 장화다. 좋은 장화. 안에 강꼬치고기가 있는데, 분명 거기 살고 있었고, 집주인의 격분으로 너를 본다. 도로 기울여 놓아 주고, 가면서 미끼까지 가져간다. 장화 발끝에, 헝겊에 싸여, 은화 네 닢. 가라고 사례받은 기분이다.' }],
      },
      { on: ['swim', 'swim hole', 'enter hole', 'jump hole'], do: [{ say: '양동이 너비다. 너는 아니고.' }] },
    ],
  },
  {
    id: 'stray', name: '길 잃은 양', biomes: ['open', 'crags', 'pines'], minDepth: 2,
    seen: '눈 위에 양 발자국이 있다, 우리에서 한참 먼 곳에.',
    when: [{ if: [{ not: { flag: 'sight.stray' } }], prop: { t: 'sheep', seed: 3 } }],
    thing: {
      nouns: ['sheep'], try: ['pet sheep'],
      look: '암양, 마르고, 무릎까지 서리를 뒤집어쓰고, 상식에 맞지 않게, 살아 있다. 양털에 낙인이 있다, 고리 안의 G. 너를 늦었다는 듯이 쳐다본다.',
      lookWhen: [{ if: [{ flag: 'sight.stray' }], look: '양이 양이 서 있어야 할 시간보다 오래 서 있던, 짓밟힌 자리.' }],
    },
    rules: [
      { on: 'orun', if: [{ not: { flag: 'sight.stray' } }], do: [{ say: 'ORUN. 그녀의 발자국이 뒤로 눈 위에 풀려 간다. 며칠 치, 느리고 고집스러운 나선으로, 매 바퀴 끝마다 그녀는 멈춰 같은 쪽을 향해 서 있었다. 골짜기 쪽. 집 쪽.' }] },
      { on: ['attack sheep', 'shoot sheep'], if: [{ not: { flag: 'sight.stray' } }], do: [{ say: '여기까지 일주일의 늑대들을 뚫고 걸어왔다. 그녀를 멈추는 것이 너일 수는 없다.' }] },
      {
        on: ['pet sheep', 'take sheep', 'use sheep', 'talk sheep', 'push sheep', 'pull sheep'], if: [{ not: { flag: 'sight.stray' } }, near('stray')],
        do: [{ set: 'sight.stray' }, { give: 'ewe' }, { sound: 'take' }, { say: '손을 내민다. 그녀는 그것을, 너를, 그리고 대안인 이것의 계속을 저울질한다. 그러다 다가와 온몸으로 네 다리에 기댄다. 이제 양이 생긴 모양이다.' }],
      },
    ],
  },
  {
    id: 'sleeper', name: '잠자는 이의 웅덩이', biomes: ['crags', 'pines'], minDepth: 3,
    seen: '눈 아래 긴 불룩이 있다, 바람이 다른 모든 것을 쌓은 식으로는 쌓지 않은.',
    when: [{ if: [{ not: { flag: 'sight.sleeper' } }], prop: { t: 'hump' } }],
    thing: {
      nouns: ['hump'], try: ['listen to the hump'], reach: 40,
      look: '바위 바람그늘에 길고 낮은 눈 불룩. 꼭대기에 주먹만 한 구멍이 있고, 가장자리에 서리가 보송보송하게 끼었다. 보고 있으면 김이 조금 나온다. 그리고 한참 뒤에, 조금 더.',
      lookWhen: [{ if: [{ flag: 'sight.sleeper' }], look: '짓밟힌 웅덩이, 네가 오기 전까지 아주 큰 무언가가 자던.' }],
    },
    rules: [
      { on: 'orun', if: [{ not: { flag: 'sight.sleeper' } }], do: [{ say: 'ORUN. 눈이 물처럼 맑아진다. 곰이다, 짐작하기 시작했던 대로. 하얗고, 거대하고, 코를 앞발 아래 묻고. 짐작하지 못한 것은 그녀에게 바싹 붙은 더 작은 불룩 둘, 하나하나 개만 하고, 하나하나 코를 앞발 아래 묻은. 단어를 거둔다, 아주 조용히.' }] },
      { on: ['listen', 'listen hump', 'smell hump'], if: [{ not: { flag: 'sight.sleeper' } }], do: [{ say: '구멍에 귀를 가까이 댄다. 안에서 아주 큰 무언가가 숨 쉰다, 느리게, 1분에 네 번쯤. 만족스러워 들린다. 계속 그랬으면 한다.' }] },
      { on: ['pet hump'], if: [{ not: { flag: 'sight.sleeper' } }, near('sleeper')], do: [{ say: '눈을 살살 쓰다듬는다. 아무 일도 없다. 자는 곰을 쓰다듬고 살았고, 아무도 안 믿을 거다.' }] },
      {
        on: ['attack hump', 'push hump', 'dig hump', 'open hump', 'use hump', 'shout', 'shout hump', 'sing', 'jump hump', 'climb hump', 'enter hump'], if: [{ not: { flag: 'sight.sleeper' } }, near('sleeper')],
        do: [{ set: 'sight.sleeper' }, { spawn: 'bear', x: 22, y: -8 }, { sound: 'hurt' }, { say: '이건 정확히 한 번만 할 수 있는 실수로 밝혀진다. 불룩이 일어선다. 한참 동안 계속 일어선다. 하얗고, 건초 수레만 하고, 조금 전까지 아무와도 다툴 일이 없었다.' }],
      },
      { on: ['listen', 'listen hump', 'pet hump', 'attack hump', 'dig hump'], do: [{ say: '아무도 안 계시고, 이유는 네가 안다.' }] },
    ],
  },
  {
    id: 'shuthouse', name: '닫힌 집', biomes: ['open', 'pines'], minDepth: 2,
    seen: '집이 홀로 서 있다, 처마까지 눈이 쌓이고, 지붕에 연기가 없는.',
    prop: { t: 'hall', w: 60, v: 'cold' },
    thing: {
      nouns: ['hall', 'door'], reach: 60, try: ['open door', 'sleep'],
      look: '떡잎 지붕의 통나무집, 처마까지 눈이 쌓였다. 문이 문틀에 얼어붙었다. 얼음 막이 병 밀봉처럼 문을 한 바퀴 돈다. 연기도 없고, 네 발자국 말곤 자국도 없다.',
      lookWhen: [{ if: [{ flag: 'sight.shuthouse' }], look: '떡잎 지붕의 통나무집, 처마까지 눈이 쌓이고, 문이 손바닥만큼 열려 있다. 안에는. 방 하나, 식은 아궁이, 의자, 그리고 의자의 사내. 장화가 문 곁에 나란히 놓여 있다.' }],
    },
    rules: [
      { on: 'orun', if: [{ flag: 'sight.shuthouse' }], do: [{ say: 'ORUN. 아궁이 돌 아래 항아리가 있고, 항아리 안에, 넣은 날처럼 바싹 마른, 두 줌의 씨앗 곡식. 그는 봄을 남겨 두었다. 그리고 안쪽 문지방에, 칼로 새긴, 작게. 여기서의 그의 겨울들, 다섯씩. 서른하나에서 멈춘다.' }] },
      { on: 'orun', do: [{ say: 'ORUN. 통나무들이 뿔처럼 얇아진다. 안에 방 하나, 식은 아궁이 앞에 당겨 놓은 의자 하나, 그리고 돌아보지 않는 누군가가 앉아 있다.' }] },
      {
        on: 'veth', if: [near('shuthouse'), { not: { flag: 'sight.shuthouse' } }],
        do: [{ set: 'sight.shuthouse' }, { sound: 'door' }, { say: 'VETH. 문 주변 얼음이 참았던 숨처럼 한꺼번에 놓이고, 문이 안으로 열린다.\n\n안에는 방 하나, 식은 아궁이, 그리고 그 앞 의자의 사내가 있다, 장화를 벗어 문 곁에 나란히 놓은, 밤을 지내러 들어온 사내가 놓는 식으로. 죽은 지 몇 겨울이다. 여기서 만난 죽은 이들 중 놓인 자리에 그대로 있는 유일한 사람이다.' }],
      },
      { on: 'veth', if: [{ not: { flag: 'sight.shuthouse' } }], do: [{ say: '단어가 눈 위로 퍼져 나가지만 집이 듣지 못한다. 문에 더 가까이 가야 한다.' }] },
      {
        on: ['sleep', 'sleep hall', 'enter hall', 'enter door', 'enter', 'open door'], if: [{ flag: 'sight.shuthouse' }, { quiet: true }, near('shuthouse')],
        do: [{ run: 'rest' }, { say: '그의 마루에서 잔다, 바람을 피해, 문을 당겨 두고. 그는 손님을 꺼리지 않는 것 같다. 아침에 너는 다시 온전하다. 장화를 바로 놓는다, 이미 바르던 것을, 그리고 닫히는 만큼 문을 닫고 나온다.' }],
      },
      { on: ['sleep', 'sleep hall', 'enter hall', 'enter door', 'enter'], if: [{ flag: 'sight.shuthouse' }], do: [{ say: '뭔가가 뒤쫓는데는 안 되고, 여기서도 안 된다.' }] },
      { on: ['open door', 'push door', 'pull door', 'knock door', 'enter hall', 'enter door', 'attack door', 'sleep', 'sleep hall'], do: [{ say: '문이 문틀에 얼어붙었다, 한 바퀴 전부. 어깨를 대고, 그다음 발을 댄다. 닫힌 시간이 네가 민 시간보다 훨씬 길다.' }, { note: '어깨보다 강한 무언가로 열어야 한다.' }] },
      { on: ['take hall', 'light hearth', 'light'], if: [{ flag: 'sight.shuthouse' }], do: [{ say: '그의 아궁이에 장작이 쌓여 있고, 너에겐 부싯돌이 있다. 놔둔다. 그의 불이고, 그가 꺼지게 둔 것이다.' }] },
    ],
  },
  {
    id: 'skates', name: '스케이트 말뚝', biomes: ['mere'], minDepth: 2,
    seen: '누군가 호숫가에 말뚝을 박고 스케이트 한 켤레를 걸었다.',
    prop: { t: 'post', v: 'skates' },
    thing: {
      nouns: ['skates'], try: ['skate'],
      look: '말 정강이뼈로 만든 스케이트 한 켤레, 밑을 평평하게 갈고 양끝에 가죽끈 구멍을 뚫은, 얼음 가장자리 말뚝의 못에 걸려 있다. 말뚝에 새겨져 있다, 아이도 읽을 글자로. 빌려 가라. 도로 걸어라.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 눈이 탁자에서 명주를 걷듯 호수에서 걷히고, 그 아래 얼음이 온통 스케이트 자국으로 쓰여 있다. 길고 확신 있는 곡선, 고리들, 8자들, 어디로도 크게 가지 않는 작고 흔들리는 선들, 그리고 군데군데 누군가 주저앉아 문지른 자리. 겹겹이 놓여 있다, 겨울 아래 겨울, 보이는 만큼 깊이. 그 사람들 모두가 스케이트를 도로 걸었다.' }] },
      { on: ['skate', 'skate skates', 'skate tarn', 'use skates', 'equip skates', 'take skates'], if: [{ flag: 'sight.skates' }, near('skates')], do: [{ say: '한 바퀴 더 돈다, 더 폼 나게, 덜 주저앉으며. 재미가 줄지 않는다. 도로 건다.' }] },
      {
        on: ['skate', 'skate skates', 'skate tarn', 'use skates', 'equip skates', 'take skates'], if: [near('skates')],
        do: [{ set: 'sight.skates' }, { heal: 10 }, { say: '장화 위에 끈으로 매고 민다. 길고 안 좋은 순간 동안 너와 호수가 위쪽이 어딘지 의견이 다르다. 그러다 감을 잡고, 돌고, 다시 돌고, 더 빠르게, 팔을 벌리고 바람을 이에 물고, 잠시 이걸 꽤 잘하게 된다, 아쉽게도, 여기 볼 사람이 아무도 없어서. 그러다 엉덩방아를 찧는다, 결국 모두가 그렇듯. 며칠 만에 가장 따뜻하다. 말뚝에 도로 건다.' }],
      },
      { on: ['attack skates', 'drop skates'], do: [{ say: '빌려 가라, 말뚝이 말한다. 도로 걸어라. 그런 일에 대해선 아무 말도 없고, 있었을 거라는 생각이 든다.' }] },
    ],
  },
  {
    id: 'lamp', name: '등불 나무', biomes: ['deadwood'], minDepth: 2,
    seen: '죽은 나무들 중 하나 높이, 그 나무의 가지에, 랜턴이 매달려 있다.',
    prop: { t: 'deadtree', h: 58, seed: 7, v: 'lantern' },
    when: [{ if: [{ flag: 'sight.lamp' }], prop: { t: 'deadtree', h: 58, seed: 7, v: 'lamplit' } }],
    thing: {
      nouns: ['lamp', 'light'], try: ['light the lantern'],
      look: '쇠고리의 뿔 랜턴, 땅에서 닿지 않을 높이의 가지에 매달렸다. 꺼진 지 오래고, 안의 초꽁지는 오래된 이 빛깔이다. 저기 걸린 건 멀리서 보이게 하려고, 어둠 속에 집에 오는 누군가에게.',
      lookWhen: [{ if: [{ flag: 'sight.lamp' }], look: '랜턴이 타고 있다, 죽은 나무 높이, 눈더미 위로 보이는 곳에. 대단한 불빛은 아니다. 없는 것보다는 한참 낫다.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 회색 껍질이 종이처럼 얇아지고, 그 아래, 줄기를 타고 올라가며, 오래된 못구멍들이 줄지어 있다, 하나하나 앞의 것보다 손 하나 위에. 눈은 매 겨울 깊어졌고, 매 겨울 누군가 올라가 랜턴을 더 높이 옮겼다, 눈더미 위로 계속 보이게. 가장 낮은 구멍이 네 무릎 높이다. 가장 높은 게 지금 걸린 곳. 그 뒤로 아무도 옮기지 않았다.' }] },
      { on: ['light lamp', 'light light', 'light tree', 'use lamp', 'use light', 'light', 'cast flame'], if: [{ flag: 'sight.lamp' }], do: [{ say: '타고 있다. 그냥 둔다. 누구를 위한 것이든, 다시 멀리서 보인다.' }] },
      {
        on: ['light lamp', 'light light', 'light tree', 'use lamp', 'use light', 'light', 'cast flame'], if: [near('lamp')],
        do: [{ set: 'sight.lamp' }, { sound: 'take' }, { say: '마지못해 허락하는 줄기를 오르고, 한 손으로 랜턴을 열고 다른 손으로 불꽃을 넣는다. 초꽁지가 붙는다. 여기선 불길이 얌전하다. 내려와 물러서서 본다. 대단한 불빛은 아니지만, 애초에 너를 위한 게 아니었다.' }],
      },
      { on: ['climb tree', 'climb lamp', 'climb light', 'climb'], if: [near('lamp')], do: [{ say: '랜턴까지 올라 그것처럼 눈더미 너머를 내다본다. 오는 사람이 없다. 다시 내려온다.' }] },
      { on: ['take lamp', 'take light', 'pull lamp'], do: [{ say: '보이는 곳에 둔다. 그게 이것의 전부였다.' }] },
    ],
  },
  {
    id: 'wishes', name: '소원 돌무더기', biomes: ['shrine'], minDepth: 3,
    seen: '돌무리 밖에 누군가 두 번째, 더 작은 돌탑을 쌓았다, 글씨 쓰인 납작한 돌들로.',
    prop: { t: 'cairn', seed: 41 },
    thing: {
      nouns: ['wishes'], try: ['make a wish'],
      look: '무릎 높이의 조약돌과 납작한 돌 무더기, 하나하나 몇 마디씩 긁혀 있다. 소원들이다. 맨 위 것들은 이렇다. 눈 좀 그만. 눈 좀 그만. 개 한 마리. 눈 좀 그만. 봄. 아무 봄이나. 안 가린다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 무더기가 얼어붙은 땅까지 물처럼 맑아지고, 안의 모든 돌을 읽을 수 있다. 위쪽에선 눈을 그치게 해 달란다. 더 아래에선 이른 봄을, 더 아래에선 따뜻한 겨울을. 맨 밑, 거의 매끈하게 닳은 돌들에, 삼백 겨울 동안 아무도 새기지 않은 글자로, 결혼식 맑은 날과 건초 좋은 날씨를 빌었다.' }] },
      { on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [{ flag: 'sight.wishes' }, near('wishes')], do: [{ say: '한 사람에 돌 하나가 관습인 모양이다. 네 건 썼다.' }] },
      {
        on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [{ flag: 'winter.broken' }, near('wishes')],
        do: [{ set: 'sight.wishes' }, { say: '납작한 돌을 찾아 습관적으로 눈 좀 그만을 긁기 시작하다가 멈춘다. 손등에 빗물이 있다. 돌을 뒤집어 대신 다른 면에 고맙다를 긁고, 그 면이 위로 가게 맨 위에 올린다.' }],
      },
      {
        on: ['wish', 'wish wishes', 'use wishes', 'give wishes'], if: [near('wishes')],
        do: [{ set: 'sight.wishes' }, { say: '납작한 돌을 찾아 칼끝으로 눈 좀 그만을 긁고 다른 것들과 함께 맨 위에 올린다. 모두가 빈 것이다. 목소리를 보태는 게 마땅해 보인다.' }],
      },
      { on: ['read wishes', 'read inscription'], if: [near('wishes')], do: [{ say: '눈 좀 그만. 눈 좀 그만. 개 한 마리. 눈 좀 그만. 봄. 아무 봄이나. 안 가린다. 더 아래 것들은 닳아서 알아보기 어렵다.' }] },
      { on: ['take wishes', 'attack wishes', 'push wishes'], do: [{ say: '그냥 둔다. 네 것이 아니고, 어떤 것들은 아직 기다리는 중일지 모른다.' }] },
    ],
  },
  {
    id: 'ferry', name: '나룻배 말뚝', biomes: ['mere'], minDepth: 3, side: 'e',
    seen: '검은 말뚝이 얼음 가장자리에 서 있다, 끈에 매달린 뿔피리와 함께.',
    prop: { t: 'post', v: 'horn' },
    thing: {
      nouns: ['ferry', 'ale', 'fence', 'sign', 'rope'], try: ['blow the horn'],
      look: '사람 굵기의 말뚝, 오래된 타르로 검고, 계류 줄용 쇠고리와 곁에 끈에 매단 소뿔이 달렸다. 나무에 새겨져 있다, 물 건너편에서도 읽을 만큼 큰 글자로. 나룻배를 부르려면 불어라. 여기엔 강이 없다. 언 호수가 있고, 그 너머 동쪽이 있을 뿐.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 얼음이 창문처럼 맑아진다. 밧줄이 쇠고리에서 물속으로 내려가 바닥을 따라 동쪽으로, 자로 잰 듯 곧게, 보이는 것보다 멀리 간다. 말뚝 아래, 짧은 줄에, 나룻배가 놓여 있다. 넓고 납작한 배가 바닥 흙 위에 반듯하게. 마지막 뱃사공이 가기 전에 단단히 매 두었다, 제대로, 늘 하던 대로, 아침의 건널 준비를 해서.' }] },
      { on: ['blow ale', 'blow ferry', 'use ale', 'use ferry'], if: [{ flag: 'sight.ferry' }, near('ferry')], do: [{ say: '다시 분다. 얼음이 예의 바르게 끝까지 들어 준다.' }] },
      {
        on: ['blow ale', 'blow ferry', 'use ale', 'use ferry'], if: [near('ferry')],
        do: [{ set: 'sight.ferry' }, { say: '뿔피리를 입에 대고 분다. 길고 낮은 음이 얼음 위로 퍼져 나가고, 그럴 법한 시간보다 오래 계속 간다. 그러고 기다린다, 말뚝이 시키는 일이니. 나룻배는 오지 않는다. 진짜 올 거라 생각한 건 아니었지만, 그래도 조금 실망한 자신을 발견한다.' }],
      },
      { on: ['take ale', 'take ferry', 'pull ferry', 'push ferry', 'pull rope', 'take rope'], do: [{ say: '뿔피리는 말뚝의 것이고, 말뚝은 너보다 훨씬 오래 여기 서 있었다. 누군가 아직 나룻배를 원할지 모른다.' }] },
      { on: ['read ferry', 'read sign', 'read inscription'], do: [{ say: '나룻배를 부르려면 불어라.' }] },
    ],
  },
  {
    id: 'rota', name: '약탈자 근무표', biomes: ['camp'], minDepth: 4,
    seen: '불구덩이 곁에 판자가 기둥에 못 박혀 있고, 누군가 거기 써 왔다.',
    prop: { t: 'signpost' },
    thing: {
      nouns: ['rota', 'sign'], try: ['read the board'],
      look: '기둥에 못 박힌 쪼개진 판자, 적어도 세 사람의 손글씨로, 좋은 글씨는 하나도 없이, 이름과 당번이 빼곡하다. 약탈자들도, 밝혀진 바로, 근무표를 돌린다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 천막들 뒤, 한 자의 눈 아래, 누군가 급히 묻고 자리를 발로 다진 곳에, 냄비가 놓여 있다. 바닥이 깨끗이 뚫릴 만큼 타 있고, 안쪽에 한때 스튜였을지 모를 검은 무언가가 달라붙어 있다. 이제 울프가 안 되는 이유를 안다.' }] },
      {
        on: ['read rota', 'read sign', 'read inscription'], if: [near('rota')],
        do: [{ say: '망보기. 울프. 케틸. 울프. 그림. 장작. 케틸. 그림. 울프. 케틸. 냄비. 그림. 케틸. 그림. 케틸. 울프는 안 됨. 그 아래, 두 번째 손글씨로. 울프가 왜 안 되는데. 그 아래, 세 번째로, 아주 깊이 새겨. 알잖아 왜.' }],
      },
      { on: ['read rota', 'read sign', 'read inscription'], do: [{ say: '여기서는 읽을 수 없다.' }] },
      { on: ['take rota', 'take sign', 'pull rota'], do: [{ say: '그 자리에 둔다. 누군가는 이들을 정리해 둬야 한다.' }] },
      { on: ['attack rota', 'attack sign'], do: [{ say: '너한테는 아무 짓도 안 했다. 울프한테는 많이 했지만.' }] },
    ],
  },
  {
    id: 'oven', name: '빵 화덕', biomes: ['ruin'], minDepth: 4,
    seen: '무너진 돌들 사이 하나만 온전히 서 있다. 구운 점토의 둥근 화덕.',
    prop: { t: 'oven' },
    when: [{ if: [{ flag: 'sight.oven' }], prop: { t: 'oven', v: 'lit' } }],
    thing: {
      nouns: ['oven', 'food'], try: ['light the oven'],
      look: '벌집처럼 둥글고 네 가슴 높이의 빵 화덕, 점토로 만들어 오랜 사용에 항아리처럼 단단하게 구워졌다. 여기 서 있던 다른 모든 것은 무너졌다. 화덕은 금 하나 가지 않았다. 안에 빵 한 덩이가 있고, 뒤쪽에 불쏘시개가 쌓여 있다.',
      lookWhen: [{ if: [{ flag: 'sight.oven' }], look: '화덕이 켜져 잘 빨아들이고, 입구에서 느린 숨결처럼 온기가 나온다. 빵은 아직 안에서 제 일을 하고 있다.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: "ORUN. 눈이 유리가 된다. 그 아래 열두 채의 집 마루가 놓여 있다, 화덕을 둘러 고리로, 모든 문이 그것을 향하고, 모든 문지방에서 돌에 길이 닳아 있다, 화덕 입구까지 곧장. 불 하나, 그리고 모두가 그것을 나눴다, 매 아침, 구울 것이 있는 한." }] },
      { on: ['light oven', 'light hearth', 'use oven', 'light', 'cast flame'], if: [{ flag: 'sight.oven' }], do: [{ say: '켜져 있다. 곁에 잠시 서 있어라. 그게 이것의 쓸모다.' }] },
      {
        on: ['light oven', 'light hearth', 'use oven', 'light', 'cast flame'], if: [near('oven')],
        do: [{ set: 'sight.oven' }, { heal: 15 }, { sound: 'take' }, { say: '불쏘시개는 아주 오래전에 쌓였고 종이처럼 바싹 말랐다. 첫 불꽃에 붙고, 화덕은 만들어진 대로 빨아들이고, 잠시 뒤 입구에서 느린 숨결처럼 온기가 나온다. 매 아침 사람들이 여기 섰듯 손을 내밀고 그 앞에 서서, 따뜻해진다. 빵은 그 자리에 둔다. 이걸 오래 기다렸다.' }],
      },
      { on: ['warm', 'warm oven', 'sit oven'], if: [{ flag: 'sight.oven' }, near('oven')], do: [{ say: '손가락이 제 쓸모를 기억할 때까지 화덕 곁에 선다.' }] },
      { on: ['enter oven', 'climb oven'], do: [{ say: '빵용으로 만들어졌고, 너는 모양이 다르다.' }] },
      { on: ['eat food', 'take food', 'eat oven'], do: [{ say: '오래 빵이었고, 훨씬 오래 돌이었다. 다른 이가 필요하다.' }] },
      { on: ['take oven', 'push oven', 'attack oven'], do: [{ say: '마을 하나를 통째로 견뎠다. 너쯤은 견딘다.' }] },
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

