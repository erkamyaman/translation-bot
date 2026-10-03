import { describe, expect, it } from 'vitest';
import { splitList, underAny } from './classify.js';

describe('splitList', () => {
  it('trims and drops empty items', () => {
    expect(splitList(' adev/ , ,.github/ ')).toEqual(['adev/', '.github/']);
  });
});

describe('underAny', () => {
  it('matches a path against any prefix', () => {
    expect(underAny('adev/src/content/a.md', ['adev/'])).toBe(true);
    expect(underAny('packages/core/a.ts', ['adev/', 'docs/'])).toBe(false);
  });
});
