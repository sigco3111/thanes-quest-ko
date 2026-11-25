# Walkthrough 한글화 상태 (2026-11-25 15:52 KST)

engine.test 205/205 녹색 완료. walkthrough.test.ts 한글화 진행 중.
- .work/align.txt: 라인번호\t영문기대값\t실제한국어출력(앞300자). probe2 기준 103건 정렬됨.
- tests/walkthrough-probe.test.ts: 로깅 프록시 (완료 후 삭제).
- 할 일: align.txt 각 행에 대해 실제 출력에서 의미 동등한 한국어 부분문자열을 골라
  tests/walkthrough.test.ts 의 toContain 기대값을 치환. 의미 보존, 확장 금지.
- 아래 11건 + 1건 동적은 이미 결정됨 (라인번호 => 한국어):
  50 => 거기 말고
  85 => 새까맣게 식었다
  146 => 그 단어를 안다
  156 => 돌아본다.
  I'll keep the broom 라인(align.txt에서 검색) => 빗자루는 내가 간직할 테니
  437 => 발 닦아라
  458 => 남은 창을 든다
  475 => 망루에서 눈이 멎은 것처럼
  492 => 너는 네 손을 본다.
  517 => 가늘고 놀라운 비
  540 => 문 닫아
  301 (동적 `${pay} silver`) => `은화 ${pay}닢`
- 완료 후: walkthrough 6/6 녹색 확인 → probe/.work 삭제 → 전체 vitest + npm run build
  → NPC 대화 스크린샷 → 수동/모바일 검증 → 배포(sigco3111/thanes-quest-ko, 저장소 먼저)
  → 한글 README → 부모 보고. Notion은 사용자 승인 전 금지.
