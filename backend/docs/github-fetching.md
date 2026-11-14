# GitHub fetching (`src/analysis/github.ts`)

## Client

`createOctokit(token = process.env.GITHUB_TOKEN)` creates an `@octokit/rest` client with:
- `auth` only if a token is set (unauthenticated otherwise)
- a 15-second request timeout
- Octokit's request logging silenced, because failures are reported as `AnalysisError` instead

## Request budget per analysis

| Step | Endpoint | Requests |
| --- | --- | --- |
| Repo lookup | `GET /repos/{o}/{r}` | 1 |
| Commit list | `GET /repos/{o}/{r}/commits?per_page=100` | ⌈maxCommits / 100⌉ (default 3) |
| Line stats | `GET /repos/{o}/{r}/commits/{sha}` | maxDetailedCommits (100 with token / 10 without) |

Default totals: about **104** requests with a token (limit 5,000/h) and about **14** without
(limit 60/h per IP). **The frontend must cache results**, or the unauthenticated limit runs out after
about 4 analyses.

## Behaviour

- **Repo lookup first.** This gives the canonical `full_name` (correct capitalisation) and turns a
  missing or private repo into `NOT_FOUND` early.
- **Pagination** uses `octokit.paginate.iterator` and stops as soon as `maxCommits` is reached. If more
  history exists, `truncated` is set to `true`.
- **Empty repos.** GitHub returns 409 on the commit list. We map it, and an empty list, to `EMPTY_REPOSITORY`.
- **Line stats** are fetched for the newest non-merge commits, 8 at a time. If one fails, only that
  commit loses its stats. If one hits the rate limit, the remaining stats requests are skipped, but
  the analysis still completes.
- **Normalisation.** `normaliseListItem()` maps GitHub's response to `CommitRecord`. `author` is `null`
  when the commit email isn't linked to a GitHub account; identity mapping handles that.

## Known limitations

- **Time zones:** the REST API returns author dates in UTC, so the author's local offset is lost.
  Late-night detection uses `timeZone` (default UTC).
- **Default branch only:** commits on other branches aren't analysed.
- **Partial large-commit coverage:** only the newest `maxDetailedCommits` commits have line stats.
  `meta.commitsWithLineStats` and `DeveloperProfile.commitsWithLineStats` show how many were covered.
- **Private repos** are out of scope. GitHub returns 404 for them, so they show as `NOT_FOUND`.
