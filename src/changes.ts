import { createHash } from 'node:crypto';
import { underAny, type ChangedFile } from './classify.js';

export interface Change {
  sha: string;
  title: string;
  prNumber: number | null;
  files: ChangedFile[];
  date: string;
}

export interface Sections {
  docs: Change[];
  docsInfra: Change[];
}

const PR_SUFFIX = /\s\(#(\d+)\)\s*$/;

export function toChange(sha: string, message: string, files: ChangedFile[], date = ''): Change {
  const firstLine = message.split('\n')[0]?.trim() ?? '';
  const match = PR_SUFFIX.exec(firstLine);
  return {
    sha,
    title: match ? firstLine.replace(PR_SUFFIX, '') : firstLine,
    prNumber: match?.[1] ? Number(match[1]) : null,
    files,
    date,
  };
}

export function splitSections(changes: Change[], contentPaths: string[]): Sections {
  const sections: Sections = { docs: [], docsInfra: [] };
  for (const change of changes) {
    const docs = change.files.filter((file) => underAny(file.filename, contentPaths));
    const infra = change.files.filter((file) => !underAny(file.filename, contentPaths));
    if (docs.length) sections.docs.push({ ...change, files: docs });
    if (infra.length) sections.docsInfra.push({ ...change, files: infra });
  }
  return sections;
}

const ZERO_WIDTH = '​';

export function neutralize(text: string): string {
  return text
    .replace(/@/g, `@${ZERO_WIDTH}`)
    .replace(/#(?=\d)/g, `#${ZERO_WIDTH}`)
    .replace(/:\/\//g, `:${ZERO_WIDTH}//`)
    .replace(/\b[0-9a-f]{7,40}\b/gi, (hex) => hex.match(/.{1,6}/g)?.join(ZERO_WIDTH) ?? hex)
    .replace(/[[\]]/g, '\\$&');
}

export function prUrl(upstream: string, prNumber: number): string {
  return `https://redirect.github.com/${upstream}/pull/${prNumber}`;
}

export function commitUrl(upstream: string, sha: string): string {
  return `https://redirect.github.com/${upstream}/commit/${sha}`;
}

export function diffUrl(upstream: string, sha: string, filename: string): string {
  const anchor = createHash('sha256').update(filename).digest('hex');
  return `https://redirect.github.com/${upstream}/commit/${sha}#diff-${anchor}`;
}
