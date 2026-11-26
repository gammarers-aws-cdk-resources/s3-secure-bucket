import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType, type S3SecureBucketProps } from '../src';

const blockPublicAll = {
  BlockPublicAcls: true,
  BlockPublicPolicy: true,
  IgnorePublicAcls: true,
  RestrictPublicBuckets: true,
};

const blockAclsOnly = {
  BlockPublicAcls: true,
  BlockPublicPolicy: false,
  IgnorePublicAcls: true,
  RestrictPublicBuckets: false,
};

const synthesize = (props?: S3SecureBucketProps): Template => {
  const stack = new Stack(new App(), 'TestingStack');
  new S3SecureBucket(stack, 'Bucket', props);
  return Template.fromStack(stack);
};

describe('S3SecureBucket allowInsecureOverrides', () => {
  it('keeps DeletionPolicy Retain when the flag is omitted and removalPolicy is DESTROY', () => {
    const template = synthesize({
      removalPolicy: RemovalPolicy.DESTROY,
    });

    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  it('sets DeletionPolicy to Delete and keeps the secure access defaults', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectEquals(blockPublicAll),
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
          Match.objectLike({
            Effect: 'Deny',
            Condition: {
              NumericLessThan: {
                's3:TlsVersion': 1.2,
              },
            },
          }),
        ]),
      },
    });
  });

  it('applies blockPublicAccess from props', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectEquals(blockAclsOnly),
    });
  });

  // blockPublicPolicy must be false. CDK rejects publicReadAccess when that setting is enabled.
  it('allows public GetObject when publicReadAccess is true', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
    });

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:GetObject',
            Principal: {
              AWS: '*',
            },
          }),
        ]),
      },
    });
  });

  it('omits the bucket policy when enforceSSL is false', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      enforceSSL: false,
    });

    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  it('uses minimumTLSVersion from props', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      minimumTLSVersion: 1.3,
    });

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: {
              NumericLessThan: {
                's3:TlsVersion': 1.3,
              },
            },
          }),
        ]),
      },
    });
  });

  it('rejects minimumTLSVersion when enforceSSL is false', () => {
    expect(() => synthesize({
      allowInsecureOverrides: true,
      enforceSSL: false,
      minimumTLSVersion: 1.3,
    })).toThrow('minimumTLSVersion requires enforceSSL');
  });

  it.each([
    ['enforceSSL', { enforceSSL: true }],
    ['minimumTLSVersion', { minimumTLSVersion: 1.2 }],
  ] as const)('rejects %s on the external-policy bucket', (_field, sslProps) => {
    expect(() => synthesize({
      allowInsecureOverrides: true,
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
      ...sslProps,
    })).toThrow('CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET does not accept enforceSSL or minimumTLSVersion');
  });

  it('applies blockPublicAccess on the external-policy bucket without a bucket policy', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
    });

    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectEquals(blockAclsOnly),
    });
  });

  it('adds a public GetObject allow on the external-policy bucket when publicReadAccess is true', () => {
    const template = synthesize({
      allowInsecureOverrides: true,
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
    });

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayEquals([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:GetObject',
            Principal: {
              AWS: '*',
            },
          }),
        ]),
      },
    });
  });

  it.each([
    {
      name: 'removal-policy-destroy',
      props: {
        allowInsecureOverrides: true,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    },
    {
      name: 'enforce-ssl-false',
      props: {
        allowInsecureOverrides: true,
        enforceSSL: false,
      },
    },
  ])('matches snapshot for $name', ({ props }) => {
    expect(synthesize(props).toJSON()).toMatchSnapshot();
  });
});
