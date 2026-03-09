export type HttpResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

export function ok(body: unknown): HttpResponse {
  return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(body) };
}

export function created(body: unknown): HttpResponse {
  return { statusCode: 201, headers: jsonHeaders, body: JSON.stringify(body) };
}

export function badRequest(body: unknown): HttpResponse {
  return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify(body) };
}

export function unauthorized(body: unknown): HttpResponse {
  return { statusCode: 401, headers: jsonHeaders, body: JSON.stringify(body) };
}

export function notFound(body: unknown): HttpResponse {
  return { statusCode: 404, headers: jsonHeaders, body: JSON.stringify(body) };
}

export function internalError(body: unknown): HttpResponse {
  return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify(body) };
}
