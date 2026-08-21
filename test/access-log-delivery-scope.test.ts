import {
  hasAllowedSourceAccountIds,
  hasOrganizationId,
  isAwsAccountId,
  isAwsOrganizationId,
  isExclusiveAccessLogDeliveryScope,
} from '../src/bucket-types/access-log-delivery-scope';

describe('AccessLogDeliveryScope predicates', () => {
  describe('isExclusiveAccessLogDeliveryScope', () => {
    it.each([
      {
        name: 'neither field',
        scope: {},
        expected: false,
      },
      {
        name: 'both fields',
        scope: {
          allowedSourceAccountIds: ['123456789012'],
          organizationId: 'o-abcdefghijklmnopqrst',
        },
        expected: false,
      },
      {
        name: 'account list only',
        scope: {
          allowedSourceAccountIds: ['123456789012'],
        },
        expected: true,
      },
      {
        name: 'organization only',
        scope: {
          organizationId: 'o-abcdefghijklmnopqrst',
        },
        expected: true,
      },
      {
        name: 'empty account list still counts as the account-list field',
        scope: {
          allowedSourceAccountIds: [],
        },
        expected: true,
      },
    ])('returns $expected when $name', ({ scope, expected }) => {
      expect(isExclusiveAccessLogDeliveryScope(scope)).toBe(expected);
    });
  });

  describe('hasAllowedSourceAccountIds / hasOrganizationId', () => {
    it.each([
      {
        name: 'empty object',
        scope: {},
        hasAccounts: false,
        hasOrg: false,
      },
      {
        name: 'account list',
        scope: { allowedSourceAccountIds: ['123456789012'] },
        hasAccounts: true,
        hasOrg: false,
      },
      {
        name: 'organization',
        scope: { organizationId: 'o-abcdefghijklmnopqrst' },
        hasAccounts: false,
        hasOrg: true,
      },
    ])('$name', ({ scope, hasAccounts, hasOrg }) => {
      expect(hasAllowedSourceAccountIds(scope)).toBe(hasAccounts);
      expect(hasOrganizationId(scope)).toBe(hasOrg);
    });
  });

  describe('isAwsAccountId', () => {
    it.each([
      { value: '123456789012', expected: true },
      { value: '000000000000', expected: true },
      { value: '12345678901', expected: false },
      { value: '1234567890123', expected: false },
      { value: '12345678901a', expected: false },
      { value: '', expected: false },
    ])('returns $expected for $value', ({ value, expected }) => {
      expect(isAwsAccountId(value)).toBe(expected);
    });
  });

  describe('isAwsOrganizationId', () => {
    it.each([
      { value: 'o-abcdefghijklmnopqrst', expected: true },
      { value: 'o-1234567890', expected: true },
      { value: 'o-abcdefghij', expected: true },
      { value: 'o-short', expected: false },
      { value: 'O-abcdefghijklmnopqrst', expected: false },
      { value: 'abcdefghijklmnopqrst', expected: false },
      { value: '', expected: false },
    ])('returns $expected for $value', ({ value, expected }) => {
      expect(isAwsOrganizationId(value)).toBe(expected);
    });
  });
});
