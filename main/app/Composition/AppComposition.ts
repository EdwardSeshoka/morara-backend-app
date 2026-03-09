import { ListFeaturedWinesUseCase } from "../../../packages/features/wines-domain/wine-domain/usecases/ListFeaturedWinesUseCase.js";
import { ListPublicCollectionsUseCase } from "../../../packages/features/wines-domain/wine-domain/usecases/ListPublicCollectionsUseCase.js";
import { ListWinesUseCase } from "../../../packages/features/wines-domain/wine-domain/usecases/ListWinesUseCase.js";
import { AddWineUseCase } from "../../../packages/features/wines-domain/wine-domain/usecases/AddWineUseCase.js";
import { GetWineUseCase } from "../../../packages/features/wines-domain/wine-domain/usecases/GetWineUseCase.js";
import { WineDynamoRepository } from "../../../packages/features/wines-data/wines-repository/WineDynamoRepository.js";
import { WineDynamoService } from "../../../packages/features/wines-data/wines-service/WineDynamoService.js";
import { WineId } from "../../../packages/features/wines-domain/wine-domain/WineId.js";
import { getDynamoDocClient } from "../../../src/shared/Data/Dynamo/DynamoClient.js";
import { UserId } from "../../../src/shared/Domain/ValueObjects/UserId.js";
import { loadEnv } from "../../../src/shared/Infrastructure/Config/env.js";

export type AppComponents = Readonly<{
  env: ReturnType<typeof loadEnv>;
  ids: {
    userId: (value: string) => UserId;
    wineId: (value: string) => WineId;
  };
  wine: {
    listWines: ListWinesUseCase;
    listFeaturedWines: ListFeaturedWinesUseCase;
    listPublicCollections: ListPublicCollectionsUseCase;
    addWine: AddWineUseCase;
    getWine: GetWineUseCase;
  };
}>;

export function buildAppComponents(): AppComponents {
  const env = loadEnv();

  const doc = getDynamoDocClient();
  const wineService = new WineDynamoService(doc, env.WINES_TABLE);
  const wineRepo = new WineDynamoRepository(wineService);

  return {
    env,
    ids: {
      userId: UserId.from,
      wineId: WineId.from
    },
    wine: {
      listWines: new ListWinesUseCase(wineRepo),
      listFeaturedWines: new ListFeaturedWinesUseCase(wineRepo),
      listPublicCollections: new ListPublicCollectionsUseCase(wineRepo),
      addWine: new AddWineUseCase(wineRepo),
      getWine: new GetWineUseCase(wineRepo)
    }
  };
}
