import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { Errors } from "../../../../../src/shared/Application/Common/Errors.js";

/**
 * If you use an API Gateway JWT authorizer, you typically don't verify JWTs in Lambda.
 * Instead, you assert the claims exist.
 */
export function requireAuth(event: APIGatewayProxyEventV2): void {
  const claims =
    (event.requestContext as any)?.authorizer?.jwt?.claims ??
    (event.requestContext as any)?.authorizer?.claims;

  if (!claims?.sub) {
    throw Errors.unauthorized("Missing JWT claims (authorizer)");
  }
}
