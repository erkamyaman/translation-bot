# translation-bot

GitHub App for translation forks. Once a day it reads the last 24 hours of commits in the upstream repo, and opens one issue in your fork listing the changed files, labeled and assigned to you.

## What it does

- Opens one issue per day, titled `Upstream changes to translate (YYYY-MM-DD)`. Re-runs on the same day update that issue.
- Splits the checklist into **Docs** (pages to translate) and **Docs infra** (app, shared-docs, pipeline), and labels the issue `translation-sync`, `docs` and `docs-infra` as they apply.
- Assigns the issue to the repo owner, or to the `assignees` you configure.

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

## Host it for free

The free Render web service sleeps when idle, so the timer lives in GitHub Actions instead. `.github/workflows/daily.yml` calls `POST /translation-bot/daily` once a day, which wakes the bot and runs the report.

1. Create a Render web service from this repo. `render.yaml` sets the build and start commands and the free plan.
2. In Render, set `APP_ID`, `WEBHOOK_SECRET`, `PRIVATE_KEY` (the `.pem` file as base64: `base64 -i key.pem | tr -d '\n'`) and `DAILY_TOKEN` (any long random string, for example `openssl rand -hex 32`).
3. In the app settings on GitHub, set the webhook URL to `https://<your-service>.onrender.com/api/github/webhooks`.
4. In this repo's Actions secrets, add `BOT_URL` (the service URL, no trailing slash) and `DAILY_TOKEN` (the same value).
5. Run the workflow once from the Actions tab to check it.

Set `DAILY_CRON=off` on the host so the in-app timer does not also run. Locally the timer still works, and `/translation-bot/daily` accepts the same bearer token.
