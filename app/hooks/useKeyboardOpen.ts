import { useEffect, useState } from 'react';

const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'file',
  'range',
  'color',
]);

function isTextField(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(el.type);
  return el instanceof HTMLTextAreaElement || el.isContentEditable;
}

/**
 * Определяет, открыта ли экранная клавиатура (фокус в текстовом поле).
 * Используется в BottomNav, чтобы Capacitor `Keyboard.resize: 'body'` не поднимал
 * плавающую панель навигации поверх клавиатуры.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onIn = (e: FocusEvent) => setOpen(isTextField(e.target));
    const onOut = () => setOpen(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  return open;
}
