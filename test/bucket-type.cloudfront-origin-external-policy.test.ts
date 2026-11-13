import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3SecureBucket, S3SecureBucketType } from '../src';

const ACCOUNT = '123456789012';
const DISTRIBUTION_ARN = 'arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE';

const encryptionProperties = {
  BucketEncryption: Match.objectEquals({
    ServerSideEncryptionConfiguration: [
      {
        ServerSideEncryptionByDefault: {
          SSEAlgorithm: 'AES256',
        },
      },
    ],
  }),
};

const createExternalPolicyBucket = (
  stack: Stack,
  id = 'OriginBucket',
  props: ConstructorParameters<typeof S3SecureBucket>[2] = {},
): S3SecureBucket => {
  return new S3SecureBucket(stack, id, {
    ...props,
    bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET,
  });
};

describe('S3SecureBucket bucketType=CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET', () => {
  const app = new App();
  const stack = new Stack(app, 'TestingStack');
  const bucket = createExternalPolicyBucket(stack, 'S3SecureBucket');
  const template = Template.fromStack(stack);

  it('Is Bucket', () => {
    expect(bucket).toBeInstanceOf(s3.Bucket);
  });

  it('does not expose accessLogBucketPolicyDependable', () => {
    expect(bucket.accessLogBucketPolicyDependable).toBeUndefined();
  });

  it('does not create a bucket policy', () => {
    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
  });

  it('does not enable versioning', () => {
    const resources = template.findResources('AWS::S3::Bucket');
    for (const resource of Object.values(resources)) {
      expect(resource.Properties?.VersioningConfiguration).toBeUndefined();
    }
  });

  it('uses S3 managed encryption, blocks public access, and enforces the bucket owner', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      ...encryptionProperties,
      AccessControl: 'Private',
      PublicAccessBlockConfiguration: Match.objectEquals({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }),
      OwnershipControls: Match.objectEquals({
        Rules: [
          {
            ObjectOwnership: 'BucketOwnerEnforced',
          },
        ],
      }),
    });
  });

  it('retains the bucket when removalPolicy is omitted', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});

describe('S3SecureBucket bucketType=CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET props', () => {
  it('accepts the fixed encryption, ownership, access control, and versioned false', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      createExternalPolicyBucket(stack, 'OriginBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        accessControl: s3.BucketAccessControl.PRIVATE,
        versioned: false,
      });
    }).not.toThrow();

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', encryptionProperties);
    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
  });

  it('rejects versioned: true', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      createExternalPolicyBucket(stack, 'OriginBucket', { versioned: true });
    }).toThrow('CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires versioned false');
  });

  it('rejects encryption other than S3_MANAGED', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      createExternalPolicyBucket(stack, 'OriginBucket', {
        encryption: s3.BucketEncryption.KMS_MANAGED,
      });
    }).toThrow('CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires encryption S3_MANAGED');
  });

  it('rejects objectOwnership other than BUCKET_OWNER_ENFORCED', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      createExternalPolicyBucket(stack, 'OriginBucket', {
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      });
    }).toThrow('CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires objectOwnership BUCKET_OWNER_ENFORCED');
  });

  it('rejects accessControl other than PRIVATE', () => {
    const stack = new Stack(new App(), 'TestingStack');
    expect(() => {
      createExternalPolicyBucket(stack, 'OriginBucket', {
        accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      });
    }).toThrow('CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET requires accessControl PRIVATE');
  });

  it('sets DeletionPolicy to Delete when removalPolicy is DESTROY', () => {
    const stack = new Stack(new App(), 'TestingStack');
    createExternalPolicyBucket(stack, 'OriginBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    Template.fromStack(stack).hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  it('passes lifecycleRules through', () => {
    const stack = new Stack(new App(), 'TestingStack');
    createExternalPolicyBucket(stack, 'OriginBucket', {
      lifecycleRules: [
        {
          id: 'expire-current-objects',
          expiration: Duration.days(30),
        },
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayEquals([
          Match.objectLike({
            Id: 'expire-current-objects',
            ExpirationInDays: 30,
            Status: 'Enabled',
          }),
        ]),
      },
    });
  });
});

