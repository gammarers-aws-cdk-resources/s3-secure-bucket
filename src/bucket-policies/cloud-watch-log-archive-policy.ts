import * as iam from 'aws-cdk-lib/aws-iam';
import { BucketPolicyContext } from './types';

/**
 * Adds resource policies for CloudWatch Logs export tasks in the stack account and region.
 *
 * Grants `logs.<region>.amazonaws.com`:
 * - `s3:GetBucketAcl` on the bucket
 * - `s3:PutObject` on bucket objects with `bucket-owner-full-control`
 *
 * Conditions restrict exports to log groups in the stack account and region.
 * For cross-account export, extend the bucket policy with additional source accounts and ARNs.
 *
 * @param context - Bucket and owning stack (account and region are read from `stack`).
 */
export const applyCloudWatchLogArchivePolicy = ({
  bucket,
  stack,
}: BucketPolicyContext): void => {
  const { account, region } = stack;
  const logsExportPrincipal = new iam.ServicePrincipal(`logs.${region}.amazonaws.com`);
  const sourceLogGroupArn = `arn:aws:logs:${region}:${account}:log-group:*`;

  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'AllowCloudWatchLogsExportGetBucketAcl',
    effect: iam.Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: ['s3:GetBucketAcl'],
    resources: [bucket.bucketArn],
    conditions: {
      StringEquals: {
        'aws:SourceAccount': [account],
      },
      ArnLike: {
        'aws:SourceArn': [sourceLogGroupArn],
      },
    },
  }));

  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'AllowCloudWatchLogsExportPutObject',
    effect: iam.Effect.ALLOW,
    principals: [logsExportPrincipal],
    actions: ['s3:PutObject'],
    resources: [`${bucket.bucketArn}/*`],
    conditions: {
      StringEquals: {
        's3:x-amz-acl': 'bucket-owner-full-control',
        'aws:SourceAccount': [account],
      },
      ArnLike: {
        'aws:SourceArn': [sourceLogGroupArn],
      },
    },
  }));
};
