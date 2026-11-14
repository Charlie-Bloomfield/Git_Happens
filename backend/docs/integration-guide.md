# Integration guide (for the server / SVG side)

## Calling the analyser from a route

```ts
import { analyseRepository, parseRepositoryInput, isAnalysisError } from '<path>/backend/src/analysis';

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

## Rendering notes

- **XML-escape `username` and `achievements`** before putting them in SVG (`& < > " '`).
  Usernames from git author names are arbitrary text.
- Get achievement descriptions from `ACHIEVEMENT_RULES` rather than hard-coding them.
- Label the card as entertainment; link to the dashboard or `docs/scoring.md` for the rules.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_TOKEN` | Recommended | Fine-grained token with **no** repo permissions is enough for public data. Server-side only. |
