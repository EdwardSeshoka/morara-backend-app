# morara-backend-app (TypeScript)

A serverless backend starter (AWS) aligned to a package-first structure:

- **packages/features**: split wine feature packages (wines-data, wines-domain, wines-presentation)
- **packages/shared**: shared API contracts & common types (monorepo-style sharing)
- **main/app**: app composition and Lambda entrypoints
- **src/shared**: backend shared kernel (errors, value objects, config, observability)
- **infra/cdk**: CDK stacks for dev/int environments

## Prereqs
- Node.js 18+
- AWS credentials configured (if deploying)
- `npm i` (or pnpm/yarn)

## Install
```bash
npm install
```

## Local build
```bash
npm run build
```

## CDK (optional)
This repo includes a CDK app under `infra/cdk`.

Build first:
```bash
npm run build
```

Deploy:
```bash
npm run cdk:deploy:dev
npm run cdk:deploy:int
```

Destroy:
```bash
npm run cdk:destroy:dev
npm run cdk:destroy:int
```

## Web hosting (S3 + CloudFront)
This CDK app now includes a `morara-<stage>-web` stack for static frontend hosting.

What it creates:
- Private S3 bucket for web assets
- CloudFront distribution (HTTPS redirect + SPA fallback to `index.html`)
- Optional Route53 alias records for custom domain
- Optional auto-upload from local frontend build folder

Build the web app first (from sibling `wine-app` repo):
```bash
cd ../wine-app
npx expo export --platform web
```

Configure dev web context in `cdk.json` (example):
```json
{
  "context": {
    "devWebBuildPath": "../wine-app/dist",
    "devWebDomainName": "app.dev.morara.wine",
    "devWebHostedZoneName": "morara.wine",
    "devWebHostedZoneId": "<route53_hosted_zone_id>",
    "devWebCertificateArn": "arn:aws:acm:us-east-1:<account-id>:certificate/<id>"
  }
}
```

Notes:
- `devWebCertificateArn` must be an ACM cert in `us-east-1` for CloudFront custom domains.
- If domain/certificate are omitted, CloudFront default domain is used.
- If `../wine-app/dist` does not exist, infra deploys but skips asset upload.

Deploy:
```bash
npm run build
npm run cdk:deploy:dev
```

## Public data seeding (deployment-time)
Public wines are seeded during deploy from local JSON files:

- Stage-specific file: `infra/cdk/seeds/public-wines.<stage>.json`
- Fallback file: `infra/cdk/seeds/public-wines.json`

Current example file:
- `infra/cdk/seeds/public-wines.dev.json`

JSON row format:
```json
{
  "id": "frh-2",
  "name": "La Motte Chardonnay",
  "estate": "La Motte",
  "vintage": 2021,
  "year": 2021,
  "region": "Franschhoek",
  "location": { "area": "Franschhoek" },
  "imageUrl": "wineBottle",
  "description": "Creamy texture with citrus lift. Subtle oak, balanced and modern in style.",
  "rating": { "value": 4.4, "count": 520 },
  "price": { "amount": 320, "currency": "ZAR" },
  "isFeatured": false
}
```

Notes:
- Deploy upserts rows into `PK=PUBLIC`, `SK=WINE#<id>`.
- Removing an entry from the file will delete that seeded row on stack update.
- If no seed file exists for the stage (or default), no public seed data is applied.

## Notes
- DynamoDB table name is provided via Lambda env var `WINES_TABLE`.
- Auth is assumed via API Gateway JWT authorizer (Cognito). Handlers read claims from the authorizer context.
- Validation uses Zod. Errors are mapped to API responses in `error.middleware.ts`.
