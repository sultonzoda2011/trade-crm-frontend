type BackHandlerFn = () => boolean | void;

const backHandlers: BackHandlerFn[] = [];

/**
 * Регистрирует кастомный обработчик аппаратной кнопки "Назад" (LIFO стек).
 * Если обработчик возвращает true, дальнейшая стандартная обработка прерывается.
 */
export function registerBackHandler(handler: BackHandlerFn): () => void {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.indexOf(handler);
    if (idx !== -1) {
      backHandlers.splice(idx, 1);
    }
  };
}

export function executeTopBackHandler(): boolean {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    const res = backHandlers[i]();
    if (res === true) {
      return true;
    }
  }
  return false;
}
