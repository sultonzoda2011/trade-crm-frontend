import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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
function submitDetached<TVars, TData = unknown>({
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

interface RunOptions {
  /** Отпустить пользователя: закрыть окно, перейти к списку. Один раз. */
  release: () => void;
  offlineMessage: string;
  slowMessage: string;
}

/**
 * Мутация из офлайн-очереди + «отпускание» экрана, не дожидаясь сервера (см. submitDetached).
 *
 * Передаётся ТОЛЬКО `mutationKey`: mutationFn, повторы, инвалидация и тосты берутся из
 * setMutationDefaults (offline-mutations.ts). Любой onSuccess/onError, переданный в
 * useMutation напрямую, заменил бы те, что в defaults.
 *
 * `isSubmitting` — своё состояние, а не isPending мутации: после «отпускания» операция
 * ещё в пути, но кнопка формы уже не должна крутиться (это окно может остаться смонтированным
 * и понадобиться для следующей записи).
 */
export function useDetachedMutation<TVars>(mutationKey: readonly unknown[]) {
  const { mutate } = useMutation<unknown, Error, TVars>({ mutationKey });
  const [isSubmitting, setSubmitting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    (vars: TVars, { release, offlineMessage, slowMessage }: RunOptions) => {
      const safeSet = (value: boolean) => {
        if (mounted.current) setSubmitting(value);
      };
      safeSet(true);
      submitDetached<TVars>({
        mutate,
        vars,
        offlineMessage,
        slowMessage,
        release: () => {
          safeSet(false);
          release();
        },
        onFail: () => safeSet(false),
      });
    },
    [mutate]
  );

  return { run, isSubmitting };
}
