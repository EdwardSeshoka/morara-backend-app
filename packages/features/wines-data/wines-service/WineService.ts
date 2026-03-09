import type { WineDto } from "../wines-service-dtos/WineDto.js";

export interface WineService {
  listByUser(userId: string): Promise<WineDto[]>;
  listPublic(): Promise<WineDto[]>;
  listPublicFeatured(): Promise<WineDto[]>;
  getById(userId: string, wineId: string): Promise<WineDto | null>;
  add(userId: string, wine: WineDto): Promise<void>;
}
