# Frontend status

## Implemented

- A responsive Next.js landing page with GitHub repository input, a clearly labelled initial demo, live loading and error states, and an automatic scroll to the verdict after submission.
- `GET /api/analysis?repo=owner/repo`, which calls the backend analyser and returns real `RepositoryAnalysis` JSON.
- `GET /api/blame.svg?repo=owner/repo`, which renders up to five ranked contributors from the same analyser for the on-page preview and README image. `demo=1` is reserved for the initial sample preview.
- Validation for `owner/repo` and HTTPS GitHub URLs, plus mapped errors for missing, private, empty, and rate-limited repositories.
- An in-memory, per-instance analysis cache with a 15-minute TTL and request deduplication, plus short HTTP caching for SVG responses.
- A copyable README Markdown embed after a successful live analysis. The SVG renderer XML-escapes text from GitHub.

## Verified

- `npm run build` passed from the repository root on 14 November 2026.
- Frontend and backend type checks passed, and all 48 backend tests passed.
- A live request for `Charlie-Bloomfield/Git_Happens` returned two contributors and eight commits; submitting the same repository in the browser displayed those numbers and a live SVG preview.
- Invalid input returned JSON 400 and an SVG error card with HTTP 200, as intended for image embeds.

## Remaining work

- Deploy to a public HTTPS domain and verify the image in a GitHub README. A localhost embed URL works only on the local machine.
- The in-memory cache is local to each server instance and does not persist across restarts or deployments. For multiple instances, use a shared cache.
- Anonymous GitHub requests are rate limited. Configure `GITHUB_TOKEN` on the server for a higher limit. The backend samples recent commits; see its integration guide for analysis limits.

See [Running and integration](./03-running-and-integration.md) for setup and route behavior.
