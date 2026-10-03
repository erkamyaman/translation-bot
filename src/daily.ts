import type { Probot, ProbotOctokit } from 'probot';
import cron from 'node-cron';
import { groupFiles } from './classify.js';
import { buildIssueBody } from './issue-body.js';
import { issueTitle, labelsFor } from './issue-meta.js';
import { loadConfig } from './repo-config.js';
import { collectChanges } from './upstream.js';

type Octokit = InstanceType<typeof ProbotOctokit>;

export async function reportForRepo(octokit: Octokit, owner: string, repo: string, now: Date): Promise<string> {
  const config = await loadConfig(octokit, owner, repo);
  if (!config) return 'skipped, no config file';

  const changes = await collectChanges(octokit, config, now);
  if (!changes) return 'no upstream commits in the window';

  const groups = groupFiles(changes.files, config.paths, config.contentPaths);
  if (!groups.content.length && !groups.infra.size) return 'no tracked files changed';

  const title = issueTitle(config.titlePrefix, now);
  const body = buildIssueBody({
    upstreamRepo: config.upstream,
    base: changes.base,
    head: changes.head,
    since: changes.since,
    windowHours: config.windowHours,
    groups,
  });

  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    labels: config.label,
    state: 'all',
    per_page: 100,
  });
  const existing = issues.find((issue) => !issue.pull_request && issue.title === title);
  if (existing) {
    await octokit.rest.issues.update({ owner, repo, issue_number: existing.number, body });
    return `updated #${existing.number}`;
  }

  const created = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels: labelsFor(groups, config.label),
    assignees: config.assignees.length ? config.assignees : [owner],
  });
  return `opened #${created.data.number}`;
}

export async function runDaily(app: Probot, now = new Date()): Promise<void> {
  const appOctokit = await app.auth();
  const installations = await appOctokit.paginate(appOctokit.rest.apps.listInstallations, { per_page: 100 });
  for (const installation of installations) {
    const octokit = await app.auth(installation.id);
    const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, { per_page: 100 });
    for (const repo of repos) {
      const name = `${repo.owner.login}/${repo.name}`;
      try {
        app.log.info(`${name}: ${await reportForRepo(octokit, repo.owner.login, repo.name, now)}`);
      } catch (error) {
        app.log.error({ error }, `${name}: failed`);
      }
    }
  }
}

export function scheduleDaily(app: Probot): void {
  const expression = process.env['DAILY_CRON'] || '0 6 * * *';
  cron.schedule(expression, () => void runDaily(app), { timezone: 'UTC' });
  app.log.info(`daily report scheduled: ${expression} UTC`);
  if (process.env['RUN_ON_START']) void runDaily(app);
}
