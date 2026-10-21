import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType } from '../src';

describe('S3SecureBucket bucketType=CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET Testing', () => {
  const app = new App();
  const stack = new Stack(app, 'TestingStack', {
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });

  const bucket = new S3SecureBucket(stack, 'S3SecureBucket', {
    bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
  });

  it('Is Bucket', () => {
    expect(bucket).toBeInstanceOf(s3.Bucket);
  });

  it('does not expose accessLogBucketPolicyDependable', () => {
    expect(bucket.accessLogBucketPolicyDependable).toBeUndefined();
  });

  const template = Template.fromStack(stack);

  it('Should have encryption (S3 managed / AES256)', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectEquals({
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      }),
    });
  });

  it('Should use LogDeliveryWrite access control', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      AccessControl: 'LogDeliveryWrite',
    });
  });

  it('Should use ObjectWriter ownership', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      OwnershipControls: Match.objectEquals({
        Rules: [
          {
            ObjectOwnership: 'ObjectWriter',
          },
        ],
      }),
    });
  });

  it('Should block public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectEquals({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }),
    });
  });

  it('Should versioning enabled by default', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: Match.objectEquals({
        Status: 'Enabled',
      }),
    });
  });

  it('Should enforce SSL only (no access-log PutObject policies)', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: Match.arrayEquals([
          Match.objectLike({
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
            Effect: 'Deny',
            Principal: {
              AWS: '*',
            },
          }),
        ]),
      },
    });
  });

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});

describe('S3SecureBucket bucketType=CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET overrides', () => {
  it('ignores encryption override and keeps S3 managed', () => {
    const stack = new Stack(new App(), 'TestingStack');
    new S3SecureBucket(stack, 'S3SecureBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
      encryption: s3.BucketEncryption.KMS_MANAGED,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectEquals({
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      }),
    });
  });

  it('respects versioned: false', () => {
    const stack = new Stack(new App(), 'TestingStack');
    new S3SecureBucket(stack, 'S3SecureBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
      versioned: false,
    });

    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::S3::Bucket');
    for (const resource of Object.values(resources)) {
      expect(resource.Properties?.VersioningConfiguration).toBeUndefined();
    }
  });

  it('allows the required accessControl and objectOwnership values', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      new S3SecureBucket(stack, 'S3SecureBucket', {
        bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
        accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      });
    }).not.toThrow();
  });

  it('rejects a different accessControl value', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      new S3SecureBucket(stack, 'S3SecureBucket', {
        bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
        accessControl: s3.BucketAccessControl.PRIVATE,
      });
    }).toThrow(
      'CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET requires accessControl LOG_DELIVERY_WRITE and objectOwnership OBJECT_WRITER for legacy CloudFront access logging',
    );
  });

  it('rejects a different objectOwnership value', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      new S3SecureBucket(stack, 'S3SecureBucket', {
        bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      });
    }).toThrow(
      'CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET requires accessControl LOG_DELIVERY_WRITE and objectOwnership OBJECT_WRITER for legacy CloudFront access logging',
    );
  });

  it('rejects grantCloudFrontRead', () => {
    const stack = new Stack(new App(), 'TestingStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const bucket = new S3SecureBucket(stack, 'S3SecureBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
    });
    const distribution = cloudfront.Distribution.fromDistributionAttributes(stack, 'Distribution', {
      distributionId: 'EDFDVBD6EXAMPLE',
      domainName: 'd111111abcdef8.cloudfront.net',
    });

    expect(() => {
      bucket.grantCloudFrontRead(distribution);
    }).toThrow('grantCloudFrontRead is only supported when bucketType is CLOUDFRONT_ORIGIN_BUCKET');
  });

  it('rejects accessLogDelivery', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      new S3SecureBucket(stack, 'S3SecureBucket', {
        bucketType: S3SecureBucketType.CLOUDFRONT_LEGACY_ACCESS_LOG_BUCKET,
        accessLogDelivery: {
          allowedSourceAccountIds: ['111111111111'],
        },
      });
    }).toThrow('accessLogDelivery is only supported when bucketType is ACCESS_LOG_BUCKET');
  });
});
