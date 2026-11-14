# Data contract

Source: `src/types/analysis.ts`. Both the backend and the frontend depend on this file.
**Don't change field names without agreeing on both sides.**

```ts
export interface DeveloperStats {
    username: string;          // GitHub login, or git author name if no linked account
    commits: number;           // non-merge, non-bot commits analysed
    reverts: number;
    lateNightCommits: number;  // 00:00–04:59 in the analysis time zone (UTC default)
    largeCommits: number;      // ≥500 lines or ≥25 files (only commits with line stats)
    blameScore: number;        // integer 0–100, see scoring.md
    achievements: string[];    // ordered titles, never empty
}

export interface RepositoryAnalysis {
    repository: string;        // canonical "Owner/Repo" as GitHub reports it
    analysedAt: string;        // ISO-8601 timestamp
    developers: DeveloperStats[]; // sorted: blameScore ↓, commits ↓, username A→Z
}
```

## Guarantees

- `developers` is sorted and deterministic for the same input.
- `achievements` always has at least one entry (fallback: `"Innocent (For Now)"`).
- `blameScore` is an integer in `[0, 100]`.
- `developers` can be empty if every commit was a merge or from a bot.
- The object is plain JSON (safe for `JSON.stringify` / KV caches).

## Extended types (dashboard / stretch goals)

`analyseRepositoryDetailed()` returns `DetailedRepositoryAnalysis`, a superset of the contract:

```ts
interface DeveloperProfile extends DeveloperStats {
    lazyMessages: number;
    weekendCommits: number;
    fridayEveningCommits: number;
    commitsWithLineStats: number;  // how many commits large-commit detection covered
    shamePoints: number;
    evidence: {                    // up to 5 GitHub commit URLs per category
        reverts: string[];
        lateNight: string[];
        large: string[];
        lazyMessages: string[];
    };
}

interface AnalysisMeta {
    commitsAnalysed: number;
    commitsWithLineStats: number;
    mergeCommitsSkipped: number;
    botCommitsSkipped: number;
    truncated: boolean;            // history was capped at maxCommits
    timeZone: string;
}

interface DetailedRepositoryAnalysis extends RepositoryAnalysis {
    developers: DeveloperProfile[];
    meta: AnalysisMeta;
}
```

Use `toRepositoryAnalysis(detailed)` to strip the extended version down to the contract.
