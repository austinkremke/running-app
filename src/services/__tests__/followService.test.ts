import { sanitizeFollowSearchQuery } from '../followService';

describe('sanitizeFollowSearchQuery', () => {
  it('trims whitespace and strips wildcard characters', () => {
    expect(sanitizeFollowSearchQuery('  %alice_  ')).toBe('alice');
  });

  it('caps query length at 40 characters', () => {
    expect(sanitizeFollowSearchQuery('a'.repeat(50))).toHaveLength(40);
  });
});
