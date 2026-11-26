import {
  DefaultStackSynthesizer,
  RemovalPolicy,
  Stack,
  Token,
} from 'aws-cdk-lib';
import type { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import {
  AccountPrincipal,
  AnyPrincipal,
  ArnPrincipal,
  Effect,
  PolicyStatement,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  type BucketPolicy,
  type BucketProps,
  type CfnBucket,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
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
 * Each value selects encryption defaults and, for some types, additional bucket resource policies or ACL settings.
 *
 * @see {@link S3SecureBucketProps.bucketType}
 */
export const S3SecureBucketType = {
  /**
   * Pipeline artifact bucket when using a custom CDK bootstrap qualifier
   * (single- or multi-region deployments).
   *
   * When the bootstrap qualifier is not default, allows `cdk-<qualifier>-deploy-role`
   * `s3:ListBucket`, `s3:GetBucketVersioning`, and `s3:GetBucketLocation` on the bucket,
   * and `s3:GetObject`, `s3:GetObjectVersion`, `s3:PutObject`, `s3:DeleteObject`, and
   * `s3:AbortMultipartUpload` on objects.
   */
  DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET: 'DeploymentPipelineArtifactBucket',
  /**
   * Origin bucket for CloudFront distributions.
   *
   * Uses S3-managed encryption ({@link BucketEncryption.S3_MANAGED}) by default.
   * `S3SecureBucket.grantCloudFrontRead` allows `s3:GetObject` from one distribution
   * through origin access control when that distribution cannot update this bucket policy.
   * `S3BucketOrigin.withOriginAccessControl` adds the same statement itself.
   */
  CLOUDFRONT_ORIGIN_BUCKET: 'CloudFrontOriginBucket',
  /**
   * CloudFront origin whose bucket policy is created in another stack.
   *
   * Uses S3-managed encryption ({@link BucketEncryption.S3_MANAGED}).
   * Does not create a TLS {@link BucketPolicy} here: `enforceSSL` is false, versioning is off,
   * and `removalPolicy` follows props ({@link RemovalPolicy.RETAIN} when omitted).
   * {@link S3SecureBucketProps.allowInsecureOverrides} can set `publicReadAccess`, which adds a bucket policy.
   * Omits `accessControl` and rejects any value. `objectOwnership` stays
   * {@link ObjectOwnership.BUCKET_OWNER_ENFORCED}.
   * {@link S3SecureBucket#addOriginPolicy} appends statements to a policy the caller owns.
   * Pass the distribution ARN as a string. This type does not accept {@link IDistribution}.
   */
  CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET: 'CloudFrontOriginExternalPolicyBucket',
  /**
   * Destination for CloudFront standard logging (legacy) via
   * {@link aws-cdk-lib/aws-cloudfront.Distribution} `logBucket` and `logFilePrefix`.
   *
   * Uses S3-managed encryption ({@link BucketEncryption.S3_MANAGED}).
   * Sets `accessControl` to {@link BucketAccessControl.LOG_DELIVERY_WRITE} and
   * `objectOwnership` to {@link ObjectOwnership.OBJECT_WRITER} so ACL-based
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
 * Extends {@link BucketProps}. Several fields receive secure defaults inside the construct.
 * `removalPolicy`, `publicReadAccess`, `blockPublicAccess`, `enforceSSL`, and `minimumTLSVersion`
 * stay at those defaults unless {@link S3SecureBucketProps.allowInsecureOverrides} is true.
 */
export interface S3SecureBucketProps extends BucketProps {
  /**
   * Selects encryption defaults and optional resource-policy or ACL settings.
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

  /**
   * Denies `s3:PutObject` unless the request sends `x-amz-server-side-encryption` for this bucket's algorithm
   * (`AES256`, `aws:kms`, or `aws:kms:dsse`).
   *
   * Adds a `StringNotEquals` deny for the wrong algorithm and a `Null` deny when the header is absent.
   * Uploaders that omit the header and rely on bucket default encryption are denied. Leave this off for
   * ALB/NLB access logs, CloudFront log delivery, S3 server access logging, and CloudWatch Logs export.
   *
   * Not supported for {@link S3SecureBucketType.ACCESS_LOG_BUCKET},
   * {@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET}, or
   * {@link S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET}.
   *
   * For {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET}, {@link S3SecureBucket#addOriginPolicy}
   * appends these statements to the caller-supplied policy. The prop does not create a bucket policy in the bucket's stack.
   *
   * @default false
   */
  readonly denyUnencryptedObjectUploads?: boolean;

  /**
   * Uses `removalPolicy`, `publicReadAccess`, `blockPublicAccess`, `enforceSSL`, and `minimumTLSVersion` from props.
   * Omitted fields keep the secure defaults.
   *
   * `publicReadAccess: true` adds an `s3:GetObject` allow for every principal.
   * Pair it with a `blockPublicAccess` value that leaves `blockPublicPolicy` disabled, or construction fails.
   * Setting `minimumTLSVersion` while `enforceSSL` is false fails at construction.
   *
   * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET} still forces `enforceSSL` off
   * and omits `minimumTLSVersion`. Setting either while this flag is true fails at construction.
   * `publicReadAccess` and `blockPublicAccess` follow props for that type.
   * `publicReadAccess: true` adds a bucket policy in the bucket's stack.
   *
   * @default false
   */
  readonly allowInsecureOverrides?: boolean;
}

const CLOUDFRONT_SERVICE_PRINCIPAL = 'cloudfront.amazonaws.com';
const MINIMUM_TLS_VERSION = 1.2;
const ELB_SOURCE_ARN = 'arn:aws:elasticloadbalancing:*:*:loadbalancer/*';

const S3_ACTION = Object.freeze({
  ALL: 's3:*',
  GET_OBJECT: 's3:GetObject',
  GET_OBJECT_VERSION: 's3:GetObjectVersion',
  PUT_OBJECT: 's3:PutObject',
  DELETE_OBJECT: 's3:DeleteObject',
  ABORT_MULTIPART_UPLOAD: 's3:AbortMultipartUpload',
  LIST_BUCKET: 's3:ListBucket',
  GET_BUCKET_VERSIONING: 's3:GetBucketVersioning',
  GET_BUCKET_LOCATION: 's3:GetBucketLocation',
} as const);

const DEPLOY_ROLE_ACTION = Object.freeze({
  BUCKET: Object.freeze([
    S3_ACTION.LIST_BUCKET,
    S3_ACTION.GET_BUCKET_VERSIONING,
    S3_ACTION.GET_BUCKET_LOCATION,
  ] as const),
  OBJECT: Object.freeze([
    S3_ACTION.GET_OBJECT,
    S3_ACTION.GET_OBJECT_VERSION,
    S3_ACTION.PUT_OBJECT,
    S3_ACTION.DELETE_OBJECT,
    S3_ACTION.ABORT_MULTIPART_UPLOAD,
  ] as const),
});

const SSE_ALGORITHM = Object.freeze({
  S3: 'AES256',
  KMS: 'aws:kms',
  DSSE: 'aws:kms:dsse',
} as const);

// CloudFront origin conditions use an uppercase AWS prefix. aws:SourceArn is a different key.
const CONDITION_KEY = Object.freeze({
  SOURCE_ORG_ID: 'aws:SourceOrgID',
  SOURCE_ACCOUNT: 'aws:SourceAccount',
  SOURCE_ARN: 'aws:SourceArn',
  CLOUDFRONT_SOURCE_ARN: 'AWS:SourceArn',
  SERVER_SIDE_ENCRYPTION: 's3:x-amz-server-side-encryption',
} as const);

const REQUIRED_LEGACY_ACCESS_LOG = Object.freeze({
  ACCESS_CONTROL: BucketAccessControl.LOG_DELIVERY_WRITE,
  OBJECT_OWNERSHIP: ObjectOwnership.OBJECT_WRITER,
} as const);

const REQUIRED_EXTERNAL_POLICY = Object.freeze({
  ENCRYPTION: BucketEncryption.S3_MANAGED,
  OBJECT_OWNERSHIP: ObjectOwnership.BUCKET_OWNER_ENFORCED,
} as const);

const ERROR = Object.freeze({
  LEGACY_CLOUD_FRONT_LOG_ACL:
    'CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET requires accessControl LOG_DELIVERY_WRITE and objectOwnership OBJECT_WRITER for legacy CloudFront access logging',
  EXTERNAL_POLICY_ENCRYPTION:
    'CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires encryption S3_MANAGED',
  EXTERNAL_POLICY_OBJECT_OWNERSHIP:
    'CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires objectOwnership BUCKET_OWNER_ENFORCED',
  EXTERNAL_POLICY_ACCESS_CONTROL:
    'CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET does not accept accessControl',
  EXTERNAL_POLICY_VERSIONED:
    'CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires versioned false',
  EXTERNAL_POLICY_SSL_OVERRIDE:
    'CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET does not accept enforceSSL or minimumTLSVersion',
  MINIMUM_TLS_VERSION_REQUIRES_ENFORCE_SSL:
    'minimumTLSVersion requires enforceSSL',
  ADD_ORIGIN_POLICY_BUCKET_TYPE:
    'addOriginPolicy is only supported when bucketType is CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET',
  ADD_ORIGIN_POLICY_BUCKET_MISMATCH:
    'addOriginPolicy requires a BucketPolicy for this bucket',
  ADD_ORIGIN_POLICY_EMPTY_ARN: 'distributionArn must not be empty',
  DENY_UNENCRYPTED_OBJECT_UPLOADS_UNSUPPORTED:
    'denyUnencryptedObjectUploads is not supported when bucketType is ACCESS_LOG_BUCKET, CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET, or CLOUD_WATCH_LOG_ARCHIVE_BUCKET',
  ACCESS_LOG_DELIVERY_EXCLUSIVE:
    'accessLogDelivery must specify exactly one of allowedSourceAccountIds or organizationId',
} as const);

interface CloudFrontLegacyAccessLogAclDefaults {
  readonly accessControl: BucketAccessControl;
  readonly objectOwnership: ObjectOwnership;
}

interface CloudFrontOriginExternalPolicyDefaults {
  readonly encryption: BucketEncryption;
  readonly objectOwnership: ObjectOwnership;
  readonly versioned: boolean;
  readonly removalPolicy: RemovalPolicy;
}

interface SecureAccessDefaults {
  readonly removalPolicy: RemovalPolicy;
  readonly publicReadAccess: boolean;
  readonly blockPublicAccess: BlockPublicAccess;
  readonly enforceSSL: boolean;
  readonly minimumTLSVersion?: number;
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
  propsEncryption?: BucketEncryption,
): BucketEncryption => {
  if (
    bucketType === S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET
    || bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET
    || bucketType === S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET
    || bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET
  ) {
    return BucketEncryption.S3_MANAGED;
  }
  return propsEncryption ?? BucketEncryption.KMS_MANAGED;
};

/**
 * Header value PutObject must send when explicit encryption is required.
 * S3-managed and the deprecated unencrypted setting both use SSE-S3.
 */
const resolveRequiredSseHeader = (encryption: BucketEncryption): string => {
  if (encryption === BucketEncryption.KMS || encryption === BucketEncryption.KMS_MANAGED) {
    return SSE_ALGORITHM.KMS;
  }
  if (encryption === BucketEncryption.DSSE || encryption === BucketEncryption.DSSE_MANAGED) {
    return SSE_ALGORITHM.DSSE;
  }
  return SSE_ALGORITHM.S3;
};

/**
 * Service log writers omit the encryption header and use the bucket default.
 * Requiring the header makes those bucket types unable to receive logs.
 */
const isServiceLogBucket = (bucketType: S3SecureBucketType): boolean => {
  if (bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET) {
    return true;
  }
  if (bucketType === S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET) {
    return true;
  }
  if (bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET) {
    return true;
  }
  return false;
};

/**
 * Denies object uploads that omit server-side encryption or name a different algorithm.
 */
const unencryptedObjectUploadDenies = (
  bucket: Bucket,
  sseHeader: string,
): PolicyStatement[] => {
  return [
    new PolicyStatement({
      sid: 'DenyIncorrectEncryptionHeader',
      effect: Effect.DENY,
      principals: [new AnyPrincipal()],
      actions: [S3_ACTION.PUT_OBJECT],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringNotEquals: {
          [CONDITION_KEY.SERVER_SIDE_ENCRYPTION]: sseHeader,
        },
      },
    }),
    new PolicyStatement({
      sid: 'DenyUnencryptedObjectUploads',
      effect: Effect.DENY,
      principals: [new AnyPrincipal()],
      actions: [S3_ACTION.PUT_OBJECT],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        Null: {
          [CONDITION_KEY.SERVER_SIDE_ENCRYPTION]: 'true',
        },
      },
    }),
  ];
};

const addUnencryptedObjectUploadDenies = (
  bucket: Bucket,
  sseHeader: string,
  policy?: BucketPolicy,
): void => {
  const statements = unencryptedObjectUploadDenies(bucket, sseHeader);
  if (policy !== undefined) {
    policy.document.addStatements(...statements);
    return;
  }
  for (const statement of statements) {
    bucket.addToResourcePolicy(statement);
  }
};

/**
 * Resolves ACL settings for CloudFront standard logging (legacy).
 * Throws when the caller passes a value other than the required defaults.
 */
const resolveCloudFrontLegacyAccessLogAcl = (
  propsAccessControl?: BucketAccessControl,
  propsObjectOwnership?: ObjectOwnership,
): CloudFrontLegacyAccessLogAclDefaults => {
  if (propsAccessControl !== undefined && propsAccessControl !== REQUIRED_LEGACY_ACCESS_LOG.ACCESS_CONTROL) {
    throw new Error(ERROR.LEGACY_CLOUD_FRONT_LOG_ACL);
  }
  if (propsObjectOwnership !== undefined && propsObjectOwnership !== REQUIRED_LEGACY_ACCESS_LOG.OBJECT_OWNERSHIP) {
    throw new Error(ERROR.LEGACY_CLOUD_FRONT_LOG_ACL);
  }

  return {
    accessControl: REQUIRED_LEGACY_ACCESS_LOG.ACCESS_CONTROL,
    objectOwnership: REQUIRED_LEGACY_ACCESS_LOG.OBJECT_OWNERSHIP,
  };
};

/**
 * Fixed settings for a CloudFront origin whose bucket policy is owned by another stack.
 * Rejects versioning, encryption other than S3-managed, object ownership other than
 * bucket owner enforced, and any accessControl value.
 */
const resolveCloudFrontOriginExternalPolicy = (
  props?: S3SecureBucketProps,
): CloudFrontOriginExternalPolicyDefaults => {
  if (props?.encryption !== undefined && props.encryption !== REQUIRED_EXTERNAL_POLICY.ENCRYPTION) {
    throw new Error(ERROR.EXTERNAL_POLICY_ENCRYPTION);
  }
  if (
    props?.objectOwnership !== undefined
    && props.objectOwnership !== REQUIRED_EXTERNAL_POLICY.OBJECT_OWNERSHIP
  ) {
    throw new Error(ERROR.EXTERNAL_POLICY_OBJECT_OWNERSHIP);
  }
  if (props?.accessControl !== undefined) {
    throw new Error(ERROR.EXTERNAL_POLICY_ACCESS_CONTROL);
  }
  if (props?.versioned === true) {
    throw new Error(ERROR.EXTERNAL_POLICY_VERSIONED);
  }

  return {
    encryption: REQUIRED_EXTERNAL_POLICY.ENCRYPTION,
    objectOwnership: REQUIRED_EXTERNAL_POLICY.OBJECT_OWNERSHIP,
    versioned: false,
    removalPolicy: props?.removalPolicy ?? RemovalPolicy.RETAIN,
  };
};

/**
 * Resolves access settings that stay at secure defaults unless `allowInsecureOverrides` is set.
 * Omitted fields keep those defaults. The external-policy type still creates no TLS bucket policy.
 */
const resolveSecureAccess = (
  props: S3SecureBucketProps | undefined,
  externalPolicyOrigin: CloudFrontOriginExternalPolicyDefaults | undefined,
): SecureAccessDefaults => {
  const allowInsecureOverrides = props?.allowInsecureOverrides === true;
  const publicReadAccess = allowInsecureOverrides ? (props?.publicReadAccess ?? false) : false;
  const blockPublicAccess = allowInsecureOverrides
    ? (props?.blockPublicAccess ?? BlockPublicAccess.BLOCK_ALL)
    : BlockPublicAccess.BLOCK_ALL;

  if (externalPolicyOrigin !== undefined) {
    if (
      allowInsecureOverrides
      && (props?.enforceSSL !== undefined || props?.minimumTLSVersion !== undefined)
    ) {
      throw new Error(ERROR.EXTERNAL_POLICY_SSL_OVERRIDE);
    }
    return {
      removalPolicy: externalPolicyOrigin.removalPolicy,
      publicReadAccess,
      blockPublicAccess,
      // CDK adds the TLS deny only when enforceSSL is set. This type adds that deny in addOriginPolicy.
      enforceSSL: false,
      minimumTLSVersion: undefined,
    };
  }

  if (!allowInsecureOverrides) {
    return {
      removalPolicy: RemovalPolicy.RETAIN,
      publicReadAccess,
      blockPublicAccess,
      enforceSSL: true,
      minimumTLSVersion: MINIMUM_TLS_VERSION,
    };
  }

  const enforceSSL = props?.enforceSSL ?? true;
  if (!enforceSSL && props?.minimumTLSVersion !== undefined) {
    throw new Error(ERROR.MINIMUM_TLS_VERSION_REQUIRES_ENFORCE_SSL);
  }

  return {
    removalPolicy: props?.removalPolicy ?? RemovalPolicy.RETAIN,
    publicReadAccess,
    blockPublicAccess,
    enforceSSL,
    minimumTLSVersion: enforceSSL ? (props?.minimumTLSVersion ?? MINIMUM_TLS_VERSION) : undefined,
  };
};

const assertAccountId = (accountId: string): void => {
  if (Token.isUnresolved(accountId)) {
    return;
  }
  if (isAwsAccountId(accountId)) {
    return;
  }
  throw new Error('allowedSourceAccountIds contains an invalid AWS account ID');
};

const resolveOrganizationDelivery = (
  bucketArn: string,
  organizationId: string,
): ResolvedAccessLogDelivery => {
  if (!Token.isUnresolved(organizationId) && !isAwsOrganizationId(organizationId)) {
    throw new Error('organizationId must be an AWS Organizations ID (o-...)');
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
      throw new Error(ERROR.ACCESS_LOG_DELIVERY_EXCLUSIVE);
    }
    return resolveOrganizationDelivery(bucketArn, organizationId);
  }
  if (allowedSourceAccountIds !== undefined) {
    return resolveAccountListDelivery(bucketArn, allowedSourceAccountIds);
  }
  throw new Error(ERROR.ACCESS_LOG_DELIVERY_EXCLUSIVE);
};

