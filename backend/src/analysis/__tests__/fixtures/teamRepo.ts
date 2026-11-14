import type { CommitRecord } from '../../types';

let counter = 0;

export function commit(partial: Partial<CommitRecord> & Pick<CommitRecord, 'message' | 'authoredAt'>): CommitRecord {
    counter++;
    const sha = partial.sha ?? counter.toString(16).padStart(40, '0');
    return {
        sha,
        url: `https://github.com/acme/widgets/commit/${sha}`,
        authorLogin: null,
        authorType: null,
        authorName: null,
        authorEmail: null,
        parentCount: 1,
        ...partial,
    };
}

const alice = { authorLogin: 'alice', authorType: 'User', authorName: 'Alice A', authorEmail: 'alice@example.com' };
const bob = { authorLogin: 'bob', authorType: 'User', authorName: 'Bob B', authorEmail: 'bob@example.com' };
const small = { additions: 12, deletions: 3, filesChanged: 2 };

/**
 * acme/widgets — a tiny team with very predictable habits (all dates UTC, March 2026):
 *  - alice: 12 tidy weekday-daytime commits (+1 merge commit, which is ignored)
 *  - bob:   7 commits — 2 reverts, 4 late-night, 2 large, 3 lazy messages, 2 Friday evenings.
 *           One commit has no GitHub login but bob's email, so it must be mapped to bob.
 *  - carol: 1 commit, no GitHub account linked
 *  - dependabot[bot]: 2 commits, ignored as a bot
 *
 * Expected bob score: points = 3·2 + 2·2 + 4 + 3 = 17 → round(100·17 / (2·(7+5))) = 71
 */
export const teamRepoCommits: CommitRecord[] = [
    // bob
    commit({ ...bob, message: 'Revert "Add login page"', authoredAt: '2026-03-03T02:10:00Z', ...small }),
    commit({ ...bob, message: 'fix', authoredAt: '2026-03-04T03:00:00Z', additions: 800, deletions: 20, filesChanged: 4 }),
    commit({ ...bob, message: 'wip', authoredAt: '2026-03-05T01:30:00Z', additions: 40, deletions: 40, filesChanged: 30 }),
    commit({ ...bob, message: 'asdf', authoredAt: '2026-03-06T17:00:00Z', ...small }),
    commit({
        ...bob,
        message: 'Undo the caching change\n\nThis reverts commit abcdef1234567.',
        authoredAt: '2026-03-13T18:00:00Z',
        ...small,
    }),
    commit({ ...bob, message: 'Add search endpoint', authoredAt: '2026-03-09T04:15:00Z', ...small }),
    commit({ ...bob, authorLogin: null, authorType: null, message: 'Tweak button styles', authoredAt: '2026-03-10T11:00:00Z' }),

    // alice: 12 commits Mon–Thu, 10:00–14:00 UTC
    ...Array.from({ length: 12 }, (_, i) =>
        commit({
            ...alice,
            message: `Implement widget feature #${i + 1} with tests`,
            authoredAt: `2026-03-${String(16 + (i % 4)).padStart(2, '0')}T${String(10 + (i % 5)).padStart(2, '0')}:00:00Z`,
            ...small,
        }),
    ),
    commit({ ...alice, message: "Merge pull request #7 from bob/feature", authoredAt: '2026-03-20T03:00:00Z', parentCount: 2 }),

    // carol (no linked GitHub account)
    commit({ authorName: 'Carol C', authorEmail: 'carol@personal.dev', message: 'Fix typo in README', authoredAt: '2026-03-07T12:00:00Z' }),

    // bots
    commit({ authorLogin: 'dependabot[bot]', authorType: 'Bot', authorName: 'dependabot[bot]', message: 'Bump lodash', authoredAt: '2026-03-08T02:00:00Z' }),
    commit({ authorLogin: 'dependabot[bot]', authorType: 'Bot', authorName: 'dependabot[bot]', message: 'Bump vite', authoredAt: '2026-03-08T02:30:00Z' }),
];
