import { z } from "zod";

import {
  DEFAULT_APP_ENVIRONMENT,
  type AppEnvironment,
  parseAppEnvironmentList,
  resolveAppEnvironment,
  toScopedContextKey,
  toScopedEnvironmentVariableName
} from "./AppEnvironment.js";
import {
  getEnvironmentConfiguration,
  type EnvironmentConfiguration
} from "./EnvironmentConfiguration.js";

const RuntimeEnvironmentSchema = z.object({
  APP_ENVIRONMENT: z.string().optional(),
  APP_STAGE: z.string().optional(),
  DEPLOY_ENVIRONMENT: z.string().optional(),
  WINES_TABLE: z.string().min(1),
  AWS_REGION: z.string().min(1).optional()
});

export type RuntimeEnvironmentConfiguration = Readonly<{
  appEnvironment: AppEnvironment;
  environmentConfiguration: EnvironmentConfiguration;
  winesTable: string;
  awsRegion?: string;
}>;

export type DeploymentWebConfiguration = Readonly<{
  enabled: boolean;
  domainName?: string;
  hostedZoneName?: string;
  hostedZoneId?: string;
  certificateArn?: string;
  buildPath: string;
}>;

export type DeploymentEnvironmentConfiguration = EnvironmentConfiguration &
  Readonly<{
    account: string;
    region: string;
    web: DeploymentWebConfiguration;
  }>;

export type DeploymentEnvironmentResolverInput = Readonly<{
  environment?: Readonly<Record<string, string | undefined>>;
  readContext?: (key: string) => string | undefined;
  fallbackTargets?: readonly AppEnvironment[];
}>;

export function loadRuntimeEnvironmentConfiguration(
  environment: Readonly<Record<string, string | undefined>> = process.env
): RuntimeEnvironmentConfiguration {
  const parsed = RuntimeEnvironmentSchema.safeParse(environment);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment variables", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }

  const appEnvironment =
    resolveAppEnvironment(
      parsed.data.APP_ENVIRONMENT,
      parsed.data.DEPLOY_ENVIRONMENT,
      parsed.data.APP_STAGE
    ) ?? DEFAULT_APP_ENVIRONMENT;

  return {
    appEnvironment,
    environmentConfiguration: getEnvironmentConfiguration(appEnvironment),
    winesTable: parsed.data.WINES_TABLE,
    ...(parsed.data.AWS_REGION ? { awsRegion: parsed.data.AWS_REGION } : {})
  };
}

export function resolveDeploymentTargetEnvironments(
  input: DeploymentEnvironmentResolverInput = {}
): AppEnvironment[] {
  const environment = input.environment ?? process.env;
  const readContext = input.readContext ?? (() => undefined);

  const requestedTargets = firstDefined(
    environment.DEPLOY_ENVIRONMENTS,
    environment.DEPLOY_ENVIRONMENT,
    readContext("deployEnvironments"),
    readContext("deployEnvironment")
  );

  const resolvedTargets = parseAppEnvironmentList(requestedTargets);

  if (resolvedTargets.length > 0) return resolvedTargets;
  if (input.fallbackTargets?.length) return [...input.fallbackTargets];

  return [DEFAULT_APP_ENVIRONMENT];
}

