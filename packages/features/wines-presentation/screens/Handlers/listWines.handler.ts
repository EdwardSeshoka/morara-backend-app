import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { toRequestContext } from "../../components/Adapters/apiGatewayEvent.js";
import { ok } from "../../components/Adapters/response.js";
import { requireAuth } from "../../components/Middleware/auth.middleware.js";
import { mapError } from "../../components/Middleware/error.middleware.js";

export function makeListWinesHandler(components: AppComponents) {
  return async function handler(event: APIGatewayProxyEventV2) {
    try {
      requireAuth(event);
      const req = toRequestContext(event);

      const result = await components.wine.listWines.execute({
        userId: components.ids.userId(req.auth.sub)
      });

      return ok(result);
    } catch (err) {
      return mapError(err);
    }
  };
}