/**
 * Grants the CDK deploy role artifact read and write when a non-default bootstrap qualifier is in use.
 * Bucket actions stay on the bucket ARN, and object actions stay on object ARNs.
 * The bucket is versioned, so reads include GetObjectVersion and large uploads can abort a multipart upload.
 */
const applyDeploymentPipelineArtifactPolicy = (
  bucket: Bucket,
  stack: Stack,
): void => {
  const qualifier = stack.synthesizer.bootstrapQualifier;
  if (!qualifier || qualifier === DefaultStackSynthesizer.DEFAULT_QUALIFIER) {
    return;
  }

  const { account, region } = stack;
  const deployRole = new ArnPrincipal(
    `arn:aws:iam::${account}:role/cdk-${qualifier}-deploy-role-${account}-${region}`,
  );
  bucket.addToResourcePolicy(new PolicyStatement({
    actions: [...DEPLOY_ROLE_ACTION.BUCKET],
    resources: [bucket.bucketArn],
    principals: [deployRole],
  }));
  bucket.addToResourcePolicy(new PolicyStatement({
    actions: [...DEPLOY_ROLE_ACTION.OBJECT],
    resources: [bucket.arnForObjects('*')],
    principals: [deployRole],
  }));
};

/**
 * Adds `s3:PutObject` for ALB/NLB, CloudFront standard logging (v2), and S3 server access logging.
 */
