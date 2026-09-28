/**
 * Dispatches bucket-type-specific S3 resource policy statements.
 *
 * @packageDocumentation
 */
import { S3SecureBucketType } from '../bucket-type';
import { applyAccessLogBucketPolicy } from './access-log';
import { applyCloudWatchLogArchivePolicy } from './cloud-watch-log-archive';
import { applyDeploymentPipelineArtifactPolicy } from './deployment-pipeline-artifact';
import { BucketPolicyApplyResult, BucketPolicyContext } from './types';

/**
 * Applies resource policies for the given bucket type, if any.
 *
 * Types without a policy at construction ({@link S3SecureBucketType.DEFAULT_BUCKET},
 * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}) return an empty result.
 * CloudFront read access is added later with `S3SecureBucket.grantCloudFrontRead`
 * only when the distribution cannot update the bucket policy.
 *
 * @param bucketType - Preset that selects which policy applier runs.
 * @param context - Bucket and owning stack.
 * @returns Side effects such as {@link BucketPolicyApplyResult.accessLogBucketPolicyDependable}.
 */
export const applyBucketPolicies = (
  bucketType: S3SecureBucketType,
  context: BucketPolicyContext,
): BucketPolicyApplyResult => {
  if (bucketType === S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET) {
    return applyDeploymentPipelineArtifactPolicy(context);
  }

  if (bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET) {
    return applyAccessLogBucketPolicy(context);
  }

  if (bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET) {
    return applyCloudWatchLogArchivePolicy(context);
  }

  return {};
};
