# S3 Secure Bucket (AWS CDK v2)

[![GitHub](https://img.shields.io/github/license/gammarers-aws-cdk-resources/s3-secure-bucket?style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/gammarers-aws-cdk-resources/s3-secure-bucket/build.yml?branch=main&label=build&style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/actions/workflows/build.yml)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/gammarers-aws-cdk-resources/s3-secure-bucket/release.yml?branch=main&label=release&style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/actions/workflows/release.yml)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/gammarers-aws-cdk-resources/s3-secure-bucket?sort=semver&style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/releases)

AWS CDK v2 construct library: an [`s3.Bucket`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) with security-focused defaults (private ACLs, block public access, TLS-only access, encryption, versioning, `BucketOwnerEnforced`, `RemovalPolicy.RETAIN`). Use `bucketType` for pipeline artifacts, CloudFront origins, and centralized access logs so encryption and bucket policies match each workload.

## Features

- Private access, block public access, and deny insecure transport (`enforceSSL`)
- **Default bucket**: KMS-managed encryption (`aws:kms`) unless overridden
- **Log / origin types**: S3-managed encryption (`AES256`) for `ACCESS_LOG_BUCKET` and `CLOUDFRONT_ORIGIN_BUCKET`
- Versioning on by default; object ownership `BucketOwnerEnforced` by default
- `RemovalPolicy.RETAIN` on the bucket
- **`bucketType` presets**
  - **`DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET`**: optional `s3:*` grant for the CDK deploy role when using a **non-default** bootstrap qualifier
  - **`CLOUDFRONT_ORIGIN_BUCKET`**: S3-managed encryption for typical origin use
  - **`ACCESS_LOG_BUCKET`**: `s3:PutObject` on `AWSLogs/<account>/*` for ALB/NLB (`logdelivery.elasticloadbalancing.amazonaws.com` + regional **ELBv2 account** from `aws-cdk-lib/region-info` when known), CloudFront standard logging (`delivery.logs.amazonaws.com`), and S3 server access logging (`logging.s3.amazonaws.com`)
- **`accessLogBucketPolicyDependable`** (access-log buckets only): use with `loadBalancer.node.addDependency(...)` so ALB/NLB access-log enablement runs after the bucket policy exists (avoids validation `PutObject` failures)

## Installation

**npm**

```shell
npm install s3-secure-bucket
```

**yarn**

```shell
yarn add s3-secure-bucket
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

### Centralized access log bucket (ALB / NLB / CloudFront / S3)

For `ACCESS_LOG_BUCKET`, the stack **`env.region` must be a concrete region** at synthesis time (not a token) so the regional ELBv2 log-delivery account ID can be resolved.

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

Wire logging on the load balancer using your normal approach (for example L1 attributes or another construct). This library only configures the **bucket** and its **resource policy**.

## Options

`S3SecureBucket` accepts `S3SecureBucketProps`, which extends [`s3.BucketProps`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.BucketProps.html). Standard options such as `bucketName`, `versioned`, `encryption`, and `lifecycleRules` work as usual alongside the secure defaults.

### Construct props (`S3SecureBucketProps`)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `bucketType` | `S3SecureBucketType` | `DEFAULT_BUCKET` | Selects encryption defaults and optional resource-policy statements. |
| *(inherited)* | `s3.BucketProps` | — | All other `Bucket` properties are passed through (some receive overrides inside the construct). |

### `S3SecureBucketType` values

| Constant | Use case |
| --- | --- |
| `S3SecureBucketType.DEFAULT_BUCKET` | General-purpose secure bucket |
| `S3SecureBucketType.ACCESS_LOG_BUCKET` | Centralized access logs (`AWSLogs/<account>/*` writers only) |
| `S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET` | CDK pipeline artifact bucket (custom bootstrap qualifier) |
| `S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET` | CloudFront origin bucket |

### Read-only: `accessLogBucketPolicyDependable`

| Property | Type | When set | Description |
| --- | --- | --- | --- |
| `accessLogBucketPolicyDependable` | `IDependable \| undefined` | `bucketType === ACCESS_LOG_BUCKET` | Depend on this from ALB/NLB so access-log configuration waits for the bucket policy resource. |

See [API.md](./API.md) for the full API reference.

## Requirements

- Node.js >= 20
- Peer dependencies: `aws-cdk-lib` ^2.232.0, `constructs` ^10.5.1

## License

This project is licensed under the Apache-2.0 License.
