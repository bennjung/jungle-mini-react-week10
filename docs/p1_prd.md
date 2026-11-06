# Phase 1 PRD

## 0. Process

> Fetch current VDOM → VDOM Snapshot → Diff → Patch → History 저장

`main.html`을 기준으로 상위 이벤트 흐름에서 Patch → Diff → VDOM 순서로 하위 역할을 설계한다.
아래 함수와 코드는 호출 구조를 설명하는 설계이며 구현 코드는 아니다. 테스트 기준은 `p1_test_cases.md`를 따른다.

## 1. main.html → 진입점

```text
main.html
└─ init()
   ├─ getElements()                     실제·테스트 영역, 버튼 조회
   ├─ createHistory()                   배열 + 현재 위치로 이력 관리
   ├─ initializeDOM()                   최초 VDOM 생성·테스트 영역 렌더링
   └─ bindEvents()
      ├─ Patch 클릭 → handlePatch()
      ├─ 뒤로 클릭  → handleHistoryMove(-1)
      └─ 앞으로 클릭 → handleHistoryMove(1)
```

`init()` 안에서 영역 참조와 History를 만들고 이벤트 핸들러가 클로저로 접근한다. 최초 `initializeDOM()`에서 초기 VDOM 생성 및 매핑을 수행한다.
별도 전역 `curVdom`은 두지 않는다.

## 2. 이벤트 핸들러

### Patch

```js
function handlePatch() {
  const curVdom = saveHistory.get();
  const nextVDOM = createSnapshot(testRoot, curVdom);
  const changes = diff(curVdom, nextVDOM);

  if (changes.length === 0) return;

  applyPatch(changes);
  saveHistory.set(nextVDOM);
}
```

History가 비어 있는 최초 상태는 이벤트 연결 전에 `initializeDOM()`으로 준비한다. 변경 없는 Patch는 이력에 저장하지 않는다. `applyPatch()` 실패 시 예외를 전달하여 이력 저장을 중단한다.

### 뒤로가기·앞으로가기

```js
function handleHistoryMove(direction) {
  const snapshot = saveHistory.peek(direction);
  if (snapshot === null) return;

  const liveVDOM = restoreSnapshot(snapshot, actualRoot, testRoot);
  saveHistory.move(direction, liveVDOM);
}
```

`restoreSnapshot()`은 저장된 데이터로 두 영역을 다시 렌더링하고 현재 DOM에 연결된 VDOM을 반환한다. 과거의 DOM 참조를 그대로 재사용하지 않는다.

## 3. applyPatch() → 실제 DOM 변경

```text
applyPatch(changes)
├─ replaceNode(target, node)
│  ├─ renderNode(node, "actual")
│  └─ 기존 DOM 교체
├─ updateNode(target, data)
│  ├─ updateText()                      텍스트 nodeValue 변경
│  ├─ updateAttributes()                속성 추가·변경·삭제
│  └─ updateProperties()                입력·선택 상태 변경
├─ insertNode(node, parent, before)
│  ├─ renderNode(node, "actual")
│  └─ 부모 DOM의 기준 형제 앞에 삽입
├─ removeNode(target)
│  └─ 대상 DOM 제거
└─ moveNode(target, parent, before)
   └─ 기존 DOM을 기준 형제 앞으로 이동
```

각 명령은 VDOM 객체를 직접 참조하고 실제 변경 대상은 `vnode.dom`으로 찾는다. `before === null`은 맨 뒤를 뜻한다. 기존 요소의 update와 move는 DOM 객체를 유지한다.

`renderNode()`는 새 실제 DOM을 생성하면서 `vnode.dom`에 연결한다. 기존 노드는 스냅샷 생성 때 참조를 이어받으므로 변경 명령이 없어도 다음 Patch에서 찾을 수 있다.

## 4. diff() → 변경 명령 배열

```text
diff(curVdom, nextVDOM)
├─ compareNode(prev, next)
│  ├─ 노드 종류·태그 변경 → replace
│  ├─ 텍스트 변경 → update
│  ├─ diffAttributes() → update의 속성 데이터
│  ├─ diffProperties() → update의 properties 데이터
│  └─ diffChildren()
│     ├─ 기존 노드 대응 관계 확인
│     ├─ 새 노드 → insert
│     ├─ 사라진 노드 → remove
│     ├─ 기존 노드의 순서 변경 → move
│     └─ 대응하는 자식 → compareNode() 재귀
└─ orderChanges() → 적용 순서가 보장된 명령 배열
```

