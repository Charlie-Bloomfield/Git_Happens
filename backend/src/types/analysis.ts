// Shared data contract between the analyser (Charlie) and the server/SVG side (Person 2).
// Do not change field names without agreeing on both branches.

export interface DeveloperStats {
    username: string;
    commits: number;
    reverts: number;
    lateNightCommits: number;
    largeCommits: number;
    blameScore: number;
    achievements: string[];
}

export interface RepositoryAnalysis {
    repository: string;
    analysedAt: string;
    developers: DeveloperStats[];
}
