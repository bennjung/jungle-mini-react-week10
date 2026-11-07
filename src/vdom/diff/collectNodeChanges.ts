import type { DiffCommand, VNode } from '../types';

/**
 * 입력: 비교할 짝으로 정해진 이전·다음 VNode.
 * 출력: 노드 자체와 하위 트리의 변경 명령.
 * 책임: 종류·태그·텍스트·HTML 속성·DOM 프로퍼티 차이를 판단한다.
 * 유지되는 요소의 자식은 collectChildChanges로 비교한다.
 * 자기 자신의 형제 간 이동은 판단하지 않는다.
 */
export function collectNodeChanges(_prev: VNode, _next: VNode): DiffCommand[] {
  throw new Error('collectNodeChanges: 미구현');
}
