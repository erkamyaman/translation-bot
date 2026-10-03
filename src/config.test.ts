import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseConfig } from './config.js';

describe('parseConfig', () => {
  it('returns the defaults for an empty or missing file', () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it('reads valid values', () => {
    const config = parseConfig({
      upstream: 'vuejs/docs',
      windowHours: 48,
      assignees: ['erkamyaman'],
      paths: ['src/'],
    });
    expect(config.upstream).toBe('vuejs/docs');
    expect(config.windowHours).toBe(48);
    expect(config.assignees).toEqual(['erkamyaman']);
    expect(config.paths).toEqual(['src/']);
  });

  it('falls back per field for invalid values', () => {
    const config = parseConfig({ upstream: 'not a repo', windowHours: -1, paths: [], label: '  ' });
    expect(config.upstream).toBe(DEFAULT_CONFIG.upstream);
    expect(config.windowHours).toBe(24);
    expect(config.paths).toEqual(DEFAULT_CONFIG.paths);
    expect(config.label).toBe(DEFAULT_CONFIG.label);
  });
});
