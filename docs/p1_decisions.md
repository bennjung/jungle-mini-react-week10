# Phase 1 결정 기록

## P1-HTML-01 — HTML 테스트 범위와 편집기 읽기 계약

- **상태:** accepted — 사용자 합의. 테스트 결과는 별도 기록한다.
- **날짜:** 2026-11-07
- **결정:** `readEditorHTML(editor: HTMLTextAreaElement): string`으로 편집기 요소를 인자로 전달한다. HTML-01·02는 테스트를 먼저 작성해 실패를 확인한 뒤 구현한다. HTML-03은 테스트만 먼저 작성하고 Snapshot 구현 후 통과를 확인한다. HTML 구현 당시에는 INIT의 연결 대기 주석을 유지했으며, 이후 INIT 변경은 P1-INIT-TDD-01을 따른다.
- **명세 확인:** HTML-01은 `readEditorHTML(editor)` 단독으로 `<div>\n  <p>A</p>\n</div>`의 실제 줄바꿈·들여쓰기를 그대로 읽는다. HTML-02는 `parseHTML()` 단독으로 `<section class="box"><p>A</p></section><span>B</span>`를 파싱하고 기존 `<p>기존</p>` 화면을 유지한다. HTML-03은 기존 실제 영역·현재 VDOM에 자식이 있는 상태에서 `parseHTML("")` → `createSnapshot()`까지만 실행하고 `{ childNodes: [], dom: null }`과 기존 화면·상태 유지를 검증한다.
- **검증 시점:** 각 대상 함수 반환 직후. Diff·Patch·렌더링·이력 저장은 호출하지 않는다.
- **구현:** `src/app/editor.ts`는 `editor.value`를 그대로 반환한다. `src/vdom/create.ts`의 `parseHTML()`은 화면에 붙이지 않은 `<template>`에 HTML을 파싱하고 `content`를 반환한다. `createSnapshot()`은 이번에 구현하거나 대역으로 대체하지 않는다.
- **실패 확인:** HTML-01은 구현 파일 부재로 테스트 수집이 중단됐고, HTML-02는 `parseHTML is not a function`으로 호출 시 중단됐다. 둘 다 assertion 실패가 아닌 미구현 오류임을 구분한다. 구현 후 두 테스트의 assertion은 통과했다.
- **보류:** HTML-03은 `createSnapshot(parseHTML(''))` 호출에서 `createSnapshot is not a function`으로 중단되어 assertion에 도달하지 못한다. 테스트가 존재하지 않는 named export를 참조하므로 타입 검사에도 TS2305가 남는다. Snapshot 구현 시 같은 테스트로 다시 확인하며, 통과를 위해 테스트를 skip하거나 기대값을 바꾸지 않는다.
- **검증 한계:** HTML-01·02는 실제 화면의 내용·노드 동일성과 편집기 원문 보존을 검증한다. 실제 History 모듈이 아직 없으므로 앱 History·현재 VDOM과의 통합 유지 검증은 수행하지 않았다. HTML-03에는 기존 DOM·현재 VDOM fixture 유지 assertion을 작성했으나 아직 실행되지 않았다.
- **최종 실행:** `npm test`에서 HTML은 2개 통과·1개 실패, HTML 구현 당시 전체 결과는 7개 중 4개 통과·3개 실패였다. 이후 INIT mock 전환 결과는 P1-INIT-TDD-01과 테스트 진행표를 따른다. `npm run typecheck`의 오류는 HTML-03의 미구현 `createSnapshot` 참조(TS2305) 1건이다.
- **영향 범위:** 편집기 읽기, HTML 파싱, HTML-03 테스트 및 관련 명세·진행표. `writeEditorHTML()` 계약은 이번에 확정하지 않는다.

## P1-INIT-TDD-01 — INIT 함수 분리와 mock 기반 단위 검증

