import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { AddWineRequestSchema } from "../../../../../packages/shared/api-contract/wines.js";
import type { AppComponents } from "../../../../../main/app/Composition/AppComposition.js";
import { toRequestContext } from "../../components/Adapters/apiGatewayEvent.js";
import { created } from "../../components/Adapters/response.js";
import { requireAuth } from "../../components/Middleware/auth.middleware.js";
import { mapError } from "../../components/Middleware/error.middleware.js";
import { validateBody } from "../../components/Middleware/validate.middleware.js";

export function makeAddWineHandler(components: AppComponents) {
  return async function handler(event: APIGatewayProxyEventV2) {
    try {
      requireAuth(event);
      const req = toRequestContext(event);
      const body = validateBody(AddWineRequestSchema, req.body);

      const result = await components.wine.addWine.execute({
        userId: components.ids.userId(req.auth.sub),
        name: body.name,
        estate: body.estate,
        ...(body.vintage !== undefined ? { vintage: body.vintage } : {}),
        ...(body.year !== undefined ? { year: body.year } : {}),
        region: body.region,
        location: {
          area: body.location.area
        },
        imageUrl: body.imageUrl,
        description: body.description,
        rating: {
          value: body.rating.value,
          count: body.rating.count
        },
        price: {
          amount: body.price.amount,
          currency: body.price.currency
        },
        isFeatured: body.isFeatured
      });

      return created(result);
    } catch (err) {
      return mapError(err);
    }
  };
}
