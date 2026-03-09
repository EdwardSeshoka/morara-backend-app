import { z } from "zod";

const EnvSchema = z.object({
  WINES_TABLE: z.string().min(1),
  AWS_REGION: z.string().min(1).optional()
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment variables", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
