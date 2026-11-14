import type { Octokit } from '@octokit/rest';
import type { RepositoryAnalysis } from '../types/analysis';
import { computeAnalysis, toRepositoryAnalysis, type DetailedRepositoryAnalysis } from './computeAnalysis';
import { createOctokit, fetchCommitHistory } from './github';
import { isValidRepositoryRef } from './repoInput';
import { AnalysisError } from './types';

export interface AnalyseOptions {
    octokit?: Octokit;
    /** Default 300 (3 list requests). */
    maxCommits?: number;
    /** Default 100 with a token, 10 without (each costs one API request). */
    maxDetailedCommits?: number;
    timeZone?: string;
    includeBots?: boolean;
    now?: Date;
}

/** Full analysis including evidence links and metadata — for the dashboard. */
export async function analyseRepositoryDetailed(
    owner: string,
    repo: string,
    options: AnalyseOptions = {},
): Promise<DetailedRepositoryAnalysis> {
    if (!isValidRepositoryRef(owner, repo)) {
        throw new AnalysisError('INVALID_REPOSITORY', `"${owner}/${repo}" is not a valid GitHub repository.`);
    }
    const hasToken = Boolean(process.env.GITHUB_TOKEN);
    const octokit = options.octokit ?? createOctokit();

    const history = await fetchCommitHistory(octokit, owner, repo, {
        maxCommits: options.maxCommits ?? 300,
        maxDetailedCommits: options.maxDetailedCommits ?? (hasToken ? 100 : 10),
    });

    return computeAnalysis(history.fullName, history.commits, {
        now: options.now,
        timeZone: options.timeZone,
        includeBots: options.includeBots,
        truncated: history.truncated,
    });
}

/**
 * Main deliverable: analyse a public repository and return the shared contract.
 * Throws AnalysisError with a `code` the SVG route can map to an error card.
 */
export async function analyseRepository(
    owner: string,
    repo: string,
    options: AnalyseOptions = {},
): Promise<RepositoryAnalysis> {
    return toRepositoryAnalysis(await analyseRepositoryDetailed(owner, repo, options));
}

export { computeAnalysis, toRepositoryAnalysis } from './computeAnalysis';
export type { DetailedRepositoryAnalysis, DeveloperProfile, AnalysisMeta, Evidence } from './computeAnalysis';
export { parseRepositoryInput, isValidRepositoryRef } from './repoInput';
export type { RepositoryRef } from './repoInput';
export { AnalysisError, isAnalysisError } from './types';
export type { AnalysisErrorCode, CommitRecord } from './types';
export { ACHIEVEMENT_RULES, FALLBACK_ACHIEVEMENT } from './achievements';
export { SCORE_WEIGHTS, PRIOR_COMMITS } from './scoring';
export { THRESHOLDS } from './heuristics';
