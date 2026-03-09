export type WineId = string & { readonly __brand: "WineId" };
export const WineId = {
  from: (value: string) => value as WineId
};
