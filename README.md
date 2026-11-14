# Git Happens — 10-Hour Hackathon Execution Plan

## Frontend status

The Next.js frontend is in `frontend/`, the canonical data contract is in `shared/`, and future backend code can live in `backend/`. The current UI and SVG use clearly labelled demo data while Charlie's GitHub analyser is developed.

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. Enter `owner/repo` or an HTTPS GitHub repository URL to preview the demo card and copy its README Markdown. The copied localhost URL will only work locally; deploy the app before embedding it in a public README.

Documentation:

- [Frontend status](docs/01-frontend-status.md) — completed work and limitations.
- [Frontend architecture](docs/02-frontend-architecture.md) — layout, data flow, and shared contract.
- [Running and integration](docs/03-running-and-integration.md) — commands, API behavior, and live analyser handoff.

Current status: the form, SVG renderer, endpoint, and copy interaction work with demo data. GitHub fetching, scoring, caching of analysis results, and deployment remain to be integrated.

**Team:** You and Charlie  
**Theme:** Hate the User  
**Goal:** Deploy a service that analyses a public GitHub repository, ranks contributors by questionable coding habits, awards humorous achievements, and generates an SVG leaderboard embeddable in a GitHub README.

## Team responsibilities

| You | Charlie |
|---|---|
| Next.js frontend and repository input | GitHub REST API integration using Octokit |
| SVG leaderboard renderer | Commit and contributor analysis |
| README Markdown snippet generator | Blame scoring and achievements |
| Public API endpoint, caching and deployment | Revert detection and data validation |
| Integration testing and demo | Analysis tests and technical explanation |

## 10-hour schedule

| Time | You | Charlie | Deliverable |
|---|---|---|---|
| **0–1h** | Create Next.js project, API route skeleton and shared types | Configure Octokit, token and analysis module | Repository and interface ready |
| **1–2h** | Build SVG leaderboard using mock data | Fetch commits and map contributors | Independent modules working |
| **2–3h** | Implement `/api/blame.svg?repo=owner/repo` | Calculate commit counts, late-night commits and large changes | First data-driven leaderboard |
| **3–4h** | Build landing page, repository input and preview | Add scoring and three achievements | Usable local prototype |
| **4–5h** | Integrate real analysis into endpoint and preview | Fix integration issues and test sample repos | **Working MVP** |
| **5–6h** | Generate copyable README embed snippet | Add basic revert detection | README integration ready |
| **6–7h** | Add caching, loading and error states | Improve scoring accuracy and handle missing authors | Stable application |
| **7–8h** | Deploy HTTPS service; test in a real GitHub README | Validate live data and edge cases | **Public, embeddable card** |
| **8–9h** | Polish UI and responsive design | Test results and improve achievements | Demo-ready build |
| **9–10h** | Rehearse demo and prepare submission | Explain analysis logic and limitations | **Final submission** |

## Shared contract — agree in hour 1

Create `shared/analysis.ts`:

```ts
export interface DeveloperStats {
  username: string;
  commits: number;
  reverts: number;
  lateNightCommits: number;
  suspiciousMessages: number;
  linesChanged: number;
  blameScore: number;
  achievements: string[];
}

export interface RepositoryAnalysis {
  repository: string;
  developers: DeveloperStats[];
  analysedAt: string;
}
```

Charlie provides:

```ts
async function analyseRepository(
  owner: string,
  repo: string
): Promise<RepositoryAnalysis>;
```

You provide:

```ts
function generateLeaderboardSVG(
  analysis: RepositoryAnalysis
): string;
```

Use mock `RepositoryAnalysis` data until the live integration is ready. Keep work on separate branches and merge early.

## MVP acceptance criteria — by hour 5

- [ ] User can enter a public GitHub repository URL or `owner/repo`.
- [ ] Server fetches recent commit history from GitHub.
- [ ] Analysis returns per-developer statistics and a reproducible score.
- [ ] At least three achievements are calculated from real data.
- [ ] SVG endpoint returns valid `image/svg+xml`.
- [ ] Landing page displays the generated leaderboard.
- [ ] README Markdown snippet can be copied.

## Deployment acceptance criteria — by hour 8

- [ ] Public HTTPS endpoint works without signing in for public repositories.
- [ ] Embedding the image in a GitHub README renders correctly.
- [ ] GitHub token is server-side only.
- [ ] Input validation and error responses handle nonexistent/private repositories.
- [ ] Results are cached to reduce GitHub API usage and response time.
- [ ] SVG text is escaped to prevent markup injection.

## README integration

```md
![Git Happens Leaderboard](https://YOUR-DOMAIN/api/blame.svg?repo=OWNER/REPO)
```

GitHub may cache proxied README images, so changes might not appear immediately. Avoid performing a full repository scan on every image request.

## Scoring and achievements

Start with objective, low-cost signals:

| Signal | Example achievement | Caveat |
|---|---|---|
| Commit count | Commit Goblin | Volume is not a measure of quality |
| Commits at unusual hours | Midnight Menace | Use UTC consistently or disclose timezone |
| Very large commits | Code Arsonist | Large commits can be legitimate |
| Revert messages | Revert Royalty | Message detection is only an approximation |

Make the leaderboard playful, not a claim about developer competence. Display the evidence or commit links where practical.

## Cut list if behind schedule

1. **Cut first:** AI-generated roasts, animations, advanced dashboards.
2. **Cut second:** Revert detection and code complexity scoring.
3. **Keep:** Real commit analysis, leaderboard, SVG endpoint, README snippet and deployment.
4. **Do not attempt in the MVP:** SZZ bug attribution or cloning and executing untrusted repositories.

## Demo script — 2–3 minutes

1. Explain the theme: **“Developers voluntarily install a card that publicly roasts their Git history.”**
2. Paste a public GitHub repository into the website.
3. Show real contributor rankings and achievements.
4. Copy the generated Markdown into a README.
5. Refresh the README to show the SVG card (allow for GitHub image caching).
6. Explain how GitHub data becomes scores, then mention safeguards and future improvements.

## Final checkpoint

At **hour 5**, stop adding features until the end-to-end flow works. At **hour 8**, freeze major development and focus on reliability and presentation. The hackathon win condition is a **live, shareable GitHub README card**, not a perfect blame algorithm.
