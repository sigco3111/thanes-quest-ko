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
      { on: ['read menhir', 'pet menhir', 'read inscription'], if: [near('roadstone')], do: [{ say: '깊이 새긴 선 하나, 남과 북을 가리키는. 그것이 할 말의 전부다.' }] },
      { on: ['read menhir', 'pet menhir', 'read inscription'], do: [{ say: '충분히 가까이 있지 않다.' }] },
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
    id: 'lookout', name: '전망대', biomes: ['crags'], minDepth: 5,
    seen: '한 바위벽에 쇠말뚝들이 박혀 있다, 사다리 가로대처럼 위로 이어지는.',
    prop: { t: 'crag', w: 40, h: 64, seed: 17, v: 'pegs' },
    thing: {
      nouns: ['pegs'], try: ['climb the pegs'],
      look: '회색 바위 돌출부, 앞면에 쇠말뚝들이 한 걸음 간격으로 박혀 절벽 평평한 곳까지 이어진다. 말뚝 윗면은 손과 장화에 닳아 반짝이고, 밑은 녹슬었다. 누군가 자주 올랐다, 운동 삼아서가 아니다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 위 절벽의 눈이 날려 걷히고, 거기 바위가 줄지은 작은 그림들로 온통 긁혀 있다. 하나하나 지붕, 거기서 연기 한 줄이 올라가는. 여기 살던 누군가가 겨울마다 올라와 고향의 연기를 셌다. 첫 줄들엔 지붕이 스물. 마지막엔 열하나. 그 뒤로 세러 올라온 사람이 없다.' }] },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [{ flag: 'winter.broken' }, near('lookout')],
        do: [{ say: '젖은 말뚝들을 오르고 절벽 위로 몸을 끌어올린다. 온 땅이 아래에 놓여 있고, 가장자리가 회색과 갈색으로 바래고, 그 맨 끝에 홀로미어가 있다. 연기 열한 가닥이 올라가고, 지금 휘고 있다, 바람이 있으니. 내려가기 전에 잠시 앉아 바라본다.' }],
      },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [{ flag: 'hearth.lit' }, near('lookout')],
        do: [{ say: '철이 차가워도 되는 한도를 넘은 말뚝들을 오르고 절벽 위로 몸을 끌어올린다. 네가 건너온 온 땅이 아래에 놓여 있다, 하얗고 주름져. 그 맨 끝에, 놓칠 만큼 작게, 홀로미어가 있다, 열한 지붕 모두에서 연기가 곧게 오르는. 멀리서 보기 좋은 광경이다. 내려가기 전에 잠시 앉아 바라본다.' }],
      },
      {
        on: ['climb pegs', 'climb crag', 'climb', 'use pegs'], if: [near('lookout')],
        do: [{ say: '철이 차가워도 되는 한도를 넘은 말뚝들을 오르고 절벽 위로 몸을 끌어올린다. 네가 건너온 온 땅이 아래에 놓여 있다, 하얗고 주름져. 그 맨 끝에, 놓칠 만큼 작게, 연기 한 가닥이 오르고 있다. 저게 홀로미어다. 불 하나, 그리고 그것을 지키는 누군가. 확실히 하려고 잠시 지켜보고 내려간다.' }],
      },
      { on: ['take pegs', 'pull pegs'], do: [{ say: '버티라고 박았고, 버티고 있다.' }] },
    ],
  },
  {
    id: 'door', name: '문', biomes: ['open'], minDepth: 6,
    seen: '문이 눈 속에 홀로 서 있다, 닫힌 채, 집 없는 문틀에.',
    prop: { t: 'doorway' },
    thing: {
      nouns: ['door', 'inscription'], try: ['knock on the door', 'open the door', 'read the notches'],
      look: '참나무 기둥 둘과 문지방, 땅에 깊이 박힌, 사이에 문이 아직 가죽 경첩에 달려, 닫힌. 집이 없다. 벽이 없다. 한 기둥에 홈들이 무릎 높이에서 어깨 높이까지 올라가고, 곁에 이름들이 새겨져 있다. 어느 쪽이 안이었는지 알 수 없다.',
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 같은 기둥 반대편, 낮은 곳, 어른이 보려면 무릎 꿇어야 할 곳에, 네 번째 홈 줄이 있다, 아주 촘촘히. 곁에 이름이 없고, 작게 긁은 개 그림만 있다.' }] },
      { on: ['knock door', 'knock'], if: [near('door')], do: [{ say: '노크한다. 예의가 그럴 것 같아서. 아무도 대답하지 않는다, 안 그럴 줄 알면서도, 하지만 귀 기울이고 있던 자신을 발견한다.' }] },
      { on: ['open door', 'enter door', 'push door'], if: [{ flag: 'sight.door' }, near('door')], do: [{ say: '들어갔다, 다시 나온다. 양쪽 다 같은 눈이다.' }] },
      {
        on: ['open door', 'enter door', 'push door'], if: [near('door')],
        do: [{ set: 'sight.door' }, { say: '빗장을 들고, 지나가고, 뒤로 문을 닫는다. 눈 속에 서 있다, 조금 전과 똑같이 춥게, 아무것도 아닌 것의 반대편에서. 그래도 장화를 문지른다.' }],
      },
      {
        on: ['read inscription', 'read door'], if: [near('door')],
        do: [{ say: "칼로 새긴 이름 셋. 에이빈드, 시그룬, 그리고 꼬마 오다. 홈들이 손 하나씩, 해 하나씩 기둥을 오르고, 꼬마 오다의 것이 제일 빠르다. 마지막 세 개는 같은 날 새겼다, 나머지보다 깊게, 모두의 키를 정확히 기억하고픈 사람들이 하는 식으로. 문은 아무도 가져가지 않았다. 문은 들고 가기 힘든 물건이다." }],
      },
      { on: ['read inscription', 'read door'], do: [{ say: '읽기엔 충분히 가깝지 않다.' }] },
      { on: ['take door', 'attack door', 'close door'], do: [{ say: '지금도 누군가의 문이다. 그들이 그랬듯 닫아 둔다.' }] },
    ],
  },
  {
    id: 'pedlar', name: '보부상의 돌탑', biomes: ['open', 'pines', 'crags'], minDepth: 3,
    seen: '휜 물푸레나무 지게가 돌탑에 기대어 있다, 누군가 숨 고르려 내려놓은 것처럼.',
    prop: { t: 'cairn', seed: 23 },
    thing: {
      nouns: ['frame'], try: ['read the frame', 'take the frame'],
      look: '보부상의 지게. 물푸레나무 기둥 둘, 휘어서 못 박은, 발밑에 선반과 누군가의 어깨에 검게 닳은 꼰 가죽 끈. 허리 높이 납작돌 탑에 기대어 있다. 가로대에 글자가 새겨져 있다.',
      lookWhen: [{ if: [{ flag: 'sight.pedlar' }], look: '납작한 돌 탑, 허리 높이, 한쪽에 지게가 오래 기대어 있던 옅은 줄무늬.' }],
    },
    rules: [
      { on: 'orun', do: [{ say: 'ORUN. 돌탑이 얼음처럼 맑아지고, 안의 납작한 돌마다 한두 단어씩 긁혀 있다, 모두 같은 손글씨, 가장 오래된 것이 맨 아래. 방울들. 붉은 천. 바늘, 삼백 개. 좋은 솥. 한참 위에, 더 작게. 그녀의 의자. 그리고 맨 위 돌에, 마지막으로, 서리보다 겨우 깊은 긁힘. 지게. 나는 가볍게 간다.' }] },
      {
        on: ['read frame', 'read inscription'], if: [near('pedlar')],
        do: [{ say: '가로대에 새겨져 있다, 정성 들인 대문자로. 엘드마르크에서 바닷가 왕복, 마흔 겨울. 그 아래, 나중에 덜 정성 들여 칼로 새긴. 나보다 멀리 갈 사람은 가져가라.' }],
      },
      { on: ['read frame', 'read inscription'], do: [{ say: '여기서는 읽을 수 없다.' }] },
      { on: ['take frame', 'use frame', 'equip frame', 'pull frame'], if: [{ flag: 'sight.pedlar' }], do: [{ say: '이미 네 등에 있다, 가라던 곳에.' }] },
      {
        on: ['take frame', 'use frame', 'equip frame', 'pull frame'], if: [near('pedlar')],
        do: [{ set: 'sight.pedlar' }, { give: 'frame' }, { sound: 'take' }, { say: '들어 올린다. 보기보다 가볍다, 좋은 솜씨가 그렇듯. 끈을 걸치고, 지게가 등의 모양을 기억한 듯 자리 잡고, 네 배낭이 선반에 올라가도 자리가 남는다. 누군가 이 아래로 마흔 겨울을 걸었다. 너는 아직 갈 길이 있다.' }],
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
      village: '홀로미어', barrow: '고분', tarn: '산호수', ridge: '능선', pinewood: '소나무숲',
      farm: "고름의 농장", camp: '도적 야영지', ford: '여울',
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
        first: ['통행세', '약탈자', '몸값', '강도들의', '도둑들의'],
        look: '수 킬로미터 안에 벽을 %s으로 넘는 길은 여기뿐이고, 약탈자들이 지키고 있다. 쌓은 돌의 바리케이드, 그 뒤에 불, 그리고 네가 가진 것이 무엇이든 그게 통행세.',
        held: '약탈자들이 너와 틈 사이에 있고, 비켜주지 않는다. 하나라도 서 있는 동안 아무도 못 지나간다.',
        open: '마지막 약탈자가 쓰러진다. 틈이 열렸고, 열려 있을 거다. 소문은 퍼지고, 다른 누구도 거기 앉고 싶어 하지 않을 테니.',
      },
      {
        id: 'pack',
        life: [['wolf', 'wolf', 'wolf'], ['bear', 'wolf', 'wolf'], ['bear', 'bear', 'wolf', 'wolf'], ['bear', 'bear', 'bear', 'wolf']],
        first: ['늑대', '회색', '송곳니', '울부짖는', '굴의'],
        look: '벽을 %s으로 넘는 유일한 길은 좁은 틈이고, 무언가가 그 목구멍에 굴을 팠다. 눈이 납작하게 짓밟혀 오래된 핏자국이 얼룩졌고, 뼈들이 있다.',
        held: '지나가게 두지 않는다. 틈을 향할 때마다 이빨 가진 무언가가 먼저 거기 있다.',
        open: '틈에 산 것은 남지 않았다. 벽을 넘는 길이 이제 열렸고, 거기 무엇이 살았는지 말해 주는 건 뼈들뿐이다.',
      },
    ],
  },
  text: {
    deadRestSeen: '죽은 이 하나가 여기 길가에 앉아 있다, 북쪽을 향해, 네가 지나가도 일어나지 않는.',
    deadRest: '죽은 이 하나, 멈춘 자리에 앉아, 등을 눈더미에 기대고 얼굴은 북쪽으로, 가던 쪽으로. 일어나지 않는다. 무언가를 들으러 먼 길을 걸어와, 그것을 들은 사람의 얼굴이다.',
    deadRestNouns: ['wight'],
    pines: {
      first: ['움푹한', '빽빽한', '고요한', '기울어진', '검은', '겨울의', '귀 기울이는', '늑대의', '토끼의', '올빼미의', '깊은', '여우의', '까마귀의', '눈에 휜', '긴'],
      second: ['소나무숲', '숲', '나무들', '덤불', '가지들', '전나무숲', '작은숲', '수풀', '잡목숲', '울창숲'],
      look: [
        '소나무들이 사방에서 다가든다, 아랫가지들이 눈에 굽은.',
        '늙은 전나무들. 그 아래 눈이 짐이 떨어진 자리로 움푹하다.',
        '나무, 그리고 더 많은 나무, 그리고 가장 가까운 것 바로 너머에서 무언가 움직이는 감각.',
      ],
    },
    open: {
      first: ['하얀', '긴', '벌거벗은', '바람에 깎인', '빈', '먼', '까마귀의', '눈먼', '굶주린', '넓은'],
      second: ['벌판', '암릉', '들판', '어깨', '황야', '긴 들', '초원', '평지', '황무지'],
      look: [
        '트인 눈, 바람에 마루로 갈렸다. 여기는 숨을 곳이 없다, 너에게도 다른 무엇에게도.',
        '넓고 하얀 벌판, 넓고 하얀 하늘 아래. 네 발자국이 유일한 흔적이다. 아직은.',
        '허벗은 땅, 매끈하게 눈이 쌓였다. 산들이 멀리서 지켜보고 의견은 내지 않는다.',
      ],
    },
    mere: {
      first: ['잿빛의', '고요한', '갈대의', '까마귀의', '움푹한', '눈먼', '왜가리의', '수달의', '검은', '잃어버린', '달의'],
      second: ['호수', '못', '산호수', '물', '큰못', '웅덩이'],
      look: [
        '못이 땅이 움푹한 곳에 얼어 있다, 가장자리에 갈대가 뻣뻣하게 서 있는.',
        '얼음, 눈먼 눈처럼 회색, 주위에 죽은 갈대. 가을 이후 아무것도 여기서 마시지 않았다.',
        '작고 언 물, 가장자리에 눈이 쌓였다. 가끔 혼잣말하듯 끽 소리를 낸다.',
      ],
    },
    ruin: {
      first: ['부서진', '오래된', '기울어진', '잊힌', '까마귀가 지키는', '마지막'],
      second: ['망루', '돌들', '경계석', '표지', '이빨', '철야'],
      look: [
        '오래된 석조물이 여기 반쯤 묻혀 서 있다, 아무도 기억하지 못하는 사람들이 아무도 모르는 이유로 세운.',
        '한때 여기 무언가가 지어졌다. 남은 것이 눈 속에 서서 무너지기를 기다린다.',
        '눈더미 사이 다듬은 돌. 누군가 아직 여기 온다. 눈이 짓밟혀 있다.',
      ],
    },
    camp: {
      first: ['소매치기의', '약탈자의', '잿더미', '늑대머리', '연기', '도둑의'],
      second: ['웅덩이', '야영지', '쉼터', '불터', '골짜기'],
      look: [
        '땅 주름 속 야영지. 가죽 천막, 불, 그리고 잎이 진 뒤로 씻지 않은 사람들의 냄새.',
        '천막, 불구덩이, 갉아먹은 뼈. 여기 사는 이들은 먹을 것을 기르지 않는다.',
        '허술한 야영지. 주인들은 아주 멀리서부터 네가 오는 걸 들었다.',
      ],
    },
    crags: {
      first: ['회색', '갈라진', '까마귀의', '서리에 물린', '굶주린', '벌거벗은', '곰의', '독수리의', '부서진', '높은'],
      second: ['바위들', '이빨', '바위산', '흉터', '마디', '선반', '계단', '턱'],
      look: [
        '벌거벗은 바위가 여기 눈에서 회색 이빨로 솟는다, 집보다 크게. 바람이 그 사이 땅을 쓸었다.',
        '바위들. 절벽 평평한 곳들에 눈이 조금, 그림자가 아주 많이 있고, 어느 하나에나 무언가 있을 수 있다.',
        '땅이 갈라지고 뒤엎힌 바위로 솟는다. 무언가가 여기 굴을 팠다. 보기 전에 냄새가 난다.',
      ],
    },
    deadwood: {
      first: ['죽은', '물에 빠진', '잿빛의', '뼈의', '매달린', '창백한', '회색의', '탄', '속삭이는', '과부의'],
      second: ['숲', '나무들', '잡목숲', '나무숲', '덤불', '수풀', '작은숲'],
      look: [
        '여기 모든 나무가 죽었다. 맨 줄기, 맨 가지, 껍질은 회색. 오랫동안 새가 앉지 않았다.',
        '서서 죽은 숲. 눈이 가지 위에 가는 줄로 놓인다, 석판의 분필처럼.',
        '죽은 나무들, 촘촘히. 너무 조용하고, 그 고요는 지켜지고 있는 느낌이다.',
      ],
    },
    shrine: {
      first: ['고요한', '오래된', '지켜지는', '귀 기울이는', '가만한'],
      second: ['고리', '돌들', '돌원', '성소', '모임터'],
      look: [
        '낮은 돌들의 고리가 여기 서 있고 한가운데 돌탑이 있다. 고리 안 눈에 흔적이 없다. 너 말고는 지나간 것이 없다.',
        '서 있는 돌들이 투박한 원을 이룬다. 가까이 가면 바람이 잦아든다, 방에서 말이 멈추듯.',
        '누군가 이 돌들을 세우고 저 탑을 쌓았고, 누군가 아직 온다. 맨 위에 소나무 가지가 놓여 있다, 싱싱한.',
      ],
    },
    steading: {
      first: ['덫놀이의', '외로운', '마지막', '연기구멍', '바람그늘의'],
      second: ['가옥', '소농장', '오두막', '터전', '울안'],
      look: [
        '통나무 오두막 하나가 여기 서 있다, 다른 지붕에서 한참 먼, 벽에 장작더미를 기댄.',
        '오두막 하나, 장작더미 하나, 통 하나. 이렇게 먼 곳에서 누군가 지을 가치가 있다고 생각한 전부.',
        '가옥, 작고 고집스러운, 길이 끊어지는 곳의.',
      ],
    },
    pass: {
      first: ['바람의', '높은'],
      second: ['틈', '고개', '샛길', '관문', '고갯길', '벌어진 곳', '목구멍'],
      look: [
        '언덕이 여기 양쪽에서 다가들고, 발밑 눈이 왕래에 단단히 다져졌다.',
        '찬바람이 여기를 멈추지 않고 지나간다, 수문을 지나는 물처럼.',
        '양쪽에 바위, 사이에 하늘이 좁은 띠. 네 발소리가 돌에서 되돌아온다.',
      ],
    },
    scarp: '%s으로 땅이 회색 바위벽으로 솟는다, 절벽에 얼음이 유리처럼 발리고, 가장 큰 소나무보다 높은.',
    scarpGap: '틈이 그것을 뚫고 %s으로 간다.',
    scarpLook: '회색 바위, 절벽, 녹은물이 흘러내리다 언 곳에 얼음이 발렸다. 양쪽으로 시야 밖까지 이어진다. 어딘가에 지나는 길이 있을 거다. 늘 있고, 늘 누군가가 그곳에 앉아 있다.',
    scarpClimb: '바위에 손을 걸고, 그다음 발을 걸고, 그다음 얼음이 결정을 대신한다. 밑바닥 눈에 앉아 고갯길을 다정하게 생각한다.',
    followed: '그것이 너를 따라온다. 여기선 네 냄새를 맡은 것은 네가 시야에서 사라졌다고 포기하지 않는다.',
    shaken: '너를 쫓던 무엇이든 이곳 앞에서 멈추고, 잠시 뒤 돌아선다.',
    valley: {
      first: ['낮은', '긴', '몰이꾼의', '양치기의', '썰매', '오리나무', '마가목', '자작나무', '이탄', '울지기의', '공동'],
      second: ['오솔길', '길', '자취길', '골짜길', '마루길', '섬길', '샛길', '큰길'],
      look: [
        '한 장소와 다음 사이의 골짜기 한 구간. 눈이 장화와 썰매 주발에 길로 짓밟혔다, 모두 다른 어딘가로 가는 중의.',
        '사는 사람은 없지만 모두가 지나간다. 길이 넓고 단단히 다져졌다, 매일 걷는 길이 그렇듯.',
        '이름 있는 곳들 사이의 조용한 땅. 늑대 발자국이 가끔 길을 가로지른다. 따라가지는 않는다.',
        '골짜기 바닥, 다진 길 양옆으로 눈이 깊이 쌓였다. 바람이 눈더미를 만졌고, 그 뒤 누군가 삽으로 길을 만졌다.',
      ],
      snow: [
        '길 위는 납작하게 짓밟혔고 양옆은 무릎 깊이다.',
        '눈, 장화와 주발과 드문 발굽 자국, 모두 길을 따라 이쪽저쪽으로.',
      ],
      sky: [
        '골짜기를 둘러싼 산들, 홀로미어가 있는 한 홀로미어가 바라봐 온 바로 그 산들.',
        '하얀 하늘, 골짜기 위로 낮게, 눈이 더 들어 있는.',
      ],
      trees: [
        '소나무들, 눈에 무겁다. 아랫가지들은 사람이 닿는 높이까지 장작으로 잘렸다.',
        '어두운 가지들, 하얀 짐, 그리고 가끔 하나가 놓아주는 쿵 소리.',
      ],
    },
    road: '길은 %s으로 이어진다.',
    crossroads: '두 길이 여기서 교차한다. %s.',
    crypt: {
      first: ['낮은', '봉인된', '차가운', '잊힌', '물에 잠긴', '이름 없는'],
      second: ['지하묘실', '납골당', '지하실', '땅굴', '움푹한 곳'],
      look: [
        '옛 망루 아래의 지하실, 망루보다 오래된. 벽에 벽감들이 줄지어 있다. 먼 구석에 무언가가 쌓여 있고, 벽에 새긴 룬이 희미한 초록빛을 낸다.',
        '계단이 관과 먼지의 낮은 방에서 끝난다. 망루를 세운 이는 이것 위에 세웠고, 무엇 위에 앉았는지 알고 있었다.',
        '매장 지하실. 공기가 오래 움직이지 않았고, 움직이라는 게 못마땅하다. 부장품이 먼 끝에서 반짝인다, 썩은 것처럼 빛나는 룬 아래.',
      ],
    },
    snow: [
      '눈, 무릎까지, 눈더미에서는 더 깊이. 발밑에서 뽀득 소리가 난다.',
      '깨끗한 눈, 제 할 일을 하러 가는 작은 발자국들만이 자국을 남겼다.',
      '껍질이 세 걸음에 한 걸음을 받쳐 준다. 나머지 둘은 정강이까지 빠진다.',
    ],
    sky: [
      '네가 이름을 모르는 산들, 전에 다 본 하늘 아래.',
      '여기 봉우리들은 더 날카롭다, 누구도 깎을 시간을 내지 못한 것처럼.',
      '아주 멀리, 하얀 정상들의 줄. 가까워지지 않는다.',
    ],
    trees: [
      '소나무들, 눈에 무겁고, 제 일에 신경 쓰는.',
      '여기 나무들은 도끼를 본 적이 없다. 그걸 아는 것처럼 보인다.',
      '어두운 가지들, 하얀 짐, 그리고 가끔 하나가 놓아주는 쿵 소리.',
    ],
    deep: '여기 추위에는 이빨이 있고, 그 안에 사는 것은 거기 맞게 자랐다.',
    waysAll: '여기서 어느 방향으로든 더 갈 수 있다.',
    waysSome: '여기서 대부분의 방향으로는 더 갈 수 있다, 전부는 아니지만.',
    pond: '못, 바닥까지 얼었다. 갈대가 빗살처럼 얼음에서 솟아 있다.',
    tower: '망루의 그루터기. 그것이 막던 이는 오래전에 오기를 그쳤거나, 도착했거나.',
    stones: '오래된 돌들, 이유 있는 누군가가 세웠다. 위의 룬들은 풍화되어 소문만 남았다.',
    campQuiet: '아무도 없는 야영지. 불은 꺼져 가고, 천막은 열린 채 늘어지고, 이 사람들이 남에게서 가져온 것이 무엇이든 눈이 덮으라고 널브러져 있다.',
    tents: '허술한 야영지. 가죽 천막, 불구덩이, 그리고 빼앗아 사는 사람들의 남긴 것들.',
    crag: '회색 바위, 서리에 덩어리와 칼날로 갈라졌다. 높은 곳 절벽에 작은 뼈들이 흩어져 있다.',
    deadtrees: '전부 죽었다. 껍질이 젖은 종이처럼 손에 떨어지고, 그 아래 서리가 있다.',
    shrineLook: '돌탑을 둘러싼 풍화된 돌 고리. 세월 동안 작은 것들이 놓였다. 구슬 하나, 휜 동전, 꼰 양털. 이곳은 참은 숨의 고요함을 지녔다.',
    shrineFar: '몇 마디 말한다. 여기서는 돌들이 듣지 못하는 것 같다.',
    hutLived: '덫놀이의 오두막, 낮고 빈틈없고, 지붕 구멍에 연기가 나고 문 곁 틀에 가죽이 쳐져 있다.',
    hutEmpty: '문이 달려 늘어지고 문지방에 눈이 쌓인 오두막. 이 겨울 여기 불을 지핀 사람이 없다. 하지만 그 뒤 누군가 들어갔다.',
    hutDoorLived: '고개를 들이민다. 방 하나, 침대 하나, 아주 많은 가죽, 그리고 연기와 수지 냄새. 주인은 여기 밖에서 이야기하는 쪽이 좋겠다.',
    hutDoorEmpty: '안에는 식은 아궁이, 부서진 걸상, 눈더미. 여기 살던 이는 들 수 있는 것을 가져갔다.',
    waymark: '길표. 납작한 돌을 가슴 높이로 쌓고 막대에 헝겊을 달았다. 맨 위 돌에 긁은 화살표가 %s을 가리킨다. 그 아래 누군가 작은 솥을 새겼다, 혹은 투구를.',
    chest: '작은 상자, 반쯤 눈에 묻혔다. 누군가 돌아올 작정이었다.',
    chestOpen: '언 자물쇠를 부순다. 안에, 썩은 지갑에 은화 %s닢.',
    chestEmpty: '비었다. 네가 그렇게 했다.',
    herb: '서리버섯. 바람을 피한 땅에서 눈을 뚫고 올라오는 작고 창백한 버섯. 할라는 구할 수 있을 때 스튜에 넣는다.',
    herbTake: '서리버섯을 따서 헝겊에 싼다. 찬 흙 냄새가 난다.',
    bones: '누군가 여기 쉬려고 앉았다가 일어나지 못했다. 눈이 그를 단정하게 지켜 왔다. 한쪽 팔 아래 배낭이 놓여 있다.',
    bonesSearch: '사과하며 배낭을 조심스레 뺀다. 안에는. 은화 %s닢, 부싯돌, 그리고 습기가 읽을 수 없게 만든 편지. 부싯돌과 편지는 둔다.',
    bonesEmpty: '있는 것은 가져갔다. 쉬게 두어라.',
    wall: '한 구간의 벽, 한때 회반죽을 발랐고, 이제는 대부분 습관으로 서 있다. 돌 층이 다듬어지고 촘촘하다. 쌓은 이는 폐허가 되길 바라지 않았다.',
    pillars: '회색 돌 기둥들, 타당한 것보다 오래 이어지는 횟수 표시로 빙빙 홈이 파였다.',
    stairBelow: '계단이 네 뒤, 아치 아래 있다. 유일한 출구고, 위로 간다.',
    waymarkStone: '납작한 돌을 찾아 맨 위에 올린다. 관습이다. 다음 여행자는 누군가 이 길로 와서, 살았다는 걸 알 거다.',
    shrineTake: '공물들을 놓인 대로 둔다. 어떤 빚은 떠맡을 가치가 없다.',
    firstStep: '너는 네 것 말고는 모든 지도의 가장자리를 벗어났다. MAP에 표시된다.',
    stair: '문간에서 계단이 그 아래로, 어둠 속으로 내려간다.',
    stairWalk: '계단이 망루 아래 어둠 속으로 내려간다. 갈 거면 문간으로 걸어 들어가라, 불을 가지고.',
    cryptTreasure: '부장품, 놓인 자리에 쌓여 있다. 팔고리들, 잔 하나, 세월에 녹슨 동전.',
    cryptTake: '들고 갈 만한 것을 가져간다. 옛 동전과 조각은으로 은화 %s닢. 만지면 아주 차갑다.',
    cryptTrinket: '동전 사이에서 네 손가락이 동전이 아닌 무언가를 움켜쥔다. %s. 여기 오래 놓여 있었다, 누군가에게 쓸모가 되길 기다리며.',
    cryptWake: '마지막 동전이 배낭에 채 들어가기도 전에 뒤에서 돌이 돌을 간다. 뚜껑들이 움직이고 있다. 그들은 자고 있지 않았다. 네가 무얼 하는지 보고 있었다.',
    cryptTrap: '널빤지 돌이 장화 아래로 손가락 너비만큼 가라앉고, 오래되고 날카로운 무언가가 무릎 높이로 벽에서 나온다. 그걸 하려고 아주 오래 기다렸고, 열의는 조금도 식지 않았다.',
    cryptTaken: '좋은 건 다 가져갔다. 나머지는 너무 무겁거나, 너무 가까이 지켜지고 있다.',
    cryptRune: '벽에 새긴 룬, 희미한 초록빛을 내는. 위대한 단어들 중 하나는 아니다. 아마 이름, 혹은 경고.',
    cryptRead: '룬을 따라 그린다, 그것이 아는 것의 조금을 내준다. 힘의 단어는 아니고, 그런 단어가 어떻게 만들어지는지의 엿봄. 옛 언어를 전보다 조금 더 이해하게 된다.',
    cryptReadAgain: '더 말해 줄 것이 없다.',
    cryptCoffins: '돌 관과 매장 벽감. 뚜껑을 들지 않는 법을 배웠다.',
    cryptWayOut: '눈 위로 돌아가는 계단.',
  },
};

