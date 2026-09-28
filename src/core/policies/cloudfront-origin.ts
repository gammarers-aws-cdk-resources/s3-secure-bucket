import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

const CLOUDFRONT_SERVICE_PRINCIPAL = 'cloudfront.amazonaws.com';

/**
 * Allows one CloudFront distribution to read objects through origin access control.
 *
 * Grants `s3:GetObject` to `cloudfront.amazonaws.com` when `AWS:SourceArn` equals
 * {@link cloudfront.IDistribution.distributionArn}. The origin access control ID belongs
 * on the distribution origin, not in this statement.
 *
 * `S3BucketOrigin.withOriginAccessControl` adds this same statement. Call this only when
 * that helper cannot update the bucket policy.
 *
 * @param bucket - Origin bucket that receives the statement.
 * @param distribution - Distribution allowed to call `s3:GetObject`.
 */
export const grantCloudFrontOriginRead = (
  bucket: s3.Bucket,
  distribution: cloudfront.IDistribution,
): void => {
  // SourceArn keeps the service principal limited to this distribution.
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal(CLOUDFRONT_SERVICE_PRINCIPAL),
    ],
    actions: [
      's3:GetObject',
    ],
    resources: [
      bucket.arnForObjects('*'),
    ],
    conditions: {
      StringEquals: {
        'AWS:SourceArn': distribution.distributionArn,
      },
    },
  }));
};
