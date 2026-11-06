
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
  const changes = diff(currentVDOM, nextVDOM); 

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
- tageName(string)
- attributes(arrays)
- nodeValue(string)
- childNodes(arrays)
}

diff arrays
{
- types : operations 
- Datas : ???
- Reference : dest

}