import { resolveLocalForUser } from './plan';

describe('resolveLocalForUser', () => {
  it('keeps the cache on a fresh device (no stored id)', () => {
    expect(resolveLocalForUser(null, 'user-1')).toBe('keep');
  });

  it('keeps the cache when the same user signs back in', () => {
    expect(resolveLocalForUser('user-1', 'user-1')).toBe('keep');
  });

  it('wipes the cache when a different user signs in', () => {
    expect(resolveLocalForUser('user-1', 'user-2')).toBe('wipe');
  });
});
