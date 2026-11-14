# Project status

Git Exposed is live at **https://git-happens-peach.vercel.app**. Every feature in the original MVP and
deployment plan is done, plus the stretch dashboard (charges, score explainer, chart embeds).

## What is implemented

### Landing page (`frontend/src/app/page.tsx`)

- **Hero:** "The Git history *roast engine*". The repo input shows a blinking terminal-style block cursor
  while empty. The **Roast me** button's arrow hops on hover and launches before the page scrolls to
  the results. Reduced-motion settings skip both animations and the cursor stops blinking.
- **Input:** accepts `owner/repo` or any `https://github.com/owner/repo…` URL. `/?repo=owner/repo` share links
  open straight to that verdict.
- **01 / The verdict: Hall of shame.**
  - **Leaderboard card:** the live `/api/blame.svg` preview, with its README Markdown in an embed bar
    and an **Embed** copy button.
  - **Charge sheet:** how many suspects, commits and achievements were found.
  - **The charges:** every achievement in the repo as a tag. Hovering shows the tagline and rule, and
    clicking filters the rap sheet to the people charged with it.
  - **The rap sheet:** each suspect's score, score meter, tags, stats and links to the commits behind them.
    Top 12 shown, with a "show all" toggle. The score's "how?" link jumps to the worked example.
- **02 / The maths: How the score works.** Two compact steps (the four weighted signals, then the
  normalise-and-cap formula) next to a worked example for any suspect.
- **03 / The evidence board: Wear your shame.** Four chart cards: score breakdown, anatomy of shame,
  commit share and the crime-time heatmap. Each shows its README snippet next to an **Embed** button.
  An Auto / Dark / Light toggle switches the snippets, and **Copy all embeds** copies all four.
- **Branding:** Git Exposed wordmark and logo in the header and footer, and the logo as the favicon
  (`src/app/icon.svg`, `src/app/apple-icon.png`).
- **Tone:** copy is written to roast the visitor ("Congratulations, you're the problem."). See
  [Page guide and tone](./04-page-guide-and-tone.md).

### Server (`frontend/src/app/api/`)

- `GET /api/blame.svg?repo=…`: live SVG leaderboard (top 5), or an SVG error card.
- `GET /api/charts/<chart>.svg?repo=…[&theme=light]`: README-embeddable chart cards.
- `GET /api/analysis?repo=…`: JSON analysis with evidence links and metadata, used by the page.
- One shared, cached analysis service, so the page, the leaderboard and the charts always agree.
- All SVG text from GitHub is XML-escaped.
- SVG cards no longer carry the "Entertainment only" footer (removed in PR #11).

### Analyser (`backend/`)

Commit fetching, identity mapping, bot filtering, signals, blame score and achievements.
See [backend/docs](../backend/docs/README.md).

## Current limitations

- The in-memory analysis cache is per server instance and resets on restart or redeploy.
- Without `GITHUB_TOKEN`, GitHub allows 60 requests/hour per IP, which is about 4 uncached analyses.
  Production has a token set.
- `largeCommits` / `linesChanged` only cover commits in the line-stats sample (newest 100 with a token,
  10 without). The rap sheet shows "—" when a developer has no sampled commits.
- Only the latest 300 commits on the default branch are read. Times are UTC.
- GitHub caches README images, so an embedded card can lag behind the live site.
- `frontend/src/lib/server-analysis.ts` is an older cache that nothing imports any more. It can be deleted.

## Verification

- Backend: 49 tests pass (`npm test` in `backend/`), and the backend typecheck passes.
- Frontend: `npm run typecheck` and `npm run build` pass in `frontend/`.
- Production server smoke-tested: page, logo, `/api/analysis`, `/api/blame.svg`, all chart endpoints,
  invalid input (400), rate-limit card.
- Layout checked in screenshots at desktop and phone widths. While GitHub was rate-limited, the evidence board
  was rendered from the backend's `acme/widgets` test fixture.
- The client bundle contains no Octokit or `GITHUB_TOKEN` code.
- README embed confirmed working on github.com.

See [Running and integration](./03-running-and-integration.md).
