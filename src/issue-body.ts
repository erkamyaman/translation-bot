import { checkedAtLine, turkeyDate, turkeyTime } from './issue-meta.js';
import { changeUrl, diffUrl, neutralize, type Change, type Sections } from './changes.js';

export const MAX_FILES_PER_CHANGE = 8;
export const MAX_BODY_LENGTH = 60_000;

export interface ReportInput {
  upstreamRepo: string;
  base: string;
  head: string;
  since: string;
  windowHours: number;
  sections: Sections;
  kind?: 'issue' | 'update';
  checkedAt?: string;
}

function item(upstream: string, change: Change): string {
  const when = change.date ? ` · ${turkeyDate(change.date)}` : '';
  const lines = [`- [ ] [${neutralize(change.title)}](${changeUrl(upstream, change)}) \`${change.sha.slice(0, 7)}\`${when}`];
  for (const file of change.files.slice(0, MAX_FILES_PER_CHANGE)) {
    lines.push(`  - \`${file.filename}\` ([diff](${diffUrl(upstream, change.sha, file.filename)}))`);
  }
  const hidden = change.files.length - MAX_FILES_PER_CHANGE;
  if (hidden > 0) lines.push(`  - and ${hidden} more files`);
  return lines.join('\n');
}

export function buildIssueBody(input: ReportInput): string {
  const { upstreamRepo, sections } = input;
  const compare = `https://redirect.github.com/${upstreamRepo}/compare/${input.base}...${input.head}`;
  const update = input.kind === 'update';
  const checked = input.checkedAt ? [checkedAtLine(input.checkedAt)] : [];
  const footer = ['', '---', ...checked].join('\n');
  const headerCount = new Set([...sections.docs, ...sections.docsInfra].map((change) => change.sha)).size;
  const header = update
    ? `## New changes from Angular repo\n\n${headerCount} new upstream changes since ${turkeyTime(input.since)}. [Full diff](${compare}).`
    : `${headerCount} upstream changes touched tracked files in the last ${input.windowHours} hours (since ${input.since}). [Full diff](${compare}).`;

  const blocks: string[] = [];
  let length = header.length + footer.length;
  let omitted = 0;
  const addSection = (title: string, changes: Change[]): void => {
    if (!changes.length) return;
    const heading = `## ${title} (${changes.length})`;
    const items: string[] = [];
    for (const change of changes) {
      const text = item(upstreamRepo, change);
      if (length + heading.length + text.length + 200 > MAX_BODY_LENGTH) {
        omitted += 1;
        continue;
      }
      length += text.length + 2;
      items.push(text);
    }
    length += heading.length + 4;
    blocks.push([heading, '', ...items].join('\n'));
  };
  addSection('Docs', sections.docs);
  addSection('Docs infra', sections.docsInfra);

  const parts = [header, ...blocks];
  if (omitted) parts.push(`${omitted} more changes did not fit. See the [full diff](${compare}).`);
  return parts.join('\n\n') + '\n' + footer;
}
