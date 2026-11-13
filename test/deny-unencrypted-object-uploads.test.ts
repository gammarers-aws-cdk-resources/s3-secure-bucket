import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType } from '../src';

const UNSUPPORTED_ERROR =
  'denyUnencryptedObjectUploads is not supported when bucketType is ACCESS_LOG_BUCKET, CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET, or CLOUD_WATCH_LOG_ARCHIVE_BUCKET';

const expectEncryptionHeaderDenies = (template: Template, sseHeader: string): void => {
  template.hasResourceProperties('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Sid: 'DenyIncorrectEncryptionHeader',
          Effect: 'Deny',
          Action: 's3:PutObject',
          Principal: { AWS: '*' },
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': sseHeader,
            },
          },
        }),
        Match.objectLike({
          Sid: 'DenyUnencryptedObjectUploads',
          Effect: 'Deny',
          Action: 's3:PutObject',
          Principal: { AWS: '*' },
          Condition: {
            Null: {
              's3:x-amz-server-side-encryption': 'true',
            },
          },
        }),
      ]),
    },
  });
};

describe('S3SecureBucket denyUnencryptedObjectUploads', () => {
  it('omits the encryption-header denies unless the prop is set', () => {
    const stack = new Stack(new App(), 'TestingStack');
    new S3SecureBucket(stack, 'Bucket', {
      denyUnencryptedObjectUploads: false,
    });

    expect(JSON.stringify(Template.fromStack(stack).toJSON())).not.toContain('s3:x-amz-server-side-encryption');
  });

  it.each([
    [undefined, 'aws:kms'],
    [s3.BucketEncryption.KMS_MANAGED, 'aws:kms'],
    [s3.BucketEncryption.KMS, 'aws:kms'],
    [s3.BucketEncryption.S3_MANAGED, 'AES256'],
    [s3.BucketEncryption.DSSE_MANAGED, 'aws:kms:dsse'],
    [s3.BucketEncryption.DSSE, 'aws:kms:dsse'],
  ] as const)('requires the %s header %s', (encryption, sseHeader) => {
    const stack = new Stack(new App(), 'TestingStack');
    new S3SecureBucket(stack, 'Bucket', {
      encryption,
      denyUnencryptedObjectUploads: true,
    });

    expectEncryptionHeaderDenies(Template.fromStack(stack), sseHeader);
  });

  it.each([
    S3SecureBucketType.ACCESS_LOG_BUCKET,
    S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
    S3SecureBucketType.CLOUD_WATCH_LOG_ARCHIVE_BUCKET,
  ])('rejects %s', (bucketType) => {
    const stack = new Stack(new App(), 'TestingStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(() => {
      new S3SecureBucket(stack, 'Bucket', {
        bucketType,
        denyUnencryptedObjectUploads: true,
      });
    }).toThrow(UNSUPPORTED_ERROR);
  });

  it('appends the denies to an external bucket policy and not to the bucket stack', () => {
    const app = new App();
    const storage = new Stack(app, 'Storage', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    const associate = new Stack(app, 'Associate', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    const bucket = new S3SecureBucket(storage, 'OriginBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
      denyUnencryptedObjectUploads: true,
    });
    const policy = new s3.BucketPolicy(associate, 'OriginBucketPolicy', { bucket });

    bucket.addOriginPolicy(policy, 'arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE');

    Template.fromStack(storage).resourceCountIs('AWS::S3::BucketPolicy', 0);
    expectEncryptionHeaderDenies(Template.fromStack(associate), 'AES256');
  });
});
