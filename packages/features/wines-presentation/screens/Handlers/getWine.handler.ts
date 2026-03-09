import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { Errors } from "../../../../../src/shared/Application/Common/Errors.js";
import { toRequestContext } from "../../components/Adapters/apiGatewayEvent.js";
import { ok } from "../../components/Adapters/response.js";
import { requireAuth } from "../../components/Middleware/auth.middleware.js";
import { mapError } from "../../components/Middleware/error.middleware.js";

export function makeGetWineHandler(components: AppComponents) {
  return async function handler(event: APIGatewayProxyEventV2) {
    try {
      requireAuth(event);
      const req = toRequestContext(event);

      const id = req.params.id;
      if (!id) throw Errors.badRequest("Missing wine id");

      const result = await components.wine.getWine.execute({
        userId: components.ids.userId(req.auth.sub),
        wineId: components.ids.wineId(id)
      });

      return ok(result);
    } catch (err) {
      return mapError(err);
    }
  };
}
