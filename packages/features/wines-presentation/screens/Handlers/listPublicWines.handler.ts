import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { ok } from "../../components/Adapters/response.js";
import { mapError } from "../../components/Middleware/error.middleware.js";

/**
 * Public GET /public/wines endpoint.
 * No authentication; returns the shared catalog without personalization.
 */
export function makeListPublicWinesHandler(components: AppComponents) {
  return async function handler(_event: APIGatewayProxyEventV2) {
    try {
      const result = await components.wine.listWines.execute({});
      return ok(result);
    } catch (err) {
      return mapError(err);
    }
  };
}
