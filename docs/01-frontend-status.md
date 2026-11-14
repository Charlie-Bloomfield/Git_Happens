# Frontend status

## What is implemented

- A Next.js 16 app with a responsive landing page and repository input.
- Input normalization for `owner/repo` and HTTPS `github.com/owner/repo` URLs.
- A mock `RepositoryAnalysis` fixture for UI development.
- An SVG leaderboard renderer that sorts by blame score, displays up to five contributors, and escapes text for XML.
- `GET /api/blame.svg?repo=owner/repo`, which validates the repository and returns an SVG or a 400 response.
- A leaderboard preview, sample summary numbers, and a copyable README image snippet.
- Visible **DEMO DATA** labels in the page and SVG so sample results are never presented as real analysis.

## Current limitations

The endpoint currently returns the same sample contributors for every valid repository. No GitHub requests or real scoring run yet. The `Cache-Control` header caches the demo SVG response at the HTTP layer, but there is no cache for repository analysis. A snippet copied from localhost is only usable locally until the app is deployed to a public HTTPS domain.

Live analysis, achievement calculation, error states for GitHub failures, analysis caching, deployment, and an actual README embed test are still open items from the execution plan.

## Verification already performed

- `npm run build` completed successfully from `frontend/` after the folder move.
- `npm run typecheck` passed from `frontend/` after the folder move.
- In the browser, submitting a full GitHub URL updated the preview and snippet, and the copy button confirmed a successful copy.
- The SVG route returned `200` with `image/svg+xml` for a valid repository and `400` for an invalid one.

The commands should be rerun after changes to the analyser or route. See [Running and integration](./03-running-and-integration.md).
