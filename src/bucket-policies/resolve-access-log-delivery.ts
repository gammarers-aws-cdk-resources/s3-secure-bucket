import { Token } from 'aws-cdk-lib';
import {
  AccessLogDeliveryScope,
  isAwsAccountId,
  isAwsOrganizationId,
} from '../bucket-types/access-log-delivery-scope';

/**
 * Resolved `AWSLogs` resource ARNs and optional organization condition value.
 */
export interface ResolvedAccessLogDelivery {
  /**
   * Bucket object ARNs granted `s3:PutObject` for log writers.
   */
  readonly awsLogsResources: string[];
  /**
   * Set when delivery is scoped to an AWS Organization (`aws:SourceOrgID`).
   */
  readonly organizationId?: string;
}

const EXCLUSIVE_FIELDS_ERROR =
  'accessLogDelivery must specify exactly one of allowedSourceAccountIds or organizationId';

const assertAccountId = (accountId: string): void => {
  if (Token.isUnresolved(accountId)) {
    return;
  }
  if (isAwsAccountId(accountId)) {
    return;
  }
  throw new Error(`allowedSourceAccountIds contains an invalid AWS account ID: ${accountId}`);
};

const resolveOrganizationDelivery = (
  bucketArn: string,
  organizationId: string,
): ResolvedAccessLogDelivery => {
  if (!Token.isUnresolved(organizationId) && !isAwsOrganizationId(organizationId)) {
    throw new Error(`organizationId must be an AWS Organizations ID (o-...), got: ${organizationId}`);
  }
  return {
    awsLogsResources: [`${bucketArn}/AWSLogs/*`],
    organizationId,
  };
};

const resolveAccountListDelivery = (
  bucketArn: string,
  accountIds: readonly string[],
): ResolvedAccessLogDelivery => {
  if (accountIds.length === 0) {
    throw new Error('allowedSourceAccountIds must contain at least one account ID');
  }
  const uniqueAccountIds = [...new Set(accountIds)];
  for (const accountId of uniqueAccountIds) {
    assertAccountId(accountId);
  }
  return {
    awsLogsResources: uniqueAccountIds.map((accountId) => `${bucketArn}/AWSLogs/${accountId}/*`),
  };
};

/**
 * Resolves `AWSLogs` resource ARNs (and organization ID when used) for an access-log bucket policy.
 *
 * @param bucketArn - Destination bucket ARN.
 * @param stackAccount - Owning stack account; used when `scope` is omitted.
 * @param scope - Optional exclusive account-list or organization scope.
 * @returns Resource ARNs and optional `organizationId` for policy conditions.
 * @throws If `scope` sets both fields, neither field, an empty account list, or invalid IDs.
 */
export const resolveAccessLogDelivery = (
  bucketArn: string,
  stackAccount: string,
  scope?: AccessLogDeliveryScope,
): ResolvedAccessLogDelivery => {
  if (scope === undefined) {
    return {
      awsLogsResources: [`${bucketArn}/AWSLogs/${stackAccount}/*`],
    };
  }

  const { allowedSourceAccountIds, organizationId } = scope;
  if (organizationId !== undefined) {
    if (allowedSourceAccountIds !== undefined) {
      throw new Error(EXCLUSIVE_FIELDS_ERROR);
    }
    return resolveOrganizationDelivery(bucketArn, organizationId);
  }
  if (allowedSourceAccountIds !== undefined) {
    return resolveAccountListDelivery(bucketArn, allowedSourceAccountIds);
  }
  throw new Error(EXCLUSIVE_FIELDS_ERROR);
};
