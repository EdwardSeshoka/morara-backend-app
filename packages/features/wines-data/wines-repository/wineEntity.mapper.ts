import { WineId } from "../../wines-domain/wine-domain/WineId.js";
import type { Wine } from "../../wines-domain/wines-entities/Wine.js";
import type { WineDto } from "../wines-service-dtos/WineDto.js";

export function toWineEntity(dto: WineDto): Wine {
  const region = toNonEmptyString(dto.region, "Unknown Region");

  return {
    id: WineId.from(dto.id),
    name: toNonEmptyString(dto.name, "Unnamed Wine"),
    estate: toNonEmptyString(dto.estate, "Unknown Estate"),
    ...(dto.vintage !== undefined ? { vintage: dto.vintage } : {}),
    ...(dto.year !== undefined ? { year: dto.year } : {}),
    region,
    location: {
      area: toNonEmptyString(dto.location.area, region)
    },
    imageUrl: toNonEmptyString(dto.imageUrl, "wineBottle"),
    description: toNonEmptyString(dto.description, ""),
    rating: {
      value: dto.rating.value,
      count: dto.rating.count
    },
    price: {
      amount: dto.price.amount,
      currency: toNonEmptyString(dto.price.currency, "ZAR")
    },
    isFeatured: dto.isFeatured
  };
}

export function toWineDto(wine: Wine): WineDto {
  return {
    id: String(wine.id),
    name: wine.name,
    estate: wine.estate,
    ...(wine.vintage !== undefined ? { vintage: wine.vintage } : {}),
    ...(wine.year !== undefined ? { year: wine.year } : {}),
    region: wine.region,
    location: {
      area: wine.location.area
    },
    imageUrl: wine.imageUrl,
    description: wine.description,
    rating: {
      value: wine.rating.value,
      count: wine.rating.count
    },
    price: {
      amount: wine.price.amount,
      currency: wine.price.currency
    },
    isFeatured: wine.isFeatured
  };
}

function toNonEmptyString(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
