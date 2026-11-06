
## 0. Process 
> Fetch current VDOM -> VDOM Snapshot -> Diff (Filter modified nodes) -> Patch(Do operations)

---

## 1. Event Handler(Patch)

``` javascript title: patch.js
function handlePatch() {
  // 0. 현재 vdom 상태 가져오기
  const curVdom = saveHistory.get();
  
  // 1. 테스트 영역의 현재 DOM을 VDOM 스냅샷으로 변환 및 매핑 
  const nextVDOM = createSnapshot(testRoot, curVdom); 

  // 2. 이전 VDOM과 비교해 변경 명령 생성
  const changes = diff(curVdom, nextVDOM); 

  // 3. 실제 영역의 변경된 부분만 갱신
  applyPatch(changes); // 배치처리 

  // 4. 새 스냅샷을 이력에 저장하고 현재 상태로 지정
  saveHistory.set(nextVDOM);
}
```

## 2. Sketch

### 2.1 Function roles
`applyPatch()` : rep/up/ins/rm/mov 5대 명령 수행 

`diff()` 의 반환값은 배열 {변경사항이 있는 노드, 해당 노드에 가할 operation}

직접 참조 : 명령 적용하기위해 태그들와 연결을 해줘야한다. <br>
즉, VDOM 만들때 매핑을 해줘야함. 

attribute 는 그대로 두고, 일종의 인터페이스를 둔다. -> 신규 데이터가 추가되더라도 로직(`diff`, `patch`) 영향이 없어야한다. 

### 2.2 Data Structures
VDOM attribute
{
- nodeType(int)
- tagName(string)
- attributes(arrays)
- nodeValue(string)
- childNodes(arrays)
}

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
