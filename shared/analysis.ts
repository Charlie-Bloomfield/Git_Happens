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
