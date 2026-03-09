import { WineId } from "../wine-domain/WineId.js";

export type Wine = Readonly<{
  id: WineId;
  name: string;
  estate: string;
  vintage?: number;
  year?: number;
  region: string;
  location: Readonly<{
    area: string;
  }>;
  imageUrl: string;
  description: string;
  rating: Readonly<{
    value: number;
    count: number;
  }>;
  price: Readonly<{
    amount: number;
    currency: string;
  }>;
  isFeatured: boolean;
}>;
