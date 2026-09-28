import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct, IDependable } from 'constructs';
import { applyBucketPolicies, grantCloudFrontOriginRead } from './bucket-policies';
import {
  resolveEncryptionDefault,
  S3SecureBucketProps,
  S3SecureBucketType,
} from './bucket-types';

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
 * - `accessControl`: {@link s3.BucketAccessControl.PRIVATE} unless overridden
 *
 * Bucket-type-specific behavior:
 * - {@link S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET}: may attach a deploy-role policy when a non-default bootstrap qualifier is present.
 * - {@link S3SecureBucketType.ACCESS_LOG_BUCKET}: adds log-writer principals; see {@link S3SecureBucket#accessLogBucketPolicyDependable}
 *   and {@link S3SecureBucketProps.accessLogDelivery}.
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
    super(scope, id, {
      ...props,
      removalPolicy: RemovalPolicy.RETAIN,
      encryption: resolveEncryptionDefault(bucketType, props?.encryption),
      accessControl: props?.accessControl ?? s3.BucketAccessControl.PRIVATE,
      eventBridgeEnabled: undefined,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: props?.versioned !== undefined ? props.versioned : true,
      objectOwnership: props?.objectOwnership ?? s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
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
    const policyResult = applyBucketPolicies(bucketType, {
      bucket: this,
      stack,
      accessLogDelivery: props?.accessLogDelivery,
    });
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
