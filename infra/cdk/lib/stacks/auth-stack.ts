import { Stack, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import type { StageName } from "../stage-names.js";

export type AuthStackProps = StackProps & {
  stageName: StageName;
};

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `morara-${props.stageName}-users`,
      signInAliases: { email: true },
      selfSignUpEnabled: true
    });

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false
    });
  }
}
