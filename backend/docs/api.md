# Public API

Import everything from `src/analysis/index.ts`.

## `analyseRepository(owner, repo, options?) → Promise<RepositoryAnalysis>`

Main deliverable. Fetches public commit metadata, analyses it and returns the shared contract.

## `analyseRepositoryDetailed(owner, repo, options?) → Promise<DetailedRepositoryAnalysis>`

The same pipeline, but it keeps evidence links and metadata (see [data-contract.md](data-contract.md)).

### `AnalyseOptions`

| Option | Default | Meaning |
| --- | --- | --- |
| `octokit` | `createOctokit()` | Inject a client (tests, custom auth) |
| `maxCommits` | `300` | Newest commits to read (100 per API request) |
| `maxDetailedCommits` | `100` with token, `10` without | Commits to fetch line stats for (1 request each) |
| `timeZone` | `"UTC"` | IANA zone for late-night / weekend / Friday detection |
| `includeBots` | `false` | Keep bot commits in the leaderboard |
| `now` | `new Date()` | Value for `analysedAt` (tests) |

Both functions throw `AnalysisError` (see below).

## `parseRepositoryInput(input) → { owner, repo }`

Accepts `owner/repo`, `https://github.com/owner/repo`, `github.com/owner/repo/tree/main/…`,
`owner/repo.git`, `git@github.com:owner/repo.git`, with query strings and trailing slashes ignored.
Throws `AnalysisError('INVALID_REPOSITORY')` for anything else, including non-GitHub hosts.

## `isValidRepositoryRef(owner, repo) → boolean`

GitHub naming rules: owner 1–39 alphanumerics/hyphens, not starting with `-`. Repo 1–100 of
`A–Z a–z 0–9 . _ -`, and not `.` or `..`.

## `computeAnalysis(repository, commits, options?) → DetailedRepositoryAnalysis`

Pure scoring over `CommitRecord[]`, with no network. Options: `now`, `timeZone`, `includeBots`,
`truncated`, `maxEvidencePerCategory` (default 5).

## `toRepositoryAnalysis(detailed) → RepositoryAnalysis`

Removes non-contract fields.

## Errors: `AnalysisError`

```ts
class AnalysisError extends Error {
    code: 'INVALID_REPOSITORY' | 'NOT_FOUND' | 'EMPTY_REPOSITORY' | 'RATE_LIMITED' | 'GITHUB_ERROR';
    retryAt?: string;  // ISO time the rate limit resets (RATE_LIMITED only)
}
isAnalysisError(e): e is AnalysisError
```

| Code | When |
| --- | --- |
| `INVALID_REPOSITORY` | Bad input format; no request made |
| `NOT_FOUND` | 404/451. The repo doesn't exist **or is private** |
| `EMPTY_REPOSITORY` | Repo has no commits (GitHub 409) |
| `RATE_LIMITED` | 429, or 403 with `x-ratelimit-remaining: 0` |
| `GITHUB_ERROR` | Anything else: 5xx, bad token (401), network failure, timeout |

## Rule constants (for the UI)

- `ACHIEVEMENT_RULES`: `{ title, criteria, test }[]` in award order. Render `title` + `criteria`.
- `FALLBACK_ACHIEVEMENT`: `{ title, criteria }`.
- `SCORE_WEIGHTS`, `PRIOR_COMMITS`: scoring formula inputs.
- `THRESHOLDS`: late-night hours, large-commit lines/files, Friday-evening hour.
