import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RegionInfo } from 'aws-cdk-lib/region-info';
import { S3SecureBucket, S3SecureBucketType } from '../src';

const awsLogsPrefixMatcher = (bucketLogicalIdFragment: string, accountId: string): Match => {
  return Match.objectLike({
    'Fn::Join': [
      '',
      Match.arrayWith([
        Match.objectLike({
          'Fn::GetAtt': [
            Match.stringLikeRegexp(bucketLogicalIdFragment),
            'Arn',
          ],
        }),
        `/AWSLogs/${accountId}/*`,
      ]),
    ],
  });
};

describe('S3SecureBucket bucketType=ACCESS_LOG_BUCKET (us-east-1)', () => {

  const app = new App();
  const stack = new Stack(app, 'TestingStack', {
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });

  const bucket = new S3SecureBucket(stack, 'S3SecureBucket', {
    bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
  });

  it('Is Bucket', () => {
    expect(bucket).toBeInstanceOf(s3.Bucket);
  });

  it('exposes accessLogBucketPolicyDependable for ALB DependsOn wiring', () => {
    expect(bucket.accessLogBucketPolicyDependable).toBeDefined();
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

  it('Should allow log delivery put to AWSLogs/account prefix including ELBv2 regional account for stack region', () => {
    const resourceForAccountPrefix = awsLogsPrefixMatcher('S3SecureBucket', '123456789012');
    const expectedElbv2Account = RegionInfo.get('us-east-1').elbv2Account;
    if (expectedElbv2Account === undefined) {
      throw new Error('Expected RegionInfo ELBv2 account for us-east-1');
    }
    expect(expectedElbv2Account).toBe('127311923021');

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logdelivery.elasticloadbalancing.amazonaws.com' },
            Resource: resourceForAccountPrefix,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: {
              AWS: {
                'Fn::Join': [
                  '',
                  Match.arrayWith([
                    Match.stringLikeRegexp(expectedElbv2Account),
                  ]),
                ],
              },
            },
            Resource: resourceForAccountPrefix,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'delivery.logs.amazonaws.com' },
            Resource: resourceForAccountPrefix,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logging.s3.amazonaws.com' },
            Resource: resourceForAccountPrefix,
          }),
        ]),
      }),
    });
  });

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('throws when stack region is a token', () => {
    const tokenRegionApp = new App();
    const tokenRegionStack = new Stack(tokenRegionApp, 'UnresolvedRegionStack');
    expect(() => {
      new S3SecureBucket(tokenRegionStack, 'LogBucket', {
        bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      });
    }).toThrow(/ELBv2 log delivery account/);
  });
});

describe('S3SecureBucket bucketType=ACCESS_LOG_BUCKET (ap-northeast-1)', () => {
  it('resolves ELBv2 log delivery account from stack region (Tokyo)', () => {
    const app = new App();
    const stack = new Stack(app, 'TokyoLogStack', {
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
    });
    const template = Template.fromStack(stack);
    const expectedElbv2Account = RegionInfo.get('ap-northeast-1').elbv2Account;
    if (expectedElbv2Account === undefined) {
      throw new Error('Expected RegionInfo ELBv2 account for ap-northeast-1');
    }
    expect(expectedElbv2Account).toBe('582318560864');

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: {
              AWS: {
                'Fn::Join': [
                  '',
                  Match.arrayWith([
                    Match.stringLikeRegexp(expectedElbv2Account),
                  ]),
                ],
              },
            },
            Resource: awsLogsPrefixMatcher('AccessLogBucket', '123456789012'),
          }),
        ]),
      }),
    });
  });
});

