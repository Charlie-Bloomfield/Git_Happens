import { describe, expect, it } from 'vitest';
import { fetchCommitHistory } from '../github';
import { analyseRepository } from '../index';
import { AnalysisError } from '../types';
import { fakeOctokit, httpError, listItem } from './fixtures/fakeOctokit';

const opts = { maxCommits: 300, maxDetailedCommits: 10 };

async function expectCode(promise: Promise<unknown>, code: string) {
    await expect(promise).rejects.toBeInstanceOf(AnalysisError);
    await expect(promise).rejects.toMatchObject({ code });
}

describe('fetchCommitHistory', () => {
    it('paginates and caps history', async () => {
        const commits = Array.from({ length: 250 }, (_, i) => listItem(i + 1));
        const { octokit, calls } = fakeOctokit({ commits });
        const history = await fetchCommitHistory(octokit, 'acme', 'widgets', { ...opts, maxCommits: 150 });
        expect(history.commits).toHaveLength(150);
        expect(history.truncated).toBe(true);
        expect(calls.listPages).toBe(2);
    });

    it('is not truncated when history fits exactly', async () => {
        const { octokit } = fakeOctokit({ commits: Array.from({ length: 100 }, (_, i) => listItem(i + 1)) });
        const history = await fetchCommitHistory(octokit, 'acme', 'widgets', { ...opts, maxCommits: 100 });
        expect(history.truncated).toBe(false);
    });

    it('fetches line stats only for the most recent non-merge commits', async () => {
        const commits = [listItem(1, { parents: [{ sha: 'a' }, { sha: 'b' }] }), ...Array.from({ length: 5 }, (_, i) => listItem(i + 2))];
        const { octokit, calls } = fakeOctokit({
            commits,
            getCommit: async () => ({ data: { stats: { additions: 600, deletions: 0 }, files: [{}, {}] } }),
        });
        const history = await fetchCommitHistory(octokit, 'acme', 'widgets', { ...opts, maxDetailedCommits: 3 });
        expect(calls.getCommit).toBe(3);
        expect(history.commits[0]!.additions).toBeUndefined(); // merge commit
        expect(history.commits[1]).toMatchObject({ additions: 600, deletions: 0, filesChanged: 2 });
        expect(history.commits[5]!.additions).toBeUndefined();
    });

    it('stops fetching details after hitting the rate limit but still returns history', async () => {
        const commits = Array.from({ length: 20 }, (_, i) => listItem(i + 1));
        const { octokit, calls } = fakeOctokit({
            commits,
            getCommit: async () => {
                throw httpError(403, { 'x-ratelimit-remaining': '0' });
            },
        });
        const history = await fetchCommitHistory(octokit, 'acme', 'widgets', { ...opts, maxDetailedCommits: 20, detailConcurrency: 1 });
        expect(history.commits).toHaveLength(20);
        expect(calls.getCommit).toBe(1);
    });

    it('normalises GitHub list items, including commits without a linked account', async () => {
        const { octokit } = fakeOctokit({ commits: [listItem(1, { author: null })] });
        const [c] = (await fetchCommitHistory(octokit, 'acme', 'widgets', opts)).commits;
        expect(c).toMatchObject({ authorLogin: null, authorName: 'Dev', authorEmail: 'dev@example.com', parentCount: 1 });
    });

    it('maps errors to typed codes', async () => {
        await expectCode(fetchCommitHistory(fakeOctokit({ repoError: httpError(404) }).octokit, 'a', 'b', opts), 'NOT_FOUND');
        await expectCode(fetchCommitHistory(fakeOctokit({ listError: httpError(409) }).octokit, 'a', 'b', opts), 'EMPTY_REPOSITORY');
        await expectCode(fetchCommitHistory(fakeOctokit({ commits: [] }).octokit, 'a', 'b', opts), 'EMPTY_REPOSITORY');
        await expectCode(fetchCommitHistory(fakeOctokit({ repoError: httpError(500) }).octokit, 'a', 'b', opts), 'GITHUB_ERROR');
        await expectCode(fetchCommitHistory(fakeOctokit({ repoError: new Error('ECONNRESET') }).octokit, 'a', 'b', opts), 'GITHUB_ERROR');
    });

    it('reports when the rate limit resets', async () => {
        const repoError = httpError(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' });
        await expect(fetchCommitHistory(fakeOctokit({ repoError }).octokit, 'a', 'b', opts)).rejects.toMatchObject({
            code: 'RATE_LIMITED',
            retryAt: new Date(1_800_000_000_000).toISOString(),
        });
    });
});

describe('analyseRepository', () => {
    it('returns the shared contract end-to-end with the canonical repo name', async () => {
        const { octokit } = fakeOctokit({ fullName: 'Acme/Widgets', commits: [listItem(1), listItem(2)] });
        const result = await analyseRepository('acme', 'widgets', { octokit, now: new Date('2026-11-14T00:00:00Z') });
        expect(result).toEqual({
            repository: 'Acme/Widgets',
            developers: [
                {
                    username: 'dev',
                    commits: 2,
                    reverts: 0,
                    lateNightCommits: 0,
                    largeCommits: 0,
                    suspiciousMessages: 0,
                    linesChanged: 4, // 2 commits × (1 addition + 1 deletion) from the fake getCommit
                    blameScore: 0,
                    achievements: ['Innocent (For Now)'],
                },
            ],
            analysedAt: '2026-11-14T00:00:00.000Z',
        });
    });

    it('rejects invalid identifiers before calling GitHub', async () => {
        const { octokit, calls } = fakeOctokit({});
        await expectCode(analyseRepository('../etc', 'passwd', { octokit }), 'INVALID_REPOSITORY');
        expect(calls.get).toBe(0);
    });
});
