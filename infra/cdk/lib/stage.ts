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
    const authStackName = `${environmentConfiguration.stackNamePrefix}-auth`;
    const dataStackName = `${environmentConfiguration.stackNamePrefix}-data`;
    const apiStackName = `${environmentConfiguration.stackNamePrefix}-api`;
    const webStackName = `${environmentConfiguration.stackNamePrefix}-web`;

    const auth = new AuthStack(this, "auth", {
      appEnvironment: props.appEnvironment,
      stackName: authStackName
    });

    const data = new DataStack(this, "data", {
      appEnvironment: props.appEnvironment,
      stackName: dataStackName
    });

    new ApiStack(this, "api", {
      appEnvironment: props.appEnvironment,
      stackName: apiStackName,
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

      new WebStack(this, "web", {
        ...webStackProps,
        stackName: webStackName
      });
    }
  }
}
