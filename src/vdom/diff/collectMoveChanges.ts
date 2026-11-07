import type { DiffCommand, VNode } from '../types';
import type { ChildMatch, Parent } from './types';

/**
 * 입력: 이전 자식 순서, 다음 부모와 자식 순서, 노드 대응 결과.
 * 출력: move 명령만 담긴 배열.
 * 책임: 이동할 대상과 기준 형제를 결정한다.
 * 삽입·제거 때문에 인덱스가 바뀐 것을 이동으로 오인하지 않는다.
 */
export function collectMoveChanges(
  _prevChildren: VNode[],
  _nextParent: Parent,
  _matches: ChildMatch[]
): Extract<DiffCommand, { type: 'move' }>[] {
  throw new Error('collectMoveChanges: 미구현');
}
