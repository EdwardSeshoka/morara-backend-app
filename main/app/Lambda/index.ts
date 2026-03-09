import { buildAppComponents } from "../Composition/AppComposition.js";
import { makeListWinesHandler } from "../../../packages/features/wines-presentation/screens/Handlers/listWines.handler.js";
import { makeAddWineHandler } from "../../../packages/features/wines-presentation/screens/Handlers/addWine.handler.js";
import { makeGetWineHandler } from "../../../packages/features/wines-presentation/screens/Handlers/getWine.handler.js";
import { makeListPublicWinesHandler } from "../../../packages/features/wines-presentation/screens/Handlers/listPublicWines.handler.js";
import { makeGetPublicFeaturedWineHandler } from "../../../packages/features/wines-presentation/screens/Handlers/getPublicFeaturedWine.handler.js";
import { makeListPublicCollectionsHandler } from "../../../packages/features/wines-presentation/screens/Handlers/listPublicCollections.handler.js";

const components = buildAppComponents();

export const listWines = makeListWinesHandler(components);
export const listPublicWines = makeListPublicWinesHandler(components);
export const getPublicFeaturedWine = makeGetPublicFeaturedWineHandler(components);
export const listPublicCollections = makeListPublicCollectionsHandler(components);
export const addWine = makeAddWineHandler(components);
export const getWine = makeGetWineHandler(components);
