import { useTranslation } from 'react-i18next';
import { useDetachedMutation } from '~/hooks/useDetachedMutation';
import { createClientId } from '~/lib/client-ids';
import {
  createIdempotencyKey,
  OFFLINE_MUTATION_KEYS,
  type QueuedCreateDebtorVars,
} from '~/lib/offline-mutations';
import type { DebtorRequest } from '~/types/debtors';

export interface CreatedDebtor {
  /** Временный id (`local-…`) — под ним должника уже можно выбрать в продаже; перед отправкой подменяется настоящим. */
  id: string;
  name: string;
  phone: string;
}

/**
 * Создание должника через очередь: форма не ждёт сервера. На быстрой связи закрывается по
 * ответу, на слабой или без сети — сразу, а должник уже виден в списке и доступен для «дать долг».
 */
export function useCreateDebtor() {
  const { t } = useTranslation('debtors');
  const { run, isSubmitting } = useDetachedMutation<QueuedCreateDebtorVars>(OFFLINE_MUTATION_KEYS.createDebtor);

  function create(payload: DebtorRequest, onReleased: (debtor: CreatedDebtor) => void) {
    const clientId = createClientId();
    run(
      { idempotencyKey: createIdempotencyKey(), clientId, payload },
      {
        release: () => onReleased({ id: clientId, name: payload.name, phone: payload.phone }),
        offlineMessage: t('createQueuedOffline'),
        slowMessage: t('createQueuedSlow'),
      }
    );
  }

  return { create, isSubmitting };
}
