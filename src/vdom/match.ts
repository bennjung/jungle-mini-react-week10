import type { VNode } from './types';

export interface MatchedPair {
  prev: VNode;
  next: VNode;
}

export interface ChildMatchPlan {
  pairs: MatchedPair[];
  inserts: Array<{ next: VNode; before: VNode | null }>;
  removals: VNode[];
  moves: Array<{ prev: VNode; next: VNode; before: VNode | null }>;
}

function keyOf(node: VNode): string | null {
  if (node.nodeType !== 1) return null;
  const attribute = node.attributes.find(({ name }) => name === 'key');
  return attribute ? attribute.value : null;
}

/**
 * 같은 부모 안의 자식 대응을 계산한다.
 * keyed 요소는 key로, keyless 요소와 텍스트 노드는 자식 순서로 대응한다.
 * 중복 key는 현재 등장 순서대로 대응하며 CONF-03 확정 전까지의 잠정 동작이다.
 */
export function matchChildren(
  prevChildren: VNode[],
  nextChildren: VNode[]
): ChildMatchPlan {
  const keyedPrev = new Map<string, VNode[]>();
  const keylessPrev: VNode[] = [];

  for (const node of prevChildren) {
    const key = keyOf(node);
    if (key === null) {
      keylessPrev.push(node);
    } else {
      const bucket = keyedPrev.get(key);
      if (bucket) bucket.push(node);
      else keyedPrev.set(key, [node]);
    }
  }

  const pairs: MatchedPair[] = [];
  const matchedPrev = new Set<VNode>();
  const matchedNext = new Set<VNode>();
  let keylessCursor = 0;

  for (const next of nextChildren) {
    const key = keyOf(next);
    if (key === null) continue;

    const bucket = keyedPrev.get(key);
    if (!bucket || bucket.length === 0) continue;

    const prev = bucket.shift() as VNode;
    pairs.push({ prev, next });
    matchedPrev.add(prev);
    matchedNext.add(next);
  }

  for (const next of nextChildren) {
    if (keyOf(next) !== null) continue;

    const prev = keylessPrev[keylessCursor];
    if (!prev) break;

    keylessCursor += 1;
    pairs.push({ prev, next });
    matchedPrev.add(prev);
    matchedNext.add(next);
  }

  const nextOrder = new Map<VNode, number>();
  nextChildren.forEach((node, index) => nextOrder.set(node, index));
  pairs.sort(
    (a, b) => (nextOrder.get(a.next) as number) - (nextOrder.get(b.next) as number)
  );

  const removals = prevChildren.filter((node) => !matchedPrev.has(node));

  const inserts = nextChildren
    .map((next, index) => ({ next, index }))
    .filter(({ next }) => !matchedNext.has(next))
    .map(({ next, index }) => ({
      next,
      before: nextChildren[index + 1] ?? null
    }));

  const prevOrder = new Map<VNode, number>();
  prevChildren.forEach((node, index) => prevOrder.set(node, index));

  const sequence = pairs.map((pair) => prevOrder.get(pair.prev) as number);
  const keep = new Set(longestIncreasingSubsequenceIndices(sequence));
  const moves: ChildMatchPlan['moves'] = [];

  pairs.forEach((pair, index) => {
    if (keep.has(index)) return;
    if (keyOf(pair.next) === null) return;

    const nextIndex = nextOrder.get(pair.next) as number;
    moves.push({
      prev: pair.prev,
      next: pair.next,
      before: nextChildren[nextIndex + 1] ?? null
    });
  });

  return { pairs, inserts, removals, moves };
}

function longestIncreasingSubsequenceIndices(values: number[]): number[] {
  const tails: number[] = [];
  const previous = new Array<number>(values.length).fill(-1);

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index] as number;
    let low = 0;
    let high = tails.length;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const middleIndex = tails[middle] as number;
      if ((values[middleIndex] as number) < value) low = middle + 1;
      else high = middle;
    }

    if (low > 0) previous[index] = tails[low - 1] as number;
    tails[low] = index;
  }

  const result: number[] = [];
  let cursor = tails.length > 0 ? (tails[tails.length - 1] as number) : -1;

  while (cursor !== -1) {
    result.push(cursor);
    cursor = previous[cursor] as number;
  }

  return result.reverse();
}
