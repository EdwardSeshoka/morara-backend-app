import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { ok } from "../../components/Adapters/response.js";
import { mapError } from "../../components/Middleware/error.middleware.js";

/**
 * Public GET /public/collections endpoint.
 * No authentication; returns public wine collections with inline wine cards.
 */
export function makeListPublicCollectionsHandler(components: AppComponents) {
  return async function handler(_event: APIGatewayProxyEventV2) {
    try {
      const result = await components.wine.listPublicCollections.execute();
      return ok(result);
    } catch (err) {
      return mapError(err);
    }
  };
}
