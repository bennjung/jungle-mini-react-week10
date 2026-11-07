import { describe, expect, it } from 'vitest';
import { createEmptyVDOM } from '../../src/vdom/create';

describe('createEmptyVDOM', () => {
  it('실제 영역 컨테이너를 초기 루트 dom으로 연결한다', () => {
    const actualRoot = document.createElement('div');

    const root = createEmptyVDOM(actualRoot);

    expect(root.childNodes).toEqual([]);
    expect(root.dom).toBe(actualRoot);
  });
});
