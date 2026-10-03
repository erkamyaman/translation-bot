import { describe, expect, it } from 'vitest';
import { groupFiles } from './classify.js';
import { buildIssueBody } from './issue-body.js';

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);

describe('buildIssueBody', () => {
  const groups = groupFiles(
    [
      { filename: 'adev/src/content/guide/signals.md', status: 'modified' },
      { filename: 'adev/src/content/guide/new.md', status: 'added' },
      { filename: 'adev/src/app/home.ts', status: 'renamed', previous_filename: 'adev/src/app/old.ts' },
    ],
    ['adev/'],
    ['adev/src/content/'],
  );
  const body = buildIssueBody({
    upstreamRepo: 'angular/angular',
    base,
    head,
    since: '2026-10-03T06:00:00.000Z',
    windowHours: 24,
    groups,
  });

  it('summarises the window and lists content and docs infra', () => {
    expect(body).toContain('3 upstream files changed in the last 24 hours');
    expect(body).toContain('## Docs (2)');
    expect(body).toContain('## Docs infra (1)');
    expect(body).toContain('### adev/src/app (1)');
  });

  it('links each file at the head commit and notes renames', () => {
    expect(body).toContain(`https://github.com/angular/angular/blob/${head}/adev/src/content/guide/new.md`);
    expect(body).toContain('(was `adev/src/app/old.ts`)');
  });

  it('links the diff and mentions the commands', () => {
    expect(body).toContain(`https://github.com/angular/angular/compare/${base}...${head}`);
    expect(body).toContain('`/claim`');
    expect(body).toContain('`/unclaim`');
  });
});
