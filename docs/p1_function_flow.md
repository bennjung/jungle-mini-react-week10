# Phase 1 함수 흐름 — Top down

기준: `p1_prd.md`, `p1_test_cases.md`. 아래 함수와 코드는 호출 구조를 설명하는 설계이며 구현 코드는 아니다.
테스트 영역은 HTML 코드 편집기, 실제 영역은 렌더링 화면이다.

합의한 참조 연결 시점은 다음과 같다.

| 단계 | 이전 VDOM | 다음 VDOM |
| --- | --- | --- |
| Snapshot 종료 | 현재 실제 DOM 참조 유지 | 논리적 루트와 모든 하위 노드의 dom이 null |
| Diff·명령 정렬 종료 | 현재 실제 DOM 참조 유지 | 참조 미연결 상태 유지 |
| Patch 성공 | 변경 전 비교 기준 | 유지된 노드와 새 노드를 포함해 실제 DOM 참조 연결 완료 |
| 현재 상태 지정·이력 저장 | 이전 상태 | 완성된 다음 VDOM을 현재 상태로 사용 |

아래 내용은 호출 흐름을 설명한다. Patch에 이전·다음 VDOM과 명령을 전달하는 구체적인 인자 형식, 완성된 VDOM의 반환·갱신 방식은 아직 확정하지 않는다.

## 1. main.html → 진입점

```text
main.html
└─ init()
   ├─ getElements()                     HTML 편집기·실제 영역·버튼 조회
   ├─ createHistory()                   저장 배열 + 현재 위치 관리
   ├─ getSampleHTML()                   초기 샘플 HTML 확보
   ├─ initializeDOM(sampleHTML)         빈 실제 영역에 샘플 반영·첫 이력 저장
   └─ bindEvents()
      ├─ Patch 클릭 → handlePatch()
      ├─ 뒤로 클릭  → handleHistoryMove(-1)
      └─ 앞으로 클릭 → handleHistoryMove(1)
```

`init()` 안에서 편집기·실제 영역·History를 만들고 핸들러가 클로저로 접근한다. 별도 전역 `curVDOM`은 두지 않는다.
초기화는 빈 VDOM과 샘플 VDOM을 비교하는 방식으로 통일한다. 빈 VDOM은 초기화의 비교 기준이며, 샘플이 반영된 상태를 첫 이력으로 저장한다.

## 2. 이벤트 핸들러

### Patch

```text
handlePatch()
├─ saveHistory.get()                    실제 DOM 참조를 가진 현재 VDOM 조회
├─ readEditorHTML()                     HTML 원문 읽기
├─ parseHTML(html)                      임시 DOM 트리 생성
├─ createSnapshot(parsedRoot)           실제 DOM 참조 없는 다음 VDOM 생성
├─ diff(curVDOM, nextVDOM)               변경 명령 계산, 다음 VDOM의 dom은 null 유지
├─ 변경 없음 → 종료                    기존 현재 VDOM과 이력 유지
├─ applyPatch()
│  ├─ 이전 VDOM의 참조로 실제 DOM 변경
│  └─ 다음 VDOM 전체의 실제 DOM 참조 연결 완료
└─ saveHistory.set(nextVDOM, html)       성공한 경우만 현재 상태 갱신·이력 저장
```

`readEditorHTML()`은 HTML 코드 편집기의 문자열을 읽는다.

History의 초기 상태는 이벤트 연결 전에 준비한다. 변경 없는 Patch는 DOM 반영·이력 저장을 생략하고 기존 현재 VDOM을 유지한다. 실패한 Patch는 저장하지 않는다. 일반 Patch에서는 편집 내용을 그대로 두고 실제 영역의 변경 부분만 갱신한다.

### 뒤로가기·앞으로가기

```js
function handleHistoryMove(direction) {
  const entry = saveHistory.peek(direction);
  if (entry === null) return;

  const liveVDOM = restoreSnapshot(entry, actualRoot);
  saveHistory.move(direction, liveVDOM);
}
```