- **상태:** 단위 검증 통과 — 실제 함수 통합 검증은 대기
- **날짜:** 2026-11-07
- **변경된 합의:** 이전의 의존 함수 연결 대기·주석 처리 방식에서, 사용자 요청으로 초기화 함수를 분리하고 mock을 주입하는 방식으로 변경한다. 실제 History 모듈은 이번에 구현하지 않는다. FLOW-01은 계속 보류한다.
- **공개 경계:** `createInitializer(elements, history, dependencies)`가 `initializeDOM(sampleHTML): void`를 반환한다. INIT-01은 이 함수에 명세의 `<section><p>A</p></section>`을 직접 전달한다. `init(dependencies)`도 같은 팩터리로 만든 초기화 함수를 호출한다.
- **구현:** 요소 조회 → History 생성 → 샘플 확보 → 초기화 → 핸들러 생성·버튼 연결 → 현재 VDOM 조회 순서다. 초기화는 빈 VDOM 생성 → 파싱 → Snapshot → Diff → Patch → 편집기 표시 → 첫 이력 저장을 수행한다. 임시 빈 루트 반환과 기존 연결 대기 주석은 제거했다.
- **주입 계약:** `InitializerDependencies`는 `parseHTML`, `createSnapshot`, `diff`, `applyPatch`를 제공한다. `InitDependencies`는 여기에 `createHistory`, `getSampleHTML`, `createHandlers`를 추가한다. `InitializationHistory`는 초기화에서 사용하는 `set(vdom, html)`·`get()`만 표현하며 History 전체 API·저장 방식·빈 상태 정책을 확정하지 않는다.
- **핸들러 경계:** `createHandlers(elements, history)`가 반환한 `handlePatch`·`handleHistoryMove`를 `bindEvents()`로 연결한다. 이벤트 연결 함수는 알고리즘·이력 복원 로직을 구현하지 않는다.
- **구현 선택:** `init()`에 의존 함수 없이 진입하면 미연결 오류를 발생시킨다. 실제 의존성이 없는데 초기화 완료로 보이는 빈 루트를 반환하지 않기 위해서다. `src/main.ts`는 아직 인자 없는 `init()` 호출이므로 현재 기본 페이지 실행은 이 오류에서 중단된다. 실제 앱 연결이 완료된 상태가 아니다.
- **테스트:** `tests/unit/app.init.test.ts`는 INIT-01 2개·INIT-02 1개로 총 3개다. 파싱은 실제 `parseHTML`을 `vi.fn`으로 감싸고, Snapshot·Diff·Patch·History·이벤트 핸들러는 테스트 파일의 mock을 사용한다. 테스트 대역은 앱 런타임에 포함하지 않는다.
- **검증 내용:** INIT-01은 인자 전달·빈 비교 기준·Snapshot/Diff 시점의 참조 미연결·Patch 후 전체 참조·편집기 원문·첫 저장 1회·컨테이너 유지·샘플 중복 방지를 확인한다. INIT-02는 클릭 전 첫 이력, Patch 콜백 1회·추가 저장 1회, 뒤로 -1·앞으로 1 콜백 각 1회와 이동 시 추가 저장 없음을 확인한다.
- **실패 확인:** 테스트를 먼저 작성했을 때는 `initialize` 모듈 부재로 수집이 중단됐다. 팩터리 구현 후 INIT-01 2개는 통과했고, INIT-02는 `createHistory` 호출 0회로 assertion이 실패했다. `init()`과 버튼 연결 구현 후 INIT 3개가 통과했다.
- **검증 한계:** mock Patch가 테스트용 DOM을 만들고 mock History가 저장 호출을 기록한다. 실제 변경 명령 계산·DOM 연산 알고리즘·이력 데이터 복사·화면 복원·실제 핸들러의 저장 횟수를 검증한 것은 아니다. 이 부분은 실제 함수 통합 테스트로 확인한다.
- **Patch 호출:** `applyPatch(prevRoot, nextRoot, changes)`는 현재 연결용 초안이며 반환값은 사용하지 않는다. `P1-PATCH-LINK-01`의 최종 Patch 인자·반환 계약은 pending으로 유지한다.
- **영향 범위:** `src/app/initialize.ts`, `src/app/init.ts`, `tests/unit/app.init.test.ts`와 관련 PRD·함수 흐름·인터페이스·테스트 명세·진행표.

### 통합 테스트 전 실제 함수 연결 위치

