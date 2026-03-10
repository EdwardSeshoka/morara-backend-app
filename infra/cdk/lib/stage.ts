import { Stage, type StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  getEnvironmentConfiguration,
  type AppEnvironment,
  type DeploymentWebConfiguration
} from "../../../src/shared/Infrastructure/Config/index.js";
import { ApiStack } from "./stacks/api-stack.js";
import { AuthStack } from "./stacks/auth-stack.js";
import { DataStack } from "./stacks/data-stack.js";
import { WebStack } from "./stacks/web-stack.js";

export type WebStageConfig = DeploymentWebConfiguration;

export type WineStageProps = StageProps & {
  appEnvironment: AppEnvironment;
  web?: WebStageConfig;
};

export class WineStage extends Stage {
  constructor(scope: Construct, id: string, props: WineStageProps) {
    super(scope, id, props);

    const environmentConfiguration = getEnvironmentConfiguration(props.appEnvironment);

    const auth = new AuthStack(this, `${environmentConfiguration.stackNamePrefix}-auth`, {
      appEnvironment: props.appEnvironment
    });

    const data = new DataStack(this, `${environmentConfiguration.stackNamePrefix}-data`, {
      appEnvironment: props.appEnvironment
    });

    new ApiStack(this, `${environmentConfiguration.stackNamePrefix}-api`, {
      appEnvironment: props.appEnvironment,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
      winesTable: data.winesTable
    });

    if (props.web?.enabled ?? environmentConfiguration.infrastructure.webEnabledByDefault) {
      const webStackProps = {
        appEnvironment: props.appEnvironment,
        ...(props.web?.domainName ? { webDomainName: props.web.domainName } : {}),
        ...(props.web?.hostedZoneName ? { webHostedZoneName: props.web.hostedZoneName } : {}),
        ...(props.web?.hostedZoneId ? { webHostedZoneId: props.web.hostedZoneId } : {}),
        ...(props.web?.certificateArn ? { webCertificateArn: props.web.certificateArn } : {}),
        ...(props.web?.buildPath ? { webBuildPath: props.web.buildPath } : {})
      };

      new WebStack(this, `${environmentConfiguration.stackNamePrefix}-web`, webStackProps);
    }
  }
}