`entry`는 DOM 참조 없는 VDOM 데이터와 해당 시점의 HTML 원문을 담는다. 이력 이동은 실제 화면과 코드 편집기를 함께 복원하며, 저장하지 않은 편집 내용은 선택한 이력의 HTML로 교체한다. 범위를 벗어나면 이동하지 않는다.

## 3. applyPatch() → 실제 DOM 변경과 다음 VDOM 참조 연결

```text
applyPatch()                            이전·다음 VDOM과 변경 명령을 이용하는 Patch 단계
├─ replaceNode(target, node)
│  ├─ renderNode(node)                  새 실제 DOM 생성·참조 연결
│  └─ 기존 DOM 교체
├─ updateNode(target, data)
│  ├─ updateText()                      텍스트 nodeValue 변경
│  ├─ updateAttributes()                속성 추가·변경·삭제
│  └─ updateProperties()                입력·선택 상태 변경
├─ insertNode(node, parent, before)
│  ├─ renderNode(node)
│  └─ 부모 DOM의 기준 형제 앞에 삽입
├─ removeNode(target)
│  └─ 대상 DOM 제거
├─ moveNode(target, parent, before)
│  └─ 기존 DOM을 기준 형제 앞으로 이동
└─ 다음 VDOM 전체에 실제 DOM 참조 연결 완료
   ├─ 유지·수정·이동 노드 → 이전 VDOM에서 찾은 실제 DOM 연결
   ├─ 삽입·교체 노드 → 생성된 실제 DOM 연결
   └─ 논리적 루트 → 실제 영역 컨테이너 연결
```

명령은 VDOM 객체를 직접 참조한다. Patch 시작 시 기존 실제 DOM은 이전 VDOM의 `dom`으로 찾으며, 다음 VDOM의 `dom`은 모두 null이다. 부모·기준 형제의 실제 DOM 참조도 Patch에서 해석한다. 이 참조는 편집기나 파싱용 임시 DOM을 가리키지 않는다.
`before === null`은 맨 뒤를 뜻한다. insert와 move는 `insertBefore()`로 위치를 적용하며, update와 move는 기존 DOM 객체를 유지한다.

기존 실제 DOM과 다음 VDOM의 연결은 Patch에서 수행한다. `renderNode()`는 새 실제 DOM을 생성할 때 해당 다음 VDOM 노드에 연결한다. 기존 노드를 유지·수정·이동하는 경우에도 다음 VDOM에 해당 실제 DOM 참조를 연결한다.

변경 명령이 없는 노드와 그 하위 트리도 연결 대상이다. Patch 성공 시 논리적 루트를 포함한 다음 VDOM 전체가 실제 DOM을 가리켜야 한다. 참조를 연결하려고 변경 없는 실제 DOM을 재생성하지 않는다.

## 4. diff() → 변경 명령 배열

```text
diff(curVDOM, nextVDOM)
├─ compareNode(prev, next)
│  ├─ 노드 종류·태그 변경 → replace
│  ├─ 텍스트 변경 → update
│  ├─ diffAttributes() → update의 속성 데이터
│  ├─ diffProperties() → update의 properties 데이터
│  └─ diffChildren()
│     ├─ matchChildren()               이전·다음 노드 대응 확인, 식별 규칙은 미확정
│     ├─ 새 노드 → insert
│     ├─ 사라진 노드 → remove
│     ├─ 식별된 기존 형제 순서 변경 → move
│     └─ 대응하는 자식 → compareNode() 재귀
└─ orderChanges() → 적용 순서가 보장된 명령 배열
```

Diff는 실제 DOM과 입력 VDOM을 수정하지 않는다. attributes와 properties는 필드 이름·값을 비교한다. 변경이 없으면 빈 배열을 반환한다. 다음 VDOM의 모든 `dom`은 Diff 종료 후에도 null이며, 노드 대응 관계를 계산하는 것과 실제 DOM 참조를 연결하는 것은 구분한다.

### 노드 식별 규칙 — 확인 필요

