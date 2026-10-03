import { describe, expect, it } from 'vitest';
import { parseCommand } from './commands.js';

describe('parseCommand', () => {
  it('reads claim and unclaim from the start of a comment', () => {
    expect(parseCommand('/claim')).toBe('claim');
    expect(parseCommand('  /Unclaim please')).toBe('unclaim');
  });

  it('ignores other comments', () => {
    expect(parseCommand('I will /claim this')).toBeNull();
    expect(parseCommand('thanks')).toBeNull();
    expect(parseCommand('')).toBeNull();
  });
});