이제 주석 해제 대신 `init(dependencies)`에 실제 구현을 주입한다. 테스트 파일의 mock을 앱에 복사하지 않는다.

| 주입 위치 | 실제로 연결할 함수 | 역할 |
| --- | --- | --- |
| `dependencies.parseHTML` | `src/vdom/create.ts`의 `parseHTML` | HTML 파싱. 실제 구현 있음 |
| `dependencies.createSnapshot` | Snapshot 구현 | DOM 참조 없는 VDOM 생성. 구현 대기 |
| `dependencies.diff` | 팀원의 Diff 구현 | 이전·다음 VDOM의 변경 명령 계산 |
| `dependencies.applyPatch` | 팀원의 Patch 구현 | 실제 DOM 반영과 다음 VDOM 전체 참조 연결 |
| `dependencies.createHistory` | 실제 History 생성 함수 | 저장 데이터와 현재 live VDOM 관리. 구현 대기 |
| `dependencies.getSampleHTML` | 기존 `SAMPLE_HTML`을 반환하는 함수 | 초기 샘플 원문 공급 |
| `dependencies.createHandlers` | 실제 `handlePatch`·`handleHistoryMove`를 만드는 함수 | 전달받은 요소·History로 변경 처리·화면 복원 |

- 연결 진입점은 `src/main.ts`의 `init()` 호출이다. 실제 함수를 조립해 `init(dependencies)`로 전달한다.
- 팩터리의 빈 비교 VDOM 생성·편집기 표시·첫 이력 저장과 `bindEvents()`의 버튼 연결은 이미 실행 코드다. 주석 해제나 임시 루트 제거 작업은 더 이상 필요하지 않다.
- Patch는 `P1-PATCH-LINK-01` 확정 후 실제 계약에 맞춘다. 완성된 VDOM을 반환하는 계약이면 초기화의 저장 대상도 그 계약에 맞춰 연결한다.
- 통합 테스트는 실제 VDOM 생성·Diff·Patch·History·핸들러를 사용한다. Snapshot/Diff 후 전체 `dom: null`, Patch 후 전체 참조 연결, 초기 이력 1개, 실제 버튼 변경·복원과 이력 추가 횟수를 확인한다.

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

## P1-ENV-01 — Phase 1 구현·테스트 환경

- **상태:** accepted
- **날짜:** 2026-11-07
- **결정:** TypeScript strict, Vite, Vitest + jsdom으로 구현·테스트한다. Playwright는 사용하지 않는다. npm lockfile을 사용하고 앱 런타임 의존성은 추가하지 않는다.
- **이유:** VNode·DiffCommand 계약을 타입으로 고정하고, 브라우저와 유사한 DOM 환경에서 단위·통합 테스트를 실행하기 위해서다.
- **인터페이스:**
  - `npm run dev` — `main.html` 개발 서버
  - `npm run typecheck` — `tsc --noEmit`
  - `npm test` — Vitest + jsdom
  - `npm run check` — typecheck + test
  - `npm run build` — typecheck + Vite build
- **영향 범위:** `package.json`, `tsconfig.json`, `vite.config.ts`, `tests/`; 인터페이스는 `p1_interfaces.md`
- **미확정:** coverage 기준, mutation testing 도입 여부, 브라우저 기능 테스트를 수동으로만 할지 여부.

## P1-VDOM-ROOT-01 — 논리적 루트를 VRoot로 분리

- **상태:** accepted
- **날짜:** 2026-11-07
- **결정:** 요소·텍스트 노드는 `VNode`로, 실제 영역 컨테이너에 대응하는 논리적 루트는 `VRoot`로 분리한다.
- **이유:** 논리적 루트는 DOM의 Element나 Text가 아니므로 `nodeType: 1, tagName: null`로 표현하면 의미가 섞인다.
- **인터페이스:**
  - `interface VRoot { childNodes: VNode[]; dom: Element | null }`
  - `createEmptyVDOM(actualRoot): VRoot` — `{ childNodes: [], dom: actualRoot }`
  - `createSnapshot(parsedRoot): VRoot` — `{ childNodes: [...], dom: null }`
  - `diff(prevRoot: VRoot, nextRoot: VRoot): DiffCommand[]`
  - `applyPatch()`의 인자·반환·유지 노드 연결 방식은 P1-PATCH-LINK-01 미확정
