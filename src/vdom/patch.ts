import { matchChildren } from './match';
import type {
  DiffCommand,
  UpdateData,
  VNode,
  VNodeAttribute,
  VNodeProperties,
  VRoot
} from './types';

/**
 * 정렬된 Diff 명령을 실제 DOM에 적용하고 다음 VDOM 전체의 dom 참조를 연결한다.
 * History 저장은 하지 않는다.
 */
export function applyPatch(
  prevRoot: VRoot,
  nextRoot: VRoot,
  changes: DiffCommand[]
): VRoot {
  const actualRoot = prevRoot.dom;
  if (!actualRoot) throw new Error('prevRoot.dom is not linked');

  /* 매치정보로 dom연결 */
  linkMatchedDom(prevRoot, nextRoot);

  /* 변경사항 적용 */
  for (const change of changes) applyChange(change);

  /* 검증함수 */
  assertAllLinked(nextRoot, actualRoot);
  return nextRoot;
}

/**
 * 유지·이동 노드의 이전 실제 DOM 참조를 다음 VDOM에 연결한다.
 * 새 삽입·교체 노드는 renderNode가 연결할 때까지 null로 둔다.
 */
export function linkMatchedDom(prev: VRoot, next: VRoot): void {
  next.dom = prev.dom;
  linkChildren(prev.childNodes, next.childNodes);
}

// VNode을 실제 DOM으로 만들고 vnode.dom과 하위 노드의 dom을 연결한다.
export function renderNode(vnode: VNode): Node {
  if (vnode.nodeType === 3) {
    const dom = document.createTextNode(vnode.nodeValue ?? '');
    vnode.dom = dom;
    return dom;
  }

  if (vnode.tagName === null) {
    throw new Error('Element VNode must have tagName');
  }

  const element = document.createElement(vnode.tagName);
  vnode.dom = element;
  applyAttributes(element, vnode.attributes);

  for (const child of vnode.childNodes) {
    element.appendChild(renderNode(child));
  }

  applyProperties(element, vnode.properties);
  return element;
}

// 실제 영역의 기존 자식을 모두 제거하고 root의 자식들을 새로 렌더링한다.
export function renderChildren(root: VRoot, container: Element): void {
  container.replaceChildren();
  root.dom = container;

  for (const child of root.childNodes) {
    container.appendChild(renderNode(child));
  }
}

// nextRoot의 모든 VNode가 actualRoot 안의 실제 DOM을 가리키는지 검증한다.
export function assertAllLinked(root: VRoot, actualRoot: Element): void {
  if (root.dom !== actualRoot) {
    throw new Error('VRoot.dom does not point to actualRoot');
  }

  const visit = (node: VNode): void => {
    if (!node.dom) {
      throw new Error(`VNode is not linked: ${node.tagName ?? '#text'}`);
    }
    if (!actualRoot.contains(node.dom)) {
      throw new Error(`VNode dom is outside actualRoot: ${node.tagName ?? '#text'}`);
    }
    for (const child of node.childNodes) visit(child);
  };

  for (const child of root.childNodes) visit(child);
}

// 같은 부모의 자식 쌍을 matchChildren()으로 찾아 재귀적으로 연결한다.
function linkChildren(prevChildren: VNode[], nextChildren: VNode[]): void {
  const plan = matchChildren(prevChildren, nextChildren);

  for (const pair of plan.pairs) {
    linkNode(pair.prev, pair.next);
  }
}

// 같은 type/tag 쌍만 기존 dom을 복사한다. replace 대상은 건너뛴다.
function linkNode(prev: VNode, next: VNode): void {
  if (prev.nodeType !== next.nodeType) return;
  if (prev.nodeType === 1 && prev.tagName !== next.tagName) return;

  next.dom = prev.dom;

  if (next.nodeType === 1) {
    linkChildren(prev.childNodes, next.childNodes);
  }
}

