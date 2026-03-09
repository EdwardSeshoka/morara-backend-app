import { z } from "zod";

/**
 * Claims we rely on from API Gateway JWT authorizer (Cognito).
 * The `sub` is the stable user id.
 */
export const JwtClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional()
});

export type JwtClaims = z.infer<typeof JwtClaimsSchema>;
