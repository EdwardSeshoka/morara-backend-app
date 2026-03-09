import { AppError } from "../../../../../src/shared/Application/Common/Errors.js";
import { logger } from "../../../../../src/shared/Infrastructure/Observability/logger.js";
import {
  badRequest,
  internalError,
  notFound,
  unauthorized,
  type HttpResponse,
} from "../Adapters/response.js";

export function mapError(err: unknown): HttpResponse {
  if (err instanceof AppError) {
    switch (err.code) {
      case "BAD_REQUEST":
        return badRequest({ message: err.message, details: err.details });
      case "UNAUTHORIZED":
        return unauthorized({ message: err.message });
      case "NOT_FOUND":
        return notFound({ message: err.message });
      default:
        return internalError({ message: err.message });
    }
  }

  logger.error("Unhandled error", { err });
  return internalError({ message: "Internal server error" });
}
