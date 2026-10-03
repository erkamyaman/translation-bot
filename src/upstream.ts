import type { ProbotOctokit } from 'probot';
import { type ChangedFile } from './classify.js';
import { sinceIso } from './issue-meta.js';
import { type BotConfig } from './config.js';

type Octokit = InstanceType<typeof ProbotOctokit>;

export interface UpstreamChanges {
  files: ChangedFile[];
  base: string;
  head: string;
  since: string;
}

export async function collectChanges(octokit: Octokit, config: BotConfig, now: Date): Promise<UpstreamChanges | null> {
  const [owner, repo] = config.upstream.split('/') as [string, string];
  const since = sinceIso(now, config.windowHours);

  const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    sha: config.upstreamBranch,
    since,
    per_page: 100,
  });
  const newest = commits[0];
  const oldest = commits[commits.length - 1];
  if (!newest || !oldest) return null;

  const head = newest.sha;
  const base = oldest.parents[0]?.sha ?? oldest.sha;
  const files: ChangedFile[] = [];
  const pages = octokit.paginate.iterator(octokit.rest.repos.compareCommitsWithBasehead, {
    owner,
    repo,
    basehead: `${base}...${head}`,
    per_page: 100,
  });
  for await (const page of pages) {
    files.push(...((page.data as { files?: ChangedFile[] }).files ?? []));
  }
  return { files, base, head, since };
}
