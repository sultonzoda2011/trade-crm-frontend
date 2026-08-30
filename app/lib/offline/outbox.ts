// app/lib/offline/outbox.ts
//
// Тонкий доменный хелпер над db.ts: поставить действие в очередь на отправку,
// когда появится интернет. Сама отправка (replay) — в syncEngine.ts.
import { addOutboxRow, type OfflineEntity, type OutboxRow } from '~/lib/offline/db';
import { newLocalId } from '~/lib/offline/localIds';

export async function enqueueOutbox(params: {
  method: OutboxRow['method'];
  url: string;
  body: unknown;
  entity: OfflineEntity;
  localId: string;
}): Promise<void> {
  await addOutboxRow({
    id: newLocalId(),
    method: params.method,
    url: params.url,
    body: params.body,
    entity: params.entity,
    localId: params.localId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}
