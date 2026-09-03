import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("products")!;

export default function SyncProductsRoute() {
  return <SyncEntityPage entity={entity} />;
}
