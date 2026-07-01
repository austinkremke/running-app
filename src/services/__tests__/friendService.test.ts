import { sanitizeFriendSearchQuery } from '../friendService';

describe('sanitizeFriendSearchQuery', () => {
  it('trims whitespace and strips wildcard characters', () => {
    expect(sanitizeFriendSearchQuery('  %alice_  ')).toBe('alice');
  });

  it('caps query length at 40 characters', () => {
    expect(sanitizeFriendSearchQuery('a'.repeat(50))).toHaveLength(40);
  });
});
