import type { UpdateData, VNodeProperties } from '../types';

/**
 * 입력: 이전·다음 VNode에 저장된 DOM 프로퍼티 값.
 * 출력: update.data에 사용할 properties 항목. 변경이 없으면 항목을 생략한다.
 * 책임: 값의 참·거짓이 아니라 값이 달라졌는지를 판단한다.
 */
export function findPropertyUpdates(
  _prevProperties: VNodeProperties,
  _nextProperties: VNodeProperties
): Pick<UpdateData, 'properties'> {
  throw new Error('findPropertyUpdates: 미구현');
}
