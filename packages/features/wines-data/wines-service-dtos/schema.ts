export const WinesTable = {
  pk: "PK",
  sk: "SK",
  // Prefixes help keep keyspace tidy.
  prefixes: {
    user: (userId: string) => `USER#${userId}`,
    public: () => "PUBLIC",
    wine: (wineId: string) => `WINE#${wineId}`
  }
} as const;
