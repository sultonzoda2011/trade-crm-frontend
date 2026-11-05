import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard, type KeyboardInfo } from '@capacitor/keyboard';

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
 * Плавно прокручивает активный инпут в видимую область,
 * если клавиатура перекрывает его положение.
 */
function scrollActiveFieldIntoView() {
  const activeEl = document.activeElement;
  if (!isTextField(activeEl)) return;

  setTimeout(() => {
    try {
      (activeEl as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch {
      // Игнорируем ошибки scrollIntoView в старых браузерах
    }
  }, 100);
}

/**
 * Определяет, открыта ли экранная клавиатура.
 *
 * В нативном Android/iOS приложении подписывается на события @capacitor/keyboard,
 * выставляет CSS-переменную `--keyboard-height` и класс `keyboard-open` на <html>,
 * а также центрирует активное поле ввода в видимой области.
 * В обычном браузере работает через события focusin/focusout.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let isCancelled = false;

      const setOpenState = (isOpen: boolean, height = 0) => {
        if (isCancelled) return;
        setOpen(isOpen);
        if (typeof document !== 'undefined') {
          if (isOpen) {
            document.documentElement.classList.add('keyboard-open');
            document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
            scrollActiveFieldIntoView();
          } else {
            document.documentElement.classList.remove('keyboard-open');
            document.documentElement.style.setProperty('--keyboard-height', '0px');
          }
        }
      };

      const willShowSub = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
        setOpenState(true, info.keyboardHeight);
      });

      const willHideSub = Keyboard.addListener('keyboardWillHide', () => {
        setOpenState(false, 0);
      });

      const didShowSub = Keyboard.addListener('keyboardDidShow', () => {
        scrollActiveFieldIntoView();
      });

      return () => {
        isCancelled = true;
        void willShowSub.then((h) => h.remove());
        void willHideSub.then((h) => h.remove());
        void didShowSub.then((h) => h.remove());
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('keyboard-open');
          document.documentElement.style.setProperty('--keyboard-height', '0px');
        }
      };
    }

    // Веб-фоллбэк
    const onIn = (e: FocusEvent) => {
      const isText = isTextField(e.target);
      setOpen(isText);
      if (isText) {
        document.documentElement.classList.add('keyboard-open');
        scrollActiveFieldIntoView();
      }
    };

    const onOut = () => {
      setOpen(false);
      document.documentElement.classList.remove('keyboard-open');
    };

    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);

    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
      document.documentElement.classList.remove('keyboard-open');
    };
  }, []);

  return open;
}
