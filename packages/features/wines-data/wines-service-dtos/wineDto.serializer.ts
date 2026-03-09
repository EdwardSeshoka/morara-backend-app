import type { WineDto } from "./WineDto.js";
import { WinesTable } from "./schema.js";

export function wineDtoFromDynamoItem(item: Record<string, unknown>): WineDto {
  const region = toNonEmptyString(item.region, "Unknown Region");

  return {
    id: toNonEmptyString(item.wineId, ""),
    name: toNonEmptyString(item.name, "Unnamed Wine"),
    estate: toNonEmptyString(item.estate, "Unknown Estate"),
    ...(item.vintage !== undefined ? { vintage: toInt(item.vintage, 0) } : {}),
    ...(item.year !== undefined ? { year: toInt(item.year, 0) } : {}),
    region,
    location: {
      area: toNonEmptyString(item.locationArea, region)
    },
    imageUrl: toNonEmptyString(item.imageUrl, "wineBottle"),
    description: toNonEmptyString(item.description, ""),
    rating: {
      value: toNumber(item.ratingValue, 0),
      count: toInt(item.ratingCount, 0)
    },
    price: {
      amount: toNumber(item.priceAmount, 0),
      currency: toNonEmptyString(item.priceCurrency, "ZAR")
    },
    isFeatured: Boolean(item.isFeatured)
  };
}

export function wineDtoToDynamoItem(input: {
  userId: string;
  wine: WineDto;
}): Record<string, unknown> {
  const { userId, wine } = input;

  return {
    [WinesTable.pk]: WinesTable.prefixes.user(userId),
    [WinesTable.sk]: WinesTable.prefixes.wine(wine.id),
    userId,
    wineId: wine.id,
    name: wine.name,
    estate: wine.estate,
    ...(wine.vintage !== undefined ? { vintage: wine.vintage } : {}),
    ...(wine.year !== undefined ? { year: wine.year } : {}),
    region: wine.region,
    locationArea: wine.location.area,
    imageUrl: wine.imageUrl,
    description: wine.description,
    ratingValue: wine.rating.value,
    ratingCount: wine.rating.count,
    priceAmount: wine.price.amount,
    priceCurrency: wine.price.currency,
    isFeatured: wine.isFeatured
  };
}

function toNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}
