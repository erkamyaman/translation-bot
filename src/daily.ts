import type { Probot, ProbotOctokit } from 'probot';
import cron from 'node-cron';
import { splitSections } from './changes.js';
import { buildIssueBody } from './issue-body.js';
import { issueTitle, labelsFor, nothingNewComment, readLastRun, sinceIso, withLastRun } from './issue-meta.js';
import { loadConfig } from './repo-config.js';
import { collectChanges } from './upstream.js';

type Octokit = InstanceType<typeof ProbotOctokit>;

export async function reportForRepo(octokit: Octokit, owner: string, repo: string, now: Date): Promise<string> {
  const config = await loadConfig(octokit, owner, repo);
  if (!config) return 'skipped, no config file';

  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    labels: config.label,
    state: 'open',
    per_page: 100,
  });
  const existing = issues.find((issue) => !issue.pull_request);

  const lastRun = readLastRun(existing?.body);
  const changes = await collectChanges(octokit, config, now, lastRun);
  const sections = changes
    ? splitSections(changes.changes, config.contentPaths)
    : { docs: [], docsInfra: [] };

  if (!changes || (!sections.docs.length && !sections.docsInfra.length)) {
    if (!existing) return 'no tracked files changed';
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: existing.number,
      body: nothingNewComment(lastRun ?? sinceIso(now, config.windowHours), lastRun !== null, config.windowHours, now.toISOString()),
    });
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: existing.number,
      body: withLastRun(existing.body, now),
    });
    return `nothing new, commented on #${existing.number}`;
  }

  const report = {
    upstreamRepo: config.upstream,
    base: changes.base,
    head: changes.head,
    since: changes.since,
    windowHours: config.windowHours,
    sections,
    checkedAt: now.toISOString(),
  };

  if (existing) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: existing.number,
      body: buildIssueBody({ ...report, kind: 'update' }),
    });
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: existing.number,
      body: withLastRun(existing.body, now),
    });
    return `commented on #${existing.number}`;
  }

  const created = await octokit.rest.issues.create({
    owner,
    repo,
    title: issueTitle(config.titlePrefix, now),
    body: withLastRun(buildIssueBody(report), now),
    labels: labelsFor(sections.docs.length > 0, sections.docsInfra.length > 0, config.label),
    assignees: config.assignees.length ? config.assignees : [owner],
  });
  return `opened #${created.data.number}`;
}

export interface DailyOutcome {
  results: string[];
  failures: number;
}

export async function runDaily(app: Probot, now = new Date()): Promise<DailyOutcome> {
  const outcome: DailyOutcome = { results: [], failures: 0 };
  const appOctokit = await app.auth();
  const installations = await appOctokit.paginate(appOctokit.rest.apps.listInstallations, { per_page: 100 });
  for (const installation of installations) {
    const octokit = await app.auth(installation.id);
    const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, { per_page: 100 });
    for (const repo of repos) {
      const name = `${repo.owner.login}/${repo.name}`;
      try {
        const result = `${name}: ${await reportForRepo(octokit, repo.owner.login, repo.name, now)}`;
        app.log.info(result);
        outcome.results.push(result);
      } catch (error) {
        app.log.error({ error }, `${name}: failed`);
        outcome.results.push(`${name}: failed`);
        outcome.failures += 1;
      }
    }
  }
  return outcome;
}

export function scheduleDaily(app: Probot): void {
  const expression = process.env['DAILY_CRON'] || '0 6 * * *';
  if (expression === 'off') {
    app.log.info('in-app daily timer is off');
    return;
  }
  cron.schedule(expression, () => void runDaily(app), { timezone: 'UTC' });
  app.log.info(`daily report scheduled: ${expression} UTC`);
  if (process.env['RUN_ON_START']) void runDaily(app);
}
