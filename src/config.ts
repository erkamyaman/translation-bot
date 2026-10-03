export interface BotConfig {
  upstream: string;
  upstreamBranch: string;
  paths: string[];
  contentPaths: string[];
  windowHours: number;
  assignees: string[];
  label: string;
  titlePrefix: string;
}

export const DEFAULT_CONFIG: BotConfig = {
  upstream: 'angular/angular',
  upstreamBranch: 'main',
  paths: ['adev/'],
  contentPaths: ['adev/src/content/'],
  windowHours: 24,
  assignees: [],
  label: 'translation-sync',
  titlePrefix: 'Upstream changes to translate',
};

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function list(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  return items.length ? items.map((item) => item.trim()) : fallback;
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
}

export function parseConfig(raw: unknown): BotConfig {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const upstream = text(source['upstream'], DEFAULT_CONFIG.upstream);
  return {
    upstream: /^[^/\s]+\/[^/\s]+$/.test(upstream) ? upstream : DEFAULT_CONFIG.upstream,
    upstreamBranch: text(source['upstreamBranch'], DEFAULT_CONFIG.upstreamBranch),
    paths: list(source['paths'], DEFAULT_CONFIG.paths),
    contentPaths: list(source['contentPaths'], DEFAULT_CONFIG.contentPaths),
    windowHours: positiveInteger(source['windowHours'], DEFAULT_CONFIG.windowHours),
    assignees: list(source['assignees'], DEFAULT_CONFIG.assignees),
    label: text(source['label'], DEFAULT_CONFIG.label),
    titlePrefix: text(source['titlePrefix'], DEFAULT_CONFIG.titlePrefix),
  };
}
