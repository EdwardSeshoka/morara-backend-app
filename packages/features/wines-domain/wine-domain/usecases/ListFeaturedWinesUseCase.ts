import { WineRepository } from "../repository/WineRepository.js";

export class ListFeaturedWinesUseCase {
  constructor(private readonly repo: WineRepository) {}

  async execute() {
    const items = await this.repo.listPublicFeatured();
    return { items };
  }
}