const applyAccessLogBucketPolicy = (
  bucket: Bucket,
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
        [CONDITION_KEY.SOURCE_ORG_ID]: organizationId,
      },
    };

  const albOrganizationConditions = organizationId === undefined
    ? undefined
    : {
      StringEquals: {
        [CONDITION_KEY.SOURCE_ORG_ID]: organizationId,
      },
      ArnLike: {
        [CONDITION_KEY.SOURCE_ARN]: ELB_SOURCE_ARN,
      },
    };

  // Allow ALB / NLB log delivery (modern service principal path; also required in opt-in regions).
  const albLogDeliveryPolicyResult = bucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [
      new ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
    ],
    actions: [S3_ACTION.PUT_OBJECT],
    resources: awsLogsResources,
    conditions: albOrganizationConditions,
  }));

  // In non–opt-in regions, access logs are often delivered using the regional ELBv2 account.
  const elbAccountId = Token.isUnresolved(stack.region)
    ? stack.regionalFact(FactName.ELBV2_ACCOUNT)
    : RegionInfo.get(stack.region).elbv2Account;
  if (elbAccountId) {
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new AccountPrincipal(elbAccountId),
      ],
      actions: [S3_ACTION.PUT_OBJECT],
      resources: awsLogsResources,
      // The ELBv2 delivery account is not an organization member; do not attach aws:SourceOrgID.
    }));
  }

  // Allow CloudFront standard logging (v2) to write logs.
  bucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [
      new ServicePrincipal('delivery.logs.amazonaws.com'),
    ],
    actions: [S3_ACTION.PUT_OBJECT],
    resources: awsLogsResources,
    conditions: organizationConditions,
  }));

  // Allow S3 server access logging to write logs when required by configuration.
  bucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [
      new ServicePrincipal('logging.s3.amazonaws.com'),
    ],
    actions: [S3_ACTION.PUT_OBJECT],
    resources: awsLogsResources,
    conditions: organizationConditions,
  }));

  return {
    accessLogBucketPolicyDependable: albLogDeliveryPolicyResult.policyDependable,
  };
};

