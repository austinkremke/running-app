import { sanitizeMatchMessageBody } from '../matchChatService';

describe('sanitizeMatchMessageBody', () => {
  it('trims whitespace and caps length at 500 characters', () => {
    expect(sanitizeMatchMessageBody('  hello  ')).toBe('hello');
    expect(sanitizeMatchMessageBody('a'.repeat(600))).toHaveLength(500);
  });
});
