# Frontend architecture

## Repository layout

```text
Git_Happens/
├── frontend/                 Next.js application and npm package
│   ├── src/app/page.tsx      Landing page, input, preview, snippet
│   ├── src/app/globals.css   Responsive styling
│   ├── src/app/api/blame.svg/route.ts   Live SVG leaderboard / error card
│   ├── src/app/api/analysis/route.ts    Live JSON analysis
│   └── src/lib/              Parser, analysis service (cache), SVG renderer
├── backend/                  Commit analyser (see backend/docs)
├── shared/analysis.ts        Canonical analyser/frontend types
├── docs/                     Implementation documentation
└── README.md                 Project entry point and execution plan
```

The separate `frontend/` folder keeps Next.js dependencies and build files away from the backend. The root `shared/` folder holds the data contract both sides need. The frontend imports the analyser through the `@backend/*` path alias.

## Current data flow

```text
Repository input → parseRepository → selected owner/repo
   ├─→ fetch /api/analysis ─┐
   └─→ <img /api/blame.svg> ─┴→ getAnalysis()  (lib/analysis-service.ts: cache + de-duplication)
                                   └→ analyseRepositoryDetailed()  (backend/, GitHub via Octokit)
/api/analysis  → JSON → charge sheet + rap sheet
/api/blame.svg → generateLeaderboardSVG / generateErrorSVG → SVG preview / README image
```

Both routes share one server-side analysis service, so the page and the image always show the same result and
share a cache. The page imports only `@backend/analysis/achievements` (rule text) and types, never the
analyser itself, so Octokit stays out of the browser bundle.

## Shared contract

`shared/analysis.ts` defines `DeveloperStats` and `RepositoryAnalysis`. It follows the 10-hour execution plan: username, commit and revert counts, late-night, large-commit and suspicious-message counts, lines changed, blame score, achievements, repository name, and analysis timestamp. Charlie's `analyseRepository(owner, repo)` should return `Promise<RepositoryAnalysis>`.

The SVG renderer accepts a `RepositoryAnalysis` object and returns an SVG string. It must continue to XML-escape any text from GitHub before interpolation. The DEMO DATA badge is now optional (`{ demo: true }`) and off for live data. `generateErrorSVG(repository, code, retryAt)` renders error cards.
