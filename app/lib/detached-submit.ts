import { toast } from 'sonner';
import { getIsOnline } from '~/lib/network-status';

/**
 * Сколько ждём ответа сервера, прежде чем отпустить пользователя с экрана. На быстрой
 * связи ответ приходит раньше и всё работает как обычно (форма закрывается по успеху);
 * на слабой — человек не стоит над крутящейся кнопкой, а идёт дальше, пока операция
 * доезжает в фоне и уже видна в списке (см. offline-overlay.ts).
 */
export const DETACH_AFTER_MS = 1500;

interface MutateOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

interface DetachedSubmitOptions<TVars, TData> {
  /** `mutate` из useMutation — операция уже стоит в очереди TanStack Query, это лишь способ её запустить. */
  mutate: (vars: TVars, options?: MutateOptions<TData>) => void;
  vars: TVars;
  /**
   * Что сделать, когда пользователя можно отпустить: закрыть окно, сбросить форму,
   * перейти к списку. Вызывается ровно один раз — по успеху, по таймеру или сразу офлайн.
   */
  release: () => void;
  /** Тост без сети. */
  offlineMessage: string;
  /** Тост на слабой связи: ответа нет, но операция сохранена. */
  slowMessage: string;
  /** Сервер отклонил операцию, пока человек ещё на форме: снять индикатор загрузки. Тост покажет очередь. */
  onFail?: () => void;
}

/**
 * Запускает операцию и освобождает UI, не дожидаясь сервера:
 *  - офлайн — mutate() только ставит операцию в очередь, сети не касается: отпускаем сразу;
 *  - онлайн — отпускаем по успеху или через DETACH_AFTER_MS, что наступит раньше;
 *  - ошибка сервера (валидация, «недостаточно товара») за это время — человек остаётся
 *    на форме и может исправить данные; тост об ошибке покажет сама очередь.
 *
 * Колбэки mutate() срабатывают, только пока компонент смонтирован: после того как
 * мы отпустили пользователя и страница ушла, они молчат, а итог (инвалидация, тосты)
 * обеспечивают setMutationDefaults из offline-mutations.ts.
 */
export function submitDetached<TVars, TData = unknown>({
  mutate,
  vars,
  release,
  offlineMessage,
  slowMessage,
  onFail,
}: DetachedSubmitOptions<TVars, TData>): void {
  let released = false;
  const releaseOnce = () => {
    if (released) return;
    released = true;
    release();
  };

  if (!getIsOnline()) {
    mutate(vars);
    releaseOnce();
    toast(offlineMessage);
    return;
  }

  const timer = setTimeout(() => {
    if (released) return;
    releaseOnce();
    toast(slowMessage);
  }, DETACH_AFTER_MS);

  mutate(vars, {
    onSuccess: () => {
      clearTimeout(timer);
      releaseOnce();
    },
    onError: () => {
      clearTimeout(timer);
      if (!released) onFail?.();
    },
  });
}
