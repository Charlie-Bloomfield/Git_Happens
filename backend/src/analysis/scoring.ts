/**
 * Blame score — entertainment only.
 *
 *   shamePoints = 3·reverts + 2·largeCommits + 1·lateNightCommits + 1·suspiciousMessages
 *   blameScore  = min(100, round(100 · shamePoints / (2 · (commits + PRIOR_COMMITS))))
 *
 * Dividing by commit count normalises for contribution volume, so prolific developers
 * are not punished for simply doing more work. PRIOR_COMMITS smooths tiny samples so a
 * developer with one unlucky commit doesn't top the board. An average of 2 shame points
 * per commit (on a large sample) maps to 100.
 */
export const SCORE_WEIGHTS = {
    revert: 3,
    largeCommit: 2,
    lateNightCommit: 1,
    suspiciousMessage: 1,
} as const;

export const PRIOR_COMMITS = 5;
const POINTS_FOR_MAX_SCORE_PER_COMMIT = 2;

export interface ScoreInputs {
    commits: number;
    reverts: number;
    largeCommits: number;
    lateNightCommits: number;
    suspiciousMessages: number;
}

export function shamePoints(s: ScoreInputs): number {
    return (
        SCORE_WEIGHTS.revert * s.reverts +
        SCORE_WEIGHTS.largeCommit * s.largeCommits +
        SCORE_WEIGHTS.lateNightCommit * s.lateNightCommits +
        SCORE_WEIGHTS.suspiciousMessage * s.suspiciousMessages
    );
}

export function blameScore(s: ScoreInputs): number {
    if (s.commits <= 0) return 0;
    const raw = (100 * shamePoints(s)) / (POINTS_FOR_MAX_SCORE_PER_COMMIT * (s.commits + PRIOR_COMMITS));
    return Math.min(100, Math.round(raw));
}
