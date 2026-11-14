<div align="center">

<img src="frontend/src/app/icon.svg" alt="Git Exposed logo" width="96" height="96">

# Git Exposed

Put your team's bad commit habits on display with live README leaderboards and charts. A little public shame gives everyone a playful reason to commit better.

**[Try it live →](https://git-happens-peach.vercel.app)**

</div>

## Pick a block

Replace `OWNER/REPO` in any snippet with a public GitHub repository. The previews below use this project.

### Hall of Shame leaderboard

![Git Exposed leaderboard](https://git-happens-peach.vercel.app/api/blame.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed leaderboard](https://git-happens-peach.vercel.app/api/blame.svg?repo=OWNER/REPO)
```

### Score breakdown

![Git Exposed score breakdown](https://git-happens-peach.vercel.app/api/charts/score-breakdown.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed score breakdown](https://git-happens-peach.vercel.app/api/charts/score-breakdown.svg?repo=OWNER/REPO)
```

### Anatomy of shame

![Git Exposed anatomy of shame](https://git-happens-peach.vercel.app/api/charts/shame-mix.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed anatomy of shame](https://git-happens-peach.vercel.app/api/charts/shame-mix.svg?repo=OWNER/REPO)
```

### Commit share

![Git Exposed commit share](https://git-happens-peach.vercel.app/api/charts/commit-share.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed commit share](https://git-happens-peach.vercel.app/api/charts/commit-share.svg?repo=OWNER/REPO)
```

### Crime-time heatmap

![Git Exposed crime-time heatmap](https://git-happens-peach.vercel.app/api/charts/heatmap.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed crime-time heatmap](https://git-happens-peach.vercel.app/api/charts/heatmap.svg?repo=OWNER/REPO)
```

### Charges filed

![Git Exposed charges filed](https://git-happens-peach.vercel.app/api/charts/awards.svg?repo=Charlie-Bloomfield/Git_Happens)

```md
![Git Exposed charges filed](https://git-happens-peach.vercel.app/api/charts/awards.svg?repo=OWNER/REPO)
```

## Make it yours

Charts default to dark. Add `&theme=light` to a chart URL for light mode, or use the site's **Auto (match GitHub)** option to copy a `<picture>` embed that follows the reader's theme. GitHub may cache README images, so fresh results can take a while to appear.

## Run locally

Requires Node.js 20.9 or later.

```sh
cd frontend
npm run install:all
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For higher GitHub API limits, set `GITHUB_TOKEN` in `frontend/.env.local`.

[Scoring rules](backend/docs/scoring.md) · [Architecture](docs/02-frontend-architecture.md) · [Running and API details](docs/03-running-and-integration.md)

Built by [Charlie-Bloomfield](https://github.com/Charlie-Bloomfield) and [Kyrylo234](https://github.com/Kyrylo234).
