import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Stack, type StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type { StageName } from "../stage-names.js";

export type DataStackProps = StackProps & {
  stageName: StageName;
};

type PublicSeedWine = Readonly<{
  id: string;
  name: string;
  estate: string;
  vintage?: number;
  year?: number;
  region: string;
  location: Readonly<{ area: string }>;
  imageUrl: string;
  description: string;
  rating: Readonly<{ value: number; count: number }>;
  price: Readonly<{ amount: number; currency: string }>;
  isFeatured: boolean;
}>;

type DynamoAttribute = Readonly<{
  S?: string;
  N?: string;
  BOOL?: boolean;
}>;

function chunk<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

export class DataStack extends Stack {
  public readonly winesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.winesTable = new dynamodb.Table(this, "WinesTable", {
      tableName: `morara-${props.stageName}-wines`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.stageName === "dev" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN
    });

    this.seedPublicWinesFromJson(props.stageName);
  }

  private seedPublicWinesFromJson(stageName: StageName): void {
    const seeds = loadPublicWineSeeds(stageName);
    if (seeds.length === 0) return;

    const fileHash = createHash("sha256")
      .update(JSON.stringify(seeds))
      .digest("hex")
      .slice(0, 12);

    const batches = chunk(seeds, 25);

    batches.forEach((batch, batchIndex) => {
      const requestItems = {
        [this.winesTable.tableName]: batch.map((wine) => ({
          PutRequest: {
            Item: toPublicWineItem(wine)
          }
        }))
      };

      const deleteRequestItems = {
        [this.winesTable.tableName]: batch.map((wine) => ({
          DeleteRequest: {
            Key: toPublicWineKey(wine.id)
          }
        }))
      };

      new cr.AwsCustomResource(this, `SeedPublicWinesBatch${batchIndex}`, {
        onCreate: {
          service: "DynamoDB",
          action: "batchWriteItem",
          parameters: {
            RequestItems: requestItems
          },
          physicalResourceId: cr.PhysicalResourceId.of(`seed-public-${stageName}-batch-${batchIndex}-${fileHash}`)
        },
        onUpdate: {
          service: "DynamoDB",
          action: "batchWriteItem",
          parameters: {
            RequestItems: requestItems
          },
          physicalResourceId: cr.PhysicalResourceId.of(`seed-public-${stageName}-batch-${batchIndex}-${fileHash}`)
        },
        onDelete: {
          service: "DynamoDB",
          action: "batchWriteItem",
          parameters: {
            RequestItems: deleteRequestItems
          }
        },
        installLatestAwsSdk: false,
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [this.winesTable.tableArn]
        })
      });
    });
  }
}