Diff는 실제 DOM과 과거 스냅샷 데이터를 수정하지 않는다. attributes와 properties는 필드 이름·값을 비교하므로 신규 속성마다 Diff 전용 분기를 추가하지 않는다.

`orderChanges()`는 부모와 기준 형제가 생성된 뒤 참조되도록 순서를 정한다. 같은 부모의 삽입·이동은 오른쪽 형제부터 처리하고, 제거할 노드를 뒤의 명령이 참조하지 않도록 한다. 교체·제거되는 하위 트리에 중복 명령을 만들지 않는다.

## 5. createSnapshot() → VDOM과 객체 매핑

```text
createSnapshot(root, curVdom = null)
├─ indexPreviousNodes(curVdom)          이전 testDom → 이전 VDOM의 WeakMap
└─ snapshotNode(domNode)
   ├─ 주석 노드 → 제외
   ├─ readNodeData()                   nodeType, tagName, nodeValue
   ├─ readAttributes()                 속성 배열을 새 데이터로 복사
   ├─ readProperties()                 propertySchema의 현재 값 복사
   ├─ linkNode()
   │  ├─ 초기 실제 영역 → vnode.dom = 현재 DOM
   │  ├─ 기존 테스트 노드 → 이전 vnode.dom 이어받기
   │  └─ 새 테스트 노드 → vnode.dom = null
   └─ 자식 snapshotNode() 재귀         childNodes의 순서 보존
```

VDOM의 데이터 필드는 `nodeType`, `tagName`, `attributes`, `nodeValue`, `childNodes`, `properties`다. 연결용 필드는 `dom`(실제 DOM)과 `testDom`(테스트 DOM)으로 구분한다.

테스트 영역에서 생성한 스냅샷에는 현재 테스트 DOM을 `testDom`으로 기록한다. 이전 VDOM의 `testDom`을 인덱싱하면 이동한 같은 DOM 객체를 식별하고 실제 DOM 참조를 이어받을 수 있다. `innerHTML` 재설정 등으로 DOM 객체를 재생성한 경우에는 같은 객체로 간주하지 않는다.

새 노드의 실제 DOM 연결은 `applyPatch()`의 삽입·교체 과정에서 완성된다. 부모와 기준 형제에 대한 VDOM 참조가 삽입 위치를 표현한다.

## 6. 초기 렌더링·이력 복원

```text
initializeDOM()
├─ createSnapshot(actualRoot)          초기 실제 DOM → VDOM, dom 연결
├─ renderChildren(vdom, testRoot, "test") → testDom 연결
└─ saveHistory.set(vdom)

restoreSnapshot(snapshot, actualRoot, testRoot)
├─ cloneSnapshotData(snapshot)         과거 데이터 복사, 연결 참조 초기화
├─ renderChildren(vdom, actualRoot, "actual") → dom 연결
├─ renderChildren(vdom, testRoot, "test") → testDom 연결
└─ return vdom

renderNode(vnode, area)
├─ 요소 생성 또는 텍스트 노드 생성
├─ area에 따라 dom 또는 testDom 연결
├─ 속성 적용
├─ 자식 renderNode() 재귀·삽입
└─ properties 적용
```

실제·테스트 영역은 같은 VDOM 데이터로 별도의 DOM 객체를 생성하며 DOM 노드를 공유하지 않는다.

실제·테스트 영역의 컨테이너는 유지하고 내부 자식만 렌더링한다. 스냅샷의 최상위 노드는 두 컨테이너에 대응하는 논리적 루트로 취급해 컨테이너 자체를 Diff하지 않는다.

SELECT의 선택 상태는 OPTION 생성 후 적용한다. 다중 선택은 OPTION.selected를 기준으로 복원하며, file INPUT의 비어 있지 않은 value는 복원할 수 없다.

## 7. History

| 함수 | 역할 |
| --- | --- |
| `createHistory()` | 저장 배열·현재 위치·현재 연결된 VDOM을 클로저 안에서 관리 |
| `saveHistory.get()` | 현재 DOM에 연결된 VDOM 반환 |
| `saveHistory.set(vdom)` | 현재 위치 뒤 이력 제거, 데이터 복사본 저장, 현재 VDOM과 위치 갱신 |
| `saveHistory.peek(direction)` | 이동할 위치의 스냅샷 조회. 범위 밖이면 null |
| `saveHistory.move(direction, liveVDOM)` | 새 이력 추가 없이 현재 위치와 연결된 VDOM 갱신 |

