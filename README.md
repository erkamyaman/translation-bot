# translation-bot

GitHub App for translation forks. Once a day it reads the last 24 hours of commits in the upstream repo, and opens one issue in your fork listing the changed files, labeled and assigned to you.

## What it does

- Opens one issue per day, titled `Upstream changes to translate (YYYY-MM-DD)`. Re-runs on the same day update that issue.
- Splits the checklist into **Docs** (pages to translate) and **Docs infra** (app, shared-docs, pipeline), and labels the issue `translation-sync`, `docs` and `docs-infra` as they apply.
- Assigns the issue to the repo owner, or to the `assignees` you configure.
- Comment `/claim` on an issue to assign yourself, or `/unclaim` to give it back.

It only touches repos that contain `.github/translation-bot.yml`.

## Configure

Every field is optional. An empty file turns the bot on with these defaults:

```yaml
upstream: angular/angular
upstreamBranch: main
paths: [adev/]
contentPaths: [adev/src/content/]
windowHours: 24
assignees: []
label: translation-sync
titlePrefix: Upstream changes to translate
```

## Run

```sh
pnpm install
cp .env.example .env
pnpm test
pnpm build && pnpm start
```

Register the app through the setup page at http://localhost:3000 the first time. `DAILY_CRON` (default `0 6 * * *`, UTC) sets the schedule, and `RUN_ON_START=1` runs the report once at startup.

The schedule runs inside the app, so the server has to be up at the scheduled time.
