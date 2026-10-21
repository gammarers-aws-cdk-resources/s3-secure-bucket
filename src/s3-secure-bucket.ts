import {
  DefaultStackSynthesizer,
  RemovalPolicy,
  Stack,
  Token,
} from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { FactName, RegionInfo } from 'aws-cdk-lib/region-info';
import { Construct, IDependable } from 'constructs';

/**
 * Account scope for {@link S3SecureBucketType.ACCESS_LOG_BUCKET} resource policies.
 *
 * Specify **exactly one** of {@link AccessLogDeliveryScope.allowedSourceAccountIds} or
 * {@link AccessLogDeliveryScope.organizationId}. Omit {@link S3SecureBucketProps.accessLogDelivery}
 * to allow only the stack account (default).
 *
 * jsii does not support a discriminated union of structs, so exclusivity is enforced at construct time.
 */
export interface AccessLogDeliveryScope {
  /**
   * Account IDs allowed to write under `AWSLogs/<accountId>/*`.
   *
   * The list is used as specified; include the stack account if that account should also deliver logs.
   * Duplicate IDs are ignored. Mutually exclusive with {@link AccessLogDeliveryScope.organizationId}.
   *
   * @default undefined (do not use an explicit account list)
   */
  readonly allowedSourceAccountIds?: string[];

  /**
   * AWS Organizations ID (`o-` followed by 10–32 lowercase letters or digits).
   *
   * Allows log delivery from accounts in the organization via `aws:SourceOrgID`,
   * with resource `AWSLogs/*`. Mutually exclusive with {@link AccessLogDeliveryScope.allowedSourceAccountIds}.
   *
   * @default undefined (do not use an organization-wide policy)
   */
  readonly organizationId?: string;
}

/**
 * Bucket type discriminator values for {@link S3SecureBucketProps.bucketType}.
 *
 * Each value selects encryption defaults and, for some types, additional bucket resource policies.
 *
 * @see {@link S3SecureBucketProps.bucketType}
 */
export const S3SecureBucketType = {
  /**
   * Pipeline artifact bucket when using a custom CDK bootstrap qualifier
   * (single- or multi-region deployments).
   *
   * Adds an `s3:*` grant for `cdk-<qualifier>-deploy-role` when the bootstrap qualifier is not default.
   */
  DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET: 'DeploymentPipelineArtifactBucket',
  /**
   * Origin bucket for CloudFront distributions.
   *
   * Uses S3-managed encryption ({@link s3.BucketEncryption.S3_MANAGED}) by default.
   * `S3SecureBucket.grantCloudFrontRead` allows `s3:GetObject` from one distribution
   * through origin access control when that distribution cannot update this bucket policy.
   * `S3BucketOrigin.withOriginAccessControl` adds the same statement itself.
   */
  CLOUDFRONT_ORIGIN_BUCKET: 'CloudFrontOriginBucket',
  /**
   * Destination for CloudFront standard logging (legacy) via
   * {@link cloudfront.Distribution} `logBucket` and `logFilePrefix`.
   *
   * Uses S3-managed encryption ({@link s3.BucketEncryption.S3_MANAGED}).
   * Sets `accessControl` to {@link s3.BucketAccessControl.LOG_DELIVERY_WRITE} and
   * `objectOwnership` to {@link s3.ObjectOwnership.OBJECT_WRITER} so ACL-based
   * log delivery works. Does not attach `ACCESS_LOG_BUCKET` resource policies;
   * object keys follow the caller-supplied prefix (for example `hostname/original-log/`),
   * not `AWSLogs/<account>/*`.
   *
   * Do not use {@link S3SecureBucketType.ACCESS_LOG_BUCKET} for `Distribution.logBucket`.
   */
  CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET: 'CloudFrontLegacyAccessLogBucket',
  /**
   * General-purpose secure bucket (default qualifier / standard use).
   *
   * Uses KMS-managed encryption unless overridden in props. No type-specific resource policies.
   */
  DEFAULT_BUCKET: 'DefaultBucket',
  /**
   * Centralized access logs for producers such as ALB/NLB, CloudFront standard logging (v2),
   * and S3 server access logging. Grants `s3:PutObject` on `AWSLogs/...` prefixes only (no read/list).
   *
   * By default the prefix is `AWSLogs/<stack account>/*`. Override with
   * {@link S3SecureBucketProps.accessLogDelivery} to allow an explicit account list or an AWS Organization.
   *
   * The regional ELBv2 log-delivery account ID (legacy path alongside the log delivery service principal)
   * is resolved from `aws-cdk-lib/region-info` at synthesis time when {@link Stack#region} is known,
   * or via a deploy-time mapping when it is a token.
   *
   * Not for CloudFront standard logging (legacy) `Distribution.logBucket`; use
   * {@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET} instead.
   */
  ACCESS_LOG_BUCKET: 'AccessLogBucket',
  /**
   * Archive bucket for log data exported from CloudWatch Logs via export tasks.
   *
   * Grants `logs.<region>.amazonaws.com` `s3:GetBucketAcl` and `s3:PutObject` for log groups in the
   * stack account and region (see AWS docs for cross-account export).
   */
  CLOUD_WATCH_LOG_ARCHIVE_BUCKET: 'CloudWatchLogArchiveBucket',
} as const;