/**
 * Adds CloudWatch Logs export-task principals for the stack account and region.
 */
const applyCloudWatchLogArchivePolicy = (bucket: Bucket, stack: Stack): void => {
  const { account, region } = stack;
  const logsExportPrincipal = new ServicePrincipal(`logs.${region}.amazonaws.com`);
  const sourceLogGroupArn = `arn:aws:logs:${region}:${account}:log-group:*`;

  bucket.addToResourcePolicy(new PolicyStatement({
    sid: 'AllowCloudWatchLogsExportGetBucketAcl',
    effect: Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: ['s3:GetBucketAcl'],
    resources: [bucket.bucketArn],
    conditions: {
      StringEquals: {
        [CONDITION_KEY.SOURCE_ACCOUNT]: [account],
      },
      ArnLike: {
        [CONDITION_KEY.SOURCE_ARN]: [sourceLogGroupArn],
      },
    },
  }));

  bucket.addToResourcePolicy(new PolicyStatement({
    sid: 'AllowCloudWatchLogsExportPutObject',
    effect: Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: [S3_ACTION.PUT_OBJECT],
    resources: [`${bucket.bucketArn}/*`],
    conditions: {
      StringEquals: {
        's3:x-amz-acl': 'bucket-owner-full-control',
        [CONDITION_KEY.SOURCE_ACCOUNT]: [account],
      },
      ArnLike: {
        [CONDITION_KEY.SOURCE_ARN]: [sourceLogGroupArn],
      },
    },
  }));
};

