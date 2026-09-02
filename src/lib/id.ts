/**
 * Small ID helper. Not cryptographically strong, but stable and collision-safe
 * enough for a single-user local journal. The real DB layer will mint UUIDs.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function uid(prefix = ''): string {
  let out = '';
  for (let i = 0; i < 20; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  const time = Date.now().toString(36);
  return `${prefix}${time}${out}`;
}
