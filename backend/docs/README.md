# Git Happens — Backend docs

The backend turns a public GitHub repository's commit history into a `RepositoryAnalysis`:
a leaderboard of developers with blame scores and achievements. The frontend (SVG route,
landing page, cache) uses that object to render the card.

## Quick start

```bash
cd backend
npm install
npm test                                   # 48 unit/integration tests, no network
npm run typecheck
npm run analyse -- octocat/Spoon-Knife     # live analysis of a public repo
```

Set `GITHUB_TOKEN` (server-side only) to raise GitHub's rate limit from 60 to 5,000 requests/hour.

## Folder layout

```
backend/
├── docs/                    ← you are here
├── scripts/analyse.ts       CLI wrapper around the analyser
├── src/
│   └── analysis/
│       ├── index.ts         Public API: analyseRepository() and re-exports
│       ├── github.ts        Octokit client, pagination, line stats, error mapping
│       ├── computeAnalysis.ts  Pure stats → scores → achievements → leaderboard
│       ├── identity.ts      Contributor identity mapping + bot detection
│       ├── heuristics.ts    Per-commit signals (revert, late night, large, lazy…)
│       ├── scoring.ts       Blame score formula
│       ├── achievements.ts  Achievement rules
│       ├── repoInput.ts     Parse/validate "owner/repo" and GitHub URLs
│       ├── types.ts         CommitRecord + AnalysisError
│       └── __tests__/       Tests and fixtures
├── package.json
└── tsconfig.json

shared/analysis.ts           Shared data contract (frontend ⇄ backend), at the repo root
```

## Documents

| Doc | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | How the pieces fit together and why the pure/IO split exists |
| [data-contract.md](data-contract.md) | `RepositoryAnalysis`, `DeveloperStats` and the extended dashboard types |
| [api.md](api.md) | Every public function, its options and what it throws |
| [github-fetching.md](github-fetching.md) | GitHub API usage, pagination, caps, rate limits, error mapping |
| [identity.md](identity.md) | How commits are matched to developers; bot filtering |
| [scoring.md](scoring.md) | Signals, blame score formula and achievement criteria |
| [integration-guide.md](integration-guide.md) | How the frontend should call, cache and render errors |
| [cli.md](cli.md) | `npm run analyse` usage |
| [testing.md](testing.md) | Test suites, fixtures and the fake Octokit |
