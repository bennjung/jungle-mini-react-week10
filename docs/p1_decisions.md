# Phase 1 결정 기록

## P1-ROLLBACK-01 — applyPatch 실패 시 C1 복구

- **상태:** accepted
- **날짜:** 2026-11-07
- **결정:** `applyPatch()` 실행 중 예외가 발생하면 현재 이력 데이터로 실제 영역만 full render 복원하고, 편집기 HTML은 실패한 입력 그대로 유지한다. History는 저장·이동하지 않는다.
- **이유:** applyPatch가 중간에 실패하면 실제 DOM이 반쯤 변경된 상태로 남아 현재 live VDOM과 어긋난다. 현재 이력으로 복원하면 다음 Patch를 같은 편집 내용으로 재시도할 수 있다.
- **인터페이스:**
  - `saveHistory.peek(0)` — 현재 위치의 이력 데이터 `{ vdom, html }` 조회. 위치 이동 없음.
  - `saveHistory.move(0, liveVDOM)` — 위치 이동·이력 추가 없이 live VDOM만 교체.
  - `restoreSnapshot(entry, actualRoot, { restoreEditor: false })` — 실제 영역만 복원하고 편집기 HTML은 덮어쓰지 않음. `restoreEditor` 기본값은 true.
- **영향 범위:**
  - `p1_prd.md` §2 Patch, §3 applyPatch, §6 restoreSnapshot, §7 History, §8 테스트 연결
  - `p1_function_flow.md` §2 Patch, §3 applyPatch, §6 restoreSnapshot, §7 History, §8 테스트 연결
  - `p1_test_cases.md` FLOW-05 추가
- **미확정:** 복원 자체가 실패할 때의 오류 UI·재시작 정책, 사용자에게 오류를 표시하는 방식.
