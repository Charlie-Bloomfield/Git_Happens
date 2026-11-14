# Frontend architecture

## Repository layout

```text
Git_Happens/
├── frontend/                 Next.js application and npm package
│   ├── src/app/page.tsx      Landing page, input, preview, snippet
│   ├── src/app/globals.css   Responsive styling
│   ├── src/app/api/blame.svg/route.ts
│   └── src/lib/             Parser, demo fixture, SVG renderer
├── shared/analysis.ts        Canonical analyser/frontend types
├── docs/                     Implementation documentation
└── README.md                 Project entry point and execution plan
```

The separate `frontend/` folder keeps Next.js dependencies and build files away from future backend code. The root `shared/` folder holds the data contract both sides need. Backend code can be added in `backend/` without moving the frontend again.

## Current data flow

```text
Repository input → parseRepository → selected owner/repo
                                   ├─→ mockAnalysis → page summary
                                   └─→ /api/blame.svg → mockAnalysis
                                                        → generateLeaderboardSVG
                                                        → SVG preview / README image
```

The page and SVG route use the same fixture format but currently invoke it separately. When the real analyser arrives, both should consume one server-side analysis service so they show identical results and share a cache.

## Shared contract

`shared/analysis.ts` defines `DeveloperStats` and `RepositoryAnalysis`. It follows the 10-hour execution plan: username, commit and revert counts, late-night and suspicious-message counts, lines changed, blame score, achievements, repository name, and analysis timestamp. Charlie's `analyseRepository(owner, repo)` should return `Promise<RepositoryAnalysis>`.

The SVG renderer accepts a `RepositoryAnalysis` object and returns an SVG string. It must continue to XML-escape any text from GitHub before interpolation. The current demo badge is hardcoded into the renderer and must be removed or made conditional when live data is connected.
