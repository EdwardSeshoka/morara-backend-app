# morara-backend-app (TypeScript)

Serverless backend infrastructure and Lambda application code for Morara.

## Project Structure
- `main/app`: application composition and Lambda entrypoints
- `src/shared`: shared backend configuration, infrastructure helpers, and domain utilities
- `packages/features`: wine feature packages
- `packages/shared`: shared contracts and common types
- `infra/cdk`: AWS CDK application for backend deployment

## Environment Model
The backend now uses the same first-class deployment environments as the frontend:

- `dev`
- `beta`
- `production`

`production` is treated only as the real production stage. Legacy CDK naming such as `int`, `uat`, `prod`, or using `production` as a stand-in for development is no longer the primary model.

Centralized environment typing and resolution live under `src/shared/Infrastructure/Config/AppEnvironment.ts`, `src/shared/Infrastructure/Config/EnvironmentConfiguration.ts`, and `src/shared/Infrastructure/Config/EnvironmentResolver.ts`.

## Runtime Configuration
Lambda runtime configuration is resolved centrally. The important runtime variables are:

- `APP_ENVIRONMENT` = `dev` | `beta` | `production`
- `WINES_TABLE` = DynamoDB table name
- `AWS_REGION` = optional region override

`APP_ENVIRONMENT` is injected by CDK into every Lambda, so the runtime environment is explicit and stage-aware.

## Deployment Configuration
Deploy-time configuration supports both:

- GitHub Environment scoped variables such as `ACCOUNT_ID`, `AWS_REGION`, `WEB_ENABLED`
- Per-environment variables/context such as `DEV_ACCOUNT_ID`, `BETA_ACCOUNT_ID`, `PRODUCTION_ACCOUNT_ID`

Supported deploy target selectors:

- `DEPLOY_ENVIRONMENT=dev|beta|production`
- `DEPLOY_ENVIRONMENTS=dev,beta,production`
- `cdk.json` context keys `deployEnvironment` or `deployEnvironments`

Supported per-environment context keys in `cdk.json` follow the same predictable pattern:

- `devAccountId`, `betaAccountId`, `productionAccountId`
- `devRegion`, `betaRegion`, `productionRegion`
- `devWebEnabled`, `betaWebEnabled`, `productionWebEnabled`
- `devWebDomainName`, `betaWebDomainName`, `productionWebDomainName`
- `devWebHostedZoneName`, `betaWebHostedZoneName`, `productionWebHostedZoneName`
- `devWebHostedZoneId`, `betaWebHostedZoneId`, `productionWebHostedZoneId`
- `devWebCertificateArn`, `betaWebCertificateArn`, `productionWebCertificateArn`
- `devWebBuildPath`, `betaWebBuildPath`, `productionWebBuildPath`

`defaultRegion` remains available as a shared fallback.

## Local Commands
Install dependencies:

```bash
npm install
```

Validate and build:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The current `lint` step is TypeScript-based until a dedicated linter is added. The current `test` command uses Node's built-in test runner and will stay effectively empty until backend test files are introduced.

Deploy with CDK:

```bash
npm run build
npm run cdk:deploy:dev
npm run cdk:deploy:beta
npm run cdk:deploy:production
```

Destroy with CDK:

```bash
npm run cdk:destroy:dev
npm run cdk:destroy:beta
npm run cdk:destroy:production
```

## GitHub Actions
This repo is prepared for the same GitHub Environments model as the frontend:

- `dev`
- `beta`
- `production`

Workflows:

- `.github/workflows/pr-validation.yml`: runs on pull requests to `main` and performs install, lint, typecheck, test, and build only
- `.github/workflows/main-environment-deploy.yml`: runs on pushes to `main` and manual dispatch, resolves a target environment, validates, and deploys the matching CDK stacks

Recommended GitHub Environment variables and secrets per environment:

- Variable: `AWS_REGION`
- Variable: `WEB_ENABLED` with default `false` unless this repo should also manage the web stack
- Optional variables: `ACCOUNT_ID`, `WEB_DOMAIN_NAME`, `WEB_HOSTED_ZONE_NAME`, `WEB_HOSTED_ZONE_ID`, `WEB_CERTIFICATE_ARN`, `WEB_BUILD_PATH`
- Recommended secret: `AWS_ROLE_TO_ASSUME`
- Fallback secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

Optional repository variable:

- `DEPLOY_ENVIRONMENT` to control the default target used for push-to-`main` deploys. Allowed values are `dev`, `beta`, and `production`. If omitted, the workflow defaults to `production`.

## Web Stack Notes
The CDK app still supports an optional `morara-<environment>-web` stack. In GitHub Actions, the deploy workflow defaults `WEB_ENABLED=false` so backend deployments do not manage frontend hosting unless you opt in per GitHub Environment.

If you want this repo to manage the web stack for an environment:

- set `WEB_ENABLED=true`
- provide any needed domain/certificate variables
- make sure `WEB_BUILD_PATH` points at a built frontend bundle available to the runner

## Public Data Seeding
Public wines are seeded during deploy from local JSON files:

- environment-specific file: `infra/cdk/seeds/public-wines.<environment>.json`
- fallback file: `infra/cdk/seeds/public-wines.json`

Current example file:

- `infra/cdk/seeds/public-wines.dev.json`

If `infra/cdk/seeds/public-wines.beta.json` or `infra/cdk/seeds/public-wines.production.json` do not exist, the CDK app falls back to `infra/cdk/seeds/public-wines.json`. If neither exists, no public seed data is applied for that environment.

## Notes
- Lambda handlers receive the DynamoDB table name through `WINES_TABLE`.
- Auth is handled through API Gateway JWT authorization backed by Cognito.
- Environment-specific infrastructure lifecycle rules are centralized in the environment configuration model instead of hard-coded string comparisons across stacks.
