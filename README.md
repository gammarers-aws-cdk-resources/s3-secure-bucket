# S3 Secure Bucket (CDK v2)

[![npm version](https://img.shields.io/npm/v/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![license](https://img.shields.io/npm/l/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![Node.js](https://img.shields.io/node/v/s3-secure-bucket?style=flat-square)](https://www.npmjs.com/package/s3-secure-bucket)
[![build](https://img.shields.io/github/actions/workflow/status/gammarers-aws-cdk-resources/s3-secure-bucket/build.yml?label=build&style=flat-square)](https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket/actions/workflows/build.yml)

[![View on Construct Hub](https://constructs.dev/badge?package=s3-secure-bucket)](https://constructs.dev/packages/s3-secure-bucket)

AWS CDK v2 construct for an Amazon S3 bucket with private access, encryption, and `bucketType` presets for pipeline artifacts, CloudFront origins, access logs, and CloudWatch Logs exports. Most types also require HTTPS with TLS 1.2 or higher, and enable versioning. `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` keeps the bucket policy in another stack.

## Features

- Private access and block public access. The bucket policy denies requests that are not HTTPS and denies TLS below 1.2, except `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` (those denies are added by `addOriginPolicy` on a policy you create)
- **Explicit encryption header** (`denyUnencryptedObjectUploads`, off by default): denies `s3:PutObject` when `x-amz-server-side-encryption` is missing or names an algorithm other than this bucket's (`AES256`, `aws:kms`, or `aws:kms:dsse`). Leave it off for log delivery buckets; those writers omit the header and use bucket default encryption
- **Default bucket**: KMS-managed encryption (`aws:kms`) unless overridden
- **Log / origin / archive types**: S3-managed encryption (`AES256`) for `ACCESS_LOG_BUCKET`, `CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET`, `CLOUDFRONT_ORIGIN_BUCKET`, `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET`, and `CLOUD_WATCH_LOG_ARCHIVE_BUCKET`
- Versioning on by default (`CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` is unversioned and rejects `versioned: true`); object ownership `BucketOwnerEnforced` by default (`ObjectWriter` for CloudFront legacy access logs)
- `RemovalPolicy.RETAIN` on the bucket (`CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` uses `removalPolicy` from props when you set it)
- Optional EventBridge notifications via `eventBridgeEnabled`
- **`bucketType` presets**
  - **`DEFAULT_BUCKET`**: general-purpose secure bucket (KMS-managed encryption by default)
  - **`DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET`**: optional `s3:*` grant for the CDK deploy role when using a **non-default** bootstrap qualifier
  - **`CLOUDFRONT_ORIGIN_BUCKET`**: S3-managed encryption for a CloudFront origin. `S3BucketOrigin.withOriginAccessControl` adds `s3:GetObject` for that distribution. Call `grantCloudFrontRead` only when the distribution cannot update the bucket policy (`cloudfront.amazonaws.com`, conditioned on the distribution ARN)
  - **`CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET`**: S3-managed CloudFront origin that does not create a bucket policy. Create one `AWS::S3::BucketPolicy` in the stack that can see both the bucket and the distribution, then call `addOriginPolicy` with that policy and the distribution ARN string
  - **`ACCESS_LOG_BUCKET`**: `s3:PutObject` for ALB/NLB (`logdelivery.elasticloadbalancing.amazonaws.com` + regional **ELBv2 account** from `aws-cdk-lib/region-info` when known), CloudFront standard logging **v2** (`delivery.logs.amazonaws.com`), and S3 server access logging (`logging.s3.amazonaws.com`). Writers default to `AWSLogs/<stack account>/*`; override with `accessLogDelivery` (`allowedSourceAccountIds` or `organizationId`). Not for legacy `Distribution.logBucket`
  - **`CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET`**: S3-managed encryption, `LogDeliveryWrite` ACL, and `ObjectWriter` ownership for CloudFront standard logging (**legacy**) via `Distribution.logBucket` / `logFilePrefix`. Delivery uses ACL, not an `AWSLogs/...` bucket policy
  - **`CLOUD_WATCH_LOG_ARCHIVE_BUCKET`**: `s3:GetBucketAcl` and `s3:PutObject` (`bucket-owner-full-control`) for CloudWatch Logs export tasks (`logs.<region>.amazonaws.com`, same-account log groups in the stack Region)
- **`accessLogBucketPolicyDependable`** (access-log buckets only): use with `loadBalancer.node.addDependency(...)` so ALB/NLB access-log enablement runs after the bucket policy exists (avoids validation `PutObject` failures)

## How it works

Creating an `S3SecureBucket` applies private access and block public access. Except for `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET`, it also requires HTTPS at TLS 1.2 or higher, enables versioning, sets `RemovalPolicy.RETAIN`, and keeps any bucket policy as a child of the bucket. `bucketType` selects the encryption default and, for some types, a bucket policy: deploy-role access for a non-default CDK bootstrap qualifier, CloudFront `s3:GetObject` when you call `grantCloudFrontRead`, log delivery for access logs, or CloudWatch Logs export. CloudFront legacy access-log buckets rely on ACL (`LogDeliveryWrite`) instead of those resource policies. Load balancers that write access logs should depend on `accessLogBucketPolicyDependable` so the policy exists before AWS validates the log destination.

Set `denyUnencryptedObjectUploads` when uploaders must send `x-amz-server-side-encryption`. Bucket default encryption still encrypts a request that omits the header, so this option is off unless you turn it on. `ACCESS_LOG_BUCKET`, `CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET`, and `CLOUD_WATCH_LOG_ARCHIVE_BUCKET` reject it because ALB/NLB, CloudFront logging, S3 server access logging, and CloudWatch Logs export omit that header.

`CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` leaves the bucket policy out of the bucket stack. A bucket has one policy document, and `AWS::S3::BucketPolicy` replaces that document rather than merging with another policy resource. Create the bucket in the storage stack, the distribution in the ingress stack, and the single bucket policy in an associate stack that references both. Call `addOriginPolicy` with that policy and the distribution ARN string. The construct appends the TLS denies and the CloudFront `s3:GetObject` allow onto that document. When `denyUnencryptedObjectUploads` is set, it also appends the encryption-header denies. It does not take an `IDistribution`, so the storage stack does not reference the distribution.

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

### CloudFront origin with the bucket policy in another stack

Use `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` when the distribution and the bucket policy cannot live in the bucket's stack. The bucket is private, S3-managed (`AES256`), unversioned, and has no `AWS::S3::BucketPolicy`. `removalPolicy` follows props and defaults to `RemovalPolicy.RETAIN`. `versioned: true`, an encryption value other than `S3_MANAGED`, an `objectOwnership` value other than `BUCKET_OWNER_ENFORCED`, or an `accessControl` value other than `PRIVATE` fails at construction. Other `BucketProps`, such as `lifecycleRules`, are passed through.

Create the `BucketPolicy` yourself and pass the distribution ARN as a string. Assemble that ARN in your stacks (for example from an exported distribution ID). Do not pass the distribution object into this construct.

```typescript
import { Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const storageStack: Stack;
declare const associateStack: Stack;
declare const distributionArn: string;

const originBucket = new S3SecureBucket(storageStack, 'OriginBucket', {
  bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
});

const originPolicy = new s3.BucketPolicy(associateStack, 'OriginBucketPolicy', {
  bucket: originBucket,
});

originBucket.addOriginPolicy(originPolicy, distributionArn);
```

`addOriginPolicy` appends three statements to that policy only: deny `s3:*` when `aws:SecureTransport` is false, deny `s3:*` when `s3:TlsVersion` is below 1.2, and allow `s3:GetObject` for `cloudfront.amazonaws.com` when `AWS:SourceArn` is `distributionArn`.

### Centralized access log bucket (ALB / NLB / CloudFront standard logging v2 / S3)

Use `ACCESS_LOG_BUCKET` for ALB/NLB access logs, CloudFront **standard logging v2**, and S3 server access logging (`AWSLogs/<account>/*`). Do **not** pass this bucket to CloudFront `Distribution.logBucket` (legacy standard logging); use `CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET` instead.

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

### CloudFront standard logging (legacy) bucket

Pass the bucket to `cloudfront.Distribution` as `logBucket`, and set `logFilePrefix` to your own prefix (for example `hostname/original-log/`). Keys are **not** under `AWSLogs/<account>/*`. Delivery uses the `LogDeliveryWrite` ACL; this type does not add the `ACCESS_LOG_BUCKET` resource policy.

```typescript
import { Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3SecureBucket, S3SecureBucketType } from 's3-secure-bucket';

declare const stack: Stack;
declare const origin: cloudfront.IOrigin;

const cloudFrontLegacyLogBucket = new S3SecureBucket(stack, 'CloudFrontLegacyLogBucket', {
  bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
});

new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: { origin },
  logBucket: cloudFrontLegacyLogBucket,
  logFilePrefix: 'hostname/original-log/',
});
```

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

`S3SecureBucket` accepts `S3SecureBucketProps`, which extends [`s3.BucketProps`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.BucketProps.html). Standard options such as `bucketName`, `versioned`, `encryption`, `lifecycleRules`, and `eventBridgeEnabled` work alongside the secure defaults. `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` keeps S3-managed encryption, private access, `BUCKET_OWNER_ENFORCED`, and versioning off, and it honors `removalPolicy`. When `eventBridgeEnabled` is `true`, EventBridge notification is enabled on the bucket.

### Construct props (`S3SecureBucketProps`)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `bucketType` | `S3SecureBucketType` | `DEFAULT_BUCKET` | Selects encryption defaults and optional resource-policy or ACL settings. |
| `accessLogDelivery` | `AccessLogDeliveryScope` | stack account only | `ACCESS_LOG_BUCKET` only. Exactly one of `allowedSourceAccountIds` or `organizationId`. |
| `denyUnencryptedObjectUploads` | `boolean` | `false` | Requires `x-amz-server-side-encryption` on `s3:PutObject`. Rejected for access-log, legacy CloudFront log, and CloudWatch Logs archive buckets. On `CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET`, `addOriginPolicy` appends the denies. |
| *(inherited)* | `s3.BucketProps` | — | All other `Bucket` properties are passed through (some receive overrides inside the construct). |

### `S3SecureBucketType` values

| Constant | Use case |
| --- | --- |
| `S3SecureBucketType.DEFAULT_BUCKET` | General-purpose secure bucket |
| `S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET` | CDK pipeline artifact bucket (custom bootstrap qualifier) |
| `S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET` | CloudFront origin bucket. `grantCloudFrontRead` adds `s3:GetObject` only when the distribution cannot update the bucket policy. `S3BucketOrigin.withOriginAccessControl` adds that statement itself |
| `S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET` | CloudFront origin with no bucket policy in the bucket stack. `addOriginPolicy` appends TLS and `s3:GetObject` statements to a `BucketPolicy` you create. Pass the distribution ARN as a string |
| `S3SecureBucketType.ACCESS_LOG_BUCKET` | Centralized access logs for ALB/NLB, CloudFront standard logging v2, and S3 server access logging (`AWSLogs/<account>/*` by default; widen with `accessLogDelivery`). Not for legacy `Distribution.logBucket` |
| `S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET` | CloudFront standard logging (legacy) destination for `Distribution.logBucket` / `logFilePrefix` (`LogDeliveryWrite` ACL, `ObjectWriter`) |
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
