import { describe, expect, it } from 'vitest';
import { labelsFor, nothingNewComment, readLastRun, sinceIso, withLastRun } from './issue-meta.js';

describe('issue metadata', () => {
  const now = new Date('2026-10-04T06:00:00Z');

  it('computes the start of the window', () => {
    expect(sinceIso(now, 24)).toBe('2026-10-03T06:00:00.000Z');
  });

  it('labels by what changed', () => {
    expect(labelsFor(true, true, 'translation-sync')).toEqual(['translation-sync', 'docs', 'docs-infra']);
    expect(labelsFor(true, false, 'translation-sync')).toEqual(['translation-sync', 'docs']);
    expect(labelsFor(false, true, 'translation-sync')).toEqual(['translation-sync', 'docs-infra']);
  });
});

describe('last run marker', () => {
  const now = new Date('2026-10-03T21:24:00.000Z');

  it('reads back what it wrote', () => {
    expect(readLastRun(withLastRun('body', now))).toBe(now.toISOString());
  });

  it('replaces an earlier marker instead of adding a second', () => {
    const later = new Date('2026-10-04T21:24:00.000Z');
    const body = withLastRun(withLastRun('body', now), later);
    expect(body.match(/last-run=/g)).toHaveLength(1);
    expect(readLastRun(body)).toBe(later.toISOString());
  });

  it('returns null without a valid marker', () => {
    expect(readLastRun(null)).toBeNull();
    expect(readLastRun('<!-- translation-bot:last-run=nonsense -->')).toBeNull();
  });
});

describe('nothing new comment', () => {
  const checkedAt = '2026-10-03T21:24:00.000Z';

  it('names the last check and when it ran', () => {
    expect(nothingNewComment('2026-10-03T06:00:00.000Z', true, 24, checkedAt)).toBe(
      '## New changes from the Angular Repository\n\nNo changes since the last check (3 Oct 2026, 09:00 (İstanbul, GMT+3)).\n\n---\nChecked at 4 Oct 2026, 00:24 (İstanbul, GMT+3).',
    );
  });

  it('names the window when there is no earlier check', () => {
    expect(nothingNewComment('2026-10-03T06:00:00.000Z', false, 24, checkedAt)).toContain('No changes in the last 24 hours');
  });
});
