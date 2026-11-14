# Running and integration

## Run locally

From the repository root:

```sh
cd frontend
npm run install:all   # installs frontend/ AND backend/ dependencies (the analyser needs both)
npm run dev
```

Open `http://localhost:3000`. Use `owner/repo` or an HTTPS GitHub repository URL. `npm run build` checks the production build and `npm run typecheck` checks TypeScript.

Optional: put `GITHUB_TOKEN=...` in `frontend/.env.local` (server-side only) to raise GitHub's rate limit from 60 to 5,000 requests/hour and analyse line stats for more commits. Never use a `NEXT_PUBLIC_` variable for it.

## API

### `GET /api/blame.svg?repo=owner/repo`

Live analysis rendered as an SVG leaderboard (`Content-Type: image/svg+xml`).

| Case | Status | Body |
| --- | --- | --- |
| Success | 200 | Leaderboard card, `X-Git-Happens-Data: live` |
| Analysis error (not found, empty, rate limited, GitHub down) | **200** | Error card, `X-Git-Happens-Data: error:<CODE>` |
| Missing/malformed `repo` | 400 | Plain text |

Analysis errors return 200 on purpose: GitHub's image proxy shows a broken image for non-2xx responses.

### `GET /api/charts/<chart>.svg?repo=owner/repo[&theme=light]`

README-embeddable chart cards rendered by `frontend/src/lib/charts-svg.ts`. The landing page renders the same SVGs inline, so the page and the embed always match. Default theme is dark; `theme=light` suits GitHub's light mode. Errors return the same 200 error card as the leaderboard, and unknown chart IDs return a 404.

| Chart | Shows |
| --- | --- |
| `score-breakdown` | Stacked bars splitting each suspect's blame score by signal (reverts, large, late-night, suspicious). |
| `shame-mix` | Donut of the repo's total shame points by signal. |
| `commit-share` | Donut of commits per contributor (top 5 + others). |
| `heatmap` | Weekday × hour commit heatmap, with the late-night zone and Friday evening outlined. |
| `awards` | How many suspects hold each achievement. |

To match the reader's GitHub theme, use `<picture>` (the site's "Auto" option copies this):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://git-happens-peach.vercel.app/api/charts/heatmap.svg?repo=OWNER/REPO">
  <img alt="Git Happens · Crime-time heatmap" src="https://git-happens-peach.vercel.app/api/charts/heatmap.svg?repo=OWNER/REPO&theme=light">
</picture>
```

### `GET /api/analysis?repo=owner/repo`

JSON for the landing page / dashboard: the `shared/analysis.ts` contract plus evidence links and `meta`
(see `backend/docs/data-contract.md`). Errors return `{ error: { code, message, retryAt? } }` with
400 / 404 / 422 (empty repo) / 429 / 502.

### Caching

`frontend/src/lib/analysis-service.ts` keeps an in-memory cache per server instance, keyed on lowercased
`owner/repo`: successes for 1 hour, errors for 1–10 minutes (rate limits until GitHub's reset time).
Concurrent requests for the same repo share one analysis. `X-Git-Happens-Cache: hit|miss` shows which one
happened. Responses also send `Cache-Control` so GitHub's image proxy and CDNs can cache them.

## Deployment

The frontend imports the analyser from `../backend` (alias `@backend/*`) and the shared types from `../shared`.
`next.config.ts` sets `turbopack.root` to the repo root so those files compile.

**The deploy must install backend dependencies too.** The analyser resolves `@octokit/rest` from
`backend/node_modules`, and the build fails with `Can't resolve '@octokit/rest'` without it. On Vercel:
- Root Directory: `frontend` (keep "Include files outside the root directory" enabled)
- Install Command: `npm run install:all`
- Environment variable: `GITHUB_TOKEN` (recommended)

## Remaining integration work

1. ~~Shared contract~~ Done: `shared/analysis.ts` is the single contract.
2. ~~Live SVG route + cache~~ Done.
3. ~~JSON endpoint~~ Done: `/api/analysis`.
4. ~~Landing page on live data with loading/error states~~ Done, plus the rap sheet with evidence links and `?repo=` share links.
5. ~~Deploy and test the README embed~~ Done: live at https://git-happens-peach.vercel.app, and the embed works on github.com.

## Production

- URL: https://git-happens-peach.vercel.app
- README embed: `![Git Happens](https://git-happens-peach.vercel.app/api/blame.svg?repo=OWNER/REPO)`
- Vercel project `git-happens`: root directory `frontend`, install command `npm run install:all`, `GITHUB_TOKEN` set for Production.
- Redeploy from the repo root with `npx vercel deploy --prod`. The project isn't connected to GitHub yet, so pushes don't deploy
  automatically; install the Vercel GitHub app on the repo and run `vercel git connect` to enable that.
- `.vercelignore` keeps `node_modules`, build output and `.env*` out of CLI uploads.
