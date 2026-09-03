import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("sellers")!;

export default function SyncSellersRoute() {
  return <SyncEntityPage entity={entity} />;
}
