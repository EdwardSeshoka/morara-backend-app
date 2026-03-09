export type UserId = string & { readonly __brand: "UserId" };
export const UserId = {
  from: (value: string) => value as UserId
};
