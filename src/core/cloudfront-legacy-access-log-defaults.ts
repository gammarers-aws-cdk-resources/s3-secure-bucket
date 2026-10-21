import * as s3 from 'aws-cdk-lib/aws-s3';

const REQUIRED_ACCESS_CONTROL = s3.BucketAccessControl.LOG_DELIVERY_WRITE;
const REQUIRED_OBJECT_OWNERSHIP = s3.ObjectOwnership.OBJECT_WRITER;

const LEGACY_CLOUD_FRONT_LOG_ACL_ERROR =
  'CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET requires accessControl LOG_DELIVERY_WRITE and objectOwnership OBJECT_WRITER for legacy CloudFront access logging';

/**
 * Access-control defaults required for `CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET`.
 */
export interface CloudFrontLegacyAccessLogAclDefaults {
  readonly accessControl: s3.BucketAccessControl;
  readonly objectOwnership: s3.ObjectOwnership;
}

/**
 * Resolves ACL settings for CloudFront standard logging (legacy).
 *
 * Always returns {@link s3.BucketAccessControl.LOG_DELIVERY_WRITE} and
 * {@link s3.ObjectOwnership.OBJECT_WRITER}. Throws when the caller passes a different value.
 *
 * @param propsAccessControl - Optional override from {@link s3.BucketProps.accessControl}.
 * @param propsObjectOwnership - Optional override from {@link s3.BucketProps.objectOwnership}.
 * @returns Fixed ACL settings for legacy CloudFront log delivery.
 * @throws Error when either prop is set to a value other than the required defaults.
 */
export const resolveCloudFrontLegacyAccessLogAcl = (
  propsAccessControl?: s3.BucketAccessControl,
  propsObjectOwnership?: s3.ObjectOwnership,
): CloudFrontLegacyAccessLogAclDefaults => {
  if (propsAccessControl !== undefined && propsAccessControl !== REQUIRED_ACCESS_CONTROL) {
    throw new Error(LEGACY_CLOUD_FRONT_LOG_ACL_ERROR);
  }
  if (propsObjectOwnership !== undefined && propsObjectOwnership !== REQUIRED_OBJECT_OWNERSHIP) {
    throw new Error(LEGACY_CLOUD_FRONT_LOG_ACL_ERROR);
  }

  return {
    accessControl: REQUIRED_ACCESS_CONTROL,
    objectOwnership: REQUIRED_OBJECT_OWNERSHIP,
  };
};
