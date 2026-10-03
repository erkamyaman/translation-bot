import { describe, expect, it } from 'vitest';
import { tokenMatches } from './daily-route.js';

describe('tokenMatches', () => {
  it('accepts the exact bearer token', () => {
    expect(tokenMatches('Bearer s3cret', 's3cret')).toBe(true);
  });

  it('ignores stray whitespace and newlines on either side', () => {
    expect(tokenMatches('Bearer s3cret\n', 's3cret')).toBe(true);
    expect(tokenMatches('Bearer s3cret', 's3cret\n')).toBe(true);
    expect(tokenMatches('Bearer s3cret ', ' s3cret\r\n')).toBe(true);
  });

  it('rejects a wrong, missing or malformed token', () => {
    expect(tokenMatches('Bearer nope', 's3cret')).toBe(false);
    expect(tokenMatches('Bearer s3cret!', 's3cret')).toBe(false);
    expect(tokenMatches('s3cret', 's3cret')).toBe(false);
    expect(tokenMatches(undefined, 's3cret')).toBe(false);
  });

  it('rejects everything when no token is configured', () => {
    expect(tokenMatches('Bearer ', undefined)).toBe(false);
    expect(tokenMatches('Bearer anything', '')).toBe(false);
  });
});
