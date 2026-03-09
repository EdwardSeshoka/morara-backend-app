import { App } from "aws-cdk-lib";
import { WineStage, type WebStageConfig } from "../lib/stage.js";
import type { StageName } from "../lib/stage-names.js";

const app = new App();

type StageConfig = {
  account: string;
  region: string;
  web: WebStageConfig;
};

// Allow configuration via env vars or cdk.json context.
const defaultAccount = process.env.CDK_DEFAULT_ACCOUNT ?? "";
const defaultRegion = process.env.CDK_DEFAULT_REGION ?? readContext("defaultRegion") ?? "us-east-1";

// Map per-stage accounts/regions (separate AWS Organization accounts).
// Keep values as plain strings to satisfy exactOptionalPropertyTypes.
const stageConfigs: Record<StageName, StageConfig> = {
  dev: {
    account: readStageString("dev", "ACCOUNT_ID", "AccountId") ?? defaultAccount,
    region: readStageString("dev", "REGION", "Region") ?? defaultRegion,
    web: resolveWebConfig("dev")
  },
  int: {
    account: readStageString("int", "ACCOUNT_ID", "AccountId") ?? "",
    region: readStageString("int", "REGION", "Region") ?? defaultRegion,
    web: resolveWebConfig("int")
  },
  uat: {
    account: readStageString("uat", "ACCOUNT_ID", "AccountId") ?? "",
    region: readStageString("uat", "REGION", "Region") ?? defaultRegion,
    web: resolveWebConfig("uat")
  },
  prod: {
    account: readStageString("prod", "ACCOUNT_ID", "AccountId") ?? "",
    region: readStageString("prod", "REGION", "Region") ?? defaultRegion,
    web: resolveWebConfig("prod")
  }
};

// Start with dev only. Add other stages here when their accounts are ready.
const enabledStages: StageName[] = ["dev"];

for (const stageName of enabledStages) {
  const account = stageConfigs[stageName].account;
  const region = stageConfigs[stageName].region;

  if (!account) {
    throw new Error(
      `Account not configured for stage ${stageName}. Set ${stageName.toUpperCase()}_ACCOUNT_ID or CDK_DEFAULT_ACCOUNT.`
    );
  }

  new WineStage(app, `morara-${stageName}`, {
    env: { account, region },
    stageName,
    web: stageConfigs[stageName].web
  });
}

function resolveWebConfig(stageName: StageName): WebStageConfig {
  const enabled = readBoolean(
    firstDefined(
      readStageEnv(stageName, "WEB_ENABLED"),
      readStageContext(stageName, "WebEnabled")
    ),
    true
  );

  const domainName = firstDefined(
    readStageEnv(stageName, "WEB_DOMAIN_NAME"),
    readStageContext(stageName, "WebDomainName")
  );

  const hostedZoneName = firstDefined(
    readStageEnv(stageName, "WEB_HOSTED_ZONE_NAME"),
    readStageContext(stageName, "WebHostedZoneName")
  );

  const hostedZoneId = firstDefined(
    readStageEnv(stageName, "WEB_HOSTED_ZONE_ID"),
    readStageContext(stageName, "WebHostedZoneId")
  );

  const certificateArn = firstDefined(
    readStageEnv(stageName, "WEB_CERTIFICATE_ARN"),
    readStageContext(stageName, "WebCertificateArn")
  );

  const buildPath = firstDefined(
    readStageEnv(stageName, "WEB_BUILD_PATH"),
    readStageContext(stageName, "WebBuildPath"),
    "../wine-app/dist"
  );

  return {
    enabled,
    ...(domainName ? { domainName } : {}),
    ...(hostedZoneName ? { hostedZoneName } : {}),
    ...(hostedZoneId ? { hostedZoneId } : {}),
    ...(certificateArn ? { certificateArn } : {}),
    ...(buildPath ? { buildPath } : {})
  };
}

function readStageString(stageName: StageName, envKeySuffix: string, contextKeySuffix: string): string | undefined {
  return firstDefined(readStageEnv(stageName, envKeySuffix), readStageContext(stageName, contextKeySuffix));
}

function readStageEnv(stageName: StageName, envKeySuffix: string): string | undefined {
  return process.env[`${stageName.toUpperCase()}_${envKeySuffix}`];
}

function readStageContext(stageName: StageName, contextKeySuffix: string): string | undefined {
  return readContext(`${stageName}${contextKeySuffix}`);
}

function readContext(key: string): string | undefined {
  const value = app.node.tryGetContext(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }

  return undefined;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
