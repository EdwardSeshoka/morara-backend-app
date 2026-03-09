import { Wine } from "./Wine.js";

export type WineCollection = Readonly<{
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: Readonly<{
    label: string;
  }>;
  wines: ReadonlyArray<Wine>;
}>;
