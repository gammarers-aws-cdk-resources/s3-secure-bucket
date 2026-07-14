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
   */
  CLOUDFRONT_ORIGIN_BUCKET: 'CloudFrontOriginBucket',
  /**
   * General-purpose secure bucket (default qualifier / standard use).
   *
   * Uses KMS-managed encryption unless overridden in props. No type-specific resource policies.
   */
  DEFAULT_BUCKET: 'DefaultBucket',
  /**
   * Centralized access logs for producers such as ALB/NLB, CloudFront standard logging (v2),
   * and S3 server access logging. Grants `s3:PutObject` on `AWSLogs/<account>/*` only (no read/list).
   *
   * The regional ELBv2 log-delivery account ID (legacy path alongside the log delivery service principal)
   * is resolved from `aws-cdk-lib/region-info` at synthesis time when {@link Stack#region} is known,
   * or via a deploy-time mapping when it is a token.
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
