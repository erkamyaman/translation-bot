import type { ProbotOctokit } from 'probot';
import { parse } from 'yaml';
import { parseConfig, type BotConfig } from './config.js';

type Octokit = InstanceType<typeof ProbotOctokit>;

export const CONFIG_PATH = '.github/translation-bot.yml';

export async function loadConfig(octokit: Octokit, owner: string, repo: string): Promise<BotConfig | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: CONFIG_PATH });
    if (Array.isArray(data) || data.type !== 'file') return null;
    return parseConfig(parse(Buffer.from(data.content, 'base64').toString('utf8')));
  } catch {
    return null;
  }
}