/**
 * Applies resource policies for the given bucket type, if any.
 */
const applyBucketPolicies = (
  bucketType: S3SecureBucketType,
  bucket: Bucket,
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
 * Appends TLS and CloudFront origin statements to a caller-owned bucket policy.
 * The policy resource stays in the caller's stack, so this bucket does not reference the distribution.
 */
const addCloudFrontOriginExternalStatements = (
  bucket: Bucket,
  policy: BucketPolicy,
  distributionArn: string,
): void => {
  const bucketAndObjectArns = [bucket.bucketArn, bucket.arnForObjects('*')];
  policy.document.addStatements(
    new PolicyStatement({
      effect: Effect.DENY,
      principals: [new AnyPrincipal()],
      actions: [S3_ACTION.ALL],
      resources: bucketAndObjectArns,
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }),
    new PolicyStatement({
      effect: Effect.DENY,
      principals: [new AnyPrincipal()],
      actions: [S3_ACTION.ALL],
      resources: bucketAndObjectArns,
      conditions: {
        NumericLessThan: {
          's3:TlsVersion': MINIMUM_TLS_VERSION,
        },
      },
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new ServicePrincipal(CLOUDFRONT_SERVICE_PRINCIPAL)],
      actions: [S3_ACTION.GET_OBJECT],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals: {
          [CONDITION_KEY.CLOUDFRONT_SOURCE_ARN]: distributionArn,
        },
      },
    }),
  );
};

