import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import type { WineDto } from "../wines-service-dtos/WineDto.js";
import {
  wineDtoFromDynamoItem,
  wineDtoToDynamoItem
} from "../wines-service-dtos/wineDto.serializer.js";
import { WinesTable } from "../wines-service-dtos/schema.js";
import type { WineService } from "./WineService.js";

export class WineDynamoService implements WineService {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async listByUser(userId: string): Promise<WineDto[]> {
    const PK = WinesTable.prefixes.user(userId);

    const res = await this.doc.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: `${WinesTable.pk} = :pk AND begins_with(${WinesTable.sk}, :wine)`,
      ExpressionAttributeValues: {
        ":pk": PK,
        ":wine": "WINE#"
      }
    }));

    return (res.Items ?? []).map((item) => wineDtoFromDynamoItem(item));
  }

  async listPublic(): Promise<WineDto[]> {
    const PK = WinesTable.prefixes.public();

    const res = await this.doc.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: `${WinesTable.pk} = :pk AND begins_with(${WinesTable.sk}, :wine)`,
      ExpressionAttributeValues: {
        ":pk": PK,
        ":wine": "WINE#"
      }
    }));

    return (res.Items ?? []).map((item) => wineDtoFromDynamoItem(item));
  }

  async listPublicFeatured(): Promise<WineDto[]> {
    const PK = WinesTable.prefixes.public();

    const res = await this.doc.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: `${WinesTable.pk} = :pk AND begins_with(${WinesTable.sk}, :wine)`,
      FilterExpression: "isFeatured = :isFeatured",
      ExpressionAttributeValues: {
        ":pk": PK,
        ":wine": "WINE#",
        ":isFeatured": true
      }
    }));

    return (res.Items ?? []).map((item) => wineDtoFromDynamoItem(item));
  }

  async getById(userId: string, wineId: string): Promise<WineDto | null> {
    const PK = WinesTable.prefixes.user(userId);
    const SK = WinesTable.prefixes.wine(wineId);

    const res = await this.doc.send(new GetCommand({
      TableName: this.tableName,
      Key: { [WinesTable.pk]: PK, [WinesTable.sk]: SK }
    }));

    if (!res.Item) return null;
    return wineDtoFromDynamoItem(res.Item);
  }

  async add(userId: string, wine: WineDto): Promise<void> {
    await this.doc.send(new PutCommand({
      TableName: this.tableName,
      Item: wineDtoToDynamoItem({ userId, wine })
    }));
  }
}
