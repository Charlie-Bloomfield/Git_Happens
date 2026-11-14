# Architecture

## Repository layout

```text
Git_Happens/
├── frontend/                          Next.js 16 app (deployed to Vercel)
│   ├── public/logo/                   Git Exposed logo
│   └── src/
│       ├── app/
│       │   ├── page.tsx               Landing page: hero, verdict, rap sheet
│       │   ├── layout.tsx             <html>, page title and description
│       │   ├── globals.css            All styling (dark, GitHub-inspired)
│       │   ├── icon.svg, apple-icon.png   Favicons
│       │   └── api/
│       │       ├── analysis/route.ts          JSON analysis
│       │       ├── blame.svg/route.ts         Leaderboard SVG / error card
│       │       └── charts/[chart]/route.ts    Chart SVGs
│       ├── components/
│       │   ├── insights.tsx           Charges, score explainer, evidence board, embed bar
│       │   └── ui/                    shadcn/ui, Magic UI and Aceternity components
│       └── lib/
│           ├── analysis-service.ts    Server-only cache around the analyser
│           ├── leaderboard-svg.ts     Leaderboard and error card renderer
│           ├── charts-svg.ts          Chart renderers (shared by page and API)
│           ├── score.ts               Score breakdown helpers for the explainer
│           ├── achievement-meta.ts    Achievement emoji, tone, tagline and description
│           └── repository.ts          owner/repo and URL parsing for the input
├── backend/                           Commit analyser (see backend/docs)
├── shared/analysis.ts                 Data contract shared by both sides
├── docs/                              Project documentation
└── README.md                          Project overview
```

`frontend/` keeps the Next.js dependencies and build output away from the analyser. The frontend imports the
analyser through the `@backend/*` alias and the contract through `@shared/*`.

The visual layer uses Tailwind CSS v4 and shadcn/ui primitives, with a Magic UI border beam on the
leaderboard card, an Aceternity spotlight behind the hero, and Motion for React for transitions.

## Data flow

```text
Repository input → parseRepository → owner/repo (also written to ?repo=)
   ├─→ fetch /api/analysis ───────┐
   ├─→ <img /api/blame.svg> ──────┼→ getAnalysis()      lib/analysis-service.ts (cache + de-duplication)
   └─  README embeds of charts ───┘     └→ analyseRepositoryDetailed()   backend/, GitHub via Octokit

/api/analysis       → JSON → charge sheet, charges, rap sheet, score explainer,
                             evidence board (charts rendered in the browser with lib/charts-svg.ts)
/api/blame.svg      → generateLeaderboardSVG / generateErrorSVG
/api/charts/<id>.svg → renderChart(id, analysis, theme)
```

All three routes share one analysis service, so the page, the leaderboard and the embeds always show the same
result and share a cache. The landing page renders the evidence-board charts itself from the JSON, using the same
renderer as the API, so the preview and the embed match exactly.

## Keeping secrets out of the browser

`page.tsx` and `insights.tsx` are client components. They import only types, `@backend/analysis/achievements`
(rule text) and the scoring constants, never the analyser itself. Octokit and `GITHUB_TOKEN` stay on the server.
`analysis-service.ts` must never be imported from a client component.

## Shared contract

`shared/analysis.ts` defines `DeveloperStats` and `RepositoryAnalysis`. The backend also returns the extended
`DetailedRepositoryAnalysis` (evidence links, extra counters, `meta.activity` for the heatmap).
See [backend/docs/data-contract.md](../backend/docs/data-contract.md).

The SVG renderers take analysis objects and return SVG strings. They must XML-escape any text from GitHub
before interpolating it. `generateErrorSVG(repository, code, retryAt)` renders error cards.
