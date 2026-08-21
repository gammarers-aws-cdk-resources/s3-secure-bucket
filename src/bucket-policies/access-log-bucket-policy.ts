import { Token } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { FactName, RegionInfo } from 'aws-cdk-lib/region-info';
import { resolveAccessLogDelivery } from './resolve-access-log-delivery';
import { BucketPolicyApplyResult, BucketPolicyContext } from './types';

const ELB_SOURCE_ARN = 'arn:aws:elasticloadbalancing:*:*:loadbalancer/*';

/**
 * Adds resource policies for ALB/NLB, CloudFront standard logging (v2), and S3 server access logging.
 *
 * Grants `s3:PutObject` on `AWSLogs/...` prefixes to:
 * - `logdelivery.elasticloadbalancing.amazonaws.com`
 * - The regional ELBv2 log-delivery account (when known)
 * - `delivery.logs.amazonaws.com`
 * - `logging.s3.amazonaws.com`
 *
 * Prefixes default to `AWSLogs/<stack.account>/*`. {@link BucketPolicyContext.accessLogDelivery}
 * can widen this to an explicit account list or to `AWSLogs/*` constrained by `aws:SourceOrgID`.
 *
 * @param context - Bucket, owning stack, and optional delivery scope.
 * @returns A result containing {@link BucketPolicyApplyResult.accessLogBucketPolicyDependable} for the
 * first (ELB) policy statement so load balancer log enablement can wait until the bucket policy exists.
 */
export const applyAccessLogBucketPolicy = ({
  bucket,
  stack,
  accessLogDelivery,
}: BucketPolicyContext): BucketPolicyApplyResult => {
  const { awsLogsResources, organizationId } = resolveAccessLogDelivery(
    bucket.bucketArn,
    stack.account,
    accessLogDelivery,
  );

  const organizationConditions = organizationId === undefined
    ? undefined
    : {
      StringEquals: {
        'aws:SourceOrgID': organizationId,
      },
    };

  const albOrganizationConditions = organizationId === undefined
    ? undefined
    : {
      StringEquals: {
        'aws:SourceOrgID': organizationId,
      },
      ArnLike: {
        'aws:SourceArn': ELB_SOURCE_ARN,
      },
    };

  // Allow ALB / NLB log delivery (modern service principal path; also required in opt-in regions).
  const albLogDeliveryPolicyResult = bucket.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com'),
    ],
    actions: [
      's3:PutObject',
    ],
    resources: awsLogsResources,
    conditions: albOrganizationConditions,
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
      resources: awsLogsResources,
      // The ELBv2 delivery account is not an organization member; do not attach aws:SourceOrgID.
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
    resources: awsLogsResources,
    conditions: organizationConditions,
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
    resources: awsLogsResources,
    conditions: organizationConditions,
  }));

  return {
    accessLogBucketPolicyDependable: albLogDeliveryPolicyResult.policyDependable ?? bucket,
  };
};