/**
 * Discriminated union of {@link S3SecureBucketType} string literals.
 */
export type S3SecureBucketType = typeof S3SecureBucketType[keyof typeof S3SecureBucketType];

/**
 * Construction properties for {@link S3SecureBucket}.
 *
 * Extends {@link s3.BucketProps}. Several fields receive secure defaults inside the construct
 * and may be overridden unless documented otherwise on {@link S3SecureBucket}.
 */
export interface S3SecureBucketProps extends s3.BucketProps {
  /**
   * Selects encryption defaults and optional resource-policy statements.
   *
   * @default {@link S3SecureBucketType.DEFAULT_BUCKET}
   */
  readonly bucketType?: S3SecureBucketType;

  /**
   * Account or organization scope for {@link S3SecureBucketType.ACCESS_LOG_BUCKET} writers.
   *
   * Specify exactly one of {@link AccessLogDeliveryScope.allowedSourceAccountIds} or
   * {@link AccessLogDeliveryScope.organizationId}. When omitted, only the stack account
   * may deliver logs (`AWSLogs/<stack account>/*`).
   *
   * Supported only when {@link S3SecureBucketProps.bucketType} is
   * {@link S3SecureBucketType.ACCESS_LOG_BUCKET}.
   *
   * @default stack account only
   */
  readonly accessLogDelivery?: AccessLogDeliveryScope;
}

const CLOUDFRONT_SERVICE_PRINCIPAL = 'cloudfront.amazonaws.com';
const ELB_SOURCE_ARN = 'arn:aws:elasticloadbalancing:*:*:loadbalancer/*';
const S3_PUT_OBJECT = 's3:PutObject';
const AWS_SOURCE_ORG_ID = 'aws:SourceOrgID';
const AWS_SOURCE_ACCOUNT = 'aws:SourceAccount';
const AWS_SOURCE_ARN = 'aws:SourceArn';

const REQUIRED_LEGACY_ACCESS_CONTROL = s3.BucketAccessControl.LOG_DELIVERY_WRITE;
const REQUIRED_LEGACY_OBJECT_OWNERSHIP = s3.ObjectOwnership.OBJECT_WRITER;
const LEGACY_CLOUD_FRONT_LOG_ACL_ERROR =
  'CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET requires accessControl LOG_DELIVERY_WRITE and objectOwnership OBJECT_WRITER for legacy CloudFront access logging';
const ACCESS_LOG_DELIVERY_EXCLUSIVE_ERROR =
  'accessLogDelivery must specify exactly one of allowedSourceAccountIds or organizationId';

interface CloudFrontLegacyAccessLogAclDefaults {
  readonly accessControl: s3.BucketAccessControl;
  readonly objectOwnership: s3.ObjectOwnership;
}

