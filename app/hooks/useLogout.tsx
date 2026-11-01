import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { useOfflineQueue } from '~/hooks/useOfflineQueue';
import { clearSession } from '~/lib/auth-utils';
import { wipeOfflineData } from '~/lib/offline-session';

/**
 * Выход из аккаунта — один на меню в шапке и экран профиля.
 *
 * Выход стирает офлайн-кеш и очередь (данные бизнеса не должны достаться
 * следующему человеку на этом телефоне). Неотправленные операции при этом
 * пропали бы молча — поэтому, если они есть, сначала спрашиваем. Диалог
 * возвращается как `logoutDialog`: его нужно один раз вставить в разметку.
 */
export function useLogout(): { requestLogout: () => void; logoutDialog: ReactNode } {
  const navigate = useNavigate();
  const { t: ts } = useTranslation('sync');
  const queryClient = useQueryClient();
  const { total: queued } = useOfflineQueue();
  const [confirm, setConfirm] = useState(false);

  const logout = async () => {
    setConfirm(false);
    clearSession();
    await wipeOfflineData(queryClient);
    navigate('/login');
  };

  const requestLogout = () => {
    if (queued > 0) setConfirm(true);
    else void logout();
  };

  const logoutDialog = (
    <ConfirmDialog
      open={confirm}
      onOpenChange={setConfirm}
      onConfirm={() => void logout()}
      type="danger"
      title={ts('logout.title')}
      description={ts('logout.description', { count: queued })}
      confirmText={ts('logout.confirm')}
    />
  );

  return { requestLogout, logoutDialog };
}
