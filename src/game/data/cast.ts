// The people of the valley, and what they have to say.
//
// Nobody here knows they are in a game. Lines are spoken in character; anything the player needs
// to be told about keys or commands goes in a hint ({ note }) or the help page, never in a mouth.
//
// Where everybody is depends on the fires. Until the Elder's hearth is lit the whole village is
// in the one room that has a fire (the inn); afterwards they go home. `thaw.home` is the thaw
// reaching Hollowmere, and `hall.thaw` the feast that is held for it.

import type { CharDef, Cond } from '../../engine/types';

const ask = (who: string, label: string, topic: string, when?: Cond[]): { label: string; say: string; if?: Cond[] } => ({ label, say: `ask ${who} about ${topic}`, ...(when ? { if: when } : {}) });

const LIT: Cond = { flag: 'hearth.lit' };
const COLD: Cond = { not: LIT };
const THAW: Cond = { flag: 'thaw.home' };
/** The woman with the ring came home by the coal, and Hollowmere knows it. */
const CAME: Cond[] = [{ flag: 'coal.given' }, THAW];

export const chars: Record<string, CharDef> = {
  sigga: {
    id: 'sigga',
    name: '시가',
    nouns: ['sigga'],
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'long', tunic: 'blue', legs: 'blue', boots: 'leather', dress: true, apron: 'cream', collar: 'cream' },
    look: '숄을 세 겹이나 두른 여자가 반죽 판 옆에서 발을 굴리고 있다. 열한 덩이어치 반죽이 강돌처럼 새하얗게 굳었다. 홀로미어에서 바깥에 나와 있는 사람은 그녀뿐이다.',
    lookWhen: [
      { if: [THAW], look: '푸른 양모 드레스를 입고 숄은 하나로 줄인 여자. 팔꿈치까지 밀가루를 묻히고, 나눠 줄 빵을 들고 있다.' },
      { if: [LIT], look: '푸른 양모 드레스에 숄 두 장을 두른 여자. 앞치마에 밀가루가 묻어 있고, 돌아가야 할 화덕이 있는 사람의 표정이다.' },
    ],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: `"아흐레 동안 부풀지 않는 반죽만 만들었지." 시가는 양손에 빵 하나씩을 들고, 어느 것이 네 몫이었는지 분명 잊었다. "내일은 광장이 빵 때문에 못 건너다닐 거야. 자. 둘 다 가져가."` },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `시가가 긴 탁자에서 빵이 가져가지는 속도만큼 빨리 썰고 있다. 처음처럼 아주 흥미롭다는 듯 너를 위아래로 훑는다. "이제 어디서 왔는지는 알겠네," 그녀가 말한다. "쓰러지기 전에 앉아."` },
      {
        if: [{ not: { flag: 'sigga.met' } }, COLD],
        say: `"매일 아침 만들어," 네가 묻기도 전에 그녀가 말한다. "혹시 몰라서." 아주 흥미롭다는 듯 너를 위아래로 훑는다. "고개 너머에서 온 건 아니야, 얼굴을 알아봤을 거야. 엘드마르크 사람도 아니지, 이제 거기 사람은 없으니까. 어디서 왔어?"\n\n대답이 없다. 그녀도 개의치 않는 것 같다.\n\n"뭐, 여기는 아니지. 케틀 앤 헬름으로 가. 연기 나는 집. 다들 거기 있어. 갈 곳이 거기밖에 없어." 목소리를 낮춘다. "할라와 불 사이에 서지는 마."`,
        do: [{ set: 'sigga.met' }, { score: 1, id: 'sigga' }],
      },
      { if: [THAW], say: `"겨울이 너 때문에 물러갔다는 소문이야. 나는 헛소리라고 했지, 겨울은 스스로 물러나는 거라고." 시가가 아직 따뜻한 빵을 건넨다. "그러고는 이걸 구웠어. 내가 그 말을 얼마나 믿는지 보라고."`, do: [{ set: 'sigga.met' }, { heal: 15 }] },
      { if: [LIT], say: `"테인." 그녀가 단어의 크기를 재보듯 말하고는 활짝 웃는다. "빵이 다시 있어. 자. 말대꾸 마."`, do: [{ set: 'sigga.met' }, { heal: 10 }] },
      { say: `"아직도 여기 있어? 나도 그래. 누군가는 반죽을 봐야지." 그녀가 발을 굴린다. "들어가, 들어가. 케틀 앤 헬름. 연기 나는 집."` },
    ],
    topics: {
      elder: [
        { if: [LIT], say: `"그 뒤로 의자에 앉은 채 하루하고 밤을 주무셨어. 아무도 말 안 했어. 너도 말하지 마."` },
        { say: `"차가운 손 마르타. 마흔 해의 겨울을 이 마을을 지켰어. 저 회당에서 오드네 애와 아흐레를 앉아 있었고, 하루에 한 번 내려와 우릴 세어. 아이가 어떤지는 묻지 마. 두 번 묻는 사람은 없어."` },
      ],
      tova: [
        { if: [LIT], say: `"일어나서, 밥도 먹고, 사물 이름을 다들에게 알려 주고 있어. 내 화덕 이름도 새로 지었어."` },
        { say: `"토바. 오드네 애, 추수 때 일곱 살. 한겨울에 폐병을 앓았어, 불이 꺼진 바로 그날 밤에. 마르타가 회당에 데려다 두셨어." 시가가 반죽을 본다. "첫날 아침에 작은 빵을 하나 구워 줬어. 다른 것들과 같이 판 위에 있어."` },
      ],
      hall: [
        { if: [LIT], say: `"다시 홀로미어에서 제일 따뜻한 곳이야. 네 침대가 거기 있다며. 저 회당에 침대를 둔 사람은 장로뿐이었어, 우리 할머니 이전부터."` },
        { say: `"장로의 회당. 마르타가 아이와 함께 안에 있어, 한겨울부터 쭉. 안이 밖보다 더 춥다더군. 나는 들여보내 준 적이 없어."` },
      ],
      hearth: [
        { if: [LIT], say: `"전부 붙었어, 안 꺼져. 밤에 일어나서 확인하는 것도 그만뒀어." 그만둔 것처럼 들리지는 않는다.` },
        { say: `"한겨울 밤. 늘 하듯 불을 덮어 두고 잤는데, 방이 고요해져서 깼어. 불이 엎드려 있었어. 달리 말할 방법이 없네. 엎드렸어, 명령받은 개처럼. 전부 그랬어."` },
      ],
      dough: [
        { if: [THAW], say: `"매일 아침 빵이 나오고, 화덕은 한 번도 토라지지 않아. 빵이 밋밋할 수 있다는 걸 잊고 있었어. 아주 즐겁게 만끽하는 중이야."` },
        { if: [LIT], say: `"빵이 다시 있어. 날 밝기 전에 일어났어. 남은 평생 날 밝기 전에 일어날 거야, 그래도 좋아."` },
        { say: `"매일 아침 열한 덩이어치. 지붕 하나에 한 덩이. 모양을 다 잡기도 전에 판 위에서 얼어버려." 손가락 마디로 하나를 두드리니 뎅 소리가 난다. "혹시 몰라서, 그랬어. 오늘이 화덕이 꺼지지 않는 날일지도 모르잖아. 그리고 나한테 그 방이 아닌 갈 곳을 주니까."` },
      ],
      inn: [
        { if: [LIT], say: `"할라는 하루하고 밤을 잤어. 그러고는 일어나서 여관 전체를 닦았지, 우리 냄새를 빼려고."` },
        { say: `"할라네 불만 안 꺼졌어, 할라가 안 꺼지게 했으니까. 아흐레 동안 나뭇가지 하나씩. 다들 담요를 뒤집어쓰고 거기에서 서로의 입김을 마셔."` },
      ],
      well: [
        { if: [THAW], say: `"흘러. 오늘 아침 두레박을 길어 올리고 바보처럼 서서 쳐다봤어."` },
        { say: `"두레박째 꽁꽁 얼었어. 눈을 녹여 써, 할라네 불에서, 냄비 하나씩."` },
      ],
      village: `"홀로미어. 지붕 열한 개, 우물 하나, 그리고 분별보다 많은 염소."`,
      eldmark: `"어딘가에 있을 때는 사흘 거리였어. 지붕이 마흔 개였지. 마흔 개를 유지하기엔 너무 추워졌어. 내가 혼인하던 해에 몇몇이 남쪽으로 가며 여길 지났는데, 멈추지 않았어."`,
      weather: [
        { if: [THAW], say: `"물 떨어지는 소리. 들어봐. 처마야. 처마가 그런다는 걸 잊고 있었어."` },
        { say: `"겨울은 해마다 더 추워져. 어머니가 그러셨는데, 어머니들이 하는 말인 줄만 알았지. 그러다 내가 어머니가 됐어."` },
      ],
      work: [
        { if: [LIT], say: `"마르타한테는 테인의 일이 있어, 다들 일이 있으니까. 그리고 골짜기 너머에도 힘센 팔에 돈을 줄 사람들이 있다더군, 할라 말로는."` },
        { say: `"일? 일이 어디 있어. 체온 지키기가 있지." 그녀가 너를 훑어본다. "마르타가 뭔가 찾아주실 거야. 다들 뭔가를 찾아주시니까."` },
      ],
      name: `"시가. 굽을 불이 있을 때는 빵을 구워."`,
      tree: `"소나무 숲에서는 길을 벗어나지 마. 그 안에 있는 것들 중에서 나무가 제일 얌전해."`,
      wolf: `"높은 숲에서 내려왔어, 주도 갈수록 대담해져. 토케가 사냥했지, 한 놈이 그의 손을 뜯어 가기 전까지는."`,
      odd: [
        { if: [LIT], say: `"어둠에서 어둠까지 풀무질 곁에 있어, 대화를 하면서. 사람한테 그렇게 말 많이 하는 건 들어 본 적 없어."` },
        { say: `"우리 대장장이. 회당 층계에 앉아 있는 저 사람이야. 아흐레를 저기 앉았어, 마르타가 허락하는 한 가장 가까이서. 쇠 얘기를 해줄 거야. 들어줘."` },
      ],
      fenn: `"산정호수의 은둔자. 봄토끼처럼 제정신이 아니야. 마을 절반한테 글자를 가르쳤지, 예의는 아무한테도 안 가르쳤지만."`,
      barrow: [
        { if: CAME, say: `"다들 올라갔어. 어린것들까지 전부. 평생 알지 못한 사람을 위해 저 돌이 움직이는 건 처음 봤고, 그렇게 옳다고 확신한 것도 처음이야."` },
        { say: `"북쪽 고분, 우리가 망자를 모시는 곳. 마르타가 봄가을에 빗자루를 들고 올라가. 뭘 쓰는 거냐고 한번 물었더니, 바닥이래."` },
      ],
      cup: [
        { if: [{ flag: 'home.cup' }], say: `"네가 마셨잖아. 봤어. 지붕이 무너지길 기다렸는데, 할라가 그냥 다시 채웠어."` },
        { say: `"장로 탁자 끝의 술잔? 아무도 손 안 대. 어릴 때 오빠가 못마땅해 하며 시켰는데, 손을 뻗기까지는 했어. 그러니까 옛 장로님이 올려다보지도 않고 회당 건너편에서 내 이름을 부르더라고. 그 뒤로 아무것에도 손을 뻗지 않아."` },
      ],
      thane: [
        { if: [LIT], say: `"익숙해질게. 일주일만 줘. 남편한테도 익숙해졌는데, 걔가 더 어려운 단어였어."` },
        { say: `"뭐라고? 가장 오래된 이야기에나 나오는 말이야. 홀로미어에 성벽이 있을 때 테인이 있었다고 우리 할머니가 그랬어. 성벽이 있었는지는 모르겠지만."` },
      ],
    },
    shrug: `"그런 건 모르지," 시가가 말한다. "빵을 알고, 빵값을 언제 갚을지도 알아."`,
    menu: [
      ask('sigga', 'The fires', 'hearth'),
      ask('sigga', 'The dough', 'dough', [COLD]),
      ask('sigga', 'The Elder', 'elder'),
      ask('sigga', "Odd's girl", 'tova'),
      ask('sigga', 'Eldmark', 'eldmark'),
      ask('sigga', 'Work', 'work'),
    ],
  },

  // Two of Hollowmere's children, kept indoors until the winter broke.
  girl: {
    id: 'girl',
    name: '여자아이',
    nouns: ['girl'],
    spec: { size: 0.72, skin: 'skin', hair: 'blond', hairStyle: 'long', tunic: 'red', legs: 'red', boots: 'fur', dress: true },
    look: '붉은 양모 드레스를 입은 여덟아홉 살짜리 여자아이. 양 팔꿈치까지 눈을 묻히고, 장인의 찌푸림을 하고 있다.',
    talk: [
      { if: [{ not: { flag: 'girl.met' } }], brief: true, say: `"장로님이야," 여자아이가 작업에서 눈을 떼지 않은 채 말한다. "아직 모르셔. 말하면 안 돼."`, do: [{ set: 'girl.met' }] },
      { brief: true, say: `"가을부터 한 번도 못 나갔어. 한 번도. 추위가 코를 가져갈 거래." 또 한 움큼을 뭉쳐 붙인다. "내 코는 못 가져갔어."` },
    ],
    topics: {
      snowman: `"등이 더 꼿꼿해야 해," 여자아이가 말한다. "절대 안 구부리셔. 내가 봤어."`,
      elder: `"토바가 목에 쓸 실을 줬어. 잘못 뜬 부분이래." 잠시 생각한다. "전부 잘못 뜬 부분이야."`,
      tova: `"아직 밖에 못 나와. 회당 문에서 소리쳐서 시켜."`,
      weather: `"따뜻해," 여자아이가 눈 속에서, 새파란 손으로, 한마디 한마디 진심을 담아 말한다.`,
      cup: `"손대면 안 돼. 잔치 때도. 못마땅한 내기로도." 내기를 당해 본 사람의 자신감으로 말한다.`,
    },
    shrug: `"바빠," 여자아이가 상냥하게 말한다.`,
  },
  boy: {
    id: 'boy',
    name: '남자아이',
    nouns: ['boy'],
    spec: { size: 0.66, skin: 'skin', hair: 'brown', hairStyle: 'short', tunic: 'green', legs: 'leather', boots: 'fur' },
    look: '여섯 살쯤의 남자아이. 아직 크지 않은 튜닉을 입고, 돌멩이 두 개를 쥐고 눈이 어디 들어갈지 알려 주기를 기다리고 있다.',
    talk: [
      { if: [{ not: { flag: 'boy.met' } }], brief: true, say: `남자아이가 네 장화를 보고, 그다음 너를 위로 끝까지 올려다본다. "테인이야? 시가가 네가 불을 살렸대. 아팠어?"`, do: [{ set: 'boy.met' }] },
      { if: [{ flag: 'boy.horse' }], brief: true, say: `"이름은 귀야," 남자아이가 튜닉 앞섶을 두드리며 말한다. "귀 때문에."` },
      { brief: true, say: `"나는 눈을 해," 남자아이가 말한다. 분명 가장 중요한 일이고, 그렇게 들은 게 분명하다.` },
    ],
    topics: {
      snowman: `"빗자루를 들게 할 거야," 남자아이가 말한다. "장로님은 빗자루가 있어. 내가 봤어."`,
      tova: `"원하면 자기가 이름 하나 지어준대. 나는 있어."`,
    },
    shrug: '남자아이가 질문을 곰곰이 생각하더니, 대신 돌멩이 하나를 들어 보인다.',
  },

  // Odd's girl. Until the hearth is lit she lies on the pallet in the hall (the room has her as a thing there).
  tova: {
    id: 'tova',
    name: '토바',
    nouns: ['tova'],
    spec: { size: 0.7, skin: 'skin', hair: 'brown', hairStyle: 'long', tunic: 'cream', legs: 'cream', boots: 'fur', dress: true, collar: 'fur' },
    look: '일곱 살쯤의 여자아이. 화로 건너편 침상에 앉아 어깨에 모피를 두르고, 어디 갔다 온 것처럼 모든 것을 바라보고 있다.',
    lookWhen: [{ if: [{ knows: 'word:sol' }], look: '일곱 살쯤의 여자아이. 화로 곁에서, 무릎에 보라색 양털 뭉치를 올리고 뱀을 죽이는 사람처럼 바늘 두 개로 쑤시고 있다.' }],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: '토바는 자고 있다. 제대로 자고 있다. 입을 다물고 주먹을 얼굴 옆에 올린 채로. 이따금 누군가 와서 숨 쉬는 걸 보고는 다시 돌아간다.' },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `"먼 길로 돌아왔네," 토바가 입을 가득 채우고 말한다. "상자는 가까운 길로 왔어. 네가 올 거라고 말했는데. 아무도 내 말을 안 들어."` },
      { if: [{ not: { flag: 'tova.n' } }], say: `"이름 있어?" 토바가 말한다.\n\n없다고 하자, 그녀는 즉시 수리 가능한 문제로 받아들인다.\n\n"그럼 넌 과자야," 그녀가 말한다.`, do: [{ set: 'tova.n', to: 1 }] },
      { if: [{ flag: 'tova.n', is: 1 }], say: `"과자는 아니야," 토바가 말한다. "생각해 봤어. 넌 문이야. 문으로 들어왔으니까."`, do: [{ set: 'tova.n', to: 2 }] },
      { if: [{ flag: 'tova.n', is: 2 }], say: `"문 아니야." 너를 살핀다. "늑대."\n\n네가 늑대가 아니라고 지적한다.\n\n"큰 늑대," 토바가 그 점은 양보하며 말한다.`, do: [{ set: 'tova.n', to: 3 }] },
      { if: [{ flag: 'tova.n', is: 3 }], say: `"마르타가 그만두래. 이름이 없다고 했더니, 다들 이름은 있어야 한다고, 근데 지어줄 건 내가 아니래." 토바가 목소리를 낮춘다. "우리 아빠는 오드야. 그러니까 넌 짝수로 해. 말하지 마."`, do: [{ set: 'tova.n', to: 4 }] },
      { if: [{ flag: 'home.cup' }], say: `"안녕, 짝수," 토바가 말한다. "네가 없는 동안 목도리를 다 떴어. 머리 넣는 구멍이 있어. 실수인데, 잘 돼."` },
      { say: `"안녕, 짝수," 마르타가 안 들을 때 토바가 말한다. 마르타가 들을 때는 "테인"이라고, 아주 점잖게 말하고, 그러고는 망친다.` },
    ],
    topics: {
      name: `"토바. 다들 알아. 없는 건 너야."`,
      elder: `"내내 나한테 손을 얹고 계셨대. 아빠가 그랬어. 나는 기억 안 나." 토바가 생각한다. "아주 긴 숨이었던 건 기억나."`,
      odd: `"풀무질한테 말을 걸어. 무슨 얘기냐고 물었더니 쇠래."`,
      weather: `"할 말이 있었어," 토바가 말한다. "한겨울에. 입을 벌려 놓았는데." 찌푸린다. "사라졌어."`,
      muffler: [
        { if: [{ knows: 'word:sol' }], say: `토바가 보라색 뜨개질 한 토막을 들어 올린다. 보통보다 모서리가 많다. "목도리야. 마르타 목도리였어. 이제 다시 목도리가 될 건데, 더 못하게."` },
        { say: `"마르타는 보라색이 있어. 그걸로 배워도 된대. 내가 뭐 하려는지는 모르셨을 거야."` },
      ],
      hearth: `"저쪽이 네 편이고 이쪽이 내 편이야," 토바가 말한다. "불은 가운데. 공평해."`,
      bed: `"저쪽이 네 편이고 이쪽이 내 편이야," 토바가 말한다. "불은 가운데. 공평해."`,
      cup: `"아무도 안 마셔. 왜냐고 물었는데 다들 다른 말을 해서, 아무도 몰라."`,
    },
    shrug: `"몰라," 토바가 말한다. "자고 있었어."`,
    menu: [ask('tova', 'The long breath', 'elder'), ask('tova', 'Her knitting', 'muffler', [{ knows: 'word:sol' }]), ask('tova', 'What she was going to say', 'weather')],
  },

  marta: {
    id: 'marta',
    name: '장로 마르타',
    nouns: ['elder'],
    spec: { skin: 'skin', hair: 'white', hairStyle: 'long', tunic: 'grey', legs: 'grey', boots: 'leather', dress: true, collar: 'purple' },
    look: '차가운 손 마르타, 홀로미어의 장로. 키가 크고, 마르고, 등이 아주 꼿꼿하다. 보라색 양털 목도리가 이 방의 유일한 색이다. 침상 옆 걸상에 앉아 한 손을 모피 위에 납작하게 얹고 있다. 이따금 입술이 움직인다, 들리는 소리는 없이.',
    lookWhen: [
      { if: [THAW], look: '차가운 손 마르타, 홀로미어의 장로. 키가 크고, 마르고, 등이 아주 꼿꼿하다. 목도리는 어딘가에서 잃어버렸는데, 그리워하는 기색도 없다.' },
      { if: [LIT], look: '차가운 손 마르타, 홀로미어의 장로. 키가 크고, 마르고, 등이 아주 꼿꼿하다. 무릎에 깁는 옷을 올려두었다. 한 번 자 보고는 아껴 쓰기로 한 사람의 표정이다.' },
      { if: [{ flag: 'marta.stopped' }], look: '차가운 손 마르타가 두 손을 아이에게 얹고 너를 보고 있다. 입술은 멈췄다.' },
      { if: [{ knows: 'word:iska' }], look: '차가운 손 마르타, 홀로미어의 장로. 키가 크고, 마르고, 등이 아주 꼿꼿하다. 침상 옆 걸상에 앉아 한 손을 모피 위에 납작하게 얹고 있다. 입술이 움직인다. 너는 그 단어를 안다.' },
    ],
    talk: [
      // The night the hearth is lit, with everybody in the hall.
      { if: [{ flag: 'hall.feast' }], brief: true, say: `"떠들게 놔둬," 마르타가 말한다. 이제 필요 없는 걸상에 여전히 앉아, 손을 모피 위에 얹고 오르내림을 느끼며. "충분히 오래 조용했어."` },
      // The feast for the thaw. What she has to say is said when the Thane sits down.
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `"문 닫아," 마르타가 탁자 건너편 끝에서, 올려다보지도 않고 말한다.` },
      // First meeting, if it was not at the inn.
      {
        if: [{ not: { flag: 'marta.met' } }],
        say: `걸상의 여자가 너만 바라본다, 추위가 다시 느껴지기 시작할 만큼 오래.\n\n"네가 사라지면 그리워할 사람이 있나?" 차가운 손 마르타가 말한다.\n\n대답이 없다.\n\n"잘됐군," 그녀가 말한다.`,
        do: [{ set: 'marta.met' }, { cmd: 'talk elder' }],
      },
      {
        if: [{ quest: 'hearth', max: 1 }],
        say: `"오드네 애. 토바. 한겨울에 폐병을 앓았어." 비축 목록을 읽는 듯한 말투다. "옛 망루 너머에 루나라는 약초 여편이 있어. 추위가 사람한테 하는 짓에 쓰는 검은 약을 만들지. 늑대가 딴 데 바쁘면 왕복 이틀이야. 한 병 가져와."\n\n마을 사람은 왜 안 갔냐고 묻는다.\n\n"토케는 활을 못 당겨. 고름은 죽으면 쓸모없어. 이번 겨울에는 아무도 잃지 않을 생각이야." 얼굴에 아무것도 없이 너를 본다. "낼 사람이 없어. 너는 낼 수 있어."\n\n네가 서 있는 동안 그녀의 입술이 한 번 움직인다, 들리는 소리 없이. 회당에 문 열어 둔 것 같은 냉기가 지나가고, 벽의 서리 깃털이 한 올만큼 자란다.`,
        do: [{ run: 'home', arg: 'runa' }, { run: 'mark', arg: 'runa' }, { quest: 'hearth', stage: 2 }, { score: 5, id: 'hearth.start' }, { note: "Runa's steading is marked on your map." }],
      },
      { if: [{ quest: 'hearth', is: 2 }], say: `"옛 망루 너머. 검은 약, 병에 든 거." 올려다보지 않는다. "아직도 여기 있군."` },
      { if: [{ flag: 'marta.stopped' }, COLD], brief: true, say: `마르타는 아무 말도 하지 않는다. 네 손의 부싯돌을 보고 있다.` },
      { if: [{ flag: 'hall.laid' }, COLD], say: '', do: [{ cmd: 'give flint elder' }] },
      { if: [{ quest: 'hearth', is: 3 }], say: `마르타가 병을 본다. 손을 뻗지는 않는다. 손은 그대로다, 아이 가슴 위의 모피에 납작하게.\n\n"탁자에 놔," 그녀가 말한다.` },
      {
        if: [{ quest: 'message', is: 1 }],
        say: `너는 말한다. 차가운 손 마르타가 세 번 숨 쉬는 동안 아무 말이 없다, 그녀에게는 긴 연설이다. "죽지 않았어," 마침내 그녀가 말한다. "아니, 그럴 리가. 기대받는 일을 한 번도 한 적이 없으니까." 벽 옆 궤짝으로 가서 회색 장갑 한 짝을 들고 돌아온다. "사십 년 전에 한 켤레를 만들어 줬는데, 보내지 못했어. 이제는 한 짝이면 필요하겠지. 내가 간직하고 있었다고는 말하지 마."`,
        do: [{ give: 'glove' }, { quest: 'message', stage: 2 }, { run: 'mark', arg: 'ivar' }],
      },
      {
        // The morning after: the second part of the story begins.
        if: [LIT, { quest: 'north', max: 0 }],
        say: `오늘 아침에는 모든 지붕에서 연기가 나는데도 창살 안쪽에는 그대로 서리가 꼈다. 마르타가 그것을 보고 있다.\n\n"여전히 사람들이 기억하는 가장 추운 겨울이야," 그녀가 말한다. "날마다 더 추워져. 나도 셀 줄 알아, 테인. 화로 하나가 그걸 고치지는 못해." 돌아선다. "호수로 내려가서 펜에게 왜인지 물어봐. 내 탓이라고 할 거야. 절반은 맞을 거고."`,
        do: [{ quest: 'north', stage: 1 }, { score: 2, id: 'north.start' }],
      },
      { if: [{ flag: 'bounty.done' }], say: '네가 들어오자 마르타가 깁는 옷에서 눈을 들고, 네가 서 있는 모습에서 답을 읽는다.', do: [{ run: 'bountyPay', arg: 'Elder Marta' }] },
      { if: [{ quest: 'north', is: 1 }], say: `"호수. 펜. 왜냐고." 마르타가 실을 이로 끊는다. "설명보다 품삯이 좋으면, 테인의 일은 또 있어."`, do: [{ run: 'bountyOffer', arg: 'Elder Marta' }] },
      { say: `"테인." 마르타가 깁는 옷에서 눈을 떼지 않는다. "손이 놀고 있는 사람의 표정이군."`, do: [{ run: 'bountyOffer', arg: 'Elder Marta' }] },
    ],
    topics: {
      ivar: [
        { if: [{ quest: 'message', is: 3 }], say: `"웃었어, 그 사람이. 그럴 거야." 마르타가 한참 불을 본다. "무릎이 나으면, 이 화로 곁에 의자 하나가 있지." 누구 것인지는 말하지 않는다.` },
        { if: [{ quest: 'message', is: 2 }], say: `"장갑을 가졌군. 가져가. 그리고 하지 말아야 할 말이 뭔지 기억해."` },
        { say: `"사냥꾼. 사십 년 전에 북쪽으로 갔고, 곰한테 잡혔지, 올가미꾼들 말로는." 얼굴이 아무것도 보여 주지 않는다, 마르타에게서는 그것도 일종의 대답이다.` },
      ],
      tova: [
        { if: [LIT], say: `"낫고 있어. 시끄럽게. 풀무에, 화로에, 너한테까지 이름을 지어줬어, 아무도 부탁 안 했는데."` },
        { say: `"일곱 살이야. 한겨울에 폐병을 앓았어. 나빠지지는 않았어." 모피 위 마르타의 손은 움직이지 않는다. "그게 알려 줄 전부야."` },
      ],
      barrow: [
        { if: CAME, say: `"숯으로 왔어, 내 화로돌 위로, 아이를 안은 채, 저녁 한가운데. 토바가 나보다 반지를 먼저 봤어." 마르타가 한동안 조용하다. "다음 날 아침에 모셔다 드렸어. 다들. 자리는 쓸어져 있었지. 그것만큼은, 모르는 채로, 내가 해 두었더군."` },
        { if: [{ flag: 'boy.home' }, THAW], say: `"그 아이가 그 자리를 가졌어. 다음 날 아침에 다들 모셔다 드렸지, 토바 담요로 덮어서. 무게가 없었어." 마르타가 불을 본다. "그 아이 하나만을 위해 쓴 자리가 아니야. 곁에 아직 자리가 있고, 내가 쓸어. 아무도 오지 않는다고는 너나 내가 말할 게 아니야."` },
        { if: [{ flag: 'sol.said' }, THAW], say: `"바람이 바뀐 아침에 올라가서 쓸었어. 계속할 거야. 아무도 오지 않는다고는 너나 내가 말할 게 아니야."` },
        { if: [LIT], say: `"안의 한 자리를 마흔 해 동안 쓸었어, 아무도 모시지 않은 채로. 나 이전 장로는 쉰 해를 쓸었어. 누구를 위한 건지는 모르셨지." 마르타가 불을 본다. "반지는 가져. 빗자루는 내가 둘게."` },
        { say: `"망자를 모시는 곳. 이번 겨울에 열 생각은 없어."` },
      ],
      hearth: [
        { if: [LIT], say: `"타고 있어. 저녁이면 곁에 앉아 아무것도 안 해. 마흔 해 동안 안 해 본 일인데, 꽤 잘하는 것 같더군."` },
        { say: `"쌓여 있고, 마르고, 죽어 있어. 불을 붙이면 엎드려." 더 말하지 않는다. 입술이 움직인다.` },
      ],
      fenn: [
        { if: [LIT], say: `"똑똑하고, 무례하고, 그럴 자격 이상으로 늙었어. 어느 겨울에 나와 루나한테 글자를 가르쳤지. 내가 더 빨랐어." 자랑처럼 들리지 않는다. 후회할 일이 있었던 것처럼 들린다.` },
        { say: `"똑똑하고, 무례하고, 그럴 자격 이상으로 늙었어. 다른 사람들과 같이 여관에 있어. 다른 겨울에 물어봐."` },
      ],
      runa: [
        { if: [LIT], say: `"그 약은 그녀 말대로 했어. 지나가거든 그렇게 전해. 내 말이라고는 하지 말고."` },
        { say: `"옛 망루 너머. 이 지붕 중 하나 아래에서 태어났는데 시끄럽다고 여겼지. 누가 보냈는지 알 거야. 하고 싶은 말 다 하게 둬."` },
      ],
      work: [
        { if: [{ flag: 'bounty.done' }], say: `"품삯 받으러 온 사람의 표정이군."`, do: [{ run: 'bountyPay', arg: 'Elder Marta' }] },
        { if: [LIT], say: `"일." 거의 웃는다. "딸린 적은 없어."`, do: [{ run: 'bountyOffer', arg: 'Elder Marta' }] },
        { say: `"일은 있잖아. 병 하나. 망루 너머." 너를 본다. "그리고 내가 네가 원할 만한 품삯은 없어."` },
      ],
      village: `"지붕 열한 개. 그 아래의 영혼은 태어날 때부터 전부 알아. 이번 겨울에 하나도 잃지 않을 생각이야."`,
      wolf: `"골칫거리. 토케가 처리하다가 한 놈이 토케를 처리했지."`,
      name: [
        { if: [LIT], say: `"마르타. 차가운 손이라고 불러. 아홉 살 때부터 그렇게 불렸어." 그 손을 본다. "왜인지는 아무도 기억 못 해. 나는 기억해."` },
        { say: `"마르타. 차가운 손이라고 불러. 너는 장로라고 불러도 돼."` },
      ],
      elder: `"그게 나야. 잘 따라오도록 해."`,
      word: [
        { if: [LIT], say: `"펜이 망루 옆 돌로 우리한테 글자를 가르쳤어, 루나와 나한테. 루나는 따라 그리고는 아무 맛도 안 난대. 나는 따라 그렸고, 그날 밤 양동이 안의 젖이 얼었어." 불을 본다. "아홉 살이었어. 다시는 말하지 않았어. 한겨울까지는, 눈앞에서 아이가 세상을 떠나가는데 손에 다른 게 없었을 때까지." 입이 일자다. "나도 셀 줄 알아, 테인. 이튿날에는 대가가 뭔지 알았어. 멈출 수가 없었어."` },
        { if: [{ knows: 'word:iska' }], say: `"무슨 말인지 모르겠군," 마르타가 말하고, 입술은 정확히 그 말을 하는 시간만큼 멈춘다.` },
        { say: `"그건 은둔자의 밥벌이야. 그에게 물어봐."` },
      ],
      ring: [
        { if: [LIT], say: `"오래된 말이야, 테인. 이 회당이 지어지기 전부터 홀로미어에는 없었어. 장로는 그럴 때를 대비해 반지를 곁에 두지." 네 손을 보고, 그다음 반지가 빠져 더 가늘어진 제 손을 본다. "나 이전 장로가 내게 그 반지와 빗자루를 줬어. 반지는 가져."` },
        { say: `"놋쇠야. 이전 장로의 것이었고, 그 이전 장로의 것이었지." 엄지로 돌린다. 그녀에게는 헐겁다.` },
      ],
      thane: [
        { if: [LIT], say: `"마을이 너를 먹이고, 너는 마을을 위해 피 흘리는 거야. 좋은 거래는 아니지. 내가 가진 유일한 거래고, 너는 받았어."` },
        { say: `"이 회당이 지어지기 전부터 홀로미어에는 없었어. 사람이 청해서 되는 게 아니야."` },
      ],
      broom: `"자작나무. 열한 개를 닳도록 썼어."`,
      cup: [
        { if: [{ flag: 'home.cup' }], say: `"네 거야. 너나 나보다 오래 살았으니까. 원리는 묻지 마. 나는 채워지는 것만 보니까."` },
        { say: `"이전 장로가 채워진 걸 봤고, 그 이전 장로도. 한번 누구 건지 물었어. 모르시더군. 그래도 채워지는 건 보셨어." 마르타가 탁자 저쪽의 잔을 본다. "나도 그래."` },
      ],
      bench: [
        { if: [{ flag: 'home.cup' }], say: `"앉고 싶은 데 앉아. 거기 앉겠지. 사람들은 제 자리에 앉게 돼 있어."` },
        { say: `"저쪽 끝에는 아무도 안 앉아. 이유는 몰라. 네가 안 앉았으면 좋겠다는 것만 알아."` },
      ],
      rhyme: `"노래는 안 해."`,
      muffler: [
        { if: [{ knows: 'word:sol' }], say: `"어차피 풀리고 있었어," 마르타가 말한다. 평생 풀리는 물건을 가져 본 적 없는 사람이.` },
        { say: `"어머니가 물들인 양털이야. 마지막이야." 더 이상 아무 말도 하지 않는다.` },
      ],
      weather: [
        { if: [THAW], say: `"밤에 바람이 바뀌었어. 처마 소리에 깼어." 서리가 없는 창살을 본다. "살아서 듣게 될 줄은 몰랐어."` },
        { if: [LIT], say: `"날마다 더 추워져. 화로 하나가 그걸 고치지는 못해."` },
        { say: `"겨울이야. 겪어 본 적 있어."` },
      ],
      north: `"이 골짜기에서 북으로 나가는 길이 있는데 다니는 사람이 없어. 문으로 이어져. 펜에게 물어봐. 내가 태어나기 전부터 올라가고 싶어 했으니까."`,
      wild: `"고개와 강 너머는 아무의 땅도 아니야. 올가미꾼, 약탈자, 그리고 망자들, 이제는 모신 자리에 머물지 않는. 저쪽에서는 아무도 묻지 않아. 땅이 삽질하기엔 너무 단단해서."`,
    },
    shrug: [
      { if: [LIT], say: `"지킬 마을이 있어," 마르타가 말한다. "도움 되는 질문을 가져와."` },
      { say: `"지킬 아이가 있어," 마르타가 말한다. "병을 가져와."` },
    ],
    menu: [
      { label: 'Hold out the flint to her', say: 'give flint elder', if: [{ flag: 'hall.laid' }, COLD, { not: { flag: 'marta.stopped' } }] },
      ask('elder', 'The girl', 'tova'),
      ask('elder', 'The hearth', 'hearth'),
      ask('elder', 'Runa', 'runa', [COLD]),
      ask('elder', 'The ring', 'ring', [LIT]),
      ask('elder', 'The barrow', 'barrow', [LIT]),
      ask('elder', 'The cup on the table', 'cup'),
      ask('elder', 'The old words', 'word', [LIT]),
      { label: 'Payment', say: 'ask elder about work', if: [COLD] },
      { label: 'Work for a Thane', say: 'ask elder about work', if: [LIT] },
    ],
  },

  odd: {
    id: 'odd',
    name: '대장장이 오드',
    nouns: ['odd'],
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'bald', beard: true, tunic: 'grey', legs: 'leather', boots: 'fur', apron: 'leather' },
    look: '가죽 앞치마를 두른 떡 벌어진 대머리 사내. 회당 층계에 앉아 무릎 사이로 손을 늘어뜨리고 있다. 팔뚝으로 보면 대장장이다. 아무것도 보고 있지 않다.',
    lookWhen: [{ if: [LIT], look: '가죽 앞치마를 두른 떡 벌어진 대머리 사내. 팔꿈치까지 대장간 불빛에 붉다. 쇠가 아흐레 빚진 듯 두드리며, 쇳소리만큼 낮은 소리로 쇠와 말하고 있다.' }],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: `오드가 침상 끝에 앉아 딸의 발을 손에 쥐고 있다. 잃은 줄 알았던 도구를 잡는 식으로. 너를 올려다본다. 이번에는 쇠 얘기가 없다.` },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `"테인," 오드가 말한다. 자기 뿔잔을 가져왔는데 양동이 크기다. "쇠는 달구면 똑같아져. 사람은 아니야. 그걸 생각하고 있었어." 오드에게는 이게 건배사다.` },
      {
        if: [{ not: { flag: 'odd.met' } }, COLD],
        say: `네가 말을 걸지 않았는데도 그가 먼저 말한다.\n\n"풀무가 식었어," 오드가 말한다. "식은 쇠는 누구한테도 쓸모없어. 사람들은 열을 붙잡아 둘 수 있다고 생각해. 못 해. 쇠 안에 있을 때 다뤄야 해, 그러다 사라지면, 한 번 쓴 거고, 그게 이 일이야." 제 손을 본다. "그게 이 일이야."`,
        do: [{ set: 'odd.met' }],
      },
      { if: [{ quest: 'hearth', is: 3 }, COLD], say: `"식은 쇠는 부서져," 오드가 말한다. "식은 채로 치면 산산조각 나."` },
      {
        if: [LIT, { not: { flag: 'odd.thanks' } }],
        say: `"풀무에 불 붙었어." 오드는 풀무에서 눈을 떼지 않는다. 그러다 뗀다, 무언가를 치르고, 네 손에 은화 스물다섯 닢을 센다. "칼 값이야. 샀으면. 안 샀으면 사." 불로 돌아간다. "그다음에 날이든 갑옷이든, 은 있을 때 언제든. 갈수록 비싸져. 쇠가 원래 그래."`,
        do: [{ set: 'odd.thanks' }, { set: 'odd.met' }, { gold: 25 }],
      },
      { if: [THAW], say: `"바람이 바뀌고 쇠가 더 잘 먹어. 이유는 묻지 마. 나는 칠 뿐이야." 턱으로 풀무를 가리킨다. "날이든 갑옷이든, 은 있을 때."` },
      { if: [LIT], say: `"풀무에 불 붙었어." 그가 이렇게 명랑한 건 처음이다, 거의 너를 쳐다볼 뻔했다는 뜻이다. "칼하고 은을 가져오면 나올 때보다 낫게 날을 세워 주지. 갑옷도."` },
      { say: `"모루 옆 작업대에 칼이 있어. 스물다섯. 방패는 열다섯. 은은 모루에 놓고 가." 돌아보지도 않는다. "전에 만든 거야. 아직 좋아. 추우면 물건이 남아. 그게 문제야."` },
    ],
    topics: {
      sword: `"쇠. 양쪽이 날이고 한쪽 끝이 뾰족해. 은화 스물다섯 닢, 너보다 오래갈 거야."`,
      shield: `"오리목에 가죽. 열다섯. 뒤에 서면 대부분 튕겨."`,
      hearth: [
        { if: [LIT], say: `"첫 불꽃을 마른 이끼처럼 받아들였어. 아흐레 동안 숯 하나를 못 붙잡았는데." 보지도 않고 먹이를 준다, 개를 긁어 주듯.` },
        { say: `"아흐레. 매일 아침 장작을 쌓았어. 엎드려." 한 손을 폈다 오므린다. "식은 건 못 쳐. 부수기만 하지."` },
      ],
      anvil: [
        { if: [LIT], say: `"아버지 것이었어. 아버지는 얘한테 말을 걸었지. 나는 안 그랬어." 풀무를 바라본다. "지금은 저것한테 말해. 다른 거야."` },
        { say: `"아버지 것이었어. 아버지는 얘한테 말을 걸었지. 나는 안 해, 그래서 사이가 좋아."` },
      ],
      steel: [
        { if: [LIT], say: `"뜨임이야. 날을 볏짚 색이 될 때까지 달구고, 담그고, 다시 달궈. 할 때마다 조금 더 바로 나오고, 할 때마다 더 나아지기 어려워져. 은 가져와. 갈수록 더 가져와."` },
        { say: `"강철은 불이 필요해. 불이 없어."` },
      ],
      hatchet: `"장작더미 옆 거 말하는 거면, 본 적 없고, 돌려받고 싶지도 않아."`,
      work: `"나는 팔아. 안 고용해."`,
      tova: [
        { if: [LIT], say: `"풀무에 이름을 지어줬어," 오드가 말한다. "뭔지는 말하면 안 된대."` },
        { say: `"일곱." 한동안 그게 전부다. "할 말이 있었어. 입을 벌려 놓았는데."` },
      ],
      elder: [
        { if: [LIT], say: `"방법을 알았다면 내가 붙잡았을 거야." 오드가 쇠를 뒤집는다. "몰라서 다행이야."` },
        { say: `"나를 못 들어가게 해. 추위를 데리고 들어온대." 제 손을 본다. "맞아. 그래."` },
      ],
      barrow: `"사람들이 땅에 안 들어가게 물건을 만들어. 땅속은 들여다보지 않아."`,
      name: `"오드." 그 말을 놔둔다. "이름이야."`,
      rhyme: `"나는 물건을 만들어," 오드가 말한다. "노래는 안 불러."`,
      cup: `"뿔. 내가 만든 거 아니야."`,
      ring: `"놋쇠. 우리 할아버지 집게보다 오래됐어. 오래가라고 만든 거야, 제 표시도 없이."`,
      weather: [
        { if: [THAW], say: `"해빙은 지붕한테는 나쁘고 대장장이한테는 좋아. 한여름까지 경첩이나 만들고 있겠지."` },
        { say: `"추우면 물건이 남아," 오드가 말한다. "그게 나쁜 점이야."` },
      ],
    },
    shrug: `"나는 쇠 얘기를 해," 오드가 말한다, "그리고 막 다 했어."`,
    full: `"그걸 어디다 넣고?" 오드가 %s과(와) 네 배낭을 번갈아 본다. "그것부터 가볍게 해. 나는 쇠를 팔아. 노새는 안 팔아."`,
    menu: [
      { label: 'Buy the iron sword (25 silver)', say: 'buy sword', if: [{ not: { has: 'sword' } }] },
      { label: 'Buy the round shield (15 silver)', say: 'buy shield', if: [{ not: { has: 'shield' } }] },
      { label: 'Buy the mail shirt (45 silver)', say: 'buy mail', if: [{ not: { has: 'mail' } }] },
      { label: 'Buy the steel longsword (60 silver)', say: 'buy longsword', if: [{ has: 'sword' }, { not: { has: 'longsword' } }] },
      { label: 'Sell a wolf pelt (3 silver)', say: 'sell pelt', if: [{ has: 'pelt' }] },
      { label: 'Sell a bearskin (8 silver)', say: 'sell bearskin', if: [{ has: 'bearskin' }] },
      { label: 'Sell a spare trinket (12 silver)', say: 'sell trinket', if: [{ any: [{ has: 'token' }, { has: 'torc' }, { has: 'hearthstone' }, { has: 'brooch' }, { has: 'harefoot' }, { has: 'antlers' }] }] },
      { label: 'Sell back the sword (10 silver)', say: 'sell sword', if: [{ has: 'sword' }, { has: 'longsword' }] },
      { label: 'Sell back the mail (18 silver)', say: 'sell mail', if: [{ has: 'mail' }, { has: 'bearcloak' }] },
      { label: 'Temper my blade ({temper.weaponCost} silver)', say: 'temper sword', if: [LIT] },
      { label: 'Temper my armour ({temper.armorCost} silver)', say: 'temper mail', if: [LIT, { any: [{ has: 'mail' }, { has: 'bearcloak' }] }] },
      ask('odd', 'His girl', 'tova'),
      { label: 'The cold forge', say: 'ask odd about hearth', if: [COLD] },
      { label: 'The forge', say: 'ask odd about anvil', if: [LIT] },
    ],
  },

  halla: {
    id: 'halla',
    name: '할라',
    nouns: ['halla'],
    spec: { skin: 'skin', hair: 'blond', hairStyle: 'long', tunic: 'green', legs: 'green', boots: 'leather', dress: true, apron: 'cream' },
    look: '불 앞 걸상에 앉은 큰 여자. 나뭇가지를 하나씩 먹인다, 먹고 싶은 마음이 사라진 새끼 양을 먹이듯. 눈이 끝까지 빨갛다.',
    lookWhen: [{ if: [LIT], look: '여관 주인. 소매를 걷은 큰 여자. 분명 잤고, 씻었고, 둘 다 즐기고 있다.' }],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: '먹일 불이 더는 없는 할라가 회당 뒤쪽에 선 채로 자고 있다. 아무도 깨우지 않는다. 너도 깨우지 않는다.' },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `할라가 주전자를 들고 탁자를 따라 내려온다. "앉아," 그녀가 말한다. "어디든. 자리 있어."` },
      {
        if: [{ not: { flag: 'halla.met' } }, COLD],
        say: `"불빛에 서지 마," 할라가 돌아보지도 않고 말한다. "쳐다보는 걸 싫어해." 네 손에 그릇을 쥐여 준다. "대체로 뜨거워."\n\n누군가는 물어야 하니까, 이렇게 된 지 얼마나 됐냐고 묻는다.\n\n"아흐레. 한겨울 밤에 골짜기의 화로가 전부 한꺼번에 엎드려서 꺼졌어, 이것 빼고. 이건 내가 안 꺼지게 했어. 지금 불을 붙이면 보는 앞에서 엎드려서 죽어." 나뭇가지를 올린다. "한 번도 꺼뜨린 적 없어."\n\n"아흐레," 사냥꾼이 말한다, "안 잤어."\n\n"잤어," 할라가 말한다. 아무도 안 믿고, 믿으라고 기대하지도 않는다.`,
        do: [{ set: 'halla.met' }, { heal: 6 }, { run: 'martaEnters' }],
      },
      {
        if: [COLD, { quest: 'hearth', min: 2 }, { not: { flag: 'halla.flint' } }],
        say: `할라가 돌아보지도 않고 네가 어디 가는지 듣는다. 제 목에서 부싯돌과 강철을 벗어 등 뒤로 내민다. 그리고 화로돌에서 소뿔 하나를 든다, 점토로 막았고, 그녀의 불에서 숯 세 개가 들어 있다.\n\n"다리 전에 꺼질 거야," 그녀가 말한다. "늘 그래. 골짜기 밖에서는 네가 붙일 수 있어."`,
        do: [{ set: 'halla.flint' }, { give: 'flint' }, { give: 'coals' }, { sound: 'take' }],
      },
      { if: [{ not: { flag: 'halla.met' } }], say: `"들어와, 들어와, 뒤에 문 닫고. 할라야. 여긴 케틀 앤 헬름." 보지도 않고 주막 걸상을 닦는다. "맥주는 은화 한 닢. 스튜도. 붉은 약은 여섯, 횃불은 셋, 침대는 하룻밤 넷, 벼룩 포함."`, do: [{ set: 'halla.met' }] },
      { if: [THAW], say: `"오늘 아침 처마에서 물이 떨어졌어. 똑! 이번 달에!" 할라가 시키지도 않았는데 뿔잔을 걸상 건너로 민다. "네가 뭘 했는지는 모르겠고, 알고 싶지도 않기로 했어. 그거 마셔."`, do: [{ heal: 6 }] },
      { if: [LIT], say: `"잤어. 하루하고 밤을, 다들 그래. 어땠는지 잊고 있었어." 맥주 뿔잔을 걸상 건너로 민다. "그건 서비스야, 테인. 익숙해지지는 마."`, do: [{ heal: 4 }] },
      { say: `"문 조심해," 할라가 말한다. 나뭇가지를 올린다. "스튜는 은화 한 닢. 대체로 뜨거워."` },
    ],
    topics: {
      hearth: [
        { if: [LIT], say: `"이제 혼자 타. 그래도 15분마다 깨서 먹여." 할라가 어깨를 으쓱한다. "한 달만 줘."` },
        { say: `"15분마다 나뭇가지 하나. 두 개는 안 돼, 질식해. 굵은 건 안 돼, 못 들어." 불에서 눈을 떼지 않는다. "납작 엎드리잖아, 봐. 바람이 비비는 것처럼. 바람은 없는데."` },
      ],
      ale: `"묽고, 시고, 뿔잔에 은화 한 닢. 두 번 불평한 사람은 없어."`,
      food: `"보리하고 제일 느렸던 것. 그릇에 은화 한 닢, 뜨거워. 대체로."`,
      potion: `"펜이 달이고 내가 팔아. 은화 여섯 닢. 상처를 점잖지 않을 만큼 빨리 아물게 해."`,
      torch: [
        { if: [LIT], say: `"나뭇가지에 송진. 은화 세 닢."` },
        { say: `"나뭇가지에 송진. 은화 세 닢. 이 골짜기만 아니면 어디서든 잘 타."` },
      ],
      bed: [
        { if: [LIT], say: `"은화 네 닢. 죽은 듯이 잘 거야, 요즘은 이 말을 더 조심해서 해."` },
        { say: `"은화 네 닢. 여기서 유일하게 아무도 없는 자리야, 불에서 제일 멀어서."` },
      ],
      barrow: `"다들 결국 갈 곳이지, 마르타가 허락하면. 이번 겨울은 아니래."`,
      elder: [
        { if: [LIT], say: `"의자에서 하루하고 밤을 주무셨어. 아무도 말 안 했어."` },
        { say: `"하루에 한 번 내려와서 우릴 세. 아무 말도 안 해. 한 사람씩 보고, 다시 올라가." 할라가 나뭇가지를 올린다. "아이 얘기는 묻지 마."` },
      ],
      tova: [
        { if: [LIT], say: `"오늘 아침 여기 내려와서 내 불한테 이름이 뭔지 알려주고 갔어."` },
        { say: `"오드네 토바. 한겨울부터 마르타가 회당에 데려다 두셨어, 마을의 모피를 전부 덮고. 내 것도. 본 사람은 없어. 마르타는 나빠지지 않았대." 나뭇가지를 올린다. "아흐레는 나빠지지 않기엔 긴 시간이야."` },
      ],
      work: [
        {
          if: [THAW],
          say: `"북쪽에 비가 온대. 비! 올가미꾼들도 가죽 들고 손가락 멀쩡히 들어오고. 브레카가 살았다는 소식을 보냈어, 브레카한테는 그게 연애편지야." 할라가 걸상에 기댄다. "그리고 얼어붙은 호수에 종이 갇혔다는 소문도 있어, 동쪽으로 아주 멀리. 나는 맥주만 따라. 보증은 안 해."`,
          do: [{ run: 'mark', arg: 'brekka' }, { run: 'mark', arg: 'ivar' }],
        },
        {
          if: [LIT],
          say: `"이제 곁에 앉을 만한 불이 생기니 사람들이 앉아서 얘기해. 지붕 아래 있는 누구보다 저쪽 땅을 잘 아는 셋이 밖에 있어. 올가미꾼 브레카. 늙은 한 장갑 이바르, 곰들이 시작한 걸 끝내지 않았다면. 그리고 네가 만난 루나." 뿔잔을 채운다. "저쪽 멀리 갈 생각이면, 먼저 셋 중 하나를 찾아."`,
          do: [{ run: 'mark', arg: 'brekka' }, { run: 'mark', arg: 'ivar' }, { note: 'Two more steadings are marked on your map.' }],
        },
        { say: `"저기 고름은 씨앗 곡식을 빼앗겼어. 토케는 물렸고. 마르타는 낼 수 있는 사람을 찾고 계셨지." 처음으로 너를 힐끗 본다. "너를 찾으셨군."` },
      ],
      name: `"할라. 다들 내가 맥주에 물 탄다고 할 거야. 맞아. 필요해서 그래."`,
      cup: [
        { if: [{ flag: 'home.cup' }], say: `"네가 내려놓기도 전에 다시 채웠어. 내 손이. 삼십 년을 그 잔을 사람들 손 안 닿게 옮겼는데, 하룻밤에 두 번 채울 생각은 처음이야."` },
        { say: `"내가 채워. 명절마다, 제일 먼저, 남들 것보다 먼저. 가진 것 중 제일 좋은 걸로, 우리 할머니처럼. 지난 명절에 담겼던 건 다시 통으로 돌아가, 아무도 안 마셨고 좋은 맥주를 바닥에 버릴 수는 없으니까." 둘러본다. "통 얘기는 마르타한테 하지 마."` },
      ],
      chest: `"투숙객용. 넣고 싶은 걸 넣고 꺼내고 싶을 때 꺼내. 이 마을에 도둑은 없어, 시작한 사람이 있다면 나를 지나쳐 나가야 할 테니까."`,
      flint: [
        { if: [LIT], say: `"가져. 사는 동안 그걸로 다시는 불꽃 일구고 싶지 않아."` },
        { say: `"부싯돌이야. 불꽃이 일어. 불꽃은 문제가 아니야."` },
      ],
      fenn: [
        { if: [LIT], say: `"Back at his tarn. He left a book behind. It's about sheep. I think it was meant as a remark."` },
        { say: `"In the corner with his books, complaining about the light. He walked in from the tarn the second day with a sack on his back. I thought it was food."` },
      ],
      runa: `"Born here. She brews a black stuff that puts back what the cold takes. The red ones are Fenn's, whatever she tells you."`,
    },
    shrug: `"That's past what I know," says Halla. "I know ale, and who drinks too much of it."`,
    full: `"You'll rattle," says Halla, looking at your pack. "Put something down first. There's a chest by the bed for lodgers, and the floor is free."`,
    menu: [
      { label: 'A horn of ale (1 silver)', say: 'buy ale' },
      { label: 'A bowl of stew (1 silver)', say: 'buy food' },
      { label: 'A red draught (6 silver)', say: 'buy potion' },
      { label: 'A pitch torch (3 silver)', say: 'buy torch', if: [{ not: { has: 'torch' } }] },
      { label: 'The bed for a night (4 silver)', say: 'sleep bed' },
      ask('halla', 'The fire', 'hearth'),
      ask('halla', "Odd's girl", 'tova', [COLD]),
      ask('halla', 'What people are saying', 'work'),
    ],
  },

  fenn: {
    id: 'fenn',
    name: 'Old Fenn',
    nouns: ['fenn'],
    spec: { skin: 'skin', hair: 'white', hairStyle: 'bald', beard: true, tunic: 'grey', legs: 'grey', boots: 'leather', dress: true, cloak: 'grey' },
    look: 'The oldest person you have ever seen, in a grey robe, with a white beard to his belt and ink on every finger. He looks at you as if you were a footnote.',
    lookWhen: [
      { if: [COLD], look: 'The oldest person you have ever seen, in the corner of the inn furthest from the door, with a sack of books for a seat and one open on his knee. He looks at you as if you were a footnote.' },
      { if: [{ quest: 'errand', max: 1 }], look: 'The oldest person you have ever seen, on his knees on the shore in the snow, looking out at something in the ice. He has ink on every finger. He does not explain.' },
    ],
    talk: [
      {
        if: [{ not: { flag: 'fenn.met' } }, COLD],
        say: `"You're in my light," says the old man in the corner, though what light there is comes from behind him. "Fenn. Yes, the hermit. I am here for the fire and not for the company; do not confuse the two. Nine days I've had with nothing to do but think, and I've thought of nothing I like." He turns a page. "If you can read, I brought the books worth saving, and they cost silver. There's a singed one on my table at the tarn, if the damp hasn't had it. Take it. I never liked it."`,
        do: [{ set: 'fenn.met' }],
      },
      { if: [{ quest: 'errand', is: 1 }, { has: 'amulet' }], say: `"Is that..." He has gone very still. "You have it. You actually have it." He holds out a hand that is not quite steady.` },
      {
        // The sum. Said on the shore, where he looks at what the ice kept; or indoors, once he has it back.
        if: [{ quest: 'north', is: 1 }, { quest: 'errand', max: 1 }],
        say: `"So you're the Thane," he says, getting up slowly and with a great deal of complaint. "Hollowmere goes without one for longer than anybody can remember, and when it gets one at last, it has less history than a snowflake. Marta Coldhand. I taught that woman her letters. I should have taught her sums."\n\nHe jabs a finger at you.\n\n"One child. One word. One room. Every fire in a valley out in a night. Now. Every winter of my life has been colder than the one before it, and I have had eighty-odd. Do the sum."\n\nYou do it. He watches you do it.\n\n"Bigger than a child," says Fenn. "Further off than a room. Longer than anybody could keep it up who has to stop for breath." He lets that sit. "I've looked sixty years for one stone, and walked everywhere a man can walk in this country, looking. There's one road I never went up. North. There's a gate across it, and the men on the gate have been dead longer than anybody remembers, and nobody has told them. Past it, the wind stops. When I was a boy they said it stopped a week past the gate. Now they say you can stand on the gate and see where."\n\nHe looks out at the ice again.\n\n"There's a word the dead can't stand. It's under the Giant's Table, and it only shows itself at night, and it's in the south, which is the wrong way entirely. These things are always arranged like that." He is quiet for a moment. "I was going to go for it. That was the spring I was going to go." He turns his back on you. "Go on, then. You're in my light."`,
        do: [{ quest: 'north', stage: 2 }, { set: 'fenn.met' }, { set: 'goal.dolmen', to: 'dolmen' }, { score: 3, id: 'north.fenn' }, { run: 'study', arg: 20 }, { note: "The Giant's Table is marked on your map." }],
      },
      {
        if: [{ quest: 'north', is: 1 }],
        say: `"So you're the Thane," he says, not getting up. "Hollowmere goes without one for longer than anybody can remember, and when it gets one at last, it has less history than a snowflake. Marta Coldhand. I taught that woman her letters. I should have taught her sums."\n\nHe jabs a finger at you.\n\n"One child. One word. One room. Every fire in a valley out in a night. Now. Every winter of my life has been colder than the one before it, and I have had eighty-odd. Do the sum."\n\nYou do it. He watches you do it.\n\n"Bigger than a child," says Fenn. "Further off than a room. Longer than anybody could keep it up who has to stop for breath." He lets that sit. "I've looked sixty years for one stone, and walked everywhere a man can walk in this country, looking. There's one road I never went up. North. There's a gate across it, and the men on the gate have been dead longer than anybody remembers, and nobody has told them. Past it, the wind stops. When I was a boy they said it stopped a week past the gate. Now they say you can stand on the gate and see where."\n\nHe looks at the amulet on its nail by the window.\n\n"There's a word the dead can't stand. It's under the Giant's Table, and it only shows itself at night, and it's in the south, which is the wrong way entirely. These things are always arranged like that." He is quiet for a moment. "I was going to go for it. That was the spring I was going to go." He picks up his book. "Go on, then. You're in my light."`,
        do: [{ quest: 'north', stage: 2 }, { set: 'fenn.met' }, { set: 'goal.dolmen', to: 'dolmen' }, { score: 3, id: 'north.fenn' }, { run: 'study', arg: 20 }, { note: "The Giant's Table is marked on your map." }],
      },
      {
        if: [{ flag: 'winter.broken' }, { knows: 'word:orun' }, { not: { flag: 'fenn.told' } }],
        say: `You tell him where the stone was.\n\n"On the far side of the gate." Fenn sits down, which he does not do in front of people. "Of course it was. Sixty years, and everywhere a man can walk, and the one road I never went up, for the sake of a row of dead men with spears." He is silent for some time. "I said I should be annoyed. I find I am mostly old."\n\nThen he has the rest out of you: the footprints, the hollow, the hands flat on the snow. He does not write any of it down.\n\n"Three hundred winters," he says at last. "Without a breath between. Marta managed nine days of it, and it very nearly killed her." He looks at the window. "I know a little about not being able to leave a thing where it lies. I should not care to do it for three hundred."`,
        do: [{ set: 'fenn.told' }, { score: 5, id: 'north.told' }, { run: 'study', arg: 60 }],
      },
      { if: [{ quest: 'north', is: 3 }], say: `"You have it. I can tell: you keep your mouth shut like a man carrying a full cup." Fenn does not look up. "Don't say it in here. My eyes are old. Go north and say it to people who need telling."` },
      { if: [{ quest: 'errand', is: 1 }], say: `"My amulet is still in the ice, I notice, and you are still standing here."` },
      { if: [{ not: { flag: 'fenn.met' } }, { quest: 'errand', max: 1 }], say: `"You're in my light," says the old man, without getting up off his knees or looking round. "Fenn. Yes, the hermit. No, I'm not lonely."`, do: [{ set: 'fenn.met' }] },
      { if: [{ not: { flag: 'fenn.met' } }], say: `"Shut the door, you're letting the weather in." He does not look up. "Fenn. Yes, the hermit. No, I'm not lonely."`, do: [{ set: 'fenn.met' }] },
      { say: `"Well? I have four hundred books to get through and one lifetime, most of it used."` },
    ],
    topics: {
      barrow: `"A grave. A big one, and well kept. Marta sweeps it. Ask her what for and she'll tell you: the floor."`,
      menhir: [
        { if: [{ knows: 'word:orun' }], say: `"West ridge. The old watchtower. The Giant's Table. And one on the wrong side of a gate, as I now know."` },
        { say: `"Two stones near this valley still hold their words: one on the west ridge, one by the old watchtower. There are others, further off. There is one I never found."` },
      ],
      word: [
        { if: [LIT], say: `"VETH opens, and pushes. ISKA stills. Each lives in a stone, and each tires the tongue: speak one and you must wait before it will come to you again." He looks at you over the book. "Unless you are past needing breath."` },
        { say: `"Old words, cut in standing stones. Nobody can teach you one. You read it off the stone or you go without. There's one by the old watchtower and one on the west ridge." He turns a page. "I taught two little girls their letters off the one by the tower, one winter, because it was nearer than my hut. I've had sixty years to wonder whether that was wise."` },
      ],
      tarn: [
        {
          if: [{ quest: 'errand', is: 0 }],
          say: `"Forty years ago my wife went through that ice. Her amulet came up the next winter and froze in where you can see it, right in the thin middle, and I've looked at it every day since. Nine days I have not, sitting in that inn." He does not look at you. "I can't reach it. Nothing heavier than a hare can cross there. Unless the ice were made to freeze harder; and there's a word for that, as this valley has cause to know. Bring me the amulet, and I'll give you Light. You'll want it, in the dark places."`,
          do: [{ quest: 'errand', stage: 1 }, { score: 2, id: 'errand.start' }],
        },
        { if: [{ quest: 'errand', is: 2 }, COLD], say: `"It's only ice now. Forty years I went down to that shore every morning, to look at one bright thing I couldn't reach." Fenn turns a page. "I shall have to find something else to do with my mornings. I'm told that is what books are for."` },
        { if: [{ quest: 'errand', is: 2 }], say: `"It's only ice now. Forty years I went down to that shore every morning, to look at one bright thing I couldn't reach." Fenn turns a page. "This week I've stayed in and read. I'm told that is what books are for."` },
        { say: `"Thin in the middle. It wouldn't hold you unless something froze it harder. ISKA would, if you had it. The stone that holds ISKA stands by the old watchtower, out past the ford."` },
      ],
      amulet: [
        { if: [{ has: 'amulet' }], say: `"Give it here. Please." It is the first time you have heard him say please, and possibly the first time he has.` },
        { if: [{ quest: 'errand', is: 2 }, COLD], say: `"In my pocket." He puts his hand over it. "Where I can't see it and can have it. After forty years of the other way about, I find I prefer it."` },
        { if: [{ quest: 'errand', is: 2 }], say: `"On the nail by the window, where the light gets at it." He does not look that way. "Asa would say it was a waste of a good necklace to hang it on a nail. She'd be right. She generally was."` },
        { say: `"Silver, with a moonstone. Hers. It's out in the middle of the tarn, where I can see it and can't have it."` },
      ],
      hearth: [
        { if: [LIT], say: `"Mine burns. Yours burn. Don't expect me to be astonished; I had worked it out by the third day, and nobody asked me."` },
        { say: `"Mine went out with the rest. I have a theory about why, and no intention of saying it aloud in a room with eleven frightened people in it."` },
      ],
      tome: `"Mend is fifteen silver, Frost twenty, Ward twenty-five. The singed one on my table is free; I never liked it."`,
      light: `"A small spell and a kind one. I don't sell it. I give it, to people who do me a kindness."`,
      flame: `"Loud, showy, effective. It's on the table in my hut. Read it before you need it, not after."`,
      frost: `"It slows what it strikes. Twenty silver."`,
      mend: `"It closes wounds. Fifteen silver, and worth ten times that the first time you need it."`,
      ward: `"It halves what hits you, for a little while. Twenty-five silver."`,
      magic: `"There are two kinds worth the name. Spells, which you learn from books and pay for in breath: Flame, Frost, Mend, Light, Ward. And the old words, which you learn from stones and pay for in waiting."`,
      wife: `"Asa. She laughed at everything, me most of all. Forty years." He turns a page he has not read.`,
      cup: `"The oldest thing in Hollowmere isn't the barrow. It's that cup. Not the horn, which is new every few lifetimes: the habit. People who never knew whose it was have filled it for longer than anybody has kept count." He sniffs. "I have never been so annoyed by a piece of kindness in my life."`,
      thane: `"An old word. Whoever the valley sent, when a thing had to be gone and seen to. The last one went before that village had a hall, and nobody wrote down where. I have looked."`,
      ring: `"The Elder's brass ring? It is older than the office. I asked three Elders whose it was. I got the same answer three times, which was a look."`,
      gap: [
        { if: [{ flag: 'gate.open' }], say: `"They went in, you say. All together, and shut nothing behind them." He writes something down. "Nobody ever came to relieve them. I suppose you did."` },
        { say: `"Two towers and a row of dead men. I got within a bowshot, at thirty. They turned their heads, all together. I found I had business at home."` },
      ],
      north: `"A road, a gate, and past it a place where the wind stops. I have that from six books and one liar, and they agree, which the books never do."`,
      veth: `"Open. Away. Make room. It's cut into the stone on the west ridge, above the pinewood. It will knock a wolf off its feet, and open what is frozen shut, and make a way through what will not move aside."`,
      iska: [
        { if: [LIT], say: `"You've seen what it does, when somebody won't stop saying it."` },
        { say: `"Stillness. It stops a thing where it is: a wolf, a river for a breath or two, snow in the air. And the going has to be taken out of the thing and put somewhere." He looks at Halla's flat little fire. "Hold a hand out the next time you hear it said, and feel which way the warmth goes."` },
      ],
      sol: [
        { if: [{ knows: 'word:sol' }], say: `"SOL." Fenn says it under his breath, and the fire stands up straight for a moment. "Day. I had it from a book, as a rumour of a rumour, and you've had it from the stone. I shan't ask you to say it in here."` },
        { if: [{ quest: 'north', min: 2 }], say: `"The sun's own name. The dead can't stand it. Under the Giant's Table, in the south, beyond the first wall, and only after dark. Wait for night, and look under the capstone."` },
        { say: `"There are tales of a word that is the sun's own name. If it was ever cut into a stone, the stone is a long way from here."` },
      ],
      orun: [
        { if: [{ flag: 'fenn.told' }], say: `"Past the gate. Sixty years." He shakes his head, and goes back to his book, and does not turn the page.` },
        { if: [{ knows: 'word:orun' }], say: `"You have it." He puts the book down. "Where? No. Sit. Tell me where."`, do: [{ cmd: 'talk fenn' }] },
        { say: `"See. Uncover. I have never found its stone, and I've looked for sixty years. If you find it, come and tell me where. I shall be very annoyed."` },
      ],
      elder: [
        { if: [LIT], say: `"She did the only thing she knew how to do, and it was the wrong thing, and she did it for nine days without sleeping." Fenn turns a page. "I have known wiser people do worse with less cause."` },
        { say: `"Marta. Quick. She always was. Ask me nothing else about her this winter."` },
      ],
      wight: [
        { if: [{ flag: 'winter.broken' }], say: `"Sat down, I hear. Where they stood." He nods slowly. "They were only ever trying to get somewhere and be done."` },
        { if: [{ quest: 'north', min: 2 }], say: `"They don't stay where they're put. They did, when I was young. Whatever is wrong with the winter is wrong with them, and they all walk the same way, and it is the way I've just sent you."` },
        { say: `"The dead walk, out past the valley, and nobody out there buries anybody. I have a great many books on the subject. None of them agree."` },
      ],
      eldmark: `"A town. I bought books there, when it was one. It didn't fall; it thinned. A roof a winter, going south."`,
      name: `"Fenn. It will do."`,
    },
    shrug: `"That is either beneath my notice or above yours," says Fenn, and turns a page.`,
    full: `"Your pack is fuller than my shelves, and my shelves are full," says Fenn. "Put something down. Not in here."`,
    menu: [
      { label: 'Give him the amulet', say: 'give amulet', if: [{ has: 'amulet' }] },
      { label: 'Give back the books you have read', say: 'give tome to fenn', if: [{ any: [{ has: 'tomeFlame' }, { has: 'tomeFrost' }, { has: 'tomeMend' }, { has: 'tomeLight' }, { has: 'tomeWard' }] }] },
      ask('fenn', 'The old words', 'word'),
      ask('fenn', 'ISKA', 'iska', [{ any: [{ knows: 'word:iska' }, LIT] }]),
      ask('fenn', "The sun's name", 'sol', [{ quest: 'north', min: 2 }]),
      ask('fenn', 'The gate in the north', 'gap', [{ quest: 'north', min: 2 }]),
      { label: 'Where the stone was', say: 'ask fenn about orun', if: [{ knows: 'word:orun' }, { not: { flag: 'fenn.told' } }] },
      ask('fenn', 'The tarn', 'tarn'),
      { label: 'Buy the book of Mend (15 silver)', say: 'buy mend', if: [{ not: { has: 'tomeMend' } }] },
      { label: 'Buy the book of Frost (20 silver)', say: 'buy frost', if: [{ not: { has: 'tomeFrost' } }] },
      { label: 'Buy the book of Ward (25 silver)', say: 'buy ward', if: [{ not: { has: 'tomeWard' } }] },
      ask('fenn', 'His fire', 'hearth'),
    ],
  },

  toke: {
    id: 'toke',
    name: 'Toke the hunter',
    nouns: ['toke'],
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'hood', beard: true, tunic: 'green', legs: 'leather', boots: 'fur', cloak: 'green' },
    look: 'A lean man in a green hood, nursing a hand bound up in rags. He is watching the door, not you.',
    lookWhen: [
      { if: [{ quest: 'wolves', is: 2 }, { flag: 'toke.mended' }], look: 'A lean man in a green hood. The bite on his hand has closed to a pink seam, and his bow is yours now. He is watching the trees, not you.' },
      { if: [{ quest: 'wolves', is: 2 }], look: 'A lean man in a green hood with a bandage on one hand. His bow is yours now. He is watching the trees, not you.' },
      { if: [{ flag: 'toke.mended' }], look: 'A lean man in a green hood with a bow on his back. The bite on his hand has closed to a pink seam. He is watching the trees, not you.' },
      { if: [LIT], look: 'A lean man in a green hood with a bow on his back and a bandage on one hand. He is watching the trees, not you.' },
    ],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: `Toke stands a little apart, as hunters do indoors, with a horn of ale in his good hand. "They'll want a speech," he says. "Don't give them one. Nobody ever went back out into a winter the better for a speech."` },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `"Walked it," says Toke, looking at your boots. "All of it. I can see by the leather." He nods, once, as he would at a clean shot.` },
      {
        if: [{ quest: 'wolves', is: 0 }, LIT],
        say: `"Toke. I hunt, when I've two hands." He holds up the one in rags. "A pack came down off the ridge when the cold got bad, and one of them had this before I could draw. I can't pull a bow like this." He flexes it and winces. "Kill three of them for me and the bow's yours. It's no use to me before spring. Two in this wood, west of here, and one at least up on the ridge."`,
        do: [{ quest: 'wolves', stage: 1 }, { score: 2, id: 'wolves.start' }],
      },
      {
        if: [{ quest: 'wolves', is: 0 }],
        say: `"Keep your voice down. She's counting sticks." He nods at the woman by the fire, and then at his own hand. "Toke. I hunt, when I've two hands. A pack came down off the ridge when the cold got bad, and one of them had this before I could draw. I can't pull a bow like this." He flexes the rags and winces. "Kill three of them for me and the bow's yours. It's no use to me before spring. Two in the pinewood, west of the square, and one at least up on the ridge."`,
        do: [{ quest: 'wolves', stage: 1 }, { score: 2, id: 'wolves.start' }],
      },
      {
        if: [{ quest: 'wolves', is: 1 }, { flag: 'wolves.killed', min: 3 }],
        say: `"Three. I heard them go quiet, one after another." He unslings the bow and holds it out. "A bargain's a bargain. She pulls a little to the left. You'll get used to it."`,
        do: [{ quest: 'wolves', stage: 2 }, { give: 'bow' }, { score: 10, id: 'wolves.done' }, { note: 'Tip: EQUIP BOW, then attack to loose an arrow. SWAP changes back.' }],
      },
      { if: [{ quest: 'wolves', is: 1 }], say: `"Not three yet. There are two in the west of the pinewood and at least one up on the ridge. Don't let them get behind you."` },
      { if: [THAW, { flag: 'toke.mended' }], say: `"I heard a thrush this morning. In the pinewood, in this month." Toke shakes his head slowly. "And my hand's whole. I could take that bow back." He very nearly smiles. "No. Keep her. You've fed her better than I ever did."` },
      { if: [THAW], say: `"I heard a thrush this morning. In the pinewood, in this month." Toke shakes his head slowly. "My hand's mending, too. Another week and I'll want that bow back." He very nearly smiles. "No. Keep her. You've fed her better than I ever did."` },
      { if: [LIT, { quest: 'wolves', is: 2 }], say: `"Thane, they tell me. The wolves will have heard; they hear everything." He looks you over. "There are deer again, out past the valley. Halla pays for venison, if you can get near enough to loose."` },
      { if: [COLD], say: `"Nine days in one room with eleven people." Toke looks at the door. "I'd sooner the wolves."` },
      { say: `"Quiet wood, for once. I could get used to it."` },
    ],
    topics: {
      wolf: `"They lunge, bite, and dance back out of reach. Hit them as they come in, or put your back to a tree and let them break their teeth on your guard." He looks at the door. "They stop at the lip of the valley, lately. They sit down up there and watch. I've never known a wolf not follow a thing into a place before."`,
      bow: `"Yew. Draws heavy, shoots true. Three wolves, and she's yours."`,
      stag: `"There are deer yet, out past the valley: in the pinewoods and by the meres, and only by day. Loose from as far off as you can see them. Come one step too near and all you'll have is the white of a tail." He flexes the bandaged hand. "Halla pays for venison. So does your belly." He lowers his voice. "And a long way out, they say, there's a white one. I saw it once, at dusk, forty paces off. I didn't loose. I've never been sure whether that was wisdom."`,
      camp: `"South-west, past the ford. Robbers. They hit Gorm's farm two nights after the fires went. Three of them, and one has a bow, so don't stand about in the open."`,
      bandit: `"Three, in the hollow past the ford. Kill the one with the bow first, or he'll make you regret every step."`,
      dog: `"A grey bitch, called Ash. Best nose in the valley. She wouldn't go up that ridge for meat nor shouting, and I never had a dog that was wrong about a place."`,
      menhir: `"On the bare ridge, west and north. I don't go near it. My dog wouldn't either, when I had a dog."`,
      tree: `"I've hunted that wood thirty years. It's never been this quiet, or this cold."`,
      work: `"Three wolves. That's the work."`,
      elder: [
        { if: [LIT], say: `"She told me I couldn't draw my bow. She was right." Toke flexes the hand. "She told you that you could be spared. I'd not have liked to be told that. You went anyway."` },
        { say: `"She says I can't draw my bow. She's right. She said it as if she'd counted my fingers."` },
      ],
      rhyme: `"I don't sing. It tells things where you are."`,
      cup: `"I've never been to a feast I didn't leave early."`,
      wight: [
        { if: [{ flag: 'winter.broken' }], say: `"Sat down. All along the north road, at the side of it, facing the way they were going. I walked past forty of them and not one got up." Toke watches the trees for a while. "I'm glad I never loosed at one. I'd have wondered about it, after."` },
        { say: `"I hunt things that are alive. Those are somebody else's trouble. They don't come into the valley, I'll say that. Nothing does, lately, that doesn't have to."` },
      ],
      name: `"Toke."`,
    },
    shrug: `"I hunt," says Toke. "The rest is other people's business."`,
    menu: [
      ask('toke', 'The wolves', 'wolf'),
      ask('toke', 'The bow', 'bow'),
      ask('toke', 'Hunting deer', 'stag'),
      ask('toke', 'The stone on the ridge', 'menhir'),
      ask('toke', 'The robbers', 'camp'),
    ],
  },

  brekka: {
    id: 'brekka',
    name: 'Brekka the trapper',
    nouns: ['brekka'],
    spec: { skin: 'skin', hair: 'red', hairStyle: 'long', tunic: 'leather', legs: 'leather', boots: 'fur', cloak: 'fur', collar: 'fur' },
    look: 'A weathered woman in a coat made of several animals, none of them recently alive. She has a skinning knife in one hand and seems to have forgotten it is there.',
    talk: [
      { if: [{ not: { flag: 'brekka.met' } }], say: `"Well. A face." She looks you over as she might a pelt. "Brekka. I trap, I skin, I keep to myself. You're the first two-legged thing I've seen since the leaves fell that wasn't trying to rob me, or dead. Are you trying to rob me? No. Good. Then we can trade."`, do: [{ set: 'brekka.met' }, { run: 'home', arg: 'brekka' }] },
      {
        if: [{ quest: 'greyback', is: 2 }],
        say: `"Dead? The Greyback?" She makes you tell it twice, and the second time she wants the details. Then she is gone, with a sledge and a knife, and back before dark with the hide. She cuts and stitches by the fire while you wait, and does not say a word until it is done. "There." She hangs it round your shoulders. "He kept me cold for six winters. He can keep you warm."`,
        do: [{ give: 'bearcloak' }, { quest: 'greyback', stage: 3 }, { score: 8, id: 'greyback.done' }, { set: 'goal.brekka', to: false }],
      },
      { say: `"Still alive, then. Out here that's most of the news there is."` },
    ],
    topics: {
      work: [{ say: `"I walk a long way for my skins, and I see what there is to see."`, do: [{ run: 'rumour', arg: 'Brekka the trapper' }] }],
      wolf: `"More of them every winter, and bolder. I take their pelts and they take my hares. It evens out, mostly in their favour."`,
      bear: [
        {
          if: [{ quest: 'greyback', is: 0 }],
          say: `"The white ones I can live with. There's one bear I'd pay to see dead. A grey one, old, with a scar across his face, bigger than any white bear you've met. He follows my trap-lines and eats what I catch, and last month he ate the dog." She spits. "He dens in the crags. Kill the Greyback, and I'll make you something from his hide that you'll not be sorry to own."`,
          do: [{ run: 'haunt', arg: 'greyback' }, { quest: 'greyback', stage: 1 }, { score: 2, id: 'greyback.start' }],
        },
        { if: [{ quest: 'greyback', is: 1 }], say: `"He dens in the crags, and he's not hard to find. He finds you. Keep your guard up: he swings slow, but he only has to land once."` },
        { say: `"White, big as a shed, and bad-tempered about being woken. Stay in front of one and keep your guard up: it swings slow, but it only has to land once."` },
      ],
      dog: [
        { if: [{ quest: 'greyback', is: 3 }], say: `"Stone. He'd have liked that cloak. He liked anything that smelled of bear, right up to the end."` },
        { say: `"Stone. Ugly as a boot, and worth two of me on a trap-line." She looks at the peg by the door, where a collar hangs. "Six winters he kept that bear off the catch. The seventh, he was slower."` },
      ],
      weather: [
        { if: [{ flag: 'winter.broken' }], say: `"It let go. I felt it in the night, like a hand coming off the back of my neck." Brekka scowls at the sky. "Now the snow will rot and the pelts will be poor. I'm not complaining."` },
        { say: `"It was never this cold when I was a girl. Something has got into the winter."` },
      ],
      village: `"Hollowmere? I go in at midsummer, sell my skins to the smith, and come straight out again. Too many people. Eleven roofs!"`,
      pelt: `"Four silver for a wolf, ten for a bear, if you can carry it. I pay better than that tight-fisted smith."`,
      pack: [
        { if: [{ has: 'trappack' }], say: `"It'll outlast you, if you keep it out of rivers." She tugs the chest-strap anyway, the way she would test a snare, and grunts.` },
        {
          if: [{ has: 'pelt', n: 6 }],
          say: `"Six. Lay them out." She goes over each pelt as if it owed her money, and throws none of them back. Then she sits down by the fire with an awl and a hank of sinew and does not speak again until the light has gone. What she hands you at the end of it is a pack of grey wolf-hide, fur turned in, with a frame of willow sewn into the back and a strap across the chest. "There. Six wolves carried their own winters on their backs all their lives," she says. "They can carry yours."`,
          do: [{ lose: 'pelt', n: 6 }, { give: 'trappack' }, { score: 3, id: 'brekka.pack' }, { sound: 'quest' }],
        },
        { say: `"That bag." She looks at it as she looked at you the first time, as at a pelt, and finds it wanting. "You carry like somebody who means to come back for things. Out here nobody comes back for things. Bring me six wolf pelts, sound ones, and I'll make you something worth carrying." She is already measuring your shoulders with her eye.` },
      ],
      potion: `"Seven silver. My own brewing: frostcap, red moss, and a thing I'll not name. It'll close a wound."`,
      name: `"Brekka. My mother had hopes for me. They didn't include this."`,
      rhyme: `"Out here you sing to tell the bears where you are, and they're not particular about the words."`,
      wight: [
        { if: [{ flag: 'winter.broken' }], say: `"Sat down. Every one, where it stood, at the side of whatever track it was on, looking north. I walked my lines by moonlight last night for the first time in my life, and met nothing but an owl." Brekka shakes her head. "I'm keeping the knife by the bed all the same."` },
        { say: `"The dead are walking. They don't come for the traps; they go by. All one way, like geese that have got it wrong: north. And nobody puts them in the ground. You can't get a spade in it."` },
      ],
      trap: `"Deadfalls for marten, snares for hare, and a pit for anything bigger, which I've never yet had the courage to look into. You learn to read snow like a page. Most of what it says is: something was here, and it was hungry."`,
      wild: `"Wood, fell, water, wood again, and then a wall of rock right round the lot, with reavers sat in every gap. And past that, more of it, and another wall. It gets worse the further you go, and so does the pay, for those who hunt."`,
      north: `"There's a gate up there with dead men on it. I've seen it from the last ridge. I've no skins to sell to dead men."`,
    },
    shrug: `"I know traps and weather," says Brekka. "The rest is somebody else's trouble."`,
    full: `"You're carrying more than my sledge does," says Brekka. "Empty something out first. I don't mind things for people. They don't come back for them."`,
    menu: [
      { label: 'Buy a red draught (7 silver)', say: 'buy potion' },
      { label: 'A pack, from six wolf pelts', say: 'ask brekka about pack', if: [{ not: { has: 'trappack' } }] },
      { label: 'Sell a wolf pelt (4 silver)', say: 'sell pelt', if: [{ has: 'pelt' }] },
      { label: 'Sell a bearskin (10 silver)', say: 'sell bearskin', if: [{ has: 'bearskin' }] },
      { label: 'Sell frostcaps (2 silver)', say: 'sell herb', if: [{ has: 'herb' }] },
      ask('brekka', 'The country round about', 'work'),
      ask('brekka', 'The bears', 'bear'),
      ask('brekka', 'The walking dead', 'wight'),
    ],
  },

  ivar: {
    id: 'ivar',
    name: 'Ivar One-Glove',
    nouns: ['ivar'],
    spec: { skin: 'skin', hair: 'white', hairStyle: 'short', beard: true, tunic: 'green', legs: 'grey', boots: 'fur', cloak: 'leather' },
    look: 'An old hunter, lean as a rail. His right sleeve is pinned up at the wrist, and his left hand is bare and the colour of oak. He leans on a spear he plainly no longer needs for walking.',
    lookWhen: [{ if: [{ quest: 'message', is: 3 }], look: 'An old hunter, lean as a rail. His right sleeve is pinned up at the wrist, and on his left hand is a glove of good grey wool, which he keeps looking at. His spear is yours now, and he does not seem to miss it.' }],
    talk: [
      { if: [{ not: { flag: 'ivar.met' } }], say: `"Sit, if you can find something to sit on." He does not get up. "Ivar. They call me One-Glove; the other is inside a bear, and I hope it disagreed with him. I hunted this country forty years. Now I mostly watch it."`, do: [{ set: 'ivar.met' }, { run: 'home', arg: 'ivar' }] },
      {
        if: [{ quest: 'message', is: 2 }, { has: 'glove' }],
        say: `You hold out the glove. Ivar looks at it for a long time, and then at his bare hand, and then he laughs until he has to sit down. "Forty years! And the left one, too. She kept count." He pulls it on. It fits. "Here. I'm past using this, and you're plainly not." He puts his boar-spear into your hands, and closes your fingers round it.`,
        do: [{ lose: 'glove' }, { give: 'spear' }, { quest: 'message', stage: 3 }, { score: 8, id: 'message.done' }, { set: 'goal.ivar', to: false }],
      },
      { say: `"Back again? Then you're harder to kill than you look, and I meant that kindly."` },
    ],
    topics: {
      work: [{ say: `"I don't walk as far as I did. But I know where things are, and things don't move much."`, do: [{ run: 'rumour', arg: 'Ivar One-Glove' }] }],
      wolf: `"A wolf comes in fast, bites, and is gone before you've finished swearing. Don't chase. Let it come to you, and be ready when it does."`,
      bear: `"He gave me fair warning. He stood up, and he took his time, the way they do. I was young and thought I was quicker." He holds up the hand he has left. "Watch for the moment before the blow. There's always a moment."`,
      weather: [
        { if: [{ flag: 'winter.broken' }], say: `"There's a north wind again. An honest one, with snow in it that lands. I stood out in it like a fool." Ivar shakes his head. "I don't know what you did up there, and at my age I've learned not to ask."` },
        { say: `"Forty winters, and each worse than the one before. And the wind's moved. When I was young it was the north wind you feared. Now you can walk north for a week and it gets quieter, and quieter, till you can hear your own eyelids." He looks at the fire. "I turned round. A hunter knows when a wood is too quiet."` },
      ],
      north: `"Quiet. No wind, no birds. I saw snow up there that wasn't falling. It was just there, in the air, like flies in amber. I'm not a man who turns round, and I turned round."`,
      village: `"Is Marta still Elder? Then it's still standing. Tell her Ivar's not dead, if she asks. She'll not ask."`,
      pelt: `"Four silver a wolf. Ten for a bear, and I'll want to hear how you did it."`,
      potion: `"Seven silver. Runa brews them, out past the old tower. I only sell them on."`,
      name: `"Ivar. The rest you can see for yourself."`,
      rhyme: `"Marta sang once, at a midsummer fire, before she was Elder and while she still sang. She'll tell you she never sang in her life." He grins. "Ask her."`,
      glove: `"The right one went with the hand, into a bear. I kept the left out of spite, and then I lost that too, crossing the mere. So now I'm One-Glove with no gloves at all, and the name's stuck anyway."`,
      trap: `"Hunting is waiting, mostly. You wait till the thing you want is where you want it, and then you don't miss. Fighting is the same, only the waiting is shorter. Watch for the moment before the blow."`,
      wild: `"There are towers out there that nobody remembers building, and vaults under them that somebody was at pains to keep shut. Take a light, if you go down. And there are walls: rock, right round the country, one outside another. Somebody holds every gap."`,
      wight: [
        { if: [{ flag: 'winter.broken' }], say: `"One sat down outside my door. He's there yet, with his back to the wall, facing north. I put a blanket over him. I don't know why. It seemed the least a neighbour could do."` },
        { say: `"They go north. I've watched them forty winters. None ever comes back south, so wherever it is they're going, they don't get there."` },
      ],
      elder: [
        {
          if: [{ quest: 'message', is: 0 }],
          say: `"Marta Coldhand. I asked her to marry me once. She said she'd sooner marry the weather. She was right, too." He is quiet a while. "She'll think the bear got all of me. Tell her it didn't. Tell her Ivar's not dead yet. I'd go myself, but my knees have opinions about the distance."`,
          do: [{ quest: 'message', stage: 1 }, { score: 2, id: 'message.start' }],
        },
        { say: `"Marta Coldhand. I asked her to marry me once. She said she'd sooner marry the weather. She was right, too."` },
      ],
    },
    shrug: `"That's a young man's question," says Ivar, "and I've forgotten the answer."`,
    full: `"Lighten that pack first," says Ivar. "I went through the ice on the mere once, for the sake of one more thing on my back. That's where my other glove is."`,
    menu: [
      { label: 'Buy a red draught (7 silver)', say: 'buy potion' },
      { label: 'Sell a wolf pelt (4 silver)', say: 'sell pelt', if: [{ has: 'pelt' }] },
      { label: 'Sell a bearskin (10 silver)', say: 'sell bearskin', if: [{ has: 'bearskin' }] },
      { label: 'Sell frostcaps (2 silver)', say: 'sell herb', if: [{ has: 'herb' }] },
      ask('ivar', 'The country round about', 'work'),
      ask('ivar', 'His missing glove', 'bear'),
      ask('ivar', 'The Elder', 'elder'),
      ask('ivar', 'The north', 'north'),
    ],
  },

  runa: {
    id: 'runa',
    name: 'Runa',
    nouns: ['runa'],
    spec: { skin: 'skin', hair: 'brown', hairStyle: 'long', tunic: 'green', legs: 'green', boots: 'leather', dress: true, apron: 'cream', collar: 'fur' },
    look: 'A small brisk woman with bunches of grey things hanging from her belt, and her hands stained black to the wrist. She smells of smoke and of something sharper.',
    talk: [
      {
        // The errand the Elder sent: this comes before any greeting.
        if: [{ quest: 'hearth', is: 2 }],
        say: `She does not ask who you are. She asks who sent you, and when you tell her, she laughs once, without much pleasure in it.\n\n"Marta Coldhand wants something from me. Is Halla still telling people the red draughts are Fenn's?"\n\nYou say you would not know.\n\n"They're mine." She takes down a stone bottle and begins to fill it from a pot. "Three frostcaps and a long night. It puts back what the cold takes out, and it stays put back. Who is it for?"\n\nYou tell her about the girl under the furs, and the hall, and the frost on the walls.\n\n"And she's breathing?"\n\nYou think about it. You cannot remember having seen her breathe.\n\nRuna stops pouring for a moment, and then goes on.\n\n"Fenn taught the two of us our letters, Marta and me, the one winter," she says. "She was quicker than I was. She was always quicker." She stops the bottle and puts it in your hands. "If the girl can swallow it, it'll mend her."\n\n"If," you say.\n\n"If," says Runa.`,
        do: [{ set: 'runa.met' }, { run: 'home', arg: 'runa' }, { give: 'bottle' }, { quest: 'hearth', stage: 3 }, { score: 5, id: 'hearth.bottle' }, { set: 'goal.runa', to: false }, { sound: 'quest' }],
      },
      { if: [{ not: { flag: 'runa.met' } }], say: `"Mind where you put your feet, there are frostcaps under that snow." She looks up at last. "Oh. A person. I'm Runa. I gather, I dry, I brew. If you've picked anything on your way, I'll pay for it, and if anything has picked at you, I can mend that too."`, do: [{ set: 'runa.met' }, { run: 'home', arg: 'runa' }] },
      { if: [LIT, { not: { flag: 'runa.heard' } }], say: `"She swallowed it?" Runa puts down what she is holding. "All of it? Then she'll do. She'll be loud for a month. They are, after." She picks it up again. "And Marta stopped. I'd not have bet on that." She thinks. "No. For a child, I would."`, do: [{ set: 'runa.heard' }] },
      { say: `"You again, and with all your fingers. Well done."` },
    ],
    topics: {
      work: [{ say: `"I go wherever the frostcaps grow, and that takes me about."`, do: [{ run: 'rumour', arg: 'Runa' }] }],
      herb: `"Frostcaps. They come up under the snow, in the lee of trees and beside still water, never in the open. Two silver, and I'll take as many as you bring."`,
      potion: `"Frostcap, red moss, and patience. Seven silver. Halla sells mine in the village and calls them Fenn's. I let her."`,
      moss: `"It grows on the north side of the old stones, and nowhere else. I'll not tell you which stones. A woman has to keep something back."`,
      wild: `"People call it empty. It's not empty. It's full of things that aren't people, which is a different thing, and in my view a better one."`,
      mend: `"For a cut, a draught. For the cold that gets into the bone and stays, my tonic. For anything worse, the old stones, if they're in a giving mood."`,
      tonic: `"Black, bitter, and it puts back what the cold takes out of you. For good, mind, not for an afternoon. It takes three frostcaps to make one, and I never have three to spare. Bring me your own."`,
      fenn: `"He taught me my letters, when I was small, and I taught him which mushrooms not to eat. He still owes me for that."`,
      // What Runa knows about Marta and the stone, for whoever asks before the hearth is lit.
      menhir: [
        { if: [LIT], say: `"That stone has done enough for one winter. Leave it be."` },
        { say: `"The one by the old watchtower? That's where he taught us. He sat us down in front of it with a slate, because it was nearer than walking to the tarn. I traced it, and it tasted of nothing. Marta traced it and went white, and wouldn't say why, and that night the milk froze in her mother's pail." Runa turns a frostcap over in her black fingers. "If you haven't put your hand on it, do, on your way back. And then go and look at that hall again."` },
      ],
      elder: [
        { if: [LIT], say: `"Born two roofs from me. Quicker than me at everything, and never once enjoyed it." Runa almost smiles. "Tell her the stuff is three frostcaps a bottle and she owes me three frostcaps."` },
        { say: `"Born two roofs from me. Quicker than me at everything, and never once enjoyed it. She'd not send to me for a headache. Whatever's in that hall, she's frightened of it." Runa looks at the pot. "I've been thinking, since you came, about the winter Fenn taught us our letters."` },
      ],
      weather: [
        { if: [{ flag: 'winter.broken' }], say: `"The frostcaps will sulk. Everything else is delighted."` },
        { say: `"The frostcaps like it. Nothing else does."` },
      ],
      wight: [
        { if: [{ flag: 'winter.broken' }], say: `"They've stopped. I went into the dead wood at dusk to see, and they were sitting down, every one, like people who've been told they can." Runa turns a frostcap over. "I'd got used to them. That's a terrible thing to say, but I had."` },
        { say: `"I've seen them, in the dead wood. They don't see me. I think they only see what's warm, and I've been cold a long time."` },
      ],
      name: `"Runa. Just Runa. Out here there's nobody to confuse me with."`,
      village: `"I was born under one of those eleven roofs. It was too loud. Out here I can hear things grow."`,
      tova: [
        { if: [LIT], say: `"Loud yet? Good."` },
        { say: `"Seven, you said. And not breathing that you saw, and not dead." She says nothing else for a while. "Take her the bottle."` },
      ],
    },
    shrug: `"If it doesn't grow, I've no opinion on it," says Runa.`,
    full: `"And where would it go? You're carrying half the country already." Runa waits, not unkindly, for you to put something down.`,
    menu: [
      { label: 'The winter Fenn taught her letters', say: 'ask runa about menhir', if: [COLD, { quest: 'hearth', min: 3 }] },
      { label: 'Buy a red draught (7 silver)', say: 'buy potion' },
      { label: 'Sell frostcaps (2 silver)', say: 'sell herb', if: [{ has: 'herb' }] },
      { label: 'Sell a wolf pelt (4 silver)', say: 'sell pelt', if: [{ has: 'pelt' }] },
      { label: 'Sell a bearskin (10 silver)', say: 'sell bearskin', if: [{ has: 'bearskin' }] },
      { label: 'Trade three frostcaps for a tonic', say: 'buy tonic', if: [{ has: 'herb', n: 3 }] },
      ask('runa', 'The country round about', 'work'),
      ask('runa', 'Marta', 'elder'),
      ask('runa', 'Her tonic', 'tonic'),
      ask('runa', 'The walking dead', 'wight'),
    ],
  },

  gorm: {
    id: 'gorm',
    name: 'Gorm the farmer',
    nouns: ['gorm'],
    spec: { skin: 'skin', hair: 'blond', hairStyle: 'short', beard: true, tunic: 'leather', legs: 'grey', boots: 'leather', collar: 'white' },
    look: 'A big, slow farmer in a sheepskin jerkin, with the stunned look of a man who has been robbed and has not finished being angry about it.',
    lookWhen: [{ if: [COLD], look: 'A big man in a sheepskin jerkin, sitting with his head in his hands. Somebody tells you, as if it explained him, that robbers took his seed grain.' }],
    talk: [
      { if: [{ flag: 'hall.feast' }], brief: true, say: `Gorm stands looking at the fire the way he looks at a field in a good year. "That will do," he says, to nobody in particular. "That will do."` },
      { if: [{ flag: 'hall.thaw' }], brief: true, say: `"I've a ewe leaning on my leg in a field gone soft," says Gorm, "and I left her to come and eat with you. Don't tell her."` },
      {
        if: [{ has: 'ewe' }, { at: ['farm'] }],
        say: `Gorm sees her before he sees you. He does not say anything. He goes down on one knee in the snow and takes her face in both hands, and she lets him, which you would not have bet on. "Bryn," he says. "That's Bryn. She went through the fence the night they took the grain." He stands, and counts along the pen with his lips moving, and gets to four. "Four," says Gorm, to the sheep, the farm, and you. "I can count to four again." He gives you everything he has in his pockets, which is nine silver and the end of a cheese.`,
        do: [{ lose: 'ewe' }, { set: 'farm.stray' }, { gold: 9 }, { give: 'cheese' }, { sound: 'quest' }],
      },
      {
        if: [{ quest: 'stores', is: 0 }, LIT],
        say: `"They came at night, two nights after the fires went. Took the seed grain. All of it." Gorm looks at the barrel by the door, which is very empty. "There was smoke from the one roof in the whole valley, then. From up on the pass it must have looked as if there was nobody left down here to mind." He breathes out. "A farm can lose a winter. It can't lose a spring. They're camped south-west, past the ford; I saw their smoke. I'm no fighter. Bring back my grain and I'll pay you everything I have, which is twenty-five silver."`,
        do: [{ quest: 'stores', stage: 1 }, { score: 2, id: 'stores.start' }],
      },
      {
        if: [{ quest: 'stores', is: 0 }],
        say: `"They came at night, two nights after the fires went. Took the seed grain. All of it." Gorm does not lift his head far out of his hands. "One chimney smoking in a whole valley. From up on the pass it must look as if there's nobody left down here to mind." He breathes out. "A farm can lose a winter. It can't lose a spring. They're camped south-west, past the ford; I saw their smoke. Smoke! They can keep a fire, out there. I'm no fighter. Bring back my grain and I'll pay you everything I have, which is twenty-five silver."`,
        do: [{ quest: 'stores', stage: 1 }, { score: 2, id: 'stores.start' }],
      },
      {
        if: [{ quest: 'stores', is: 1 }, { has: 'grain' }],
        say: `You swing the sack down off your shoulder. Gorm looks at the G burned into it, then at you, then at the sack again, and for a moment you think he is going to cry. He counts twenty-five silver into your hand instead, very carefully, and then adds a cheese.`,
        do: [{ lose: 'grain' }, { gold: 25 }, { give: 'cheese' }, { quest: 'stores', stage: 2 }, { score: 10, id: 'stores.done' }],
      },
      { if: [{ quest: 'stores', is: 1 }], say: `"South-west, past the ford. You'll see their smoke. Mind yourself."` },
      { if: [THAW], say: `"The snow on the south field has gone soft. Soft! I put my hand in it." Gorm holds the hand up, as if it might still be wet. "I'll be sowing in a month. You'll have the first loaf, Thane, and the second."` },
      { if: [COLD], say: `"There'll be a spring now, thanks to you. If there's a spring." Gorm looks at Halla's little fire. "I'd give the grain back to see that stand up straight."` },
      { say: `"There'll be a spring now, thanks to you. Have you met the sheep? They like you. As much as they like anything."` },
    ],
    topics: {
      sheep: [
        { if: [{ flag: 'farm.stray' }], say: `"Four. I had eleven, and then three, and now four. I count them every night. It doesn't take long, but I enjoy it more than I did."` },
        { say: `"Three left. I had eleven. Wolves, cold, one that simply gave up, and one that went through the fence the night they came for the grain. She'll be bones by now."` },
      ],
      grain: `"Seed for the whole east field, in a sack with my mark on it: a G in a ring."`,
      bandit: `"Three of them, I think. One with a bow. They laughed, that's what I remember."`,
      camp: `"South-west, past the ford, in the trees. I saw smoke."`,
      work: `"Bring back my grain. That's all the work I have, and all I can pay for."`,
      tarn: `"North-east. Old Fenn lives on the shore. Don't cross the ice: it looks sound and isn't."`,
      tower: `"The old watchtower, out past the ford, a morning down the south road. Nobody goes there. Somebody has been lately; I've seen a light. A fire'll light, out there."`,
      name: `"Gorm. That's my mark on the sack."`,
      rhyme: `"I sing to the ewes at lambing. They don't care for it, but they hold still to listen, and that's all I ask of a song."`,
      tova: [
        { if: [LIT], say: `"She came out to the farm on Odd's shoulders and told my ewes their names. They'd names already. They've others now."` },
        { say: `"Odd's little one. She used to come and count my sheep for me, wrong." He puts his head back in his hands.` },
      ],
      cup: [
        { if: [{ quest: 'stores', is: 2 }], say: `"Never had a feast at my place to set one at. If I did, I'd have set one for my seed grain." He considers this. "And it came home."` },
        { say: `"Never had a feast at my place to set one at. If I did, I'd set one for my seed grain, and see if it came home."` },
      ],
    },
    shrug: `"I only know sheep and soil," says Gorm. "And that my grain is gone."`,
    menu: [
      ask('gorm', 'The stolen grain', 'grain'),
      ask('gorm', 'The robbers', 'bandit'),
      ask('gorm', 'The sheep', 'sheep'),
      ask('gorm', 'The old watchtower', 'tower'),
    ],
  },

  // She kneels in the hollow past the gate. What can be done there is in the room's rules.
  kneeler: {
    id: 'kneeler',
    name: 'The woman',
    // "Woman" is one of the baker's words; out here it can only mean this one.
    nouns: ['kneeler', 'sigga'],
    spec: { skin: 'ice', hair: 'white', hairStyle: 'long', tunic: 'snow', legs: 'snow', boots: 'snow', dress: true, cloak: 'snow', eyes: 'ice', hunch: true, outline: 'ice', ragged: true },
    look: 'The cold has kept her as she was the hour she knelt down, and she might be any age. Frost has grown over her shoulders like a fur. Her eyes are open and white. Her hands are spread flat on the drift in front of her, the way you would put your hands on somebody\'s back to feel them breathing, and her lips are moving. On one of her hands is a brass ring.',
    lookWhen: [{ if: [{ flag: 'hollow.joined' }], look: 'Her lips have stopped. She is looking at you, and at your hand, and at the ring on it.' }],
    talk: [
      { if: [{ flag: 'hollow.joined' }], brief: true, say: 'She does not speak. Whatever she had to say, she has been saying it for three hundred winters, and she has stopped.' },
      { brief: true, say: 'She does not hear you. Her lips are moving, and they have been moving for longer than Hollowmere has had a hall. She is saying ISKA, ISKA, ISKA, without a breath between, because the dead do not get tired, and do not have to wait.' },
    ],
    shrug: 'She does not hear you. She is saying the one word.',
  },
};

