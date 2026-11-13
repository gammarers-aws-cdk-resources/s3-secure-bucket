import { App, DefaultStackSynthesizer, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType } from '../src';

describe('S3SecureBucket bucketType=DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET Testing', () => {

  const customQualifier = 'custom9uo';

  const stack = new Stack(new App(), 'TestStack', {
    synthesizer: new DefaultStackSynthesizer({
      qualifier: customQualifier,
    }),
  });

  const bucket = new S3SecureBucket(stack, 'S3SecureBucket', {
    bucketName: 'example-secure-bucket',
    bucketType: S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET,
  });

  it('Is Bucket', () => {
    expect(bucket).toBeInstanceOf(s3.Bucket);
  });

  it('does not expose accessLogBucketPolicyDependable', () => {
    expect(bucket.accessLogBucketPolicyDependable).toBeUndefined();
  });

  const template = Template.fromStack(stack);

  it('Should have bucket policy for custom qualifier deploy role', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      Bucket: Match.objectEquals({
        Ref: Match.stringLikeRegexp('S3SecureBucket'),
      }),
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: Match.arrayWith([
          Match.objectEquals({
            Action: 's3:*',
            Effect: 'Allow',
            Principal: {
              AWS: {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:iam::',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    `:role/cdk-${customQualifier}-deploy-role-`,
                    {
                      Ref: 'AWS::AccountId',
                    },
                    '-',
                    {
                      Ref: 'AWS::Region',
                    },
                  ],
                ],
              },
            },
            Resource: [
              {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('S3SecureBucket'),
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        Match.stringLikeRegexp('S3SecureBucket'),
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            ],
          }),
        ]),
      },
    });
  });

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});

describe('DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET without a custom qualifier', () => {
  const expectTlsDeniesOnly = (template: Template): void => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayEquals([
          Match.objectLike({
            Effect: 'Deny',
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
          Match.objectLike({
            Effect: 'Deny',
            Action: 's3:*',
            Condition: {
              NumericLessThan: {
                's3:TlsVersion': 1.2,
              },
            },
          }),
        ]),
      },
    });
  };

  it('does not grant the deploy role for the default qualifier', () => {
    const stack = new Stack(new App(), 'DefaultQualifierStack');
    new S3SecureBucket(stack, 'Bucket', {
      bucketType: S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET,
    });

    expectTlsDeniesOnly(Template.fromStack(stack));
  });

  it('does not grant the deploy role when the qualifier is empty', () => {
    const stack = new Stack(new App(), 'EmptyQualifierStack', {
      synthesizer: new DefaultStackSynthesizer({ qualifier: '' }),
    });
    new S3SecureBucket(stack, 'Bucket', {
      bucketType: S3SecureBucketType.DEPLOYMENT_PIPELINE_ARTIFACT_BUCKET,
    });

    expectTlsDeniesOnly(Template.fromStack(stack));
  });
});

