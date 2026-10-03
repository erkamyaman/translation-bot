import { type Groups } from './classify.js';

export function sinceIso(now: Date, windowHours: number): string {
  return new Date(now.getTime() - windowHours * 3_600_000).toISOString();
}

export function issueTitle(prefix: string, now: Date): string {
  return `${prefix} (${now.toISOString().slice(0, 10)})`;
}

export function labelsFor(groups: Groups, baseLabel: string): string[] {
  const labels = [baseLabel];
  if (groups.content.length) labels.push('docs');
  if (groups.infra.size) labels.push('docs-infra');
  return labels;
}
