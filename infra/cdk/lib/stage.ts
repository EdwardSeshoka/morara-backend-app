import { Stage, type StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiStack } from "./stacks/api-stack.js";
import { AuthStack } from "./stacks/auth-stack.js";
import { DataStack } from "./stacks/data-stack.js";
import { WebStack } from "./stacks/web-stack.js";
import type { StageName } from "./stage-names.js";

export type WebStageConfig = Readonly<{
  enabled?: boolean;
  domainName?: string;
  hostedZoneName?: string;
  hostedZoneId?: string;
  certificateArn?: string;
  buildPath?: string;
}>;

export type WineStageProps = StageProps & {
  stageName: StageName;
  web?: WebStageConfig;
};

export class WineStage extends Stage {
  constructor(scope: Construct, id: string, props: WineStageProps) {
    super(scope, id, props);

    const auth = new AuthStack(this, `morara-${props.stageName}-auth`, {
      stageName: props.stageName
    });

    const data = new DataStack(this, `morara-${props.stageName}-data`, {
      stageName: props.stageName
    });

    new ApiStack(this, `morara-${props.stageName}-api`, {
      stageName: props.stageName,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
      winesTable: data.winesTable
    });

    if (props.web?.enabled ?? true) {
      const webStackProps = {
        stageName: props.stageName,
        ...(props.web?.domainName ? { webDomainName: props.web.domainName } : {}),
        ...(props.web?.hostedZoneName ? { webHostedZoneName: props.web.hostedZoneName } : {}),
        ...(props.web?.hostedZoneId ? { webHostedZoneId: props.web.hostedZoneId } : {}),
        ...(props.web?.certificateArn ? { webCertificateArn: props.web.certificateArn } : {}),
        ...(props.web?.buildPath ? { webBuildPath: props.web.buildPath } : {})
      };

      new WebStack(this, `morara-${props.stageName}-web`, webStackProps);
    }
  }
}
