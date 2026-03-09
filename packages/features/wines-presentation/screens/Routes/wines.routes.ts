/**
 * This file is intentionally simple: it documents "what endpoints exist".
 * API Gateway/CDK wiring can reference these handler exports.
 */
export const WinesRoutes = {
  listPublic: { method: "GET", path: "/public/wines" },
  getPublicFeatured: { method: "GET", path: "/public/featuredwine" },
  listPublicCollections: { method: "GET", path: "/public/collections" },
  list: { method: "GET", path: "/wines" },
  add: { method: "POST", path: "/wines" },
  get: { method: "GET", path: "/wines/{id}" }
} as const;
