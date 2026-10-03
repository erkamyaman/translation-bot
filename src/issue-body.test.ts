import { describe, expect, it } from 'vitest';
import { splitSections, toChange } from './changes.js';
import { buildIssueBody, MAX_BODY_LENGTH, MAX_FILES_PER_CHANGE } from './issue-body.js';

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const input = (changes: ReturnType<typeof toChange>[]) => ({
  upstreamRepo: 'angular/angular',
  base,
  head,
  since: '2026-10-03T06:00:00.000Z',
  windowHours: 24,
  sections: splitSections(changes, ['adev/src/content/']),
});

describe('buildIssueBody', () => {
  const changes = [
    toChange('1'.repeat(40), 'docs: guide update (#10)', [{ filename: 'adev/src/content/guide/a.md', status: 'modified' }]),
    toChange('2'.repeat(40), 'fix(docs-infra): card titles (#11)', [{ filename: 'adev/src/app/card.ts', status: 'modified' }]),
  ];
  const body = buildIssueBody(input(changes));

  it('lists changes under Docs and Docs infra with PR and diff links', () => {
    expect(body).toContain('2 upstream changes touched tracked files in the last 24 hours');
    expect(body).toContain('## Docs (1)');
    expect(body).toContain('## Docs infra (1)');
    expect(body).toContain('[docs: guide update](https://redirect.github.com/angular/angular/pull/10)');
    expect(body).toContain('([diff](https://redirect.github.com/angular/angular/commit/');
  });

  it('never mentions a user or an issue number of this repo', () => {
    expect(body).not.toMatch(/(^|\s)@\w/);
    expect(body).not.toMatch(/(^|\s)#\d/);
  });

  it('writes no link to github.com pull requests, issues or commits', () => {
    expect(body).not.toMatch(/https:\/\/github\.com\/[^/]+\/[^/]+\/(pull|issues|commit|compare)/);
  });

  it('links the full diff and mentions the commands', () => {
    expect(body).toContain(`https://redirect.github.com/angular/angular/compare/${base}...${head}`);
    expect(body).toContain('`/claim`');
  });

  it('caps the files shown per change', () => {
    const many = toChange(
      '3'.repeat(40),
      'docs: big (#12)',
      Array.from({ length: MAX_FILES_PER_CHANGE + 3 }, (_, i) => ({ filename: `adev/src/content/f${i}.md`, status: 'added' })),
    );
    expect(buildIssueBody(input([many]))).toContain('and 3 more files');
  });

  it('stays under the size limit and says what it left out', () => {
    const lots = Array.from({ length: 800 }, (_, i) =>
      toChange(String(i).padStart(40, '0'), `docs: change number ${i} (#${i + 1})`, [
        { filename: `adev/src/content/guide/page-${i}.md`, status: 'modified' },
      ]),
    );
    const huge = buildIssueBody(input(lots));
    expect(huge.length).toBeLessThanOrEqual(MAX_BODY_LENGTH + 500);
    expect(huge).toMatch(/\d+ more changes did not fit/);
  });
});
