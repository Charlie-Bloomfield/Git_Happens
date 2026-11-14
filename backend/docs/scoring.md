# Git Exposed — scoring & achievements

> **Entertainment only.** These heuristics describe commit *habits*. They do not prove bugs,
> blame, or incompetence. Every statistic links back to the commits that produced it.

## What is analysed

- The most recent **300 commits** on the default branch (configurable). Older history is ignored
  and the analysis is flagged `truncated`.
- **Merge commits** (more than one parent) are skipped.
- **Bots** are skipped: GitHub account type `Bot`, or names like `*[bot]`, `dependabot`, `renovate`,
  `github-actions`.
- **Line stats** need one extra API request per commit, so they're fetched for the most recent
  100 non-merge commits with a `GITHUB_TOKEN` (10 without). Large-commit detection only covers those.

## Identity

Commits are grouped by GitHub login (case-insensitive). Commits with no linked account are matched
to a login via the same author email where possible; otherwise they're grouped by email and shown
under the author's git name.

## Per-commit signals

| Signal | Rule |
| --- | --- |
| Revert | Message starts with `Revert`, contains `This reverts commit <sha>`, or `revert(ed) <sha>` / `revert "…"`. |
| Late night | Authored 00:00–04:59 in the analysis time zone (**UTC by default** — GitHub's REST API doesn't expose the author's own offset). |
| Large commit | ≥ 500 changed lines (additions + deletions) or ≥ 25 files. |
| Suspicious message | First line under 4 chars, or just `fix`, `wip`, `update`, `stuff`, `asdf`, `final final`, `please work`, `...` and friends. |
| Weekend | Saturday or Sunday (analysis time zone). |
| Friday evening | Friday, 16:00 or later (analysis time zone). |

## Blame score (0–100)

```
shamePoints = 3·reverts + 2·largeCommits + 1·lateNightCommits + 1·suspiciousMessages
blameScore  = min(100, round(100 · shamePoints / (2 · (commits + 5))))
```

- Dividing by commits normalises for volume, so prolific developers aren't punished for doing more.
- The `+ 5` smooths small samples: one unlucky commit doesn't top the leaderboard.
- Leaderboard order: blame score ↓, then commits ↓, then username A→Z. Same input ⇒ same output.

## Achievements

Listed in this order on each developer; anyone with none gets **Innocent (For Now)**.

| Title | Criteria |
| --- | --- |
| Most Wanted | Highest blame score in the repo (score > 0, at least 2 developers). Ties all win. |
| Ctrl+Z Enthusiast | ≥ 2 reverts. |
| Night Owl | ≥ 3 late-night commits and ≥ 20% of their commits. |
| The Big Bang | ≥ 2 large commits. |
| Commit Message Poet | ≥ 3 suspicious messages and ≥ 25% of their commits. |
| Weekend Warrior | ≥ 5 commits, ≥ 40% on weekends. |
| Friday Deployer | ≥ 2 Friday-evening commits. |
| Carrying The Team | Most commits in the repo (at least 2 developers). |
| One-Hit Wonder | Exactly 1 commit. |
| Suspiciously Clean | ≥ 10 commits and zero shame points. |

Rules live in `src/analysis/achievements.ts` (`ACHIEVEMENT_RULES`) so the UI can render the
criteria directly instead of duplicating this table.
