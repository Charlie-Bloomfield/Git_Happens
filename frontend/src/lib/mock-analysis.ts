import type { RepositoryAnalysis } from "@shared/analysis";

export function mockAnalysis(repository: string): RepositoryAnalysis {
  return {
    repository,
    analysedAt: "2026-11-14T10:00:00.000Z",
    developers: [
      {
        username: "midnight-merge",
        commits: 48,
        reverts: 4,
        lateNightCommits: 17,
        largeCommits: 6,
        suspiciousMessages: 7,
        linesChanged: 8421,
        blameScore: 94,
        achievements: ["Midnight Menace", "Revert Royalty"],
      },
      {
        username: "commit-goblin",
        commits: 86,
        reverts: 1,
        lateNightCommits: 9,
        largeCommits: 3,
        suspiciousMessages: 12,
        linesChanged: 6102,
        blameScore: 81,
        achievements: ["Commit Goblin", "Code Arsonist"],
      },
      {
        username: "last-minute-fix",
        commits: 32,
        reverts: 2,
        lateNightCommits: 6,
        largeCommits: 2,
        suspiciousMessages: 5,
        linesChanged: 2940,
        blameScore: 67,
        achievements: ["Revert Royalty"],
      },
    ],
  };
}
