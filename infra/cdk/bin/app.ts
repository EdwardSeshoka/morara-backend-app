import { App } from "aws-cdk-lib";
import {
  DEFAULT_APP_ENVIRONMENT,
  resolveDeploymentEnvironmentConfiguration,
  resolveDeploymentTargetEnvironments
} from "../../../src/shared/Infrastructure/Config/index.js";
import { WineStage } from "../lib/stage.js";

const app = new App();

const deploymentTargets = resolveDeploymentTargetEnvironments({
  environment: process.env,
  readContext,
  fallbackTargets: [DEFAULT_APP_ENVIRONMENT]
});

for (const appEnvironment of deploymentTargets) {
  const deploymentConfiguration = resolveDeploymentEnvironmentConfiguration(appEnvironment, {
    environment: process.env,
    readContext,
    fallbackTargets: deploymentTargets
  });

  const account = deploymentConfiguration.account;
  const region = deploymentConfiguration.region;

  if (!account) {
    throw new Error(
      `Account not configured for environment ${appEnvironment}. Set ${appEnvironment.toUpperCase()}_ACCOUNT_ID, ACCOUNT_ID, or CDK_DEFAULT_ACCOUNT.`
    );
  }

  new WineStage(app, deploymentConfiguration.stackNamePrefix, {
    env: { account, region },
    appEnvironment,
    web: deploymentConfiguration.web
  });
}

function readContext(key: string): string | undefined {
  const value = app.node.tryGetContext(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
