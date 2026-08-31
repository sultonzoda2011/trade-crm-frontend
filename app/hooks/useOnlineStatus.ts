import { useEffect, useState } from 'react';

/**
 * Простой признак наличия сети (browser online/offline events).
 * Используется только для UX (задизейблить кнопку/показать баннер) —
 * никакого офлайн-хранилища или очереди синхронизации за этим не стоит.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
}