export function resolveDeploymentEnvironmentConfiguration(
  appEnvironment: AppEnvironment,
  input: DeploymentEnvironmentResolverInput = {}
): DeploymentEnvironmentConfiguration {
  const environment = input.environment ?? process.env;
  const readContext = input.readContext ?? (() => undefined);
  const environmentConfiguration = getEnvironmentConfiguration(appEnvironment);
  const deploymentTargets = input.fallbackTargets
    ? resolveDeploymentTargetEnvironments({
        environment,
        readContext,
        fallbackTargets: input.fallbackTargets
      })
    : resolveDeploymentTargetEnvironments({
        environment,
        readContext
      });
  const allowSharedEnvironmentVariables =
    deploymentTargets.length === 1 && deploymentTargets[0] === appEnvironment;

  const account =
    firstDefined(
      readScopedEnvironmentValue(
        appEnvironment,
        "ACCOUNT_ID",
        "AccountId",
        environment,
        readContext
      ),
      allowSharedEnvironmentVariables ? environment.ACCOUNT_ID : undefined,
      environment.CDK_DEFAULT_ACCOUNT
    ) ?? "";

  const region =
    firstDefined(
      readScopedEnvironmentValue(appEnvironment, "REGION", "Region", environment, readContext),
      allowSharedEnvironmentVariables ? environment.AWS_REGION : undefined,
      allowSharedEnvironmentVariables ? environment.REGION : undefined,
      environment.CDK_DEFAULT_REGION,
      readContext("defaultRegion"),
      environmentConfiguration.infrastructure.defaultRegion
    ) ?? environmentConfiguration.infrastructure.defaultRegion;

  const webEnabled = readBoolean(
    firstDefined(
      readScopedEnvironmentValue(
        appEnvironment,
        "WEB_ENABLED",
        "WebEnabled",
        environment,
        readContext
      ),
      allowSharedEnvironmentVariables ? environment.WEB_ENABLED : undefined
    ),
    environmentConfiguration.infrastructure.webEnabledByDefault
  );

  const domainName = firstDefined(
    readScopedEnvironmentValue(
      appEnvironment,
      "WEB_DOMAIN_NAME",
      "WebDomainName",
      environment,
      readContext
    ),
    allowSharedEnvironmentVariables ? environment.WEB_DOMAIN_NAME : undefined
  );

  const hostedZoneName = firstDefined(
    readScopedEnvironmentValue(
      appEnvironment,
      "WEB_HOSTED_ZONE_NAME",
      "WebHostedZoneName",
      environment,
      readContext
    ),
    allowSharedEnvironmentVariables ? environment.WEB_HOSTED_ZONE_NAME : undefined
  );

  const hostedZoneId = firstDefined(
    readScopedEnvironmentValue(
      appEnvironment,
      "WEB_HOSTED_ZONE_ID",
      "WebHostedZoneId",
      environment,
      readContext
    ),
    allowSharedEnvironmentVariables ? environment.WEB_HOSTED_ZONE_ID : undefined
  );

  const certificateArn = firstDefined(
    readScopedEnvironmentValue(
      appEnvironment,
      "WEB_CERTIFICATE_ARN",
      "WebCertificateArn",
      environment,
      readContext
    ),
    allowSharedEnvironmentVariables ? environment.WEB_CERTIFICATE_ARN : undefined
  );

  const buildPath =
    firstDefined(
      readScopedEnvironmentValue(
        appEnvironment,
        "WEB_BUILD_PATH",
        "WebBuildPath",
        environment,
        readContext
      ),
      allowSharedEnvironmentVariables ? environment.WEB_BUILD_PATH : undefined,
      environmentConfiguration.infrastructure.defaultWebBuildPath
    ) ?? environmentConfiguration.infrastructure.defaultWebBuildPath;

  return {
    ...environmentConfiguration,
    account,
    region,
    web: {
      enabled: webEnabled,
      buildPath,
      ...(domainName ? { domainName } : {}),
      ...(hostedZoneName ? { hostedZoneName } : {}),
      ...(hostedZoneId ? { hostedZoneId } : {}),
      ...(certificateArn ? { certificateArn } : {})
    }
  };
}

function readScopedEnvironmentValue(
  appEnvironment: AppEnvironment,
  envKeySuffix: string,
  contextKeySuffix: string,
  environment: Readonly<Record<string, string | undefined>>,
  readContext: (key: string) => string | undefined
): string | undefined {
  return firstDefined(
    environment[toScopedEnvironmentVariableName(appEnvironment, envKeySuffix)],
    readContext(toScopedContextKey(appEnvironment, contextKeySuffix))
  );
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (!value) continue;

    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
