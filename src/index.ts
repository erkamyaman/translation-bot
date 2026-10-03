import type { ApplicationFunctionOptions, Probot } from 'probot';
import { parseCommand } from './commands.js';
import { scheduleDaily } from './daily.js';
import { dailyHandler } from './daily-route.js';
import { loadConfig } from './repo-config.js';

export default (app: Probot, { addHandler }: ApplicationFunctionOptions) => {
  scheduleDaily(app);
  addHandler(dailyHandler(app));

  app.on('issue_comment.created', async (context) => {
    const { comment, issue, sender } = context.payload;
    if (sender.type === 'Bot' || issue.pull_request || issue.state !== 'open') return;

    const command = parseCommand(comment.body);
    if (!command) return;

    const { owner, repo } = context.repo();
    const config = await loadConfig(context.octokit, owner, repo);
    if (!config || !issue.labels.some((label) => (typeof label === 'string' ? label : label.name) === config.label)) {
      return;
    }

    if (command === 'claim') {
      await context.octokit.rest.issues.addAssignees(context.issue({ assignees: [sender.login] }));
    } else {
      await context.octokit.rest.issues.removeAssignees(context.issue({ assignees: [sender.login] }));
    }
    await context.octokit.rest.reactions.createForIssueComment(
      context.repo({ comment_id: comment.id, content: '+1' }),
    );
  });
};
