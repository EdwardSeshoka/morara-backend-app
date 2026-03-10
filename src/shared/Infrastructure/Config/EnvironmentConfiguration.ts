import type { AppEnvironment } from "./AppEnvironment.js";

const DEFAULT_AWS_REGION = "af-south-1";
const DEFAULT_WEB_BUILD_PATH = "../wine-app/dist";

export type EnvironmentConfiguration = Readonly<{
  appEnvironment: AppEnvironment;
  githubEnvironment: AppEnvironment;
  stackNamePrefix: string;
  serviceEndpoints: Readonly<{
    publicApiBaseUrl?: string;
  }>;
  database: Readonly<{
    allowTeardown: boolean;
    publicSeedFileName: string;
  }>;
  featureFlags: Readonly<{
    developerOverridesEnabled: boolean;
  }>;
  infrastructure: Readonly<{
    allowDestructiveChanges: boolean;
    defaultRegion: string;
    defaultWebBuildPath: string;
    webEnabledByDefault: boolean;
  }>;
  runtime: Readonly<{
    defaultLogLevel: "DEBUG" | "INFO";
  }>;
}>;

export const ENVIRONMENT_CONFIGURATIONS: Record<AppEnvironment, EnvironmentConfiguration> = {
  dev: {
    appEnvironment: "dev",
    githubEnvironment: "dev",
    stackNamePrefix: "morara-dev",
    serviceEndpoints: {},
    database: {
      allowTeardown: true,
      publicSeedFileName: "public-wines.dev.json"
    },
    featureFlags: {
      developerOverridesEnabled: true
    },
    infrastructure: {
      allowDestructiveChanges: true,
      defaultRegion: DEFAULT_AWS_REGION,
      defaultWebBuildPath: DEFAULT_WEB_BUILD_PATH,
      webEnabledByDefault: true
    },
    runtime: {
      defaultLogLevel: "DEBUG"
    }
  },
  beta: {
    appEnvironment: "beta",
    githubEnvironment: "beta",
    stackNamePrefix: "morara-beta",
    serviceEndpoints: {},
    database: {
      allowTeardown: false,
      publicSeedFileName: "public-wines.beta.json"
    },
    featureFlags: {
      developerOverridesEnabled: false
    },
    infrastructure: {
      allowDestructiveChanges: false,
      defaultRegion: DEFAULT_AWS_REGION,
      defaultWebBuildPath: DEFAULT_WEB_BUILD_PATH,
      webEnabledByDefault: true
    },
    runtime: {
      defaultLogLevel: "INFO"
    }
  },
  production: {
    appEnvironment: "production",
    githubEnvironment: "production",
    stackNamePrefix: "morara-production",
    serviceEndpoints: {},
    database: {
      allowTeardown: false,
      publicSeedFileName: "public-wines.production.json"
    },
    featureFlags: {
      developerOverridesEnabled: false
    },
    infrastructure: {
      allowDestructiveChanges: false,
      defaultRegion: DEFAULT_AWS_REGION,
      defaultWebBuildPath: DEFAULT_WEB_BUILD_PATH,
      webEnabledByDefault: true
    },
    runtime: {
      defaultLogLevel: "INFO"
    }
  }
};

export function getEnvironmentConfiguration(
  appEnvironment: AppEnvironment
): EnvironmentConfiguration {
  return ENVIRONMENT_CONFIGURATIONS[appEnvironment];
}
