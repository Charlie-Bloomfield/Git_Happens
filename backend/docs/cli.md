# CLI: `npm run analyse`

`scripts/analyse.ts` runs the analyser against a live repository and prints JSON.

```bash
npm run analyse -- <owner/repo | GitHub URL> [--detailed] [--tz=<IANA zone>] [--max=<n>]
```

| Flag | Effect |
| --- | --- |
| `--detailed` | Print `DetailedRepositoryAnalysis` (evidence links + `meta`) |
| `--tz=Europe/London` | Time zone for late-night / weekend / Friday detection |
| `--max=50` | Cap on commits analysed (default 300) |

Examples:

```bash
npm run analyse -- octocat/Spoon-Knife
npm run analyse -- https://github.com/sindresorhus/is --detailed --max=200
GITHUB_TOKEN=... npm run analyse -- vercel/next.js --max=500
```

Exit codes: `0` success; `1` usage error; `2` an `AnalysisError` (printed as `[CODE] message`).