interface ResolvedAccessLogDelivery {
  readonly awsLogsResources: string[];
  readonly organizationId?: string;
}

interface BucketPolicyApplyResult {
  readonly accessLogBucketPolicyDependable?: IDependable;
}

const isAwsAccountId = (value: string): boolean => /^\d{12}$/.test(value);

const isAwsOrganizationId = (value: string): boolean => /^o-[a-z0-9]{10,32}$/.test(value);

/**
 * Resolves bucket encryption for a given {@link S3SecureBucketType}.
 * Log / origin / archive types always use S3-managed encryption.
 */
const resolveEncryptionDefault = (
  bucketType: S3SecureBucketType,
  propsEncryption?: s3.BucketEncryption,
): s3.BucketEncryption => {
  if (
    bucketType === S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET
    || bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET
    || bucketType === S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET
    || bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET
  ) {
    return s3.BucketEncryption.S3_MANAGED;
  }
  return propsEncryption ?? s3.BucketEncryption.KMS_MANAGED;
};

/**
 * Resolves ACL settings for CloudFront standard logging (legacy).
 * Throws when the caller passes a value other than the required defaults.
 */
const resolveCloudFrontLegacyAccessLogAcl = (
  propsAccessControl?: s3.BucketAccessControl,
  propsObjectOwnership?: s3.ObjectOwnership,
): CloudFrontLegacyAccessLogAclDefaults => {
  if (propsAccessControl !== undefined && propsAccessControl !== REQUIRED_LEGACY_ACCESS_CONTROL) {
    throw new Error(LEGACY_CLOUD_FRONT_LOG_ACL_ERROR);
  }
  if (propsObjectOwnership !== undefined && propsObjectOwnership !== REQUIRED_LEGACY_OBJECT_OWNERSHIP) {
    throw new Error(LEGACY_CLOUD_FRONT_LOG_ACL_ERROR);
  }

  return {
    accessControl: REQUIRED_LEGACY_ACCESS_CONTROL,
    objectOwnership: REQUIRED_LEGACY_OBJECT_OWNERSHIP,
  };
};

const assertAccountId = (accountId: string): void => {
  if (Token.isUnresolved(accountId)) {
    return;
  }
  if (isAwsAccountId(accountId)) {
    return;
  }
  throw new Error(`allowedSourceAccountIds contains an invalid AWS account ID: ${accountId}`);
};

const resolveOrganizationDelivery = (
  bucketArn: string,
  organizationId: string,
): ResolvedAccessLogDelivery => {
  if (!Token.isUnresolved(organizationId) && !isAwsOrganizationId(organizationId)) {
    throw new Error(`organizationId must be an AWS Organizations ID (o-...), got: ${organizationId}`);
  }
  return {
    awsLogsResources: [`${bucketArn}/AWSLogs/*`],
    organizationId,
  };
};

const resolveAccountListDelivery = (
  bucketArn: string,
  accountIds: readonly string[],
): ResolvedAccessLogDelivery => {
  if (accountIds.length === 0) {
    throw new Error('allowedSourceAccountIds must contain at least one account ID');
  }
  const uniqueAccountIds = [...new Set(accountIds)];
  for (const accountId of uniqueAccountIds) {
    assertAccountId(accountId);
  }
  return {
    awsLogsResources: uniqueAccountIds.map((accountId) => `${bucketArn}/AWSLogs/${accountId}/*`),
  };
};

/**
 * Resolves `AWSLogs` resource ARNs (and organization ID when used) for an access-log bucket policy.
 */
