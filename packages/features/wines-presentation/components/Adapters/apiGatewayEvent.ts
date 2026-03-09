import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { JwtClaimsSchema, type JwtClaims } from "../Contracts/JwtClaims.js";

export type RequestContext = Readonly<{
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  params: Record<string, string | undefined>;
  body: unknown;
  auth: JwtClaims;
}>;

export function toRequestContext(event: APIGatewayProxyEventV2): RequestContext {
  const claimsRaw =
    (event.requestContext as any)?.authorizer?.jwt?.claims ??
    (event.requestContext as any)?.authorizer?.claims ??
    {};

  const claims = JwtClaimsSchema.parse(claimsRaw);

  const body = event.body ? safeJsonParse(event.body) : undefined;

  return {
    method: event.requestContext.http.method,
    path: event.rawPath,
    query: event.queryStringParameters ?? {},
    params: event.pathParameters ?? {},
    body,
    auth: claims
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
