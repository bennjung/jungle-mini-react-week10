Phase 2. Component, State, Hooks


React 의 핵심 기능인 Component, State, Hooks 를 직접 구현합니다.
이 기능들을 활용하여 동작하는 웹 페이지를 구현합니다.

Component 는 UI 를 나누는 작은 단위이며, 각각 자신만의 로직과 렌더링을 담당합니다.
반드시 함수형 컴포넌트로 구현합니다.

a. 함수형 컴포넌트를 감싸는 FunctionComponent 클래스를 작성합니다.

a1. hooks 배열을 이용하여 상태를 저장합니다.

a2. mount() 를 호출하면 처음 렌더링을 수행합니다.

a3. update() 를 호출하면 상태 변경 후 다시 렌더링을 수행합니다.

b. 값이 변경될 수 있는 동적 데이터인 State 를 구현합니다.
State 가 변경되면 화면이 자동으로 다시 그려져야 합니다.

c. 함수형 컴포넌트에서 상태와 생명주기를 사용할 수 있도록 Hooks 를 구현합니다.
최소 구현 대상은 다음과 같습니다.

* useState
* useEffect
* useMemo

제약조건

- Hook 은 최상위 컴포넌트에서만 사용할 수 있습니다.
- State 는 최상위 컴포넌트 (루트 컴포넌트) 에서만 관리합니다.
- 자식 컴포넌트는 State 를 가지지 않고, 부모로부터 전달받은 props 만 사용하는 순수 함수로 구현합니다. (Stateless, Lifting State Up 패턴)

Phase 2 — Component / State / Hooks 관련 중점 포인트

- 함수형 컴포넌트
<br>-> UI 를 나누는 단위와 각 컴포넌트의 역할
<br>-> UI 를 어떻게 Component 로 나눌 것인가?
<br>-> FunctionComponent 클래스의 hooks 배열, mount(), update()

- State
<br>-> 상태 변경과 화면 렌더링의 관계
<br>-> 최상위 컴포넌트의 상태 관리와 자식 컴포넌트로의 props 전달
<br>-> State 는 어디에 두는 것이 좋은가?
<br>-> setState 는 상태 변경 외에 무엇을 해야 하는가?

- Hooks
<br>-> useState, useEffect, useMemo
<br>-> 함수가 매번 새로 실행되어도 상태를 유지하는 방법

- 여러 상태 변경을 한 번에 처리하는 방법
<br>-> Batching 방법 (선택 과제)

- 이번에 구현한 React 와 실제 React 의 차이점
