// Pure helpers that explain the blame score. Safe for client and server: imports the
// scoring constants directly (not "@backend/analysis") so Octokit stays out of the client bundle.
import { POINTS_FOR_MAX_SCORE_PER_COMMIT, PRIOR_COMMITS, SCORE_WEIGHTS } from "@backend/analysis/scoring";
import type { DeveloperStats } from "@shared/analysis";

export type SignalKey = "reverts" | "largeCommits" | "lateNightCommits" | "suspiciousMessages";

export interface Signal {
  key: SignalKey;
  label: string;
  short: string;
  weight: number;
  description: string;
}

/** Fixed order = fixed colour slot in every chart. Never reorder by value. */
export const SIGNALS: readonly Signal[] = [
  { key: "reverts", label: "Reverts", short: "revert", weight: SCORE_WEIGHTS.revert, description: "Commits that undo other commits. The costliest sin: someone shipped something that had to come back out." },
  { key: "largeCommits", label: "Large commits", short: "large", weight: SCORE_WEIGHTS.largeCommit, description: "500+ changed lines or 25+ files in one go. Good luck reviewing that." },
  { key: "lateNightCommits", label: "Late-night commits", short: "late-night", weight: SCORE_WEIGHTS.lateNightCommit, description: "Authored between 00:00 and 05:00. Nothing good is committed after midnight." },
  { key: "suspiciousMessages", label: "Suspicious messages", short: "suspicious", weight: SCORE_WEIGHTS.suspiciousMessage, description: "Messages like \"fix\", \"wip\", \"asdf\" or anything under four characters." },
];

export const SCORE_CONSTANTS = {
  priorCommits: PRIOR_COMMITS,
  pointsForMaxPerCommit: POINTS_FOR_MAX_SCORE_PER_COMMIT,
} as const;

export interface SignalContribution extends Signal {
  count: number;
  points: number;
  /** Score points this signal contributes after normalising (and after scaling down if capped). */
  scoreShare: number;
}

export interface ScoreBreakdown {
  contributions: SignalContribution[];
  shamePoints: number;
  /** 2 · (commits + 5) */
  denominator: number;
  /** Unrounded, uncapped score. */
  raw: number;
  score: number;
  capped: boolean;
}

export function scoreBreakdown(dev: Pick<DeveloperStats, "commits" | SignalKey>): ScoreBreakdown {
  const denominator = POINTS_FOR_MAX_SCORE_PER_COMMIT * (dev.commits + PRIOR_COMMITS);
  const base = SIGNALS.map((signal) => {
    const count = dev[signal.key];
    const points = count * signal.weight;
    return { ...signal, count, points, scoreShare: dev.commits > 0 ? (100 * points) / denominator : 0 };
  });
  const shamePoints = base.reduce((sum, c) => sum + c.points, 0);
  const raw = dev.commits > 0 ? (100 * shamePoints) / denominator : 0;
  const capped = raw > 100;
  const scale = capped ? 100 / raw : 1;
  return {
    contributions: base.map((c) => ({ ...c, scoreShare: c.scoreShare * scale })),
    shamePoints,
    denominator,
    raw,
    score: Math.min(100, Math.round(raw)),
    capped,
  };
}
