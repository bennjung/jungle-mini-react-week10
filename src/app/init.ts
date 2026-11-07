import { createEmptyVDOM } from '../vdom/create';
import type { VRoot } from '../vdom/types';

export interface AppElements {
  editor: HTMLTextAreaElement;
  actualRoot: HTMLElement;
  patchButton: HTMLButtonElement;
  backButton: HTMLButtonElement;
  forwardButton: HTMLButtonElement;
}

export function getElements(): AppElements {
  const editor = document.querySelector<HTMLTextAreaElement>('#editor');
  const actualRoot = document.querySelector<HTMLElement>('#actual');
  const patchButton = document.querySelector<HTMLButtonElement>('#patch');
  const backButton = document.querySelector<HTMLButtonElement>('#back');
  const forwardButton = document.querySelector<HTMLButtonElement>('#forward');

  if (!editor || !actualRoot || !patchButton || !backButton || !forwardButton) {
    throw new Error(
      '필수 요소를 찾을 수 없습니다: #editor, #actual, #patch, #back, #forward'
    );
  }

  return { editor, actualRoot, patchButton, backButton, forwardButton };
}

export function init(): { elements: AppElements; root: VRoot } {
  const elements = getElements();
  const root = createEmptyVDOM(elements.actualRoot);

  return { elements, root };
}
