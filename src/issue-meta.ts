export function sinceIso(now: Date, windowHours: number): string {
  return new Date(now.getTime() - windowHours * 3_600_000).toISOString();
}

export function labelsFor(hasDocs: boolean, hasDocsInfra: boolean, baseLabel: string): string[] {
  const labels = [baseLabel];
  if (hasDocs) labels.push('docs');
  if (hasDocsInfra) labels.push('docs-infra');
  return labels;
}

const LAST_RUN = /<!-- translation-bot:last-run=(\S+) -->/;

export function lastRunMarker(now: Date): string {
  return `<!-- translation-bot:last-run=${now.toISOString()} -->`;
}

export function readLastRun(body: string | null | undefined): string | null {
  const iso = LAST_RUN.exec(body ?? '')?.[1];
  return iso && !Number.isNaN(Date.parse(iso)) ? iso : null;
}

export function withLastRun(body: string | null | undefined, now: Date): string {
  const text = body ?? '';
  const marker = lastRunMarker(now);
  return LAST_RUN.test(text) ? text.replace(LAST_RUN, marker) : `${text}\n\n${marker}`;
}

const TURKEY_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Istanbul',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function turkeyDate(iso: string): string {
  return TURKEY_TIME.format(new Date(iso));
}

export function turkeyTime(iso: string): string {
  return `${turkeyDate(iso)} (İstanbul, GMT+3)`;
}

export function checkedAtLine(iso: string): string {
  return `Checked at ${turkeyTime(iso)}.`;
}

function nothingNewDetail(since: string, hasLastRun: boolean, windowHours: number): string {
  return hasLastRun
    ? `No changes since the last check (${turkeyTime(since)}).`
    : `No changes in the last ${windowHours} hours, since ${turkeyTime(since)}.`;
}

export function nothingNewComment(since: string, hasLastRun: boolean, windowHours: number, checkedAt: string): string {
  return `## New changes from the Angular Repository\n\n${nothingNewDetail(since, hasLastRun, windowHours)}\n\n---\n${checkedAtLine(checkedAt)}`;
}

export function nothingNewIssueBody(since: string, windowHours: number, checkedAt: string): string {
  return [
    nothingNewDetail(since, false, windowHours),
    'The Angular repository had no commits that touch the tracked docs files in this time, so there is nothing to translate yet.',
    'This issue stays open. Each check adds a comment with what is new, or says that nothing changed.',
    `---\n${checkedAtLine(checkedAt)}`,
  ].join('\n\n');
}
