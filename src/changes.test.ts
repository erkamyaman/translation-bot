import { describe, expect, it } from 'vitest';
import { changeUrl, diffUrl, neutralize, splitSections, toChange } from './changes.js';

describe('toChange', () => {
  it('reads the PR number and strips it from the title', () => {
    const change = toChange('a'.repeat(40), 'docs: add a page (#70835)\n\nbody', []);
    expect(change.prNumber).toBe(70835);
    expect(change.title).toBe('docs: add a page');
  });

  it('keeps the whole title when there is no PR number', () => {
    const change = toChange('a'.repeat(40), 'fix(docs-infra): direct push', []);
    expect(change.prNumber).toBeNull();
    expect(change.title).toBe('fix(docs-infra): direct push');
  });
});

describe('splitSections', () => {
  it('puts a commit in both sections with only its own files', () => {
    const change = toChange('b'.repeat(40), 'docs: both (#1)', [
      { filename: 'adev/src/content/a.md', status: 'modified' },
      { filename: 'adev/src/app/b.ts', status: 'modified' },
    ]);
    const sections = splitSections([change], ['adev/src/content/']);
    expect(sections.docs[0]?.files.map((f) => f.filename)).toEqual(['adev/src/content/a.md']);
    expect(sections.docsInfra[0]?.files.map((f) => f.filename)).toEqual(['adev/src/app/b.ts']);
  });
});

describe('mention safety', () => {
  it('breaks #numbers, long hashes and URLs so nothing is cross-referenced', () => {
    const text = neutralize('revert #123 and 8eea8f5ec3b1 see https://example.com');
    expect(text).not.toMatch(/#\d/);
    expect(text).not.toMatch(/\b[0-9a-f]{7,}\b/i);
    expect(text).not.toContain('://');
  });

  it('breaks @ mentions and brackets in titles', () => {
    const text = neutralize('fix(core): handle @Input and [x]');
    expect(text).not.toContain('@I');
    expect(text).toContain('@​Input');
    expect(text).toContain('\\[x\\]');
  });

  it('links PRs through redirect.github.com so Angular PRs get no back-link', () => {
    const withPr = toChange('c'.repeat(40), 'docs: x (#12)', []);
    expect(changeUrl('angular/angular', withPr)).toBe('https://redirect.github.com/angular/angular/pull/12');
    const noPr = toChange('d'.repeat(40), 'docs: y', []);
    expect(changeUrl('angular/angular', noPr)).toBe(`https://redirect.github.com/angular/angular/commit/${'d'.repeat(40)}`);
  });

  it('builds a stable per-file diff anchor', () => {
    expect(diffUrl('angular/angular', 'e'.repeat(40), 'adev/a.md')).toMatch(
      /^https:\/\/redirect\.github\.com\/angular\/angular\/commit\/e{40}#diff-[0-9a-f]{64}$/,
    );
  });
});
