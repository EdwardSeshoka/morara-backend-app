import { WineRepository } from "../../wines-domain/wine-domain/repository/WineRepository.js";
import type { WineId } from "../../wines-domain/wine-domain/WineId.js";
import type { Wine } from "../../wines-domain/wines-entities/Wine.js";
import type { WineCollection } from "../../wines-domain/wines-entities/WineCollection.js";
import type { WineService } from "../wines-service/WineService.js";
import { toWineDto, toWineEntity } from "./wineEntity.mapper.js";
import type { UserId } from "../../../../src/shared/Domain/ValueObjects/UserId.js";

export class WineDynamoRepository implements WineRepository {
  constructor(private readonly service: WineService) {}

  async listByUser(userId: UserId): Promise<Wine[]> {
    const dtos = await this.service.listByUser(String(userId));
    return dtos.map(toWineEntity);
  }

  async listPublic(): Promise<Wine[]> {
    const dtos = await this.service.listPublic();
    return dtos.map(toWineEntity);
  }

  async listPublicFeatured(): Promise<Wine[]> {
    const dtos = await this.service.listPublicFeatured();
    return dtos.map(toWineEntity);
  }

  async listPublicCollections(): Promise<WineCollection[]> {
    const wines = await this.listPublic();
    return buildPublicCollections(wines);
  }

  async getById(userId: UserId, wineId: WineId): Promise<Wine | null> {
    const dto = await this.service.getById(String(userId), String(wineId));
    if (!dto) return null;

    return toWineEntity(dto);
  }

  async add(userId: UserId, wine: Wine): Promise<void> {
    await this.service.add(String(userId), toWineDto(wine));
  }
}

function buildPublicCollections(wines: Wine[]): WineCollection[] {
  if (wines.length === 0) return [];

  const featured = dedupeById(wines.filter((wine) => wine.isFeatured)).slice(0, 8);

  const southAfrican = dedupeById(
    wines.filter(
      (wine) =>
        includesIgnoreCase(wine.location.area, "south africa") ||
        includesIgnoreCase(wine.region, "stellenbosch") ||
        includesIgnoreCase(wine.region, "franschhoek") ||
        includesIgnoreCase(wine.region, "constantia")
    )
  ).slice(0, 8);

  const topRated = dedupeById(
    [...wines].sort((left, right) => {
      const byRating = right.rating.value - left.rating.value;
      if (byRating !== 0) return byRating;
      return right.rating.count - left.rating.count;
    })
  ).slice(0, 8);

  const collections: WineCollection[] = [];

  if (featured.length > 0) {
    collections.push({
      id: "featured-picks",
      title: "Featured Picks",
      subtitle: "Editor highlights",
      description: "A curated set of standout bottles selected for the home experience.",
      badge: { label: "Featured" },
      wines: featured
    });
  }

  if (southAfrican.length > 0) {
    collections.push({
      id: "south-african-icons",
      title: "South African Icons",
      subtitle: "Regional favorites",
      description: "Wines from South African regions currently represented in the public catalog.",
      wines: southAfrican
    });
  }

  if (topRated.length > 0) {
    collections.push({
      id: "top-rated",
      title: "Top Rated",
      subtitle: "Community score leaders",
      description: "Highest-rated wines based on rating value and rating count.",
      wines: topRated
    });
  }

  return collections;
}

function dedupeById(wines: Wine[]): Wine[] {
  const seen = new Set<string>();
  const deduped: Wine[] = [];

  for (const wine of wines) {
    if (seen.has(wine.id)) continue;
    seen.add(wine.id);
    deduped.push(wine);
  }

  return deduped;
}

function includesIgnoreCase(value: string, search: string): boolean {
  return value.toLowerCase().includes(search.toLowerCase());
}
