import { SyncEntityPage } from "~/components/sync/SyncEntityPage";
import { getSyncEntity } from "~/lib/offline/entities";

const entity = getSyncEntity("categories")!;

export default function SyncCategoriesRoute() {
  return <SyncEntityPage entity={entity} />;
}
