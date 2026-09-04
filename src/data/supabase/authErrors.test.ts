import { friendlyAuthError } from './authErrors';

describe('friendlyAuthError', () => {
  it('maps the common Supabase messages', () => {
    expect(friendlyAuthError('User already registered')).toMatch(/already has an account/i);
    expect(friendlyAuthError('Invalid login credentials')).toMatch(/don.t match/i);
    expect(friendlyAuthError('Email not confirmed')).toMatch(/confirm your email/i);
    expect(friendlyAuthError('Password should be at least 6 characters')).toMatch(/6 characters/i);
    expect(friendlyAuthError('For security purposes, you can only request this after 55 seconds')).toMatch(
      /too many attempts/i,
    );
  });

  it('passes through anything it does not recognise', () => {
    expect(friendlyAuthError('Some novel backend error')).toBe('Some novel backend error');
  });
});
