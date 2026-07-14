/**
 * Dispatches bucket-type-specific S3 resource policy statements.
 *
 * @packageDocumentation
 */
import { S3SecureBucketType } from '../bucket-types';
import { applyAccessLogBucketPolicy } from './access-log-bucket-policy';
import { applyCloudWatchLogArchivePolicy } from './cloud-watch-log-archive-policy';
import { applyDeploymentPipelineArtifactPolicy } from './deployment-pipeline-artifact-policy';
import { BucketPolicyApplyResult, BucketPolicyContext } from './types';

/**
 * Applies resource policies for the given bucket type, if any.
 *
 * Types without dedicated policies ({@link S3SecureBucketType.DEFAULT_BUCKET},
 * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}) are no-ops and return an empty result.
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