/**
 * Allows one CloudFront distribution to read objects through origin access control.
 */
const grantCloudFrontOriginRead = (
  bucket: Bucket,
  distribution: IDistribution,
): void => {
  // SourceArn keeps the service principal limited to this distribution.
  bucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [
      new ServicePrincipal(CLOUDFRONT_SERVICE_PRINCIPAL),
    ],
    actions: [S3_ACTION.GET_OBJECT],
    resources: [bucket.arnForObjects('*')],
    conditions: {
      StringEquals: {
        [CONDITION_KEY.CLOUDFRONT_SOURCE_ARN]: distribution.distributionArn,
      },
    },
  }));
};

/**
 * S3 bucket with opinionated secure defaults: private ACLs, block public access,
 * and encryption (S3-managed for log, origin, and archive types; KMS-managed by default otherwise).
 *
 * @remarks
 * Secure defaults applied for every type.
 * `publicReadAccess` and `blockPublicAccess` stay at these values unless
 * {@link S3SecureBucketProps.allowInsecureOverrides} is true:
 * - `publicReadAccess`: `false`
 * - `blockPublicAccess`: {@link BlockPublicAccess.BLOCK_ALL}
 * - `objectOwnership`: {@link ObjectOwnership.BUCKET_OWNER_ENFORCED} unless overridden
 *   ({@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET} forces {@link ObjectOwnership.OBJECT_WRITER};
 *   {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET} rejects any other value)
 * - `accessControl`: {@link BucketAccessControl.PRIVATE} unless overridden
 *   ({@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET} forces {@link BucketAccessControl.LOG_DELIVERY_WRITE};
 *   {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET} omits `accessControl` and rejects any value)
 *
 * Defaults for every type except {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET}.
 * `removalPolicy`, `enforceSSL`, and `minimumTLSVersion` stay at these values unless
 * {@link S3SecureBucketProps.allowInsecureOverrides} is true:
 * - `removalPolicy`: {@link RemovalPolicy.RETAIN}
 * - `enforceSSL`: `true` (deny requests that are not HTTPS)
 * - `minimumTLSVersion`: `1.2` (deny TLS below 1.2 on this bucket's policy)
 * - `versioned`: `true` unless explicitly set in `props`
 *
 * Omitted fields keep those defaults when the flag is true.
 * `minimumTLSVersion` applies only when `enforceSSL` is enabled. Setting it while `enforceSSL` is false fails at construction.
 * `publicReadAccess: true` adds an `s3:GetObject` allow for every principal and requires `blockPublicAccess` to be set
 * with `blockPublicPolicy` disabled.
 *
 * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET} uses `removalPolicy` from props
 * ({@link RemovalPolicy.RETAIN} when omitted), `enforceSSL: false` (no TLS {@link BucketPolicy} in this
 * bucket's stack), and `versioned: false` (`true` is rejected). TLS and CloudFront origin statements
 * are added with {@link S3SecureBucket#addOriginPolicy}.
 * The flag can change `publicReadAccess` and `blockPublicAccess` for this type.
 * Setting `enforceSSL` or `minimumTLSVersion` while the flag is true fails at construction.
 * `publicReadAccess: true` adds a bucket policy.
 *
 * Bucket-type-specific behavior:
 * - {@link S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET}: when the bootstrap qualifier is not default,
 *   allows the deploy role `s3:ListBucket`, `s3:GetBucketVersioning`, and `s3:GetBucketLocation` on the bucket,
 *   and `s3:GetObject`, `s3:GetObjectVersion`, `s3:PutObject`, `s3:DeleteObject`, and `s3:AbortMultipartUpload` on objects.
 * - {@link S3SecureBucketType.ACCESS_LOG_BUCKET}: adds log-writer principals; see {@link S3SecureBucket#accessLogBucketPolicyDependable}
 *   and {@link S3SecureBucketProps.accessLogDelivery}.
 * - {@link S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET}: S3-managed encryption; ACL-based
 *   CloudFront standard logging (legacy) via `logBucket` / `logFilePrefix`. No access-log resource policy.
 * - {@link S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET}: adds CloudWatch Logs export principals (`logs.<region>.amazonaws.com`).
 * - {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}: S3-managed encryption.
 *   {@link S3SecureBucket#grantCloudFrontRead} allows `s3:GetObject` when the distribution cannot update this bucket policy.
 *   `S3BucketOrigin.withOriginAccessControl` adds that statement itself.
 * - {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET}: S3-managed encryption.
 *   Does not create a bucket policy. {@link S3SecureBucket#addOriginPolicy} appends TLS and CloudFront
 *   `s3:GetObject` statements to a {@link BucketPolicy} supplied by the caller.
 *
 * Set {@link S3SecureBucketProps.denyUnencryptedObjectUploads} to require `x-amz-server-side-encryption` on `s3:PutObject`.
 * Service log bucket types reject that prop.
 */
