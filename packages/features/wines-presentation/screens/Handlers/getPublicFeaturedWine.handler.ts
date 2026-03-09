import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { ok } from "../../components/Adapters/response.js";
import { mapError } from "../../components/Middleware/error.middleware.js";

/**
 * Public GET /public/featuredwine endpoint.
 * No authentication; returns a single featured wine for the discover hero.
 */
export function makeGetPublicFeaturedWineHandler(components: AppComponents) {
  return async function handler(_event: APIGatewayProxyEventV2) {
    try {
      const result = await components.wine.listFeaturedWines.execute();
      return ok({ item: result.items[0] ?? null });
    } catch (err) {
      return mapError(err);
    }
  };
}
