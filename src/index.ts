import { DefaultStackSynthesizer, RemovalPolicy, Stack, Token } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { FactName, RegionInfo } from 'aws-cdk-lib/region-info';
import { Construct, IDependable } from 'constructs';

/**
 * Bucket type discriminator values for {@link S3SecureBucketProps.bucketType}.
 *
 * @see {@link S3SecureBucketProps.bucketType}
 */
export const S3SecureBucketType = {
  /**
   * Pipeline artifact bucket when using a custom CDK bootstrap qualifier
   * (single- or multi-region deployments).
   */
  DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET: 'DeploymentPipelineArtifactBucket',
  /**
   * Origin bucket for CloudFront distributions.
   */
  CLOUDFRONT_ORIGIN_BUCKET: 'CloudFrontOriginBucket',
  /**
   * General-purpose secure bucket (default qualifier / standard use).
   */
  DEFAULT_BUCKET: 'DefaultBucket',
  /**
   * Centralized access logs for producers such as ALB/NLB, CloudFront standard logging (v2),
   * and S3 server access logging. Grants `s3:PutObject` on `AWSLogs/<account>/*` only (no read/list).
   *
   * For {@link S3SecureBucketType.ACCESS_LOG_BUCKET}, the regional ELBv2 log-delivery account ID
   * (legacy path alongside the log delivery service principal) is resolved from `aws-cdk-lib/region-info`
   * at synthesis time when {@link Stack#region} is known, or via a deploy-time mapping when it is a token.
   */
  ACCESS_LOG_BUCKET: 'AccessLogBucket',
} as const;

/**
 * Discriminated union of {@link S3SecureBucketType} string literals.
 */
export type S3SecureBucketType = typeof S3SecureBucketType[keyof typeof S3SecureBucketType];

/**
 * Construction properties for {@link S3SecureBucket}.
 *
 * Extends {@link s3.BucketProps}; several fields receive secure defaults inside the construct.
 */
export interface S3SecureBucketProps extends s3.BucketProps {

  /**
   * Selects encryption defaults and optional resource-policy statements.
   *
   * @default {@link S3SecureBucketType.DEFAULT_BUCKET}
   */
  readonly bucketType?: S3SecureBucketType;
}

/**
 * S3 bucket with opinionated secure defaults: private ACLs, block public access, TLS-only access,
 * and encryption (S3-managed for log/origin types; KMS-managed by default otherwise).
 *
 * @remarks
 * - {@link S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET}: may attach a deploy-role policy when a non-default bootstrap qualifier is present.
 * - {@link S3SecureBucketType.ACCESS_LOG_BUCKET}: adds log-writer principals; see {@link S3SecureBucketType.ACCESS_LOG_BUCKET} and {@link S3SecureBucket#accessLogBucketPolicyDependable}.
 */
export class S3SecureBucket extends s3.Bucket {
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
   * @param props - Optional {@link s3.BucketProps} plus {@link S3SecureBucketProps.bucketType} and `eventBridgeEnabled` (applied via L1 override when true).
   */
  constructor(scope: Construct, id: string, props?: S3SecureBucketProps) {
    const bucketType = props?.bucketType || S3SecureBucketType.DEFAULT_BUCKET;
    super(scope, id, {
      ...props,
      removalPolicy: RemovalPolicy.RETAIN,
      encryption: (() => {
        if (bucketType === S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET || bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET) {
          return s3.BucketEncryption.S3_MANAGED;
        }
        return props?.encryption || s3.BucketEncryption.KMS_MANAGED;
      })(),
      accessControl: (() => {
        if (!props?.accessControl) {
          return s3.BucketAccessControl.PRIVATE;
        }
        return props.accessControl;
      })(),
      eventBridgeEnabled: undefined,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: props?.versioned !== undefined ? props.versioned : true,
      objectOwnership: (() => {
        if (props?.objectOwnership) {
          return props.objectOwnership;
        }
        return s3.ObjectOwnership.BUCKET_OWNER_ENFORCED;
      })(),
    });

    const cfnBucket = this.node.defaultChild as s3.CfnBucket;
    if (props?.eventBridgeEnabled === true) {
      cfnBucket.addPropertyOverride('NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled', true);
    }

    const account = Stack.of(this).account;
    const region = Stack.of(this).region;

    if (bucketType === S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET) {

      const qualifier = Stack.of(this).synthesizer.bootstrapQualifier;

      if (qualifier && (qualifier != DefaultStackSynthesizer.DEFAULT_QUALIFIER)) {
        this.addToResourcePolicy(new iam.PolicyStatement({
          actions: [
            's3:*',
          ],
          resources: [
            `${this.bucketArn}`,
            `${this.bucketArn}/*`,
          ],
          principals: [
            new iam.ArnPrincipal(`arn:aws:iam::${account}:role/cdk-${qualifier}-deploy-role-${account}-${region}`),
          ],
        }));
      }
    }

    if (bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET) {
      const awsLogsPrefixResource = `${this.bucketArn}/AWSLogs/${account}/*`;

      // Allow ALB / NLB log delivery (modern service principal path; also required in opt-in regions).
      const albLogDeliveryPolicyResult = this.addToResourcePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
        ],
        actions: [
          's3:PutObject',
        ],
        resources: [
          awsLogsPrefixResource,
        ],
      }));

      // In non–opt-in regions (for example ap-northeast-1), access logs are often delivered using the
      // regional ELBv2 account (root of that account) for s3:PutObject, not only the service principal above.
      const stack = Stack.of(this);
      const elbAccountId = Token.isUnresolved(stack.region)
        ? stack.regionalFact(FactName.ELBV2_ACCOUNT)
        : RegionInfo.get(stack.region).elbv2Account;
      if (elbAccountId) {
        this.addToResourcePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [
            new iam.AccountPrincipal(elbAccountId),
          ],
          actions: [
            's3:PutObject',
          ],
          resources: [
            awsLogsPrefixResource,
          ],
        }));
      }

      this.accessLogBucketPolicyDependable = albLogDeliveryPolicyResult.policyDependable ?? this;

      // Allow CloudFront standard logging (v2) to write logs
      this.addToResourcePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('delivery.logs.amazonaws.com'),
        ],
        actions: [
          's3:PutObject',
        ],
        resources: [
          awsLogsPrefixResource,
        ],
      }));

      // Allow S3 server access logging to write logs when required by configuration
      this.addToResourcePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('logging.s3.amazonaws.com'),
        ],
        actions: [
          's3:PutObject',
        ],
        resources: [
          awsLogsPrefixResource,
        ],
      }));
    }
  }
}
