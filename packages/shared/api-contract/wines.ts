import { z } from "zod";

export const WineLocationSchema = z.object({
  area: z.string().min(1)
});

export const WineRatingSchema = z.object({
  value: z.number().min(0).max(5),
  count: z.number().int().min(0)
});

export const WinePriceSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().min(1)
});

export const WineDtoSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  estate: z.string().min(1),
  vintage: z.number().int().min(1900).max(2100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  region: z.string().min(1),
  location: WineLocationSchema,
  imageUrl: z.string().min(1),
  description: z.string().min(1),
  rating: WineRatingSchema,
  price: WinePriceSchema,
  isFeatured: z.boolean()
});

export type WineDto = z.infer<typeof WineDtoSchema>;

export const ListWinesResponseSchema = z.object({
  items: z.array(WineDtoSchema)
});
export type ListWinesResponse = z.infer<typeof ListWinesResponseSchema>;

export const AddWineRequestSchema = z.object({
  name: z.string().min(1),
  estate: z.string().min(1),
  vintage: z.number().int().min(1900).max(2100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  region: z.string().min(1),
  location: WineLocationSchema,
  imageUrl: z.string().min(1),
  description: z.string().min(1),
  rating: WineRatingSchema,
  price: WinePriceSchema,
  isFeatured: z.boolean()
});
export type AddWineRequest = z.infer<typeof AddWineRequestSchema>;

export const AddWineResponseSchema = z.object({
  item: WineDtoSchema
});
export type AddWineResponse = z.infer<typeof AddWineResponseSchema>;