저장 배열에는 DOM 참조를 제외한 데이터 복사본을 보관한다. 현재 렌더링에 사용하는 VDOM은 DOM 참조를 포함한다. 두 데이터를 구분해 이후 Patch나 이력 복원이 과거 상태를 수정하지 않도록 한다.

## 8. 테스트 연결

| 함수 영역 | 검증 케이스 |
| --- | --- |
| 스냅샷·매핑 | S01–S05 |
| Diff·Patch | D01–D10 |
| 초기화·Patch 핸들러 | H01–H02 |
| History·복원 | H03–H06 |

## 9. Data Structures

### 9.1 VDOM

| 필드 | 내용 |
| --- | --- |
| `nodeType` | 노드 종류 정수. 요소 1, 텍스트 3을 지원하고 주석 8은 제외 |
| `tagName` | 요소 태그 이름. 텍스트 노드는 null |
| `attributes` | `{ name, value }` 원소의 배열. 텍스트 노드는 빈 배열 |
| `nodeValue` | 텍스트 노드의 문자열 값. 요소 노드는 null |
| `childNodes` | 자식 VDOM 배열. 순서 보존 |
| `properties` | 스키마에 지정된 DOM 프로퍼티의 현재 값 객체 |
| `dom` | 실제 DOM 객체 직접 참조. 생성 전에는 null |
| `testDom` | 테스트 DOM 객체 직접 참조 |

속성은 이름·값 인터페이스로 처리한다. 신규 HTML 속성이 추가되어도 Diff·Patch에 속성별 전용 로직을 추가하지 않는다.

```js
const propertySchema = {
  INPUT: ["value", "checked", "indeterminate"],
  TEXTAREA: ["value"],
  SELECT: ["value"],
  OPTION: ["selected"]
};
```

- 스냅샷은 현재 값을 `attributes`와 별도로 `properties`에 저장한다.
- Diff는 `properties`의 변경값을 찾아 `update` 명령에 담는다.
- 렌더링·Patch·이력 복원 시 해당 값을 실제 DOM 프로퍼티에 적용한다.

### 9.2 Diff 명령

`diff()`는 아래 명령들의 배열을 반환한다.
예시의 `"<...>"`는 VDOM 객체 참조를 표시하는 자리표시자다. 실제 실행에서는 문자열이 아닌 객체 직접 참조를 사용한다.

#### replace

`target`을 새 `node`로 교체한다.

```json
{
  "type": "replace",
  "target": "<기존 VDOM 객체>",
  "node": "<새 VDOM 객체>"
}
```

#### update — 텍스트

`target` 텍스트 노드의 값을 변경한다.

```json
{
  "type": "update",
  "target": "<기존 텍스트 VDOM 객체>",
  "data": {
    "nodeValue": "새 텍스트"
  }
}
```

#### update — 속성

`setAttributes`는 추가·변경할 속성, `removeAttributes`는 삭제할 속성 이름이다. 해당 작업이 없으면 빈 배열을 사용한다.

```json
{
  "type": "update",
  "target": "<기존 요소 VDOM 객체>",
  "data": {
    "setAttributes": [
      { "name": "class", "value": "active" }
    ],
    "removeAttributes": ["title"]
  }
}
```

#### update — 입력·선택 상태

변경된 값을 실제 DOM 프로퍼티에 적용한다.

```json
{
  "type": "update",
  "target": "<기존 요소 VDOM 객체>",
  "data": {
    "properties": {
      "value": "사용자 입력"
    }
  }
}
```

#### insert

`parent`의 자식으로 새 `node`를 `before` 앞에 삽입한다. `before`가 `null`이면 맨 뒤에 삽입한다.

```json
{
  "type": "insert",
  "node": "<새 VDOM 객체>",
  "parent": "<부모 VDOM 객체>",
  "before": "<기준 형제 VDOM 객체 또는 null>"
}
```

#### remove

`target`을 제거한다.

```json
{
  "type": "remove",
  "target": "<기존 VDOM 객체>"
}
```

#### move

기존 `target`을 `parent`의 자식인 `before` 앞으로 이동한다. `before`가 `null`이면 맨 뒤로 이동한다.

```json
{
  "type": "move",
  "target": "<기존 VDOM 객체>",
  "parent": "<부모 VDOM 객체>",
  "before": "<기준 형제 VDOM 객체 또는 null>"
}
```
