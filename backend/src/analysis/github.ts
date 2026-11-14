import { Octokit } from '@octokit/rest';
import { AnalysisError, type CommitRecord } from './types';

export interface FetchOptions {
    /** Max commits to read from history (newest first). */
    maxCommits: number;
    /** Max non-merge commits to fetch line stats for (1 extra API request each). */
    maxDetailedCommits: number;
    detailConcurrency?: number;
}

export interface FetchedHistory {
    fullName: string;
    commits: CommitRecord[];
    truncated: boolean;
}

/**
 * Server-side only. Uses GITHUB_TOKEN when set (5,000 req/h) — never expose it to the client.
 * Without a token GitHub allows 60 req/h per IP, which is fine for a cached demo.
 */
export function createOctokit(token = process.env.GITHUB_TOKEN): Octokit {
    return new Octokit({
        auth: token || undefined,
        userAgent: 'git-exposed',
        request: { timeout: 15_000 },
        // Request failures are mapped to AnalysisError by the caller; don't double-log them.
        log: { debug: () => {}, info: () => {}, warn: console.warn, error: () => {} },
    });
}

export async function fetchCommitHistory(
    octokit: Octokit,
    owner: string,
    repo: string,
    options: FetchOptions,
): Promise<FetchedHistory> {
    const repoInfo = await call(() => octokit.rest.repos.get({ owner, repo }), `${owner}/${repo}`);
    const fullName = repoInfo.data.full_name;

    const commits: CommitRecord[] = [];
    let truncated = false;

    try {
        const pages = octokit.paginate.iterator(octokit.rest.repos.listCommits, {
            owner,
            repo,
            per_page: 100,
        });
        outer: for await (const page of pages) {
            for (const item of page.data) {
                if (commits.length >= options.maxCommits) {
                    truncated = true;
                    break outer;
                }
                commits.push(normaliseListItem(item));
            }
        }
    } catch (error) {
        // GitHub answers 409 "Git Repository is empty." for repos without commits.
        if (statusOf(error) === 409) {
            throw new AnalysisError('EMPTY_REPOSITORY', `${fullName} has no commits yet.`, { cause: error });
        }
        throw toAnalysisError(error, fullName);
    }

    if (commits.length === 0) {
        throw new AnalysisError('EMPTY_REPOSITORY', `${fullName} has no commits yet.`);
    }

    await attachLineStats(octokit, owner, repo, commits, options);
    return { fullName, commits, truncated };
}

/**
 * The list endpoint doesn't include additions/deletions, so we fetch details for the
 * most recent non-merge commits. Failures here degrade gracefully (stats stay unknown)
 * unless we've hit the rate limit, in which case we stop requesting more.
 */
async function attachLineStats(
    octokit: Octokit,
    owner: string,
    repo: string,
    commits: CommitRecord[],
    options: FetchOptions,
): Promise<void> {
    const targets = commits.filter((c) => c.parentCount <= 1).slice(0, options.maxDetailedCommits);
    const concurrency = Math.max(1, options.detailConcurrency ?? 8);
    let next = 0;
    let rateLimited = false;

    const worker = async () => {
        while (!rateLimited && next < targets.length) {
            const commit = targets[next++]!;
            try {
                const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: commit.sha });
                commit.additions = data.stats?.additions ?? 0;
                commit.deletions = data.stats?.deletions ?? 0;
                commit.filesChanged = data.files?.length ?? 0;
            } catch (error) {
                if (isRateLimit(error)) rateLimited = true;
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
}

type ListCommitsItem = Awaited<ReturnType<Octokit['rest']['repos']['listCommits']>>['data'][number];

export function normaliseListItem(item: ListCommitsItem): CommitRecord {
    return {
        sha: item.sha,
        url: item.html_url,
        message: item.commit.message,
        authoredAt: item.commit.author?.date ?? item.commit.committer?.date ?? '',
        authorLogin: item.author && 'login' in item.author ? item.author.login : null,
        authorType: item.author && 'type' in item.author ? item.author.type : null,
        authorName: item.commit.author?.name ?? null,
        authorEmail: item.commit.author?.email ?? null,
        parentCount: item.parents.length,
    };
}

async function call<T>(fn: () => Promise<T>, label: string): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        throw toAnalysisError(error, label);
    }
}

function statusOf(error: unknown): number | undefined {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined;
}

function headersOf(error: unknown): Record<string, string | number | undefined> {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { headers?: Record<string, string | number | undefined> } }).response;
        return response?.headers ?? {};
    }
    return {};
}

function isRateLimit(error: unknown): boolean {
    const status = statusOf(error);
    if (status === 429) return true;
    return status === 403 && String(headersOf(error)['x-ratelimit-remaining']) === '0';
}

export function toAnalysisError(error: unknown, label: string): AnalysisError {
    if (error instanceof AnalysisError) return error;
    const status = statusOf(error);

    if (isRateLimit(error)) {
        const reset = Number(headersOf(error)['x-ratelimit-reset']);
        return new AnalysisError('RATE_LIMITED', 'GitHub rate limit reached. Try again later.', {
            retryAt: Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : undefined,
            cause: error,
        });
    }
    // Private repos also return 404 to unauthorised callers — out of scope for the MVP.
    if (status === 404 || status === 451) {
        return new AnalysisError('NOT_FOUND', `Repository ${label} was not found or is not public.`, { cause: error });
    }
    if (status === 409) {
        return new AnalysisError('EMPTY_REPOSITORY', `${label} has no commits yet.`, { cause: error });
    }
    return new AnalysisError('GITHUB_ERROR', `GitHub request for ${label} failed${status ? ` (HTTP ${status})` : ''}.`, {
        cause: error,
    });
}
