import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3SecureBucket, S3SecureBucketType } from '../src';

const DISTRIBUTION_ID = 'EDFDVBD6EXAMPLE';
const DISTRIBUTION_DOMAIN_NAME = 'd111111abcdef8.cloudfront.net';

describe('S3SecureBucket.grantCloudFrontRead', () => {
  const createDistribution = (stack: Stack): cloudfront.IDistribution => {
    return cloudfront.Distribution.fromDistributionAttributes(stack, 'Distribution', {
      distributionId: DISTRIBUTION_ID,
      domainName: DISTRIBUTION_DOMAIN_NAME,
    });
  };

  it('allows s3:GetObject from the distribution', () => {
    const app = new App();
    const stack = new Stack(app, 'TestingStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const bucket = new S3SecureBucket(stack, 'OriginBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET,
    });

    bucket.grantCloudFrontRead(createDistribution(stack));

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Resource: {
              'Fn::Join': [
                '',
                [
                  Match.anyValue(),
                  '/*',
                ],
              ],
            },
            Condition: {
              StringEquals: {
                'AWS:SourceArn': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { Ref: 'AWS::Partition' },
                      `:cloudfront::123456789012:distribution/${DISTRIBUTION_ID}`,
                    ],
                  ],
                },
              },
            },
          }),
        ]),
      },
    });
  });

  it('rejects buckets that are not CloudFront origins', () => {
    const app = new App();
    const stack = new Stack(app, 'TestingStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const bucket = new S3SecureBucket(stack, 'Bucket');

    expect(() => {
      bucket.grantCloudFrontRead(createDistribution(stack));
    }).toThrow('grantCloudFrontRead is only supported when bucketType is CLOUDFRONT_ORIGIN_BUCKET');
  });
});