function loadPublicWineSeeds(stageName: StageName): PublicSeedWine[] {
  const seedsDir = join(process.cwd(), "infra", "cdk", "seeds");
  const stagePath = join(seedsDir, `public-wines.${stageName}.json`);
  const defaultPath = join(seedsDir, "public-wines.json");

  let targetPath: string | null = null;
  if (existsSync(stagePath)) {
    targetPath = stagePath;
  } else if (existsSync(defaultPath)) {
    targetPath = defaultPath;
  }

  if (!targetPath) return [];

  const raw = readFileSync(targetPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Seed file must be an array: ${targetPath}`);
  }

  return parsed.map((entry, index) => parsePublicSeedWine(entry, index, targetPath));
}

function parsePublicSeedWine(entry: unknown, index: number, filePath: string): PublicSeedWine {
  const row = asRecord(entry, `Seed row ${index} in ${filePath} must be an object`);

  const wine: {
    id: string;
    name: string;
    estate: string;
    vintage?: number;
    year?: number;
    region: string;
    location: { area: string };
    imageUrl: string;
    description: string;
    rating: { value: number; count: number };
    price: { amount: number; currency: string };
    isFeatured: boolean;
  } = {
    id: readRequiredString(row.id, `Seed row ${index} in ${filePath} has invalid 'id'`),
    name: readRequiredString(row.name, `Seed row ${index} in ${filePath} has invalid 'name'`),
    estate: readRequiredString(row.estate, `Seed row ${index} in ${filePath} has invalid 'estate'`),
    region: readRequiredString(row.region, `Seed row ${index} in ${filePath} has invalid 'region'`),
    location: {
      area: readRequiredString(
        asRecord(row.location, `Seed row ${index} in ${filePath} has invalid 'location'`).area,
        `Seed row ${index} in ${filePath} has invalid 'location.area'`
      )
    },
    imageUrl: readRequiredString(row.imageUrl, `Seed row ${index} in ${filePath} has invalid 'imageUrl'`),
    description: readRequiredString(row.description, `Seed row ${index} in ${filePath} has invalid 'description'`),
    rating: {
      value: readFiniteNumber(
        asRecord(row.rating, `Seed row ${index} in ${filePath} has invalid 'rating'`).value,
        `Seed row ${index} in ${filePath} has invalid 'rating.value'`
      ),
      count: readInteger(
        asRecord(row.rating, `Seed row ${index} in ${filePath} has invalid 'rating'`).count,
        `Seed row ${index} in ${filePath} has invalid 'rating.count'`
      )
    },
    price: {
      amount: readFiniteNumber(
        asRecord(row.price, `Seed row ${index} in ${filePath} has invalid 'price'`).amount,
        `Seed row ${index} in ${filePath} has invalid 'price.amount'`
      ),
      currency: readRequiredString(
        asRecord(row.price, `Seed row ${index} in ${filePath} has invalid 'price'`).currency,
        `Seed row ${index} in ${filePath} has invalid 'price.currency'`
      )
    },
    isFeatured: readBoolean(row.isFeatured, `Seed row ${index} in ${filePath} has invalid 'isFeatured'`)
  };

  if (row.vintage !== undefined) {
    wine.vintage = readInteger(row.vintage, `Seed row ${index} in ${filePath} has invalid 'vintage'`);
  }

  if (row.year !== undefined) {
    wine.year = readInteger(row.year, `Seed row ${index} in ${filePath} has invalid 'year'`);
  }

  return wine;
}

function toPublicWineKey(wineId: string): Record<string, DynamoAttribute> {
  return {
    PK: { S: "PUBLIC" },
    SK: { S: `WINE#${wineId}` }
  };
}

function toPublicWineItem(wine: PublicSeedWine): Record<string, DynamoAttribute> {
  const item: Record<string, DynamoAttribute> = {
    PK: { S: "PUBLIC" },
    SK: { S: `WINE#${wine.id}` },
    wineId: { S: wine.id },
    name: { S: wine.name },
    estate: { S: wine.estate },
    region: { S: wine.region },
    locationArea: { S: wine.location.area },
    imageUrl: { S: wine.imageUrl },
    description: { S: wine.description },
    ratingValue: { N: String(wine.rating.value) },
    ratingCount: { N: String(wine.rating.count) },
    priceAmount: { N: String(wine.price.amount) },
    priceCurrency: { S: wine.price.currency },
    isFeatured: { BOOL: wine.isFeatured }
  };

  if (wine.vintage !== undefined) {
    item.vintage = { N: String(wine.vintage) };
  }

  if (wine.year !== undefined) {
    item.year = { N: String(wine.year) };
  }

  return item;
}

function asRecord(value: unknown, errorMessage: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(errorMessage);
  }
  return value as Record<string, unknown>;
}

function readRequiredString(value: unknown, errorMessage: string): string {
  if (typeof value !== "string") throw new Error(errorMessage);
  const trimmed = value.trim();
  if (!trimmed) throw new Error(errorMessage);
  return trimmed;
}

function readFiniteNumber(value: unknown, errorMessage: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(errorMessage);
  }
  return value;
}

function readInteger(value: unknown, errorMessage: string): number {
  const parsed = readFiniteNumber(value, errorMessage);
  if (!Number.isInteger(parsed)) throw new Error(errorMessage);
  return parsed;
}

function readBoolean(value: unknown, errorMessage: string): boolean {
  if (typeof value !== "boolean") throw new Error(errorMessage);
  return value;
}
