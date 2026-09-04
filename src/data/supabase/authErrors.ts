/** Supabase auth error text → something a person can act on. Pure. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'That email already has an account — try signing in.';
  }
  if (m.includes('invalid login credentials')) {
    return "That email and password don't match.";
  }
  if (m.includes('email not confirmed')) {
    return 'Check your inbox to confirm your email, then sign in.';
  }
  if (m.includes('password should be') || m.includes('at least 6')) {
    return 'Use a password of at least 6 characters.';
  }
  if (m.includes('unable to validate email') || m.includes('invalid format')) {
    return 'That email address looks off.';
  }
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('for security purposes')) {
    return 'Too many attempts — wait a minute and try again.';
  }
  return message;
}
