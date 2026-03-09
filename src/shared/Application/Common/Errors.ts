export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BAD_REQUEST"
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "INTERNAL",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest(message: string, details?: unknown) {
    return new AppError(message, "BAD_REQUEST", details);
  },
  unauthorized(message = "Unauthorized") {
    return new AppError(message, "UNAUTHORIZED");
  },
  notFound(message = "Not found") {
    return new AppError(message, "NOT_FOUND");
  },
  internal(message = "Internal error", details?: unknown) {
    return new AppError(message, "INTERNAL", details);
  }
};
