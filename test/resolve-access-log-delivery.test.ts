import { Aws, Token } from 'aws-cdk-lib';
import { resolveAccessLogDelivery } from '../src/bucket-policies/resolve-access-log-delivery';

describe('resolveAccessLogDelivery', () => {
  const bucketArn = 'arn:aws:s3:::example-access-logs';
  const stackAccount = '123456789012';

  it('defaults to the stack account prefix', () => {
    expect(resolveAccessLogDelivery(bucketArn, stackAccount)).toEqual({
      awsLogsResources: [`${bucketArn}/AWSLogs/${stackAccount}/*`],
    });
  });

  it('maps allowedSourceAccountIds to AWSLogs prefixes and drops duplicates', () => {
    expect(resolveAccessLogDelivery(bucketArn, stackAccount, {
      allowedSourceAccountIds: ['111111111111', '222222222222', '111111111111'],
    })).toEqual({
      awsLogsResources: [
        `${bucketArn}/AWSLogs/111111111111/*`,
        `${bucketArn}/AWSLogs/222222222222/*`,
      ],
    });
  });

  it('does not add the stack account unless it is listed', () => {
    expect(resolveAccessLogDelivery(bucketArn, stackAccount, {
      allowedSourceAccountIds: ['111111111111'],
    })).toEqual({
      awsLogsResources: [`${bucketArn}/AWSLogs/111111111111/*`],
    });
  });

  it('uses AWSLogs/* when organizationId is set', () => {
    expect(resolveAccessLogDelivery(bucketArn, stackAccount, {
      organizationId: 'o-abcdefghijklmnopqrst',
    })).toEqual({
      awsLogsResources: [`${bucketArn}/AWSLogs/*`],
      organizationId: 'o-abcdefghijklmnopqrst',
    });
  });

  it.each([
    {
      name: 'neither field',
      scope: {},
    },
    {
      name: 'both fields',
      scope: {
        allowedSourceAccountIds: ['111111111111'],
        organizationId: 'o-abcdefghijklmnopqrst',
      },
    },
  ])('throws when $name is specified', ({ scope }) => {
    expect(() => resolveAccessLogDelivery(bucketArn, stackAccount, scope)).toThrow(
      'accessLogDelivery must specify exactly one of allowedSourceAccountIds or organizationId',
    );
  });

  it('throws when allowedSourceAccountIds is empty', () => {
    expect(() => resolveAccessLogDelivery(bucketArn, stackAccount, {
      allowedSourceAccountIds: [],
    })).toThrow('allowedSourceAccountIds must contain at least one account ID');
  });

  it('throws when an account ID is invalid', () => {
    expect(() => resolveAccessLogDelivery(bucketArn, stackAccount, {
      allowedSourceAccountIds: ['not-an-account'],
    })).toThrow('allowedSourceAccountIds contains an invalid AWS account ID: not-an-account');
  });

  it('throws when organizationId is invalid', () => {
    expect(() => resolveAccessLogDelivery(bucketArn, stackAccount, {
      organizationId: 'not-an-org',
    })).toThrow('organizationId must be an AWS Organizations ID (o-...), got: not-an-org');
  });

  it('skips account ID format checks for unresolved tokens', () => {
    expect(resolveAccessLogDelivery(bucketArn, stackAccount, {
      allowedSourceAccountIds: [Aws.ACCOUNT_ID],
    })).toEqual({
      awsLogsResources: [`${bucketArn}/AWSLogs/${Aws.ACCOUNT_ID}/*`],
    });
  });

  it('skips organization ID format checks for unresolved tokens', () => {
    const organizationIdToken = Token.asString({ Ref: 'OrganizationId' });
    expect(resolveAccessLogDelivery(bucketArn, stackAccount, {
      organizationId: organizationIdToken,
    })).toEqual({
      awsLogsResources: [`${bucketArn}/AWSLogs/*`],
      organizationId: organizationIdToken,
    });
  });
});
