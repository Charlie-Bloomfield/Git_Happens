# Running and integration

## Run locally

From the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. Use `owner/repo` or an HTTPS GitHub repository URL. `npm run build` checks the production build and `npm run typecheck` checks TypeScript.

## API behavior today

```text
GET /api/blame.svg?repo=octocat/Hello-World
```

Valid input returns an SVG with `Content-Type: image/svg+xml` and an `X-Git-Happens-Data: demo` header. Missing or malformed input returns `400` as plain text. The image contains a **DEMO DATA** badge. It is not a real GitHub analysis.

## Connect Charlie's analyser

1. Keep the public return type in `shared/analysis.ts` as the integration contract. Resolve any differences with Charlie's module there first.
2. Add a server-only function that calls `analyseRepository(owner, repo)` and caches its `RepositoryAnalysis` result by normalized repository name for a short time.
3. Replace the `mockAnalysis(repository)` call in `frontend/src/app/api/blame.svg/route.ts` with that function. Preserve validation, the SVG content type, and safe XML escaping. Remove the demo response header and demo badge for live results.
4. Add a JSON analysis endpoint that calls the same function. Make the landing page fetch it for preview and summary; show loading, empty-repository, rate-limit, missing/private-repository, and generic-error states.
5. Test one known public repository end to end, then deploy to a public HTTPS domain and paste the generated Markdown into a GitHub README. GitHub may cache the image, so a README refresh may lag behind fresh analysis.

Keep GitHub credentials on the server. Do not add a token to client components or a `NEXT_PUBLIC_` variable.
