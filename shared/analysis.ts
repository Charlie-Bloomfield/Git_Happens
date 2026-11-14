// Canonical contract between backend/ (analyser) and frontend/ (SVG + site).
// Agree changes with both sides before editing.

export interface DeveloperStats {
  username: string;
  commits: number;
  reverts: number;
  lateNightCommits: number;
  largeCommits: number;
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
