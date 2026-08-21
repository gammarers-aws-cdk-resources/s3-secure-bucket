import { Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { IDependable } from 'constructs';
import type { AccessLogDeliveryScope } from '../bucket-types';

/**
 * Inputs shared by bucket-type resource policy appliers.
 */
export interface BucketPolicyContext {
  /** The bucket to attach resource policies to. */
  readonly bucket: s3.Bucket;
  /** Stack that owns the bucket; used for account, region, and synthesizer metadata. */
  readonly stack: Stack;
  /**
   * Optional writer scope for {@link S3SecureBucketType.ACCESS_LOG_BUCKET}.
   * Ignored by other bucket types.
   */
  readonly accessLogDelivery?: AccessLogDeliveryScope;
}

/**
 * Optional side effects returned after applying type-specific bucket policies.
 */
export interface BucketPolicyApplyResult {
  /**
   * Set when {@link S3SecureBucketType.ACCESS_LOG_BUCKET} policies are applied.
   * Depend on this before enabling ALB/NLB access logging.
   */
  readonly accessLogBucketPolicyDependable?: IDependable;
}
