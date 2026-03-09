import { WineId } from "../WineId.js";
import { WineRepository } from "../repository/WineRepository.js";
import type { Wine } from "../../wines-entities/Wine.js";
import { UserId } from "../../../../../src/shared/Domain/ValueObjects/UserId.js";

export class AddWineUseCase {
  constructor(private readonly repo: WineRepository) {}

  async execute(input: {
    userId: UserId;
    name: string;
    estate: string;
    vintage?: number;
    year?: number;
    region: string;
    location: { area: string };
    imageUrl: string;
    description: string;
    rating: { value: number; count: number };
    price: { amount: number; currency: string };
    isFeatured: boolean;
  }) {
    const id = WineId.from(crypto.randomUUID());

    const wine: Wine = {
      id,
      name: input.name,
      estate: input.estate,
      ...(input.vintage !== undefined ? { vintage: input.vintage } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      region: input.region,
      location: { area: input.location.area },
      imageUrl: input.imageUrl,
      description: input.description,
      rating: {
        value: input.rating.value,
        count: input.rating.count
      },
      price: {
        amount: input.price.amount,
        currency: input.price.currency
      },
      isFeatured: input.isFeatured
    };

    await this.repo.add(input.userId, wine);
    return { item: wine };
  }
}
