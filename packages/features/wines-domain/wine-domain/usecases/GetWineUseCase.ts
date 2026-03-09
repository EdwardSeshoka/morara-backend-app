import { WineId } from "../WineId.js";
import { WineRepository } from "../repository/WineRepository.js";
import { Errors } from "../../../../../src/shared/Application/Common/Errors.js";
import { UserId } from "../../../../../src/shared/Domain/ValueObjects/UserId.js";

export class GetWineUseCase {
  constructor(private readonly repo: WineRepository) {}

  async execute(input: { userId: UserId; wineId: WineId }) {
    const item = await this.repo.getById(input.userId, input.wineId);
    if (!item) throw Errors.notFound("Wine not found");
    return { item };
  }
}
