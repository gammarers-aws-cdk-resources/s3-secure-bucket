import * as s3 from 'aws-cdk-lib/aws-s3';
import { AccessLogDeliveryScope } from './access-log-delivery-scope';
import { S3SecureBucketType } from './bucket-type';

/**
 * Construction properties for {@link S3SecureBucket}.
 *
 * Extends {@link s3.BucketProps}. Several fields receive secure defaults inside the construct
 * and may be overridden unless documented otherwise on {@link S3SecureBucket}.
 */
export interface S3SecureBucketProps extends s3.BucketProps {

  /**
   * Selects encryption defaults and optional resource-policy statements.
   *
   * @default {@link S3SecureBucketType.DEFAULT_BUCKET}
   */
  readonly bucketType?: S3SecureBucketType;

  /**
   * Account or organization scope for {@link S3SecureBucketType.ACCESS_LOG_BUCKET} writers.
   *
   * Specify exactly one of {@link AccessLogDeliveryScope.allowedSourceAccountIds} or
   * {@link AccessLogDeliveryScope.organizationId}. When omitted, only the stack account
   * may deliver logs (`AWSLogs/<stack account>/*`).
   *
   * Supported only when {@link S3SecureBucketProps.bucketType} is
   * {@link S3SecureBucketType.ACCESS_LOG_BUCKET}.
   *
   * @default stack account only
   */
  readonly accessLogDelivery?: AccessLogDeliveryScope;
}
