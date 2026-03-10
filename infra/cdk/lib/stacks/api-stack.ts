import { Stack, type StackProps } from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { WinesRoutes } from "../../../../packages/features/wines-presentation/screens/Routes/wines.routes.js";
import {
  getEnvironmentConfiguration,
  type AppEnvironment
} from "../../../../src/shared/Infrastructure/Config/index.js";

export type ApiStackProps = StackProps & {
  appEnvironment: AppEnvironment;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  winesTable: dynamodb.Table;
};

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const environmentConfiguration = getEnvironmentConfiguration(props.appEnvironment);

    const api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `${environmentConfiguration.stackNamePrefix}-api`,
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["authorization", "content-type"],
      },
    });

    const authorizer = new authorizers.HttpJwtAuthorizer(
      "JwtAuthorizer",
      props.userPool.userPoolProviderUrl,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId],
      }
    );

    const runtime = lambda.Runtime.NODEJS_20_X;
    const lambdaCode = lambda.Code.fromAsset(".", {
      exclude: ["cdk.out", "cdk.out/**", ".git", ".git/**", ".DS_Store"],
    });

    const handlerPrefix = "dist/main/app/Lambda/index";
    const createApiFunction = (
      constructId: string,
      functionNameSuffix: string,
      handlerExportName: string
    ) => {
      return new lambda.Function(this, constructId, {
        functionName: `${environmentConfiguration.stackNamePrefix}-${functionNameSuffix}`,
        runtime,
        handler: `${handlerPrefix}.${handlerExportName}`,
        code: lambdaCode,
        environment: {
          APP_ENVIRONMENT: props.appEnvironment,
          WINES_TABLE: props.winesTable.tableName
        },
      });
    };

    const listPublicWinesFn = createApiFunction(
      "ListPublicWinesFn",
      "listPublicWines",
      "listPublicWines"
    );

    const getPublicFeaturedWineFn = createApiFunction(
      "GetPublicFeaturedWineFn",
      "getPublicFeaturedWine",
      "getPublicFeaturedWine"
    );

    const listPublicCollectionsFn = createApiFunction(
      "ListPublicCollectionsFn",
      "listPublicCollections",
      "listPublicCollections"
    );

    const listWinesFn = createApiFunction("ListWinesFn", "listWines", "listWines");
    const addWineFn = createApiFunction("AddWineFn", "addWine", "addWine");
    const getWineFn = createApiFunction("GetWineFn", "getWine", "getWine");

    props.winesTable.grantReadData(listPublicWinesFn);
    props.winesTable.grantReadData(getPublicFeaturedWineFn);
    props.winesTable.grantReadData(listPublicCollectionsFn);
    props.winesTable.grantReadData(listWinesFn);
    props.winesTable.grantWriteData(addWineFn);
    props.winesTable.grantReadData(getWineFn);

    api.addRoutes({
      path: WinesRoutes.listPublic.path,
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "ListPublicWinesIntegration",
        listPublicWinesFn
      ),
    });

    api.addRoutes({
      path: WinesRoutes.getPublicFeatured.path,
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "GetPublicFeaturedWineIntegration",
        getPublicFeaturedWineFn
      ),
    });

    api.addRoutes({
      path: WinesRoutes.listPublicCollections.path,
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "ListPublicCollectionsIntegration",
        listPublicCollectionsFn
      ),
    });

    api.addRoutes({
      path: WinesRoutes.list.path,
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration("ListWinesIntegration", listWinesFn),
      authorizer,
    });

    api.addRoutes({
      path: WinesRoutes.add.path,
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration("AddWineIntegration", addWineFn),
      authorizer,
    });

    api.addRoutes({
      path: WinesRoutes.get.path,
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration("GetWineIntegration", getWineFn),
      authorizer,
    });
  }
}
