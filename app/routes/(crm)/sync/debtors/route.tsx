import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("debtors")!;

export default function SyncDebtorsRoute() {
  return <SyncEntityPage entity={entity} />;
}
