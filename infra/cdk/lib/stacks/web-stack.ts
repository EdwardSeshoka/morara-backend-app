import { Annotations, CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getEnvironmentConfiguration,
  type AppEnvironment
} from "../../../../src/shared/Infrastructure/Config/index.js";

export type WebStackProps = StackProps & {
  appEnvironment: AppEnvironment;
  webDomainName?: string;
  webHostedZoneName?: string;
  webHostedZoneId?: string;
  webCertificateArn?: string;
  webBuildPath?: string;
};

export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const environmentConfiguration = getEnvironmentConfiguration(props.appEnvironment);

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: environmentConfiguration.infrastructure.allowDestructiveChanges
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN,
      autoDeleteObjects: environmentConfiguration.infrastructure.allowDestructiveChanges
    });

    const domainName = props.webDomainName?.trim() || undefined;
    const hostedZoneName = props.webHostedZoneName?.trim() || undefined;
    const hostedZoneId = props.webHostedZoneId?.trim() || undefined;
    const certificateArn = props.webCertificateArn?.trim() || undefined;

    let certificate: acm.ICertificate | undefined;
    if (domainName) {
      if (!certificateArn) {
        throw new Error(
          `Custom web domain '${domainName}' requires a us-east-1 ACM certificate ARN. Set ${props.appEnvironment}WebCertificateArn in cdk.json context.`
        );
      }

      certificate = acm.Certificate.fromCertificateArn(this, "WebCertificate", certificateArn);
    }

    const normalizeAssetUriFn = new cloudfront.Function(this, "NormalizeAssetUri", {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  if (request.uri && request.uri.indexOf('/assets/') === 0 && request.uri.indexOf('+') !== -1) {
    request.uri = request.uri.replace(/\\+/g, '%2B');
  }
  return request;
}
      `)
    });

    const distribution = new cloudfront.Distribution(this, "WebsiteDistribution", {
      comment: `${environmentConfiguration.stackNamePrefix}-web`,
      defaultRootObject: "index.html",
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      ...(domainName && certificate
        ? {
            domainNames: [domainName],
            certificate
          }
        : {}),
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: normalizeAssetUriFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
          }
        ],
        compress: true
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(0)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(0)
        }
      ]
    });

    const buildPath =
      props.webBuildPath?.trim() || environmentConfiguration.infrastructure.defaultWebBuildPath;
    const resolvedBuildPath = resolve(process.cwd(), buildPath);

    if (existsSync(resolvedBuildPath)) {
      new s3deploy.BucketDeployment(this, "DeployWebsite", {
        destinationBucket: websiteBucket,
        sources: [s3deploy.Source.asset(resolvedBuildPath)],
        distribution,
        distributionPaths: ["/*"],
        prune: true
      });
    } else {
      Annotations.of(this).addWarning(
        `Web build folder not found at '${resolvedBuildPath}'. Build the frontend first (expo export --platform web) before deploying this stack.`
      );
    }

    const hostedZone = resolveHostedZone(this, hostedZoneName, hostedZoneId);

    if (domainName && hostedZone) {
      const recordName = toRecordName(domainName, hostedZone.zoneName);

      new route53.ARecord(this, "WebAliasA", {
        zone: hostedZone,
        ...(recordName ? { recordName } : {}),
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution))
      });

      new route53.AaaaRecord(this, "WebAliasAAAA", {
        zone: hostedZone,
        ...(recordName ? { recordName } : {}),
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution))
      });
    } else if (domainName && !hostedZoneName) {
      Annotations.of(this).addWarning(
        `Custom web domain '${domainName}' configured without a hosted zone. DNS alias records were not created.`
      );
    }

    const publicUrl = domainName
      ? `https://${domainName}`
      : `https://${distribution.distributionDomainName}`;

    new CfnOutput(this, "WebBucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket storing web assets"
    });

    new CfnOutput(this, "WebDistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution id"
    });

    new CfnOutput(this, "WebDistributionDomain", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain"
    });

    new CfnOutput(this, "WebUrl", {
      value: publicUrl,
      description: "Public URL for the web app"
    });
  }
}

function resolveHostedZone(
  scope: Construct,
  hostedZoneName?: string,
  hostedZoneId?: string
): route53.IHostedZone | undefined {
  if (!hostedZoneName) return undefined;

  if (hostedZoneId) {
    return route53.HostedZone.fromHostedZoneAttributes(scope, "WebHostedZone", {
      hostedZoneId,
      zoneName: hostedZoneName
    });
  }

  return route53.HostedZone.fromLookup(scope, "WebHostedZone", {
    domainName: hostedZoneName
  });
}

function toRecordName(domainName: string, zoneName: string): string | undefined {
  const normalizedDomain = stripTrailingDot(domainName);
  const normalizedZone = stripTrailingDot(zoneName);

  if (normalizedDomain === normalizedZone) return undefined;

  const suffix = `.${normalizedZone}`;
  if (!normalizedDomain.endsWith(suffix)) {
    throw new Error(`Web domain '${normalizedDomain}' is not within hosted zone '${normalizedZone}'.`);
  }

  return normalizedDomain.slice(0, -suffix.length);
}

function stripTrailingDot(value: string): string {
  return value.endsWith(".") ? value.slice(0, -1) : value;
}
