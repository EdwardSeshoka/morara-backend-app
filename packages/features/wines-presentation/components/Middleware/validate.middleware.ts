import { z } from "zod";
import { Errors } from "../../../../../src/shared/Application/Common/Errors.js";

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw Errors.badRequest("Validation failed", parsed.error.flatten());
  }
  return parsed.data;
}