코드 파싱 때마다 임시 DOM 객체가 새로 생성되므로, 임시 DOM 객체의 직접 참조로 이전·다음 노드를 식별하지 않는다.
`data-key` 사용, key 없는 노드의 위치 기반 대응, 중복 key 오류 처리는 기존 에이전트 제안이며 미합의 상태다. 구체적인 식별 규칙은 사용자와 확정한 뒤 반영한다. 이 항목은 테스트 문서의 CONF-01–CONF-03에 대응한다.

### 명령 적용 순서

`orderChanges()`는 Patch에서 부모와 기준 형제가 생성된 뒤 사용되도록 명령 순서를 정한다. 제거된 노드를 이후 명령의 기준으로 사용하지 않으며, 교체·제거되는 하위 트리에 중복 명령을 만들지 않는다. 정렬 자체는 DOM을 생성하거나 다음 VDOM에 실제 DOM 참조를 연결하지 않는다.

## 5. HTML → 임시 DOM → VDOM

```text
readEditorHTML()                        편집기의 HTML 문자열 읽기
└─ parseHTML(html)                      화면에 삽입하지 않는 임시 DOM 트리
   └─ createSnapshot(parsedRoot)
      └─ snapshotNode(domNode)
         ├─ 주석 노드 → 제외
         ├─ readNodeData()              nodeType, tagName, nodeValue
         ├─ readAttributes()            속성 배열 복사
         ├─ readProperties()            propertySchema의 현재 값 복사
         ├─ dom = null                  기존·새 노드 모두 실제 DOM 참조 없음
         └─ 자식 snapshotNode() 재귀    childNodes 순서 보존
```

`parseHTML()`은 `<template>` 같은 브라우저 파싱 기능을 사용한다. 임시 DOM은 VDOM 데이터 추출용이며 실제 화면에 직접 삽입하지 않는다. 브라우저가 보정한 HTML 구조를 기준으로 스냅샷을 만든다.

VDOM 데이터는 `nodeType`, `tagName`, `attributes`, `nodeValue`, `childNodes`, `properties`로 구성하며 실제 DOM 연결용 필드는 `dom`이다. Snapshot에서는 논리적 루트와 모든 하위 노드의 `dom`을 null로 둔다. 이전 VDOM이나 임시 DOM 참조를 실제 DOM 참조로 연결하지 않는다. 식별용 key 필드의 채택 여부는 미확정이다.

### 입력·선택 상태

`readProperties()`는 기존 `propertySchema`를 따라 파싱된 요소의 값을 읽는다. HTML의 value·checked·selected 속성과 TEXTAREA 내용이 초기 상태의 입력값이 된다.
실제 화면에서 사용자가 바꾼 입력 상태는 HTML 원문에 자동 반영되지 않으며, 코드 편집기에서 만드는 스냅샷에는 포함되지 않는다.
`indeterminate`는 HTML만으로 지정할 수 없어 기본값을 읽는다. 실제 화면의 입력까지 이력에 담는 양방향 동기화는 이 흐름에 포함하지 않는다.

## 6. 초기 렌더링·이력 복원

```text
initializeDOM(sampleHTML)
├─ createEmptyVDOM(actualRoot)          자식 없는 논리적 루트, 실제 컨테이너 연결
├─ parseHTML(sampleHTML)                샘플 코드 → 임시 DOM
├─ createSnapshot(parsedRoot)           샘플 VDOM 전체의 dom은 null
├─ diff(emptyVDOM, sampleVDOM)
├─ applyPatch()                         실제 화면 생성·샘플 VDOM 전체의 dom 연결
├─ writeEditorHTML(sampleHTML)          편집기에 HTML 문자열 표시
└─ saveHistory.set(sampleVDOM, sampleHTML)

restoreSnapshot(entry, actualRoot)
├─ cloneSnapshotData(entry.vdom)        데이터 복사, dom 참조 초기화
├─ renderChildren(vdom, actualRoot)     실제 영역 내용 교체·dom 재연결
├─ writeEditorHTML(entry.html)          해당 시점의 코드 원문 복원
└─ return vdom

renderChildren(vdom, actualRoot)
├─ 실제 영역 컨테이너 유지, 기존 자식 제거
└─ 각 자식 renderNode() 후 순서대로 삽입

renderNode(vnode)
├─ 요소 또는 텍스트 노드 생성
├─ vnode.dom에 생성한 실제 DOM 연결
├─ 속성 적용
├─ 자식 renderNode() 재귀·삽입
└─ properties 적용
```

