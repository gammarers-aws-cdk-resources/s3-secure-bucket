import { DefaultStackSynthesizer } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BucketPolicyContext } from './types';

/**
 * Grants the CDK deploy role full S3 access when a non-default bootstrap qualifier is in use.
 *
 * No policy is added when the stack uses the default bootstrap qualifier
 * ({@link DefaultStackSynthesizer.DEFAULT_QUALIFIER}).
 *
 * @param context - Bucket and owning stack (account, region, and synthesizer qualifier).
 */
export const applyDeploymentPipelineArtifactPolicy = ({
  bucket,
  stack,
}: BucketPolicyContext): void => {
  const qualifier = stack.synthesizer.bootstrapQualifier;

  if (!qualifier || qualifier === DefaultStackSynthesizer.DEFAULT_QUALIFIER) {
    return;
  }

  const { account, region } = stack;

  bucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: [
      's3:*',
    ],
    resources: [
      `${bucket.bucketArn}`,
      `${bucket.bucketArn}/*`,
    ],
    principals: [
      new iam.ArnPrincipal(`arn:aws:iam::${account}:role/cdk-${qualifier}-deploy-role-${account}-${region}`),
    ],
  }));
};
