# Architecture

```
analyseRepository(owner, repo)                     index.ts
  │
  ├─ isValidRepositoryRef()          validate       repoInput.ts
  │
  ├─ fetchCommitHistory()            I/O            github.ts
  │    ├─ GET /repos/{owner}/{repo}                 → canonical full name, 404 detection
  │    ├─ GET /repos/{owner}/{repo}/commits (paged) → up to maxCommits, newest first
  │    ├─ GET /repos/{owner}/{repo}/commits/{sha}   → line stats for newest N commits
  │    └─ normaliseListItem()                       → CommitRecord[]
  │
  ├─ computeAnalysis()               pure           computeAnalysis.ts
  │    ├─ skip merges and bots                      identity.ts
  │    ├─ resolve identity per commit               identity.ts
  │    ├─ per-commit signals                        heuristics.ts
  │    ├─ blameScore()                              scoring.ts
  │    ├─ awardAchievements()                       achievements.ts
  │    └─ sort leaderboard
  │
  └─ toRepositoryAnalysis()          strip to contract
```

## Design decisions

**Pure core, thin I/O shell.** Everything that decides scores is in `computeAnalysis()`, which
takes plain `CommitRecord` objects and returns data. It does no network calls and has no hidden
state (the clock is passed in as `now`), so it is deterministic and tested with fixtures.
`github.ts` is the only module that talks to GitHub.

**`CommitRecord` as the boundary type.** GitHub's API response shapes stay in `github.ts`.
If we switch to GraphQL or local `git log` later, only the normaliser changes.

**Two output levels.** `analyseRepositoryDetailed()` returns `DetailedRepositoryAnalysis`
(evidence links, extra counters, metadata) for the dashboard. `analyseRepository()` strips it to
the agreed `RepositoryAnalysis` contract for the SVG endpoint and cache.

**Typed errors.** Every failure becomes an `AnalysisError` with a `code`, so the frontend can
map codes to error cards without parsing messages.

**No caching here.** Caching belongs to the server layer (Person 2). The backend is stateless.

## Security notes

- Repository identifiers are validated against GitHub's naming rules before any request.
- No repository code is downloaded or executed; only commit metadata is read.
- Commit messages and usernames are **untrusted**. The backend returns them raw; the SVG renderer
  must XML-escape them.
- `GITHUB_TOKEN` is read from the server environment only and never included in output.
