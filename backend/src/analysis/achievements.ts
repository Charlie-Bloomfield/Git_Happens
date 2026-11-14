import type { DeveloperProfile } from './computeAnalysis';

export interface AchievementContext {
    developerCount: number;
    topBlameScore: number;
    topCommitCount: number;
}

export interface AchievementRule {
    title: string;
    /** Human-readable criteria, shown on the dashboard. */
    criteria: string;
    test: (dev: DeveloperProfile, ctx: AchievementContext) => boolean;
}

/** Order matters: achievements are listed on a developer in this order. */
export const ACHIEVEMENT_RULES: readonly AchievementRule[] = [
    {
        title: 'Most Wanted',
        criteria: 'Highest blame score in the repository (score above 0, at least 2 developers).',
        test: (d, c) => c.developerCount >= 2 && d.blameScore > 0 && d.blameScore === c.topBlameScore,
    },
    {
        title: 'Ctrl+Z Enthusiast',
        criteria: 'At least 2 commits that revert other commits.',
        test: (d) => d.reverts >= 2,
    },
    {
        title: 'Night Owl',
        criteria: 'At least 3 commits between 00:00 and 05:00, making up at least 20% of their commits.',
        test: (d) => d.lateNightCommits >= 3 && d.lateNightCommits / d.commits >= 0.2,
    },
    {
        title: 'The Big Bang',
        criteria: 'At least 2 commits touching 500+ lines or 25+ files.',
        test: (d) => d.largeCommits >= 2,
    },
    {
        title: 'Commit Message Poet',
        criteria: 'At least 3 commits with messages like "fix", "wip" or "asdf", making up at least 25% of their commits.',
        test: (d) => d.suspiciousMessages >= 3 && d.suspiciousMessages / d.commits >= 0.25,
    },
    {
        title: 'Weekend Warrior',
        criteria: 'At least 5 commits, with 40% or more made on Saturday or Sunday.',
        test: (d) => d.commits >= 5 && d.weekendCommits / d.commits >= 0.4,
    },
    {
        title: 'Friday Deployer',
        criteria: 'At least 2 commits on a Friday after 16:00.',
        test: (d) => d.fridayEveningCommits >= 2,
    },
    {
        title: 'Carrying The Team',
        criteria: 'Most commits in the repository (at least 2 developers).',
        test: (d, c) => c.developerCount >= 2 && d.commits === c.topCommitCount,
    },
    {
        title: 'One-Hit Wonder',
        criteria: 'Exactly one commit.',
        test: (d) => d.commits === 1,
    },
    {
        title: 'Suspiciously Clean',
        criteria: 'At least 10 commits and not a single shame point. What are they hiding?',
        test: (d) => d.commits >= 10 && d.shamePoints === 0,
    },
];

/** Awarded when nothing else applies, so every leaderboard row has a title. */
export const FALLBACK_ACHIEVEMENT: Pick<AchievementRule, 'title' | 'criteria'> = {
    title: 'Innocent (For Now)',
    criteria: 'No other achievement earned yet.',
};

export function awardAchievements(dev: DeveloperProfile, ctx: AchievementContext): string[] {
    const earned = ACHIEVEMENT_RULES.filter((rule) => rule.test(dev, ctx)).map((rule) => rule.title);
    return earned.length > 0 ? earned : [FALLBACK_ACHIEVEMENT.title];
}
