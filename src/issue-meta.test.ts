import { describe, expect, it } from 'vitest';
import { groupFiles } from './classify.js';
import { issueTitle, labelsFor, sinceIso } from './issue-meta.js';

describe('issue metadata', () => {
  const now = new Date('2026-10-04T06:00:00Z');

  it('computes the start of the window', () => {
    expect(sinceIso(now, 24)).toBe('2026-10-03T06:00:00.000Z');
  });

  it('puts the UTC date in the title', () => {
    expect(issueTitle('Upstream changes', now)).toBe('Upstream changes (2026-10-04)');
  });

  it('labels by what changed', () => {
    const both = groupFiles(
      [
        { filename: 'adev/src/content/a.md', status: 'modified' },
        { filename: 'adev/src/app/b.ts', status: 'modified' },
      ],
      ['adev/'],
      ['adev/src/content/'],
    );
    expect(labelsFor(both, 'translation-sync')).toEqual(['translation-sync', 'docs', 'docs-infra']);
    const onlyContent = groupFiles([{ filename: 'adev/src/content/a.md', status: 'added' }], ['adev/'], ['adev/src/content/']);
    expect(labelsFor(onlyContent, 'translation-sync')).toEqual(['translation-sync', 'docs']);
  });
});
