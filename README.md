# S3 Secure Bucket (CDK v2)

[![npm version](https://img.shields.io/npm/v/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![license](https://img.shields.io/npm/l/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![Node.js](https://img.shields.io/node/v/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![build](https://img.shields.io/github/actions/workflow/status/gammarers-aws-cdk-resources/s3-secure-bucket/build.yml?label=build&style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/actions/workflows/build.yml)

[![View on Construct Hub](https://constructs.dev/badge?package=s3-secure-bucket)](https://constructs.dev/packages/s3-secure-bucket)

AWS CDK v2 construct for an Amazon S3 bucket with private access, TLS-only requests, encryption, and versioning. `bucketType` selects encryption and, where needed, a bucket policy for pipeline artifacts, CloudFront origins, access logs, or CloudWatch Logs exports.

## Features

- Private access, block public access, and deny insecure transport (`enforceSSL`)
- **Default bucket**: KMS-managed encryption (`aws:kms`) unless overridden
- **Log / origin / archive types**: S3-managed encryption (`AES256`) for `ACCESS_LOG_BUCKET`, `CLOUDFRONT_ORIGIN_BUCKET`, and `CLOUD_WATCH_LOG_ARCHIVE_BUCKET`
- Versioning on by default; object ownership `BucketOwnerEnforced` by default
- `RemovalPolicy.RETAIN` on the bucket
- Optional EventBridge notifications via `eventBridgeEnabled`
- **`bucketType` presets**
  - **`DEFAULT_BUCKET`**: general-purpose secure bucket (KMS-managed encryption by default)
  - **`DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET`**: optional `s3:*` grant for the CDK deploy role when using a **non-default** bootstrap qualifier
  - **`CLOUDFRONT_ORIGIN_BUCKET`**: S3-managed encryption for a CloudFront origin. `S3BucketOrigin.withOriginAccessControl` adds `s3:GetObject` for that distribution. Call `grantCloudFrontRead` only when the distribution cannot update the bucket policy (`cloudfront.amazonaws.com`, conditioned on the distribution ARN)
  - **`ACCESS_LOG_BUCKET`**: `s3:PutObject` for ALB/NLB (`logdelivery.elasticloadbalancing.amazonaws.com` + regional **ELBv2 account** from `aws-cdk-lib/region-info` when known), CloudFront standard logging (`delivery.logs.amazonaws.com`), and S3 server access logging (`logging.s3.amazonaws.com`). Writers default to `AWSLogs/<stack account>/*`; override with `accessLogDelivery` (`allowedSourceAccountIds` or `organizationId`)
  - **`CLOUD_WATCH_LOG_ARCHIVE_BUCKET`**: `s3:GetBucketAcl` and `s3:PutObject` (`bucket-owner-full-control`) for CloudWatch Logs export tasks (`logs.<region>.amazonaws.com`, same-account log groups in the stack Region)
- **`accessLogBucketPolicyDependable`** (access-log buckets only): use with `loadBalancer.node.addDependency(...)` so ALB/NLB access-log enablement runs after the bucket policy exists (avoids validation `PutObject` failures)

## How it works

Creating an `S3SecureBucket` applies private access, block public access, TLS-only requests, versioning, and `RemovalPolicy.RETAIN`. `bucketType` selects the encryption default and, for some types, a bucket policy: deploy-role access for a non-default CDK bootstrap qualifier, CloudFront `s3:GetObject` when you call `grantCloudFrontRead`, log delivery for access logs, or CloudWatch Logs export. Load balancers that write access logs should depend on `accessLogBucketPolicyDependable` so the policy exists before AWS validates the log destination.

## Installation

### npm

```bash
npm install s3-secure-bucket
```

### yarn

```bash
yarn add s3-secure-bucket
```

### pnpm

```bash
pnpm add s3-secure-bucket
```

## Usage

### Default secure bucket

```typescript
import { Stack } from 'aws-cdk-lib';
import { S3SecureBucket } from 's3-secure-bucket';

declare const stack: Stack;

const bucket = new S3SecureBucket(stack, 'S3SecureBucket', {
  bucketName: 'example-secure-bucket',
});
```

### CDK deployment pipeline artifact bucket

When the stack uses a **non-default** CDK bootstrap qualifier, the construct grants `s3:*` on the bucket to the regional `cdk-<qualifier>-deploy-role`.

```typescript
import { Stack } from 'aws-cdk-lib';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const stack: Stack;

const artifactBucket = new S3SecureBucket(stack, 'ArtifactBucket', {
  bucketType: S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET,
});
```

### CloudFront origin bucket

The bucket stays private. CloudFront reads objects through origin access control. The bucket policy allows `s3:GetObject` for `cloudfront.amazonaws.com` only when `AWS:SourceArn` is that distribution. Put the origin access control on the distribution origin. The access control ID is not part of the bucket policy.

`origins.S3BucketOrigin.withOriginAccessControl` adds that statement. Do not also call `grantCloudFrontRead` for that distribution.

Call `grantCloudFrontRead` only when the distribution cannot update this bucket policy, for example when the bucket is referenced from another stack. It adds the same `s3:GetObject` statement.

```typescript
import { Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const stack: Stack;
declare const distribution: cloudfront.IDistribution;

const originBucket = new S3SecureBucket(stack, 'OriginBucket', {
  bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET,
});

originBucket.grantCloudFrontRead(distribution);
```

### Centralized access log bucket (ALB / NLB / CloudFront / S3)

For `ACCESS_LOG_BUCKET`, the stack **`env.region` must be a concrete region** at synthesis time (not a token) so the regional ELBv2 log-delivery account ID can be resolved when the region is known.

```typescript
import { Stack } from 'aws-cdk-lib';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const stack: Stack;

const accessLogBucket = new S3SecureBucket(stack, 'AccessLogBucket', {
  bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
});

// After creating your load balancer (e.g. elbv2.ApplicationLoadBalancer), depend on the bucket policy
// so ELB's validation PutObject runs after the policy exists:
// loadBalancer.node.addDependency(accessLogBucket.accessLogBucketPolicyDependable!);
```

To accept logs from other accounts, set **exactly one** of the following on `accessLogDelivery` (the stack account is **not** added automatically):

```typescript
const multiAccountLogBucket = new S3SecureBucket(stack, 'MultiAccountAccessLogBucket', {
  bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
  accessLogDelivery: {
    allowedSourceAccountIds: ['111111111111', '222222222222'],
  },
});

const organizationLogBucket = new S3SecureBucket(stack, 'OrganizationAccessLogBucket', {
  bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
  accessLogDelivery: {
    organizationId: 'o-xxxxxxxxxx',
  },
});
```

Organization scope uses resource `AWSLogs/*` and `aws:SourceOrgID` on the log-delivery **service** principals. The regional ELBv2 account statement is not organization-conditioned (that principal is not an organization member).

Wire logging on the load balancer using your normal approach (for example L1 attributes or another construct). This library only configures the **bucket** and its **resource policy**.

### CloudWatch Logs export archive bucket

Store log data exported from CloudWatch Logs via [export tasks](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3Export.html). The bucket must be in the **same Region** as the log groups you export. Create export tasks with your usual workflow (console, CLI, or API); this library configures the **bucket** and **resource policy** for same-account exports.

```typescript
import { Stack } from 'aws-cdk-lib';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const stack: Stack;

const logArchiveBucket = new S3SecureBucket(stack, 'LogArchiveBucket', {
  bucketType: S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET,
});
```

For cross-account export, extend the bucket policy with additional `aws:SourceAccount` and `aws:SourceArn` entries per [AWS documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3ExportTasks.html).

## Options

`S3SecureBucket` accepts `S3SecureBucketProps`, which extends [`s3.BucketProps`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.BucketProps.html). Standard options such as `bucketName`, `versioned`, `encryption`, `lifecycleRules`, and `eventBridgeEnabled` work as usual alongside the secure defaults. When `eventBridgeEnabled` is `true`, EventBridge notification is enabled on the bucket.

### Construct props (`S3SecureBucketProps`)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `bucketType` | `S3SecureBucketType` | `DEFAULT_BUCKET` | Selects encryption defaults and optional resource-policy statements. |
| `accessLogDelivery` | `AccessLogDeliveryScope` | stack account only | `ACCESS_LOG_BUCKET` only. Exactly one of `allowedSourceAccountIds` or `organizationId`. |
| *(inherited)* | `s3.BucketProps` | — | All other `Bucket` properties are passed through (some receive overrides inside the construct). |

### `S3SecureBucketType` values

| Constant | Use case |
| --- | --- |
| `S3SecureBucketType.DEFAULT_BUCKET` | General-purpose secure bucket |
| `S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET` | CDK pipeline artifact bucket (custom bootstrap qualifier) |
| `S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET` | CloudFront origin bucket. `grantCloudFrontRead` adds `s3:GetObject` only when the distribution cannot update the bucket policy. `S3BucketOrigin.withOriginAccessControl` adds that statement itself |
| `S3SecureBucketType.ACCESS_LOG_BUCKET` | Centralized access logs (`AWSLogs/<account>/*` by default; widen with `accessLogDelivery`) |
| `S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET` | CloudWatch Logs export archive |

### Read-only: `accessLogBucketPolicyDependable`

| Property | Type | When set | Description |
| --- | --- | --- | --- |
| `accessLogBucketPolicyDependable` | `IDependable \| undefined` | `bucketType === ACCESS_LOG_BUCKET` | Depend on this from ALB/NLB so access-log configuration waits for the bucket policy resource. |

## API

See [API.md](./API.md).

## Requirements

- Node.js >= 20
- Peer dependencies: `aws-cdk-lib` ^2.232.0, `constructs` ^10.5.1

## License

This project is licensed under the Apache-2.0 License.
