export function sinceIso(now: Date, windowHours: number): string {
  return new Date(now.getTime() - windowHours * 3_600_000).toISOString();
}

export function issueTitle(prefix: string, now: Date): string {
  return `${prefix} (${now.toISOString().slice(0, 10)})`;
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
  return `${turkeyDate(iso)} Turkey time`;
}

export function checkedAtLine(iso: string): string {
  return `Checked at ${turkeyTime(iso)}.`;
}

export function nothingNewComment(since: string, hasLastRun: boolean, windowHours: number, checkedAt: string): string {
  const detail = hasLastRun
    ? `No changes since the last check (${turkeyTime(since)}).`
    : `No changes in the last ${windowHours} hours (since ${turkeyTime(since)}).`;
  return `## New changes from Angular repo\n\n${detail}\n\n---\n${checkedAtLine(checkedAt)}`;
}