const resolveAccessLogDelivery = (
  bucketArn: string,
  stackAccount: string,
  scope?: AccessLogDeliveryScope,
): ResolvedAccessLogDelivery => {
  if (scope === undefined) {
    return {
      awsLogsResources: [`${bucketArn}/AWSLogs/${stackAccount}/*`],
    };
  }

  const { allowedSourceAccountIds, organizationId } = scope;
  if (organizationId !== undefined) {
    if (allowedSourceAccountIds !== undefined) {
      throw new Error(ACCESS_LOG_DELIVERY_EXCLUSIVE_ERROR);
    }
    return resolveOrganizationDelivery(bucketArn, organizationId);
  }
  if (allowedSourceAccountIds !== undefined) {
    return resolveAccountListDelivery(bucketArn, allowedSourceAccountIds);
  }
  throw new Error(ACCESS_LOG_DELIVERY_EXCLUSIVE_ERROR);
};

const applyDeploymentPipelineArtifactPolicy = (
  bucket: s3.Bucket,
  stack: Stack,
): void => {
  const qualifier = stack.synthesizer.bootstrapQualifier;
  if (!qualifier || qualifier === DefaultStackSynthesizer.DEFAULT_QUALIFIER) {
    return;
  }

  const { account, region } = stack;
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ['s3:*'],
    resources: [
      `${bucket.bucketArn}`,
      `${bucket.bucketArn}/*`,
    ],
    principals: [
      new iam.ArnPrincipal(`arn:aws:iam::${account}:role/cdk-${qualifier}-deploy-role-${account}-${region}`),
    ],
  }));
};

const applyAccessLogBucketPolicy = (
  bucket: s3.Bucket,
  stack: Stack,
  accessLogDelivery?: AccessLogDeliveryScope,
): BucketPolicyApplyResult => {
  const { awsLogsResources, organizationId } = resolveAccessLogDelivery(
    bucket.bucketArn,
    stack.account,
    accessLogDelivery,
  );

  const organizationConditions = organizationId === undefined
    ? undefined
    : {
      StringEquals: {
        [AWS_SOURCE_ORG_ID]: organizationId,
      },
    };

  const albOrganizationConditions = organizationId === undefined
    ? undefined
    : {
      StringEquals: {
        [AWS_SOURCE_ORG_ID]: organizationId,
      },
      ArnLike: {
        'aws:SourceArn': ELB_SOURCE_ARN,
      },
    };

  // Allow ALB / NLB log delivery (modern service principal path; also required in opt-in regions).
  const albLogDeliveryPolicyResult = bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
    ],
    actions: [S3_PUT_OBJECT],
    resources: awsLogsResources,
    conditions: albOrganizationConditions,
  }));

  // In non–opt-in regions, access logs are often delivered using the regional ELBv2 account.
  const elbAccountId = Token.isUnresolved(stack.region)
    ? stack.regionalFact(FactName.ELBV2_ACCOUNT)
    : RegionInfo.get(stack.region).elbv2Account;
  if (elbAccountId) {
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [
        new iam.AccountPrincipal(elbAccountId),
      ],
      actions: [S3_PUT_OBJECT],
      resources: awsLogsResources,
      // The ELBv2 delivery account is not an organization member; do not attach aws:SourceOrgID.
    }));
  }

  // Allow CloudFront standard logging (v2) to write logs.
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('delivery.logs.amazonaws.com'),
    ],
    actions: [S3_PUT_OBJECT],
    resources: awsLogsResources,
    conditions: organizationConditions,
  }));

  // Allow S3 server access logging to write logs when required by configuration.
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('logging.s3.amazonaws.com'),
    ],
    actions: [S3_PUT_OBJECT],
    resources: awsLogsResources,
    conditions: organizationConditions,
  }));

  return {
    accessLogBucketPolicyDependable: albLogDeliveryPolicyResult.policyDependable ?? bucket,
  };
};

