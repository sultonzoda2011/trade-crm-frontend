import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '~/components/layout/PageHeader';
import { CoverageSection } from '~/components/sync/CoverageSection';
import { QueueSection } from '~/components/sync/QueueSection';
import { StorageSection } from '~/components/sync/StorageSection';
import { SyncHero } from '~/components/sync/SyncHero';
import { useSyncStore } from '~/store/useSyncStore';

/**
 * Единый экран офлайн-режима: связь и «синхронизировать всё», очередь
 * неотправленных операций, что именно сохранено на устройстве и сколько места
 * это занимает.
 */
export default function SyncPage() {
  const { t } = useTranslation('sync');

  useEffect(() => {
    void useSyncStore.getState().loadLastSync();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-4">
      <PageHeader title={t('title')} />
      <SyncHero />
      <QueueSection />
      <CoverageSection />
      <StorageSection />
    </div>
  );
}
