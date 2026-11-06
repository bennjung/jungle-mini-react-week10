Core concept for REACT
- Virtual DOM
- Diff 
- Patch


브라우저의 DOM 정보를 읽어서 Virtual DOM 으로 변환하는 함수를 작성합니다.

두 Virtual DOM 을 비교하여 변경된 부분을 찾아내는 Diff 알고리즘을 작성합니다.
이 알고리즘을 검증할 수 있는 웹 페이지를 구현합니다.

페이지 내에 다음과 같이 2개의 영역과 Patch, 뒤로가기, 앞으로가기 버튼들이 있어야 합니다.

* 실제 영역
* 테스트 영역

a. 웹 페이지를 로드하면 "실제 영역" 의 샘플 HTML 코드를 Virtual DOM 트리로 변환합니다.

b. 방금 만든 Virtual DOM 을 이용하여 테스트 영역을 렌더링합니다.

c. 사용자가 "테스트 영역" 에 있는 샘플 HTML 코드를 자유롭게 수정합니다.

c1. Patch 버튼을 누르면 현재 테스트 영역 상태를 다시 Virtual DOM 으로 만듭니다.

c2. Diff 알고리즘을 이용해서 이전 Virtual DOM 과 비교하여 변경된 부분을 찾습니다.

c3. 변경된 부분만 "실제 영역" 에 렌더링합니다.

c4. 새로 변경된 Virtual DOM 은 State History 에 저장합니다.

뒤로가기, 앞으로가기 버튼을 눌러 state history 에 저장된 특정 Virtual DOM 으로 이동 가능하며 "실제 영역", "테스트 영역" 도 함께 변경되어야 합니다