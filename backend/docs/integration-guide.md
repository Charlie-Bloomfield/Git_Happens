# Integration guide (for the server / SVG side)

> **Status:** implemented on the frontend in `frontend/src/lib/analysis-service.ts`,
> `frontend/src/app/api/blame.svg/route.ts` and `frontend/src/app/api/analysis/route.ts`.
> See `docs/03-running-and-integration.md` for the API and deployment notes. This guide explains the reasoning.

## Calling the analyser from a route

```ts
// From frontend/src/app/api/blame.svg/route.ts
import { analyseRepository, parseRepositoryInput, isAnalysisError } from '../../../../../backend/src/analysis';

export async function GET(request: Request) {
    const input = new URL(request.url).searchParams.get('repo') ?? '';
    try {
        const { owner, repo } = parseRepositoryInput(input);
        const analysis = await getCachedOrAnalyse(`${owner}/${repo}`.toLowerCase(), () =>
            analyseRepository(owner, repo),
        );
        return svgResponse(renderLeaderboard(analysis));
    } catch (error) {
        if (isAnalysisError(error)) return svgResponse(renderErrorCard(error.code, error.message), 200);
        throw error;
    }
}
```

Return error cards with **HTTP 200**. GitHub's image proxy (camo) shows a broken image for non-2xx
responses, which hides the friendly error card.

## Suggested error cards

| `code` | Card copy idea | Cache it? |
| --- | --- | --- |
| `INVALID_REPOSITORY` | "That's not a repo. Try owner/repo." | Long |
| `NOT_FOUND` | "Repo not found (or it's private, coward)." | ~10 min |
| `EMPTY_REPOSITORY` | "No commits, no crimes. Yet." | ~10 min |
| `RATE_LIMITED` | "GitHub needs a breather." (show `retryAt`) | Until `retryAt` |
| `GITHUB_ERROR` | "GitHub happened. Try again later." | ~1 min |

## Caching

- Key on the lowercased `owner/repo` (GitHub names are case-insensitive).
- Cache the **contract** (`RepositoryAnalysis`). It's small, plain JSON.
- Suggested TTL: 1–6 hours. Use `analysedAt` to show freshness on the card.
- De-duplicate requests already in flight for the same key, so a burst of README loads triggers only one analysis.
- Analysis takes about 1–3 s with default settings (mostly the line-stats requests).

## Wiring it into the Next.js app

The analyser lives outside `frontend/`. This is how the frontend is set up to use it:
- **Dependencies:** `npm run install:all` (in `frontend/`) installs both `frontend/` and `backend/` packages, so
  `@octokit/rest` resolves from `backend/node_modules`. Vercel uses the same command as its install step.
- **Compiling outside `frontend/`:** `next.config.ts` sets `outputFileTracingRoot` and `turbopack.root` to the repo root.
- **Path aliases:** `@backend/*` → `../backend/src/*` and `@shared/*` → `../shared/*` in `frontend/tsconfig.json`.
- **Runtime:** every route that calls the analyser sets `export const runtime = 'nodejs'`.

## Rendering notes

- **XML-escape `username` and `achievements`** before putting them in SVG (`& < > " '`).
  Usernames from git author names are arbitrary text.
- Get achievement descriptions from `ACHIEVEMENT_RULES` rather than hard-coding them.
- Label the card as entertainment; link to the dashboard or `docs/scoring.md` for the rules.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_TOKEN` | Recommended | Fine-grained token with **no** repo permissions is enough for public data. Server-side only. |
