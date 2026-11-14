/**
 * Internal, GitHub-agnostic representation of a commit. The fetcher normalises
 * GitHub API responses into this shape so the scoring logic is pure and can be
 * tested with plain JSON fixtures.
 */
export interface CommitRecord {
    sha: string;
    /** Browser URL for the commit (evidence link). */
    url: string;
    message: string;
    /** ISO-8601 author date as returned by GitHub (UTC). */
    authoredAt: string;
    authorLogin: string | null;
    /** GitHub account type, e.g. "User" or "Bot". */
    authorType: string | null;
    authorName: string | null;
    authorEmail: string | null;
    parentCount: number;
    /** Line stats are only present when per-commit details were fetched. */
    additions?: number;
    deletions?: number;
    filesChanged?: number;
}

export type AnalysisErrorCode =
    | 'INVALID_REPOSITORY'
    | 'NOT_FOUND'
    | 'EMPTY_REPOSITORY'
    | 'RATE_LIMITED'
    | 'GITHUB_ERROR';

/** Typed error so the SVG route can render a specific error card per code. */
export class AnalysisError extends Error {
    readonly code: AnalysisErrorCode;
    /** For RATE_LIMITED: when the GitHub limit resets (ISO string), if known. */
    readonly retryAt?: string;

    constructor(code: AnalysisErrorCode, message: string, options?: { retryAt?: string; cause?: unknown }) {
        super(message, { cause: options?.cause });
        this.name = 'AnalysisError';
        this.code = code;
        this.retryAt = options?.retryAt;
    }
}

export function isAnalysisError(error: unknown): error is AnalysisError {
    return error instanceof AnalysisError;
}