const applyCloudWatchLogArchivePolicy = (bucket: s3.Bucket, stack: Stack): void => {
  const { account, region } = stack;
  const logsExportPrincipal = new iam.ServicePrincipal(`logs.${region}.amazonaws.com`);
  const sourceLogGroupArn = `arn:aws:logs:${region}:${account}:log-group:*`;

  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'AllowCloudWatchLogsExportGetBucketAcl',
    effect: iam.Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: ['s3:GetBucketAcl'],
    resources: [bucket.bucketArn],
    conditions: {
      StringEquals: {
        [AWS_SOURCE_ACCOUNT]: [account],
      },
      ArnLike: {
        [AWS_SOURCE_ARN]: [sourceLogGroupArn],
      },
    },
  }));

  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'AllowCloudWatchLogsExportPutObject',
    effect: iam.Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: ['s3:PutObject'],
    resources: [`${bucket.bucketArn}/*`],
    conditions: {
      StringEquals: {
        's3:x-amz-acl': 'bucket-owner-full-control',
        [AWS_SOURCE_ACCOUNT]: [account],
      },
      ArnLike: {
        [AWS_SOURCE_ARN]: [sourceLogGroupArn],
      },
    },
  }));
};

/**
 * Applies resource policies for the given bucket type, if any.
 */
const applyBucketPolicies = (
  bucketType: S3SecureBucketType,
  bucket: s3.Bucket,
  stack: Stack,
  accessLogDelivery?: AccessLogDeliveryScope,
): BucketPolicyApplyResult => {
  if (bucketType === S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET) {
    applyDeploymentPipelineArtifactPolicy(bucket, stack);
    return {};
  }

  if (bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET) {
    return applyAccessLogBucketPolicy(bucket, stack, accessLogDelivery);
  }

  if (bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET) {
    applyCloudWatchLogArchivePolicy(bucket, stack);
    return {};
  }

  return {};
};

/**
 * Allows one CloudFront distribution to read objects through origin access control.
 */
const grantCloudFrontOriginRead = (
  bucket: s3.Bucket,
  distribution: cloudfront.IDistribution,
): void => {
  // SourceArn keeps the service principal limited to this distribution.
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal(CLOUDFRONT_SERVICE_PRINCIPAL),
    ],
    actions: ['s3:GetObject'],
    resources: [bucket.arnForObjects('*')],
    conditions: {
      StringEquals: {
        'AWS:SourceArn': distribution.distributionArn,
      },
    },
  }));
};

/**
 * S3 bucket with opinionated secure defaults: private ACLs, block public access, TLS-only access,
 * and encryption (S3-managed for log/origin/archive types; KMS-managed by default otherwise).
 *
 * @remarks
 * Secure defaults applied regardless of `props`:
 * - `removalPolicy`: {@link RemovalPolicy.RETAIN}
 * - `publicReadAccess`: `false`
 * - `blockPublicAccess`: {@link s3.BlockPublicAccess.BLOCK_ALL}
 * - `enforceSSL`: `true`
 * - `versioned`: `true` unless explicitly set in `props`
 * - `objectOwnership`: {@link s3.ObjectOwnership.BUCKET_OWNER_ENFORCED} unless overridden
 *   ({@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET} forces {@link s3.ObjectOwnership.OBJECT_WRITER})
 * - `accessControl`: {@link s3.BucketAccessControl.PRIVATE} unless overridden
 *   ({@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET} forces {@link s3.BucketAccessControl.LOG_DELIVERY_WRITE})
 *
 * Bucket-type-specific behavior:
 * - {@link S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET}: may attach a deploy-role policy when a non-default bootstrap qualifier is present.
 * - {@link S3SecureBucketType.ACCESS_LOG_BUCKET}: adds log-writer principals; see {@link S3SecureBucket#accessLogBucketPolicyDependable}
 *   and {@link S3SecureBucketProps.accessLogDelivery}.
 * - {@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET}: S3-managed encryption; ACL-based
 *   CloudFront standard logging (legacy) via `logBucket` / `logFilePrefix`. No access-log resource policy.
 * - {@link S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET}: adds CloudWatch Logs export principals (`logs.<region>.amazonaws.com`).
 * - {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}: S3-managed encryption.
 *   {@link S3SecureBucket#grantCloudFrontRead} allows `s3:GetObject` when the distribution cannot update this bucket policy.
 *   `S3BucketOrigin.withOriginAccessControl` adds that statement itself.
 */
