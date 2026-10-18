import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { submitDetached } from '~/lib/detached-submit';

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
