import { App, Aws, Stack, Token } from 'aws-cdk-lib';
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

  it('resolves ELBv2 log delivery account at deploy time when stack region is a token', () => {
    const tokenRegionApp = new App();
    const tokenRegionStack = new Stack(tokenRegionApp, 'UnresolvedRegionStack');
    new S3SecureBucket(tokenRegionStack, 'LogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
    });
    const tokenRegionTemplate = Template.fromStack(tokenRegionStack);
    const expectedElbv2Account = RegionInfo.get('us-east-1').elbv2Account;
    if (expectedElbv2Account === undefined) {
      throw new Error('Expected RegionInfo ELBv2 account for us-east-1');
    }

    tokenRegionTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
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
                    {
                      'Fn::FindInMap': [
                        'Elbv2AccountMap',
                        { Ref: 'AWS::Region' },
                        'value',
                      ],
                    },
                  ]),
                ],
              },
            },
            Resource: {
              'Fn::Join': [
                '',
                Match.arrayWith([
                  Match.objectLike({
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('LogBucket'),
                      'Arn',
                    ],
                  }),
                  '/AWSLogs/',
                  { Ref: 'AWS::AccountId' },
                  '/*',
                ]),
              ],
            },
          }),
        ]),
      }),
    });
    tokenRegionTemplate.hasMapping('Elbv2AccountMap', Match.objectLike({
      'us-east-1': { value: expectedElbv2Account },
    }));
  });
});

describe('S3SecureBucket bucketType=ACCESS_LOG_BUCKET accessLogDelivery', () => {
  it('allows an explicit source account list on AWSLogs prefixes', () => {
    const app = new App();
    const stack = new Stack(app, 'AccountListLogStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        // Duplicates are ignored; stack account is not added unless listed.
        allowedSourceAccountIds: ['111111111111', '222222222222', '111111111111'],
      },
    });
    const template = Template.fromStack(stack);
    const resources = [
      awsLogsPrefixMatcher('AccessLogBucket', '111111111111'),
      awsLogsPrefixMatcher('AccessLogBucket', '222222222222'),
    ];

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logdelivery.elasticloadbalancing.amazonaws.com' },
            Resource: resources,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'delivery.logs.amazonaws.com' },
            Resource: resources,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logging.s3.amazonaws.com' },
            Resource: resources,
          }),
        ]),
      }),
    });
  });

  it('allows organization-wide delivery with aws:SourceOrgID on service principals', () => {
    const app = new App();
    const stack = new Stack(app, 'OrganizationLogStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        organizationId: 'o-abcdefghijklmnopqrst',
      },
    });
    const template = Template.fromStack(stack);
    const wildcardResource = Match.objectLike({
      'Fn::Join': [
        '',
        Match.arrayWith([
          Match.objectLike({
            'Fn::GetAtt': [
              Match.stringLikeRegexp('AccessLogBucket'),
              'Arn',
            ],
          }),
          '/AWSLogs/*',
        ]),
      ],
    });
    const organizationCondition = {
      StringEquals: {
        'aws:SourceOrgID': 'o-abcdefghijklmnopqrst',
      },
    };
    const expectedElbv2Account = RegionInfo.get('us-east-1').elbv2Account;
    if (expectedElbv2Account === undefined) {
      throw new Error('Expected RegionInfo ELBv2 account for us-east-1');
    }

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logdelivery.elasticloadbalancing.amazonaws.com' },
            Resource: wildcardResource,
            Condition: {
              StringEquals: {
                'aws:SourceOrgID': 'o-abcdefghijklmnopqrst',
              },
              ArnLike: {
                'aws:SourceArn': 'arn:aws:elasticloadbalancing:*:*:loadbalancer/*',
              },
            },
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
            Resource: wildcardResource,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'delivery.logs.amazonaws.com' },
            Resource: wildcardResource,
            Condition: organizationCondition,
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:PutObject',
            Principal: { Service: 'logging.s3.amazonaws.com' },
            Resource: wildcardResource,
            Condition: organizationCondition,
          }),
        ]),
      }),
    });
  });

  it('throws when accessLogDelivery is set on a non-access-log bucket type', () => {
    const app = new App();
    const stack = new Stack(app, 'InvalidTypeStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'DefaultBucket', {
      accessLogDelivery: {
        organizationId: 'o-abcdefghijklmnopqrst',
      },
    })).toThrow('accessLogDelivery is only supported when bucketType is ACCESS_LOG_BUCKET');
  });

  it.each([
    {
      name: 'neither field',
      accessLogDelivery: {},
    },
    {
      name: 'both fields',
      accessLogDelivery: {
        allowedSourceAccountIds: ['111111111111'],
        organizationId: 'o-abcdefghijklmnopqrst',
      },
    },
  ])('throws when accessLogDelivery specifies $name', ({ accessLogDelivery }) => {
    const app = new App();
    const stack = new Stack(app, 'ExclusiveFieldsStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery,
    })).toThrow('accessLogDelivery must specify exactly one of allowedSourceAccountIds or organizationId');
  });

  it('throws when allowedSourceAccountIds is empty', () => {
    const app = new App();
    const stack = new Stack(app, 'EmptyAccountListStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        allowedSourceAccountIds: [],
      },
    })).toThrow('allowedSourceAccountIds must contain at least one account ID');
  });

  it('throws when an account ID is invalid', () => {
    const app = new App();
    const stack = new Stack(app, 'InvalidAccountStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        allowedSourceAccountIds: ['not-an-account'],
      },
    })).toThrow('allowedSourceAccountIds contains an invalid AWS account ID: not-an-account');
  });

  it('throws when organizationId is invalid', () => {
    const app = new App();
    const stack = new Stack(app, 'InvalidOrgStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        organizationId: 'not-an-org',
      },
    })).toThrow('organizationId must be an AWS Organizations ID (o-...), got: not-an-org');
  });

  it('skips account ID format checks for unresolved tokens', () => {
    const app = new App();
    const stack = new Stack(app, 'TokenAccountStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        allowedSourceAccountIds: [Aws.ACCOUNT_ID],
      },
    })).not.toThrow();
  });

  it('skips organization ID format checks for unresolved tokens', () => {
    const app = new App();
    const stack = new Stack(app, 'TokenOrgStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(() => new S3SecureBucket(stack, 'AccessLogBucket', {
      bucketType: S3SecureBucketType.ACCESS_LOG_BUCKET,
      accessLogDelivery: {
        organizationId: Token.asString({ Ref: 'OrganizationId' }),
      },
    })).not.toThrow();
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

