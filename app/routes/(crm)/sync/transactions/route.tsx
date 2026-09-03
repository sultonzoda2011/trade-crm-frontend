import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("transactions")!;

export default function SyncTransactionsRoute() {
  return <SyncEntityPage entity={entity} />;
}
