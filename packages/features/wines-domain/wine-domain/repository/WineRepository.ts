import type { Wine } from "../../wines-entities/Wine.js";
import type { WineCollection } from "../../wines-entities/WineCollection.js";
import type { WineId } from "../WineId.js";
import type { UserId } from "../../../../../src/shared/Domain/ValueObjects/UserId.js";

export interface WineRepository {
  listByUser(userId: UserId): Promise<Wine[]>;
  listPublic(): Promise<Wine[]>;
  listPublicFeatured(): Promise<Wine[]>;
  listPublicCollections(): Promise<WineCollection[]>;
  getById(userId: UserId, wineId: WineId): Promise<Wine | null>;
  add(userId: UserId, wine: Wine): Promise<void>;
}
