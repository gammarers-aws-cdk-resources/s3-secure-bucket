import * as s3 from 'aws-cdk-lib/aws-s3';
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
}
