import { Token } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { FactName, RegionInfo } from 'aws-cdk-lib/region-info';
import { IDependable } from 'constructs';
import { BucketPolicyContext } from './types';

/**
 * Adds resource policies for ALB/NLB, CloudFront standard logging (v2), and S3 server access logging.
 *
 * Grants `s3:PutObject` on `AWSLogs/<stack.account>/*` to:
 * - `logdelivery.elasticloadbalancing.amazonaws.com`
 * - The regional ELBv2 log-delivery account (when known)
 * - `delivery.logs.amazonaws.com`
 * - `logging.s3.amazonaws.com`
 *
 * @param context - Bucket and owning stack (account and region are read from `stack`).
 * @returns A dependency target for the first (ELB) policy statement so load balancer log enablement
 * can wait until the bucket policy exists.
 */
export const applyAccessLogBucketPolicy = ({
  bucket,
  stack,
}: BucketPolicyContext): IDependable => {
  const awsLogsPrefixResource = `${bucket.bucketArn}/AWSLogs/${stack.account}/*`;

  // Allow ALB / NLB log delivery (modern service principal path; also required in opt-in regions).
  const albLogDeliveryPolicyResult = bucket.addToResourcePolicy(new iam.PolicyStatement({
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
  const elbAccountId = Token.isUnresolved(stack.region)
    ? stack.regionalFact(FactName.ELBV2_ACCOUNT)
    : RegionInfo.get(stack.region).elbv2Account;
  if (elbAccountId) {
    bucket.addToResourcePolicy(new iam.PolicyStatement({
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

  // Allow CloudFront standard logging (v2) to write logs
  bucket.addToResourcePolicy(new iam.PolicyStatement({
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
  bucket.addToResourcePolicy(new iam.PolicyStatement({
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

  return albLogDeliveryPolicyResult.policyDependable ?? bucket;
};
