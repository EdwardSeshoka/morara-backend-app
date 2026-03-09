import { WineRepository } from "../repository/WineRepository.js";

export class ListPublicCollectionsUseCase {
  constructor(private readonly repo: WineRepository) {}

  execute() {
    return this.repo.listPublicCollections();
  }
}
