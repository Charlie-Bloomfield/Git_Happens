import type { DeveloperStats, RepositoryAnalysis } from '../../../shared/analysis';
import { awardAchievements } from './achievements';
import {
    isFridayEvening,
    isLargeCommit,
    isLateNight,
    isSuspiciousMessage,
    isMergeCommit,
    isRevertCommit,
    isWeekend,
    localTime,
} from './heuristics';
import { createIdentityResolver, isBotCommit } from './identity';
import { blameScore, shamePoints } from './scoring';
import type { CommitRecord } from './types';

export interface Evidence {
    reverts: string[];
    lateNight: string[];
    large: string[];
    suspiciousMessages: string[];
}

/** Superset of the shared DeveloperStats with the extra detail the dashboard can use. */
export interface DeveloperProfile extends DeveloperStats {
    weekendCommits: number;
    fridayEveningCommits: number;
    /** Commits for which line stats were available (large-commit detection coverage). */
    commitsWithLineStats: number;
    shamePoints: number;
    /** Commit URLs supporting each statistic (capped per category). */
    evidence: Evidence;
}

export interface AnalysisMeta {
    commitsAnalysed: number;
    commitsWithLineStats: number;
    mergeCommitsSkipped: number;
    botCommitsSkipped: number;
    /** True when the commit history was capped and older commits were not analysed. */
    truncated: boolean;
    timeZone: string;
}

export interface DetailedRepositoryAnalysis extends RepositoryAnalysis {
    developers: DeveloperProfile[];
    meta: AnalysisMeta;
}

export interface ComputeOptions {
    now?: Date;
    /** IANA time zone used for late-night / weekend detection. Default "UTC". */
    timeZone?: string;
    includeBots?: boolean;
    truncated?: boolean;
    maxEvidencePerCategory?: number;
}

/** Pure, deterministic: same commits + options ⇒ same output. */
export function computeAnalysis(
    repository: string,
    commits: readonly CommitRecord[],
    options: ComputeOptions = {},
): DetailedRepositoryAnalysis {
    const timeZone = options.timeZone ?? 'UTC';
    const maxEvidence = options.maxEvidencePerCategory ?? 5;
    const resolve = createIdentityResolver(commits);
    const byKey = new Map<string, DeveloperProfile>();

    let mergeCommitsSkipped = 0;
    let botCommitsSkipped = 0;
    let commitsAnalysed = 0;
    let commitsWithLineStats = 0;

    for (const commit of commits) {
        if (isMergeCommit(commit)) {
            mergeCommitsSkipped++;
            continue;
        }
        if (!options.includeBots && isBotCommit(commit)) {
            botCommitsSkipped++;
            continue;
        }
        commitsAnalysed++;

        const identity = resolve(commit);
        let dev = byKey.get(identity.key);
        if (!dev) {
            dev = emptyProfile(identity.username);
            byKey.set(identity.key, dev);
        }

        const time = localTime(commit.authoredAt, timeZone);
        const large = isLargeCommit(commit);
        const add = (list: string[]) => {
            if (list.length < maxEvidence) list.push(commit.url);
        };

        dev.commits++;
        if (large !== null) {
            dev.commitsWithLineStats++;
            commitsWithLineStats++;
            dev.linesChanged += (commit.additions ?? 0) + (commit.deletions ?? 0);
        }
        if (isRevertCommit(commit)) {
            dev.reverts++;
            add(dev.evidence.reverts);
        }
        if (isLateNight(time)) {
            dev.lateNightCommits++;
            add(dev.evidence.lateNight);
        }
        if (large) {
            dev.largeCommits++;
            add(dev.evidence.large);
        }
        if (isSuspiciousMessage(commit)) {
            dev.suspiciousMessages++;
            add(dev.evidence.suspiciousMessages);
        }
        if (isWeekend(time)) dev.weekendCommits++;
        if (isFridayEvening(time)) dev.fridayEveningCommits++;
    }

    const developers = [...byKey.values()];
    for (const dev of developers) {
        dev.shamePoints = shamePoints(dev);
        dev.blameScore = blameScore(dev);
    }

    const ctx = {
        developerCount: developers.length,
        topBlameScore: Math.max(0, ...developers.map((d) => d.blameScore)),
        topCommitCount: Math.max(0, ...developers.map((d) => d.commits)),
    };
    for (const dev of developers) dev.achievements = awardAchievements(dev, ctx);

    developers.sort(
        (a, b) =>
            b.blameScore - a.blameScore ||
            b.commits - a.commits ||
            a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
    );

    return {
        repository,
        analysedAt: (options.now ?? new Date()).toISOString(),
        developers,
        meta: {
            commitsAnalysed,
            commitsWithLineStats,
            mergeCommitsSkipped,
            botCommitsSkipped,
            truncated: options.truncated ?? false,
            timeZone,
        },
    };
}

/** Strips everything not in the shared contract (for the SVG endpoint / cache). */
export function toRepositoryAnalysis(detailed: DetailedRepositoryAnalysis): RepositoryAnalysis {
    return {
        repository: detailed.repository,
        developers: detailed.developers.map((d) => ({
            username: d.username,
            commits: d.commits,
            reverts: d.reverts,
            lateNightCommits: d.lateNightCommits,
            largeCommits: d.largeCommits,
            suspiciousMessages: d.suspiciousMessages,
            linesChanged: d.linesChanged,
            blameScore: d.blameScore,
            achievements: [...d.achievements],
        })),
        analysedAt: detailed.analysedAt,
    };
}

function emptyProfile(username: string): DeveloperProfile {
    return {
        username,
        commits: 0,
        reverts: 0,
        lateNightCommits: 0,
        largeCommits: 0,
        suspiciousMessages: 0,
        linesChanged: 0,
        blameScore: 0,
        achievements: [],
        weekendCommits: 0,
        fridayEveningCommits: 0,
        commitsWithLineStats: 0,
        shamePoints: 0,
        evidence: { reverts: [], lateNight: [], large: [], suspiciousMessages: [] },
    };
}
