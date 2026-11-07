import type { DiffCommand } from '../types';

/**
 * 입력: 필요한 변경 명령 배열.
 * 출력: 동일한 작업을 실행 가능한 순서로 배치한 배열.
 * 책임: 명령 간 실행 의존성을 처리한다. 잘못된 대응·이동 선택은 고치지 않는다.
 */
export function orderChanges(_changes: DiffCommand[]): DiffCommand[] {
  throw new Error('orderChanges: 미구현');
}
