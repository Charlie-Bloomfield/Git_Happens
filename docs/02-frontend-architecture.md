# Frontend architecture

## Repository layout

```text
Git_Happens/
├── package.json                      npm workspaces for frontend and backend
├── frontend/                         Next.js application
│   ├── src/app/page.tsx              Input and verdict states
│   ├── src/app/api/analysis/route.ts Live JSON analysis
│   ├── src/app/api/blame.svg/route.ts README image
│   └── src/lib/                    Parser, cache, demo fixture, SVG renderer
├── backend/src/analysis/             GitHub fetching, scoring, achievements
├── shared/analysis.ts                Shared analysis contract
└── docs/                             Project documentation
```

The separate [frontend](../frontend/) and [backend](../backend/) folders keep app and analysis code distinct. Both packages use [shared/analysis.ts](../shared/analysis.ts). Install from the repository root so Next.js can resolve the backend package's Octokit dependency and trace server files outside `frontend/`.

## Request flow

```text
Submit repository → parseRepository → GET /api/analysis → getRepositoryAnalysis
                                                         → analyseRepository (backend)
                                                         → GitHub API
                                  ↓ JSON
                          page stats and live verdict

SVG preview / README → GET /api/blame.svg → getRepositoryAnalysis → SVG renderer
```

The initial page shows a labelled fixture and calls the SVG route with `demo=1`. Once a user submits a repository, the page requests live JSON and points its image at the live SVG route. Both routes use [server-analysis.ts](../frontend/src/lib/server-analysis.ts), which caches successful results by normalized repository name for 15 minutes and coalesces concurrent requests in one server instance. The SVG response also has a short HTTP cache lifetime.

The analyser's `RepositoryAnalysis` contract includes contributor statistics, blame scores, achievements, repository name, and analysis time. The SVG renderer sorts by blame score, limits the card to five contributors, and escapes interpolated text. API errors are shown as text on the page and as SVG error cards for README embeds.
