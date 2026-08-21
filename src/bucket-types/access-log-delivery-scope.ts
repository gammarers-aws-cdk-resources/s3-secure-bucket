/**
 * Account scope for {@link S3SecureBucketType.ACCESS_LOG_BUCKET} resource policies.
 *
 * Specify **exactly one** of {@link AccessLogDeliveryScope.allowedSourceAccountIds} or
 * {@link AccessLogDeliveryScope.organizationId}. Omit {@link S3SecureBucketProps.accessLogDelivery}
 * to allow only the stack account (default).
 *
 * jsii does not support a discriminated union of structs, so exclusivity is enforced at construct time.
 */
export interface AccessLogDeliveryScope {
  /**
   * Account IDs allowed to write under `AWSLogs/<accountId>/*`.
   *
   * The list is used as specified; include the stack account if that account should also deliver logs.
   * Duplicate IDs are ignored. Mutually exclusive with {@link AccessLogDeliveryScope.organizationId}.
   *
   * @default undefined (do not use an explicit account list)
   */
  readonly allowedSourceAccountIds?: string[];

  /**
   * AWS Organizations ID (`o-` followed by 10–32 lowercase letters or digits).
   *
   * Allows log delivery from accounts in the organization via `aws:SourceOrgID`,
   * with resource `AWSLogs/*`. Mutually exclusive with {@link AccessLogDeliveryScope.allowedSourceAccountIds}.
   *
   * @default undefined (do not use an organization-wide policy)
   */
  readonly organizationId?: string;
}

/**
 * Returns whether `scope` sets {@link AccessLogDeliveryScope.allowedSourceAccountIds}.
 *
 * @param scope - Caller-supplied delivery scope.
 * @returns `true` when the account-list field is present.
 */
export const hasAllowedSourceAccountIds = (scope: AccessLogDeliveryScope): boolean => {
  return scope.allowedSourceAccountIds !== undefined;
};

/**
 * Returns whether `scope` sets {@link AccessLogDeliveryScope.organizationId}.
 *
 * @param scope - Caller-supplied delivery scope.
 * @returns `true` when the organization field is present.
 */
export const hasOrganizationId = (scope: AccessLogDeliveryScope): boolean => {
  return scope.organizationId !== undefined;
};

/**
 * Returns whether `scope` sets exactly one of the mutually exclusive delivery fields.
 *
 * @param scope - Caller-supplied delivery scope.
 * @returns `true` when exactly one of the two fields is present.
 */
export const isExclusiveAccessLogDeliveryScope = (scope: AccessLogDeliveryScope): boolean => {
  return hasAllowedSourceAccountIds(scope) !== hasOrganizationId(scope);
};

/**
 * Returns whether `value` is a 12-digit AWS account ID.
 *
 * @param value - Candidate account ID.
 * @returns `true` when `value` matches `^[0-9]{12}$`.
 */
export const isAwsAccountId = (value: string): boolean => {
  return /^\d{12}$/.test(value);
};

/**
 * Returns whether `value` is an AWS Organizations ID.
 *
 * @param value - Candidate organization ID.
 * @returns `true` when `value` matches `^o-[a-z0-9]{10,32}$`.
 */
export const isAwsOrganizationId = (value: string): boolean => {
  return /^o-[a-z0-9]{10,32}$/.test(value);
};