describe('S3SecureBucket.addOriginPolicy', () => {
  const originStatements = [
    Match.objectLike({
      Effect: 'Deny',
      Action: 's3:*',
      Principal: { AWS: '*' },
      Condition: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }),
    Match.objectLike({
      Effect: 'Deny',
      Action: 's3:*',
      Principal: { AWS: '*' },
      Condition: {
        NumericLessThan: {
          's3:TlsVersion': 1.2,
        },
      },
    }),
    Match.objectLike({
      Effect: 'Allow',
      Action: 's3:GetObject',
      Principal: { Service: 'cloudfront.amazonaws.com' },
      Condition: {
        StringEquals: {
          'AWS:SourceArn': Match.anyValue(),
        },
      },
    }),
  ];

  it('adds the three statements on another stack and not on the bucket stack', () => {
    const app = new App();
    const storage = new Stack(app, 'Storage', {
      env: { account: ACCOUNT, region: 'ap-northeast-1' },
      crossRegionReferences: true,
    });
    const associate = new Stack(app, 'Associate', {
      env: { account: ACCOUNT, region: 'ap-northeast-1' },
      crossRegionReferences: true,
    });
    const ingress = new Stack(app, 'Ingress', {
      env: { account: ACCOUNT, region: 'us-east-1' },
      crossRegionReferences: true,
    });
    const bucket = createExternalPolicyBucket(storage);
    const distribution = new cloudfront.Distribution(ingress, 'Distribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('example.com'),
      },
    });
    const policy = new s3.BucketPolicy(associate, 'OriginBucketPolicy', { bucket });

    bucket.addOriginPolicy(policy, distribution.distributionArn);

    const storageTemplate = Template.fromStack(storage);
    storageTemplate.resourceCountIs('AWS::S3::BucketPolicy', 0);
    expect(storage.dependencies.map((dependency) => dependency.node.id)).not.toContain('Ingress');
    expect(JSON.stringify(storageTemplate.toJSON())).not.toContain('cloudfront');

    const associateTemplate = Template.fromStack(associate);
    associateTemplate.resourceCountIs('AWS::S3::BucketPolicy', 1);
    associateTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayEquals(originStatements),
      },
    });

    const policies = associateTemplate.findResources('AWS::S3::BucketPolicy');
    const statements = Object.values(policies)[0].Properties.PolicyDocument.Statement as Array<{
      Resource: unknown;
    }>;
    expect(statements[0].Resource).toHaveLength(2);
    expect(statements[1].Resource).toHaveLength(2);
    expect(statements[2].Resource).not.toBeInstanceOf(Array);
    expect(JSON.stringify(statements[2].Resource)).toContain('/*');
  });

  it('keeps a concrete distribution ARN on the policy stack', () => {
    const app = new App();
    const storage = new Stack(app, 'Storage', {
      env: { account: ACCOUNT, region: 'ap-northeast-1' },
    });
    const associate = new Stack(app, 'Associate', {
      env: { account: ACCOUNT, region: 'ap-northeast-1' },
    });
    const bucket = createExternalPolicyBucket(storage);
    const policy = new s3.BucketPolicy(associate, 'OriginBucketPolicy', { bucket });

    bucket.addOriginPolicy(policy, DISTRIBUTION_ARN);

    Template.fromStack(storage).resourceCountIs('AWS::S3::BucketPolicy', 0);
    Template.fromStack(associate).hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayEquals([
          originStatements[0],
          originStatements[1],
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:GetObject',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Condition: {
              StringEquals: {
                'AWS:SourceArn': DISTRIBUTION_ARN,
              },
            },
          }),
        ]),
      },
    });
  });

  it('rejects addOriginPolicy on another bucket type', () => {
    const stack = new Stack(new App(), 'TestingStack', {
      env: { account: ACCOUNT, region: 'us-east-1' },
    });
    const bucket = new S3SecureBucket(stack, 'OriginBucket', {
      bucketType: S3SecureBucketType.CLOUDFRONT_ORIGIN_BUCKET,
    });
    const other = new s3.Bucket(stack, 'OtherBucket');
    const policy = new s3.BucketPolicy(stack, 'OtherPolicy', { bucket: other });

    expect(() => {
      bucket.addOriginPolicy(policy, DISTRIBUTION_ARN);
    }).toThrow('addOriginPolicy is only supported when bucketType is CLOUDFRONT_ORIGIN_EXTERNAL_POLICY_BUCKET');
  });

  it('rejects a BucketPolicy for a different bucket', () => {
    const stack = new Stack(new App(), 'TestingStack');
    const bucket = createExternalPolicyBucket(stack);
    const other = new s3.Bucket(stack, 'OtherBucket');
    const policy = new s3.BucketPolicy(stack, 'OtherPolicy', { bucket: other });

    expect(() => {
      bucket.addOriginPolicy(policy, DISTRIBUTION_ARN);
    }).toThrow('addOriginPolicy requires a BucketPolicy for this bucket');
  });

  it('rejects a resolved empty distribution ARN', () => {
    const stack = new Stack(new App(), 'TestingStack');
    const bucket = createExternalPolicyBucket(stack);
    const policy = new s3.BucketPolicy(stack, 'OriginBucketPolicy', { bucket });

    expect(() => {
      bucket.addOriginPolicy(policy, '');
    }).toThrow('distributionArn must not be empty');
  });
});