- **영향 범위:** `p1_prd.md` §3, §5, §6, §9.1; `p1_function_flow.md` §3, §5, §6; `p1_test_cases.md` §1, SNAP-05, PATCH-08
- **미확정:** `VRoot` 자체는 확정. `applyPatch()`의 인자·반환·유지 노드 연결 방식은 P1-PATCH-LINK-01. `VRoot`는 컨테이너 태그·속성을 Diff하지 않는다. 인터페이스는 `p1_interfaces.md`의 §1–§3을 따른다.

## P1-KEY-01 — key attribute를 실제 DOM에도 렌더링

- **상태:** accepted
- **날짜:** 2026-11-07
- **결정:** 요소의 `key` attribute는 `attributes`에서 제거하지 않고 실제 DOM에도 렌더링한다. `matchChildren()`은 같은 `attributes`의 `key` 값을 읽어 식별자로 사용한다.
- **이유:** 실제 DOM에서 key를 확인해 노드 대응·유지·교체 결과를 검증할 수 있고, 속성별 예외 로직 없이 일반 속성 처리와 일관성을 유지할 수 있다.
- **영향 범위:**
  - `p1_prd.md` §5, §9.1
  - `p1_function_flow.md` §5
  - `p1_test_cases.md` §1, SNAP-04, SNAP-05, PATCH-08
- **미확정:** 같은 부모 안의 중복 key, key 값 변경, 같은 key의 태그 변경 대응은 CONF-03.

## P1-UI-01 — main.html 좌우 2분할 화면과 초기 루트

- **상태:** accepted
- **날짜:** 2026-11-07
- **결정:** `main.html`을 Vite 진입점으로 사용한다. 화면은 좌우 2분할이며 왼쪽은 HTML 코드 편집기, 오른쪽은 실제 영역이다. 실제 영역 컨테이너는 `#actual`이다. Patch·뒤로·앞으로 버튼은 하단 푸터에 둔다. `init()`은 `createEmptyVDOM(#actual)`로 초기 `VRoot.dom`을 연결한다.
- **이유:** 편집기와 렌더링 결과를 동시에 비교하고, Patch·이력 이동을 한 곳에서 조작하기 위해서다.
- **인터페이스:**
  - `getElements(): { editor, actualRoot, patchButton, backButton, forwardButton }`
  - `init(dependencies?): { elements, root: VRoot }` — 의존 함수 주입은 P1-INIT-TDD-01에서 추가. 실제 호출에는 의존 함수가 필요하다.
- **영향 범위:** `main.html`, `src/styles/main.css`, `src/app/init.ts`; `p1_prd.md` §1; `p1_function_flow.md` §1
- **미확정:** 줄번호·문법 강조, 버튼 비활성화 UI, 오류 표시 방식.

## P1-PATCH-LINK-01 — 유지 노드의 실제 DOM 참조 연결 방식

- **상태:** pending
- **날짜:** 2026-11-07
- **배경:** `diff()`는 변경 명령만 반환한다. Patch가 끝나면 다음 VDOM의 모든 노드가 실제 DOM을 가리켜야 하지만, 변경 없는 노드는 명령에 포함되지 않는다.
- **제안 A:** `applyPatch(prevRoot, nextRoot, changes)`가 `matchChildren()`을 다시 실행해 유지 노드에 `prev.dom`을 연결하고 완성된 `nextRoot`를 반환한다. `diff()`는 지금처럼 명령 배열을 반환한다.
- **대안 B:** `diff()`가 `{ changes, matches }`를 반환한다. 매칭을 한 번만 하지만 TC·문서의 `diff()` 반환 계약을 바꿔야 한다.
- **미확정:** A/B 선택, `matchChildren()` 소유권과 분담 구조.
- **인터페이스 초안:** `p1_interfaces.md` §4–§6
- **영향 범위:** `p1_prd.md` §3, §9.2; `p1_function_flow.md` §3; `p1_test_cases.md` PATCH-01–08
