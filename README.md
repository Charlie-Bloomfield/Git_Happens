<div align="center">

<img src="frontend/src/app/icon.svg" alt="Git Exposed logo" width="96" height="96">

# Git Exposed

**Your commits. Our judgement.**

A roast engine for your Git history. Hand over a public GitHub repo and Git Exposed ranks its contributors by
their worst commit habits, hands out achievements nobody wants, and gives you a card to put in your README.

**[Try it live →](https://git-happens-peach.vercel.app)**

</div>

---

Built for a hackathon with the theme **Hate the User**: you paste in your own repo, and the site turns on you.

<p align="center">
  <img src="https://git-happens-peach.vercel.app/api/blame.svg?repo=Charlie-Bloomfield/Git_Happens" alt="Git Exposed leaderboard for this repository" width="640">
</p>

## Features

- **Hall of shame:** a live leaderboard of every contributor, ranked by blame score.
- **Achievements:** eleven tags, from *Most Wanted* ("Congratulations, you're the problem.") to *Suspiciously Clean*
  ("Nobody is this clean."). Hover a tag for its rule; click it to see who's charged.
- **Rap sheet:** each suspect's stats with links to the exact commits behind them.
- **The maths, shown:** a worked example breaks down anyone's score step by step.
- **Evidence board:** four charts (score breakdown, anatomy of shame, commit share, crime-time heatmap).
- **README embeds:** the leaderboard and every chart are live SVGs you can paste into any README, in dark, light or
  auto-matching themes.
- **Shareable links:** `/?repo=owner/repo` opens straight to a verdict.

## How it works

```text
owner/repo ─→ GitHub REST API ─→ commit metadata (latest 300 commits, default branch)
               (Octokit)          │
                                  ├─ skip merges and bots, group commits by person
                                  ├─ detect signals per commit
                                  ├─ blame score + achievements
                                  └─ cached analysis ─→ landing page, leaderboard SVG, chart SVGs
```

No code is downloaded or run. Git Exposed only reads public commit metadata.

### The blame score

Four signals carry weight:

| Signal | Rule | Weight |
| --- | --- | --- |
| Revert | Undoes another commit | ×3 |
| Large commit | 500+ lines or 25+ files | ×2 |
| Late night | Committed 00:00–05:00 UTC | ×1 |
| Suspicious message | `fix`, `wip`, `asdf`… or under 4 characters | ×1 |

```text
shamePoints = 3·reverts + 2·large + 1·lateNight + 1·suspicious
blameScore  = min(100, round(100 · shamePoints / (2 · (commits + 5))))
```

Dividing by commits means doing lots of work isn't punished, and the `+ 5` stops one bad commit from topping the
board. Full rules and achievement criteria: [backend/docs/scoring.md](backend/docs/scoring.md).

## Put it in your README

```md
![Git Exposed leaderboard](https://git-happens-peach.vercel.app/api/blame.svg?repo=OWNER/REPO)
```

Charts work the same way: `/api/charts/<chart>.svg?repo=OWNER/REPO`, where `<chart>` is `score-breakdown`,
`shame-mix`, `commit-share` or `heatmap`. Add `&theme=light` for GitHub's light mode, or copy the auto-theme
`<picture>` snippet from the site's **Embed** buttons. GitHub caches README images, so updates can take a while to
show up.

## API

| Endpoint | Returns |
| --- | --- |
| `GET /api/blame.svg?repo=owner/repo` | Leaderboard SVG (top 5). Errors come back as an SVG error card with status 200, so READMEs never show a broken image. |
| `GET /api/charts/<chart>.svg?repo=owner/repo[&theme=light]` | Chart SVG. |
| `GET /api/analysis?repo=owner/repo` | Full JSON analysis with evidence links. Errors are `{ error: { code, message } }` with 400/404/422/429/502. |

Results are cached in memory for an hour per repo. Details: [docs/03-running-and-integration.md](docs/03-running-and-integration.md).

## Run it locally

Requires Node.js 20.9 or later (the minimum for Next.js 16).

```sh
cd frontend
npm run install:all   # installs frontend/ and backend/ dependencies
npm run dev           # http://localhost:3000
```

Optional but recommended: put `GITHUB_TOKEN=...` in `frontend/.env.local`. Without it, GitHub allows 60 requests an
hour (about 4 analyses); with it, 5,000. A fine-grained token with no permissions is enough. Never expose it as a
`NEXT_PUBLIC_` variable.

| Command | Where | Does |
| --- | --- | --- |
| `npm run build` | `frontend/` | Production build |
| `npm run typecheck` | `frontend/` or `backend/` | TypeScript check |
| `npm test` | `backend/` | 49 analyser tests, no network needed |
| `npm run analyse -- owner/repo` | `backend/` | Analyse a repo from the command line |

## Project structure

```text
frontend/   Next.js 16 app: landing page, API routes, SVG renderers (deployed on Vercel)
backend/    Commit analyser: GitHub fetching, identity, signals, scoring, achievements
shared/     Data contract used by both sides
docs/       Project documentation
```

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion for React, Octokit, Vitest, Vercel.

## Limitations

- Public repositories only. Private repos show as "not found".
- Reads the latest 300 commits on the default branch. Large-commit detection covers the newest 100 (10 without a token).
- Times are in UTC, because GitHub's API doesn't give the author's own time zone.
- The scores are a joke. They measure commit habits, not how good anyone is at their job.

## Documentation

| Doc | Covers |
| --- | --- |
| [Project status](docs/01-frontend-status.md) | What's built, known limitations, how it was verified |
| [Architecture](docs/02-frontend-architecture.md) | Repository layout, data flow, keeping secrets server-side |
| [Running and integration](docs/03-running-and-integration.md) | Commands, API behaviour, caching, deployment |
| [Page guide and tone](docs/04-page-guide-and-tone.md) | Page walkthrough, demo script, how to write roast copy |
| [Hackathon plan](docs/05-hackathon-plan.md) | The original 10-hour plan (historical) |
| [Backend docs](backend/docs/README.md) | Analyser API, data contract, scoring, GitHub fetching, testing |

## Team

Built by [Charlie-Bloomfield](https://github.com/Charlie-Bloomfield) and [Kyrylo234](https://github.com/Kyrylo234).
