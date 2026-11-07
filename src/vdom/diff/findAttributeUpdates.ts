import type { VNodeAttribute } from '../types';
import type { AttributeUpdate } from './types';

/**
 * 입력: 이전·다음 HTML 속성 목록.
 * 출력: 추가·변경할 속성과 제거할 속성 이름.
 * 책임: 속성 이름·값을 비교한다. 속성 나열 순서는 차이로 보지 않는다.
 */
export function findAttributeUpdates(
  _prevAttributes: VNodeAttribute[],
  _nextAttributes: VNodeAttribute[]
): AttributeUpdate {
  throw new Error('findAttributeUpdates: 미구현');
}
