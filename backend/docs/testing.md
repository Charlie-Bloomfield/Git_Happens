# Testing

```bash
npm test            # vitest run: no network access needed
npm run typecheck   # tsc --noEmit
```

## Suites (`src/analysis/__tests__/`)

| File | Covers |
| --- | --- |
| `units.test.ts` | Revert/lazy/large heuristics, time-zone conversion, bot detection, identity merging, score formula, repo input parsing |
| `computeAnalysis.test.ts` | The full scoring pipeline on the `acme/widgets` fixture: grouping, counts, exact scores, achievement order, determinism, time zones, contract shape |
| `github.test.ts` | Pagination cap and `truncated`, line stats fetching, rate-limit handling, error-code mapping, end-to-end `analyseRepository` |

## Fixtures

**`fixtures/teamRepo.ts`** is a small hand-made team where every expected number is worked out by hand
(see the comment block in the file):

| Developer | Setup | Expected |
| --- | --- | --- |
| bob | 7 commits: 2 reverts, 4 late-night, 2 large, 3 suspicious, 2 Friday evenings; one commit has no login but bob's email | score **71**; Most Wanted, Ctrl+Z Enthusiast, Night Owl, The Big Bang, Commit Message Poet, Friday Deployer |
| alice | 12 tidy weekday commits + 1 merge (skipped) | score 0; Carrying The Team, Suspiciously Clean |
| Carol C | 1 commit, no GitHub account | One-Hit Wonder |
| dependabot[bot] | 2 commits | skipped |

`commit({...})` builds a `CommitRecord` with defaults, which is useful for one-off unit cases.

**`fixtures/fakeOctokit.ts`** is a stand-in for the parts of Octokit the fetcher uses
(`repos.get`, `paginate.iterator`, `repos.getCommit`). It can inject errors (`repoError`, `listError`,
custom `getCommit`) and records call counts, so tests can check request budgets. `httpError(status, headers)`
builds Octokit-style errors, including rate-limit headers.

## Adding a rule

1. Add the heuristic to `heuristics.ts` and a case to `units.test.ts`.
2. Count it in `computeAnalysis.ts` and, if it affects scoring, in `scoring.ts`.
3. Add the achievement to `ACHIEVEMENT_RULES` (order matters).
4. Update the fixture expectations and `docs/scoring.md`.
