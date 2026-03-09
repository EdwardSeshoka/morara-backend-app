import { WineRepository } from "../repository/WineRepository.js";
import { UserId } from "../../../../../src/shared/Domain/ValueObjects/UserId.js";

export class ListWinesUseCase {
  constructor(private readonly repo: WineRepository) {}

  async execute(input: { userId?: UserId }) {
    const items = input.userId
      ? await this.repo.listByUser(input.userId)
      : await this.repo.listPublic();
    return { items };
  }
}