export class S3SecureBucket extends Bucket {
  /**
   * Preset selected at construction. Later grants use it to reject the wrong bucket type.
   */
  private readonly bucketType: S3SecureBucketType;

  /**
   * Set when {@link S3SecureBucketProps.denyUnencryptedObjectUploads} is true.
   * The external-policy bucket appends the denies from {@link S3SecureBucket#addOriginPolicy}.
   */
  private readonly requiredObjectEncryptionHeader?: string;

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
   * @param props - Optional {@link S3SecureBucketProps}. Secure defaults override `removalPolicy`,
   * `publicReadAccess`, `blockPublicAccess`, `enforceSSL`, and `minimumTLSVersion` unless
   * {@link S3SecureBucketProps.allowInsecureOverrides} is true.
   * When `eventBridgeEnabled` is `true`, EventBridge notification is enabled via an L1 property override.
   */
  constructor(scope: Construct, id: string, props?: S3SecureBucketProps) {
    const bucketType = props?.bucketType || S3SecureBucketType.DEFAULT_BUCKET;
    if (props?.denyUnencryptedObjectUploads === true && isServiceLogBucket(bucketType)) {
      throw new Error(ERROR.DENY_UNENCRYPTED_OBJECT_UPLOADS_UNSUPPORTED);
    }
    const isCloudFrontLegacyAccessLog =
      bucketType === S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET;
    const legacyAcl = isCloudFrontLegacyAccessLog
      ? resolveCloudFrontLegacyAccessLogAcl(props?.accessControl, props?.objectOwnership)
      : undefined;
    const externalPolicyOrigin = bucketType === S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET
      ? resolveCloudFrontOriginExternalPolicy(props)
      : undefined;
    const accessControl = externalPolicyOrigin !== undefined
      ? undefined
      : legacyAcl?.accessControl
        ?? props?.accessControl
        ?? BucketAccessControl.PRIVATE;
    const objectEncryptionHeader = props?.denyUnencryptedObjectUploads === true
      ? resolveRequiredSseHeader(
        externalPolicyOrigin?.encryption ?? resolveEncryptionDefault(bucketType, props?.encryption),
      )
      : undefined;
    const secureAccess = resolveSecureAccess(props, externalPolicyOrigin);

    super(scope, id, {
      ...props,
      removalPolicy: secureAccess.removalPolicy,
      encryption: externalPolicyOrigin?.encryption ?? resolveEncryptionDefault(bucketType, props?.encryption),
      accessControl,
      eventBridgeEnabled: undefined,
      publicReadAccess: secureAccess.publicReadAccess,
      blockPublicAccess: secureAccess.blockPublicAccess,
      enforceSSL: secureAccess.enforceSSL,
      minimumTLSVersion: secureAccess.minimumTLSVersion,
      versioned: externalPolicyOrigin?.versioned
        ?? (props?.versioned !== undefined ? props.versioned : true),
      objectOwnership: legacyAcl?.objectOwnership
        ?? externalPolicyOrigin?.objectOwnership
        ?? props?.objectOwnership
        ?? ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    const cfnBucket = this.node.defaultChild as CfnBucket;
    if (props?.eventBridgeEnabled === true) {
      cfnBucket.addPropertyOverride('NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled', true);
    }

    this.bucketType = bucketType;
    this.requiredObjectEncryptionHeader = objectEncryptionHeader;

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
    // The external-policy type appends these denies in addOriginPolicy so this stack stays free of a bucket policy.
    if (objectEncryptionHeader !== undefined && externalPolicyOrigin === undefined) {
      addUnencryptedObjectUploadDenies(this, objectEncryptionHeader);
    }
  }

  /**
   * Allows one CloudFront distribution to read objects through origin access control.
   *
   * Adds `s3:GetObject` for `cloudfront.amazonaws.com` when `AWS:SourceArn` is
   * {@link IDistribution.distributionArn}. Call once per distribution.
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
  public grantCloudFrontRead(distribution: IDistribution): void {
    if (this.bucketType !== S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET) {
      throw new Error('grantCloudFrontRead is only supported when bucketType is CLOUDFRONT_ORIGIN_BUCKET');
    }

    grantCloudFrontOriginRead(this, distribution);
  }

  /**
   * Appends CloudFront origin statements to a bucket policy created outside this bucket's stack.
   *
   * Adds three statements to `policy.document`: deny when `aws:SecureTransport` is false, deny when
   * `s3:TlsVersion` is below 1.2, and allow `s3:GetObject` for `cloudfront.amazonaws.com` when
   * `AWS:SourceArn` is `distributionArn`. When {@link S3SecureBucketProps.denyUnencryptedObjectUploads}
   * is set, also denies `s3:PutObject` that omits `x-amz-server-side-encryption` or names another algorithm.
   * Does not call `addToResourcePolicy`.
   *
   * Supported only when {@link S3SecureBucketProps.bucketType} is
   * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET}.
   *
   * @param policy - Bucket policy for this bucket. The caller creates it, typically in another stack.
   * @param distributionArn - Distribution ARN. Unresolved tokens are accepted. A resolved empty string is rejected.
   * @throws Error when `bucketType` is not {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET}.
   * @throws Error when `policy` is for a different bucket.
   * @throws Error when `distributionArn` is a resolved empty string.
   */
  public addOriginPolicy(policy: BucketPolicy, distributionArn: string): void {
    if (this.bucketType !== S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET) {
      throw new Error(ERROR.ADD_ORIGIN_POLICY_BUCKET_TYPE);
    }
    if (policy.bucket !== this) {
      throw new Error(ERROR.ADD_ORIGIN_POLICY_BUCKET_MISMATCH);
    }
    if (!Token.isUnresolved(distributionArn) && distributionArn === '') {
      throw new Error(ERROR.ADD_ORIGIN_POLICY_EMPTY_ARN);
    }

    addCloudFrontOriginExternalStatements(this, policy, distributionArn);
    if (this.requiredObjectEncryptionHeader !== undefined) {
      addUnencryptedObjectUploadDenies(this, this.requiredObjectEncryptionHeader, policy);
    }
  }
}
