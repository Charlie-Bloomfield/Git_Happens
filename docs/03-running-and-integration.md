# Running and integration

## Run locally

From the repository root:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` and submit `owner/repo` or an HTTPS GitHub repository URL. A server-side `GITHUB_TOKEN` is optional but raises the GitHub API rate limit. Never put the token in a `NEXT_PUBLIC_` variable.

Verification commands:

```sh
npm run build
npm run typecheck
npm run test:backend
```

## API

- `GET /api/analysis?repo=owner/repo` returns real analysis as JSON. Invalid input returns 400; missing or private repositories return 404; empty repositories return 409; GitHub rate limits return 429; upstream failures return 502.
- `GET /api/blame.svg?repo=owner/repo` returns a live `image/svg+xml` leaderboard. If analysis fails, it returns a readable SVG error card with HTTP 200 so README image proxies can display the message. The `X-Git-Happens-Error` header carries the error code.
- `GET /api/blame.svg?repo=owner/repo&demo=1` returns the labelled sample card used only before a repository is submitted.

Successful analysis is cached in memory for 15 minutes per server instance. Concurrent requests for one repository share the same in-flight analysis. The SVG route also sends `Cache-Control` headers. These caches reduce GitHub requests but are not shared between deployed instances.

## README embed and deployment

After a successful analysis, copy the Markdown shown on the page. On localhost it looks like:

```md
![Git Happens leaderboard](http://localhost:3000/api/blame.svg?repo=OWNER%2FREPO)
```

Deploy the app from the repository root so both workspaces and the root lockfile are installed. Use the public HTTPS origin in the embed, then check the image in a GitHub README. GitHub proxies and caches README images, so updates may appear after the server cache expires. For multi-instance deployment, replace the in-memory cache with a shared store. See the [backend integration guide](../backend/docs/integration-guide.md) for GitHub sampling and token details.