// 변경 명령 하나를 해당 실제 DOM 연산으로 분기한다.
function applyChange(change: DiffCommand): void {
  switch (change.type) {
    case 'replace':
      replaceNode(change.target, change.node);
      break;
    case 'update':
      updateNode(change.target, change.data);
      break;
    case 'insert':
      insertNode(change.node, change.parent, change.before);
      break;
    case 'remove':
      removeNode(change.target);
      break;
    case 'move':
      moveNode(change.target, change.parent, change.before);
      break;
  }
}

// update 명령의 텍스트·속성·properties 변경을 적용한다.
function updateNode(target: VNode, data: UpdateData): void {
  requireDom(target, 'update target');

  if (target.nodeType === 3) {
    if (data.nodeValue !== undefined) {
      updateText(target, data.nodeValue);
    }
    return;
  }

  updateAttributes(target, data);
  if (data.properties) updateProperties(target, data.properties);
}

// 텍스트 노드의 nodeValue를 변경한다.
function updateText(target: VNode, nodeValue: string): void {
  const dom = requireDom(target, 'update target');
  if (!(dom instanceof Text)) throw new Error('updateText target is not a Text node');
  dom.nodeValue = nodeValue;
}

// setAttributes/removeAttributes를 실제 Element에 적용한다.
function updateAttributes(target: VNode, data: UpdateData): void {
  const dom = requireDom(target, 'update target');
  if (!(dom instanceof Element)) return;

  for (const attribute of data.setAttributes ?? []) {
    dom.setAttribute(attribute.name, attribute.value);
  }
  for (const name of data.removeAttributes ?? []) {
    dom.removeAttribute(name);
  }
}

// properties 값을 실제 DOM 프로퍼티에 적용한다.
function updateProperties(target: VNode, properties: VNodeProperties): void {
  const dom = requireDom(target, 'update target');
  if (!(dom instanceof Element)) return;
  applyProperties(dom, properties);
}

// target의 실제 DOM을 새 VNode의 DOM으로 제자리 교체한다.
function replaceNode(target: VNode, node: VNode): void {
  const targetDom = requireDom(target, 'replace target');
  const parent = targetDom.parentNode;
  if (!parent) throw new Error('replace target is not attached');

  parent.replaceChild(renderNode(node), targetDom);
}

// 새 VNode를 parent의 before 앞에 삽입하고 하위 dom을 연결한다.
function insertNode(
  node: VNode,
  parent: VNode | VRoot,
  before: VNode | null
): void {
  const parentDom = requireDom(parent, 'insert parent');
  const beforeDom = before ? requireDom(before, 'insert before') : null;

  parentDom.insertBefore(renderNode(node), beforeDom);
}

// target의 실제 DOM을 부모에서 제거한다.
function removeNode(target: VNode): void {
  const targetDom = requireDom(target, 'remove target');
  targetDom.parentNode?.removeChild(targetDom);
}

// 기존 DOM 객체를 parent의 before 앞으로 이동한다.
function moveNode(
  target: VNode,
  parent: VNode | VRoot,
  before: VNode | null
): void {
  const targetDom = requireDom(target, 'move target');
  const parentDom = requireDom(parent, 'move parent');
  const beforeDom = before ? requireDom(before, 'move before') : null;

  parentDom.insertBefore(targetDom, beforeDom);
}

// VNode/VRoot의 dom이 연결되어 있는지 확인하고 반환한다.
function requireDom(node: VNode | VRoot, label: string): Node {
  if (!node.dom) throw new Error(`${label}.dom is not linked`);
  return node.dom;
}

// VNode attributes를 실제 Element attribute로 설정한다.
function applyAttributes(element: Element, attributes: VNodeAttribute[]): void {
  for (const attribute of attributes) {
    element.setAttribute(attribute.name, attribute.value);
  }
}

// properties를 실제 DOM 프로퍼티로 설정한다. 다중 SELECT의 value는 건너뛴다.
function applyProperties(element: Element, properties: VNodeProperties): void {
  for (const [name, value] of Object.entries(properties)) {
    // 다중 선택은 OPTION.selected로 복원한다. SELECT.value 대입이 선택을 해제하지 않게 한다.
    if (element instanceof HTMLSelectElement && element.multiple && name === 'value') {
      continue;
    }

    Reflect.set(element, name, value);
  }
}
