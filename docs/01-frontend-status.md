# Frontend status

## What is implemented

- A Next.js 16 app with a responsive landing page and repository input.
- Input normalization for `owner/repo` and HTTPS `github.com/owner/repo` URLs.
- **Live analysis** using the backend analyser (`backend/`) through a cached server-side service.
- `GET /api/blame.svg?repo=owner/repo`: live SVG leaderboard (top 5), or an SVG error card.
- `GET /api/analysis?repo=owner/repo`: JSON analysis with links to the commits behind each stat, for the page.
- Landing page:
  - fetches `/api/analysis`, with loading (skeleton + "JUDGING…"), success and error states for each error code;
  - live "charge sheet" totals, with notes on what was analysed (merges/bots skipped, line-stats coverage, time zone);
  - **rap sheet**: every suspect's stats, achievements (hover shows the criteria) and links to the evidence commits;
    top 12 shown, with a "show all" toggle;
  - shareable links: `/?repo=owner/repo` opens straight to that verdict;
  - copyable README image snippet.
- The SVG renderer escapes all text for XML, uses a sans-serif font stack and correct singular/plural wording.

## Current limitations

- The in-memory analysis cache is per server instance and resets on restart/redeploy.
- Without `GITHUB_TOKEN`, GitHub allows 60 requests/hour per IP (about 4–5 uncached analyses). Set a token for the demo.
- `largeCommits` / `linesChanged` only cover commits in the line-stats sample. The rap sheet shows "—" when a
  developer has no sampled commits.
- The README embed hasn't been tested on github.com yet; that needs a public HTTPS deployment.

## Verification performed

- `npm run build` and `npm run typecheck` pass from `frontend/`; the backend's 48 tests pass.
- Production server (`next start`) tested with real repositories: live SVG, cache hit on a repeat request
  regardless of capitals, JSON endpoint, not-found card (SVG 200 / JSON 404), invalid input (400),
  rate limit (SVG card with reset time / JSON 429).
- Screenshots checked at desktop width and ~600px mobile width; no horizontal overflow.
- The client bundle contains no Octokit or `GITHUB_TOKEN` code.

See [Running and integration](./03-running-and-integration.md).
