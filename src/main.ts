import { init } from './app/init';

const app = init();

app.elements.editor.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;

  event.preventDefault();
  const start = app.elements.editor.selectionStart;
  const end = app.elements.editor.selectionEnd;
  app.elements.editor.value = `${app.elements.editor.value.slice(0, start)}  ${app.elements.editor.value.slice(end)}`;
  app.elements.editor.selectionStart = app.elements.editor.selectionEnd = start + 2;
});