초기화도 Snapshot·Diff 종료까지 샘플 VDOM의 모든 `dom`이 null이고, Patch 성공 후에만 전체 실제 DOM 참조를 가진다. 빈 이전 VDOM의 논리적 루트는 작업 대상인 실제 컨테이너를 가리킨다.

초기 실제 영역은 비어 있다는 전제다. 이미 샘플 DOM이 있는 페이지에서는 이를 빈 루트로 간주하면 중복 생성되므로 초기화 경로를 혼용하지 않는다.
최상위 VDOM은 실제 영역 컨테이너에 대응하는 논리적 루트이며, 컨테이너 자체의 태그·속성은 Diff하지 않는다. 이력 복원 시 논리적 루트의 `dom`도 현재 `actualRoot`로 연결한다.

코드 편집기는 HTML 문자열을 표시한다. `renderChildren()`이나 `renderNode()`로 편집기 내부에 샘플 DOM을 만들지 않는다. 이력 복원은 실제 영역을 전체 렌더링하고 DOM 참조를 새로 연결한다.

SELECT의 상태는 OPTION 생성 후 적용한다. 다중 선택은 OPTION.selected를 기준으로 복원하며, file INPUT의 비어 있지 않은 value는 복원할 수 없다.

## 7. History

| 함수 | 역할 |
| --- | --- |
| `createHistory()` | 저장 배열·현재 위치·현재 연결된 VDOM을 클로저 안에서 관리 |
| `saveHistory.get()` | 현재 위치의 상태에 대응하며 실제 DOM에 연결된 VDOM 반환 |
| `saveHistory.set(vdom, html)` | 현재 위치 뒤 이력 제거, VDOM 데이터와 코드 원문 저장, 현재 위치·VDOM 갱신 |
| `saveHistory.peek(direction)` | 이동할 위치의 `{ vdom, html }` 조회. 범위 밖이면 null |
| `saveHistory.move(direction, liveVDOM)` | 새 이력 추가 없이 현재 위치와 연결된 VDOM 갱신 |

저장 배열에는 DOM 참조를 제외한 VDOM 데이터 복사본과 HTML 원문을 보관한다. 원문을 함께 저장해 들여쓰기 등 코드 표현도 복원한다. 현재 렌더링용 VDOM만 DOM 참조를 포함하고, 과거 데이터는 수정하지 않는다.
현재 위치와 렌더링용 VDOM의 갱신은 History 내부에서 함께 처리한다. 새 상태 저장은 Patch 성공으로 다음 VDOM의 참조 연결이 완성된 뒤 수행한다. 변경 없는 경우에는 참조가 없는 다음 VDOM으로 현재 상태를 바꾸지 않는다. 속성 나열 순서처럼 DOM 데이터가 같으면 새 이력을 추가하지 않으며, 실제 텍스트 노드가 달라지는 공백 변경은 별도로 비교한다.

## 8. 테스트 연결

| 함수 영역 | 검증 케이스 |
| --- | --- |
| 초기화·버튼 연결 | INIT-01–INIT-02 |
| HTML 읽기·파싱 | HTML-01–HTML-03 |
| 스냅샷 데이터·실제 DOM 참조 없음 | SNAP-01–SNAP-06 |
| 순수한 변경 계산 | DIFF-01–DIFF-06 |
| 명령 의존성·중복 방지 | ORDER-01–ORDER-04 |
| 실제 DOM 연산·다음 VDOM 전체 참조 연결 | PATCH-01–PATCH-08 |
| 단계별·연속 Patch·변경 없음·실패 | FLOW-01–FLOW-04 |
| History 저장·복원·복원 후 Patch | HIST-01–HIST-06 |
| 미합의 노드 식별 규칙 | CONF-01–CONF-03 |
