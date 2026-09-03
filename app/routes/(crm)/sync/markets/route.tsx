import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("markets")!;

export default function SyncMarketsRoute() {
  return <SyncEntityPage entity={entity} />;
}
