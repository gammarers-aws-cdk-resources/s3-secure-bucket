import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucketType } from './bucket-type';

/**
 * Resolves bucket encryption for a given {@link S3SecureBucketType}.
 *
 * {@link S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET}, {@link S3SecureBucketType.ACCESS_LOG_BUCKET},
 * and {@link S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET} always use S3-managed encryption.
 * All other types use `propsEncryption` when provided, otherwise KMS-managed encryption.
 *
 * @param bucketType - Preset that determines the default encryption mode.
 * @param propsEncryption - Optional caller override from {@link s3.BucketProps.encryption}.
 * @returns The encryption mode to pass to {@link s3.Bucket}.
 */
export const resolveEncryptionDefault = (
  bucketType: S3SecureBucketType,
  propsEncryption?: s3.BucketEncryption,
): s3.BucketEncryption => {
  if (
    bucketType === S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET
    || bucketType === S3SecureBucketType.ACCESS_LOG_BUCKET
    || bucketType === S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET
  ) {
    return s3.BucketEncryption.S3_MANAGED;
  }
  return propsEncryption ?? s3.BucketEncryption.KMS_MANAGED;
};
