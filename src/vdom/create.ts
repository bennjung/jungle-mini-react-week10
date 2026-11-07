import type { VRoot } from './types';

/**
 * 실제 영역 컨테이너에 대응하는 빈 논리적 루트를 만든다.
 * 초기화 시 비교 기준으로 사용하며, 루트의 dom은 실제 컨테이너를 가리킨다.
 */
export function createEmptyVDOM(actualRoot: Element): VRoot {
  return {
    childNodes: [],
    dom: actualRoot
  };
}