export class S3SecureBucket extends s3.Bucket {
  /**
   * Preset selected at construction. Later grants use it to reject the wrong bucket type.
   */
  private readonly bucketType: S3SecureBucketType;

  /**
   * Set only when {@link S3SecureBucketProps.bucketType} is {@link S3SecureBucketType.ACCESS_LOG_BUCKET}.
   * Use as a dependency target so load balancer access-log enablement runs after the bucket policy
   * exists (ELB performs an immediate validation `PutObject` that fails if the policy is not applied yet).
   *
   * Example: `loadBalancer.node.addDependency(bucket.accessLogBucketPolicyDependable!)`.
   *
   * @default undefined when `bucketType` is not {@link S3SecureBucketType.ACCESS_LOG_BUCKET}.
   */
  public readonly accessLogBucketPolicyDependable?: IDependable;

  /**
   * Creates a secure S3 bucket according to `bucketType` and merged `props`.
   *
   * @param scope - Parent construct, typically a {@link Stack}.
   * @param id - Construct ID (stable logical ID segment).
   * @param props - Optional {@link S3SecureBucketProps}; secure defaults override several {@link s3.BucketProps} fields.
   * When `eventBridgeEnabled` is `true`, EventBridge notification is enabled via an L1 property override.
   */
  constructor(scope: Construct, id: string, props?: S3SecureBucketProps) {
    const bucketType = props?.bucketType || S3SecureBucketType.DEFAULT_BUCKET;
    const isCloudFrontLegacyAccessLog =
      bucketType === S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET;
    const legacyAcl = isCloudFrontLegacyAccessLog
      ? resolveCloudFrontLegacyAccessLogAcl(props?.accessControl, props?.objectOwnership)
      : undefined;

    super(scope, id, {
      ...props,
      removalPolicy: RemovalPolicy.RETAIN,
      encryption: resolveEncryptionDefault(bucketType, props?.encryption),
      accessControl: legacyAcl?.accessControl
        ?? props?.accessControl
        ?? s3.BucketAccessControl.PRIVATE,
      eventBridgeEnabled: undefined,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: props?.versioned !== undefined ? props.versioned : true,
      objectOwnership: legacyAcl?.objectOwnership
        ?? props?.objectOwnership
        ?? s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    const cfnBucket = this.node.defaultChild as s3.CfnBucket;
    if (props?.eventBridgeEnabled === true) {
      cfnBucket.addPropertyOverride('NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled', true);
    }

    this.bucketType = bucketType;

    const stack = Stack.of(this);
    if (props?.accessLogDelivery !== undefined && bucketType !== S3SecureBucketType.ACCESS_LOG_BUCKET) {
      throw new Error('accessLogDelivery is only supported when bucketType is ACCESS_LOG_BUCKET');
    }
    const policyResult = applyBucketPolicies(
      bucketType,
      this,
      stack,
      props?.accessLogDelivery,
    );
    this.accessLogBucketPolicyDependable = policyResult.accessLogBucketPolicyDependable;
  }

  /**
   * Allows one CloudFront distribution to read objects through origin access control.
   *
   * Adds `s3:GetObject` for `cloudfront.amazonaws.com` when `AWS:SourceArn` is
   * {@link cloudfront.IDistribution.distributionArn}. Call once per distribution.
   *
   * `S3BucketOrigin.withOriginAccessControl` adds this same statement. Do not call
   * this method for a distribution created with that helper.
   *
   * Call this method only when the distribution cannot update this bucket policy,
   * for example when the bucket is referenced from another stack.
   *
   * Supported only when {@link S3SecureBucketProps.bucketType} is
   * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}.
   *
   * @param distribution - Distribution that fetches objects from this bucket.
   * @throws Error when `bucketType` is not {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}.
   */
  public grantCloudFrontRead(distribution: cloudfront.IDistribution): void {
    if (this.bucketType !== S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET) {
      throw new Error('grantCloudFrontRead is only supported when bucketType is CLOUDFRONT_ORIGIN_BUCKET');
    }

    grantCloudFrontOriginRead(this, distribution);
  }
}
