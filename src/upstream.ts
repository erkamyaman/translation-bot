import type { ProbotOctokit } from 'probot';
import { underAny, type ChangedFile } from './classify.js';
import { toChange, type Change } from './changes.js';
import { sinceIso } from './issue-meta.js';
import { type BotConfig } from './config.js';

type Octokit = InstanceType<typeof ProbotOctokit>;

export interface UpstreamChanges {
  changes: Change[];
  base: string;
  head: string;
  since: string;
}

const CONCURRENCY = 5;

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

  const changes: Change[] = [];
  for (let start = 0; start < commits.length; start += CONCURRENCY) {
    const batch = commits.slice(start, start + CONCURRENCY);
    const details = await Promise.all(
      batch.map((commit) => octokit.rest.repos.getCommit({ owner, repo, ref: commit.sha })),
    );
    for (const { data } of details) {
      const files = ((data.files ?? []) as ChangedFile[]).filter((file) => underAny(file.filename, config.paths));
      if (files.length) changes.push(toChange(data.sha, data.commit.message, files));
    }
  }

  return {
    changes,
    base: oldest.parents[0]?.sha ?? oldest.sha,
    head: newest.sha,
    since,
  };
}
