import type { Octokit } from '@octokit/rest';

export interface FakeListItem {
    sha: string;
    html_url: string;
    commit: { message: string; author: { name: string; email: string; date: string } | null; committer: null };
    author: { login: string; type: string } | null;
    parents: { sha: string }[];
}

export function listItem(i: number, overrides: Partial<FakeListItem> = {}): FakeListItem {
    const sha = i.toString(16).padStart(40, '0');
    return {
        sha,
        html_url: `https://github.com/acme/widgets/commit/${sha}`,
        commit: {
            message: `Commit number ${i}`,
            author: { name: 'Dev', email: 'dev@example.com', date: '2026-03-02T12:00:00Z' },
            committer: null,
        },
        author: { login: 'dev', type: 'User' },
        parents: [{ sha: 'p' }],
        ...overrides,
    };
}

export function httpError(status: number, headers: Record<string, string> = {}) {
    return Object.assign(new Error(`HTTP ${status}`), { status, response: { headers } });
}

interface FakeConfig {
    fullName?: string;
    commits?: FakeListItem[];
    repoError?: unknown;
    listError?: unknown;
    getCommit?: (sha: string) => Promise<{ data: { stats?: { additions: number; deletions: number }; files?: unknown[] } }>;
}

/** Minimal stand-in for the bits of Octokit the fetcher uses. Records call counts. */
export function fakeOctokit(config: FakeConfig) {
    const calls = { get: 0, listPages: 0, getCommit: 0 };
    const listCommits = () => {
        throw new Error('use paginate.iterator');
    };
    const octokit = {
        rest: {
            repos: {
                get: async () => {
                    calls.get++;
                    if (config.repoError) throw config.repoError;
                    return { data: { full_name: config.fullName ?? 'acme/widgets' } };
                },
                listCommits,
                getCommit: async ({ ref }: { ref: string }) => {
                    calls.getCommit++;
                    if (config.getCommit) return config.getCommit(ref);
                    return { data: { stats: { additions: 1, deletions: 1 }, files: [{}] } };
                },
            },
        },
        paginate: {
            iterator: (_fn: unknown, params: { per_page: number }) =>
                (async function* () {
                    if (config.listError) throw config.listError;
                    const all = config.commits ?? [];
                    for (let i = 0; i < all.length; i += params.per_page) {
                        calls.listPages++;
                        yield { data: all.slice(i, i + params.per_page) };
                    }
                })(),
        },
    };
    return { octokit: octokit as unknown as Octokit, calls };
}
