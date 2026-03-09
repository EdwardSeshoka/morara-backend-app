/**
 * Shared ID helpers (frontend + backend).
 * Keep these simple and serializable.
 */

export type UserId = string & { readonly __brand: "UserId" };
export type WineId = string & { readonly __brand: "WineId" };

export const asUserId = (value: string) => value as UserId;
export const asWineId = (value: string) => value as WineId;
