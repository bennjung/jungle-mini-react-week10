import { afterEach, expect, it } from 'vitest';
import { createSnapshot, parseHTML } from '../../src/vdom/create';
import type { VRoot } from '../../src/vdom/types';

afterEach(() => {
  document.body.replaceChildren();
});

it('HTML-03: 빈 HTML을 자식 없는 VDOM으로 변환하고 기존 화면·현재 VDOM을 유지한다', () => {
  const actualRoot = document.createElement('div');
  actualRoot.innerHTML = '<p>기존</p>';
  document.body.append(actualRoot);
  const paragraph = actualRoot.firstChild;
  const text = paragraph?.firstChild ?? null;
  const prevRoot: VRoot = {
    childNodes: [{
      nodeType: 1,
      tagName: 'P',
      attributes: [],
      nodeValue: null,
      properties: {},
      dom: paragraph,
      childNodes: [{
        nodeType: 3,
        tagName: null,
        attributes: [],
        nodeValue: '기존',
        properties: {},
        dom: text,
        childNodes: []
      }]
    }],
    dom: actualRoot
  };
  const prevChildren = prevRoot.childNodes;
  const prevParagraph = prevChildren[0];
  const prevText = prevParagraph?.childNodes[0];

  const nextRoot = createSnapshot(parseHTML(''));

  expect(nextRoot).toEqual({ childNodes: [], dom: null });
  expect(actualRoot.innerHTML).toBe('<p>기존</p>');
  expect(actualRoot.firstChild).toBe(paragraph);
  expect(paragraph?.firstChild).toBe(text);
  expect(prevRoot.dom).toBe(actualRoot);
  expect(prevRoot.childNodes).toBe(prevChildren);
  expect(prevRoot.childNodes).toHaveLength(1);
  expect(prevRoot.childNodes[0]).toBe(prevParagraph);
  expect(prevParagraph?.dom).toBe(paragraph);
  expect(prevParagraph?.tagName).toBe('P');
  expect(prevParagraph?.childNodes).toHaveLength(1);
  expect(prevParagraph?.childNodes[0]).toBe(prevText);
  expect(prevText?.dom).toBe(text);
  expect(prevText?.nodeValue).toBe('기존');
});
