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
