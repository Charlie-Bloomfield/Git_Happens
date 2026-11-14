import { describe, expect, it } from 'vitest';
import { isLargeCommit, isLazyMessage, isRevertCommit, localTime } from '../heuristics';
import { createIdentityResolver, isBotCommit } from '../identity';
import { parseRepositoryInput } from '../repoInput';
import { blameScore } from '../scoring';
import { AnalysisError } from '../types';
import { commit } from './fixtures/teamRepo';

const at = '2026-03-02T12:00:00Z';

describe('heuristics', () => {
    it.each([
        ['Revert "Add thing"', true],
        ['Something\n\nThis reverts commit 0123456789abcdef.', true],
        ['reverted 1a2b3c4d because it broke prod', true],
        ['Add revert button to editor', false],
        ['Prevent reverting state on unmount', false],
    ])('isRevertCommit(%j) = %s', (message, expected) => {
        expect(isRevertCommit(commit({ message, authoredAt: at }))).toBe(expected);
    });

    it.each([
        ['fix', true],
        ['WIP', true],
        ['asdfasdf', true],
        ['...', true],
        ['ok', true],
        ['final final', true],
        ['Fix null check in parser', false],
        ['Update README with setup steps', false],
    ])('isLazyMessage(%j) = %s', (message, expected) => {
        expect(isLazyMessage(commit({ message, authoredAt: at }))).toBe(expected);
    });

    it('large commit detection is unknown without stats', () => {
        expect(isLargeCommit(commit({ message: 'x', authoredAt: at }))).toBeNull();
        expect(isLargeCommit(commit({ message: 'x', authoredAt: at, additions: 499, deletions: 1 }))).toBe(true);
        expect(isLargeCommit(commit({ message: 'x', authoredAt: at, additions: 10, filesChanged: 25 }))).toBe(true);
        expect(isLargeCommit(commit({ message: 'x', authoredAt: at, additions: 10, deletions: 10 }))).toBe(false);
    });

    it('localTime converts to a time zone and tolerates bad dates', () => {
        expect(localTime('2026-03-06T17:00:00Z', 'UTC')).toEqual({ hour: 17, weekday: 5 });
        expect(localTime('2026-03-06T17:00:00Z', 'Asia/Tokyo')).toEqual({ hour: 2, weekday: 6 });
        expect(localTime('not a date', 'UTC')).toBeNull();
    });
});

describe('identity', () => {
    it('detects bots by type and name', () => {
        expect(isBotCommit(commit({ message: 'x', authoredAt: at, authorType: 'Bot' }))).toBe(true);
        expect(isBotCommit(commit({ message: 'x', authoredAt: at, authorName: 'renovate[bot]' }))).toBe(true);
        expect(isBotCommit(commit({ message: 'x', authoredAt: at, authorEmail: 'github-actions@github.com' }))).toBe(true);
        expect(isBotCommit(commit({ message: 'x', authoredAt: at, authorLogin: 'robotics-fan' }))).toBe(false);
    });

    it('merges logins case-insensitively and maps emails to logins', () => {
        const a = commit({ message: 'x', authoredAt: at, authorLogin: 'Dana', authorEmail: 'Dana@Example.com' });
        const b = commit({ message: 'x', authoredAt: at, authorLogin: 'dana' });
        const c = commit({ message: 'x', authoredAt: at, authorEmail: 'dana@example.com', authorName: 'D' });
        const resolve = createIdentityResolver([a, b, c]);
        expect(new Set([a, b, c].map((x) => resolve(x).key)).size).toBe(1);
        expect(resolve(c).username).toBe('Dana');
    });
});

describe('scoring', () => {
    it('normalises by volume and caps at 100', () => {
        expect(blameScore({ commits: 0, reverts: 0, largeCommits: 0, lateNightCommits: 0, lazyMessages: 0 })).toBe(0);
        // one late-night commit is smoothed: 100·1 / (2·6) = 8.33 → 8
        expect(blameScore({ commits: 1, reverts: 0, largeCommits: 0, lateNightCommits: 1, lazyMessages: 0 })).toBe(8);
        expect(blameScore({ commits: 2, reverts: 5, largeCommits: 2, lateNightCommits: 2, lazyMessages: 2 })).toBe(100);
        const few = blameScore({ commits: 10, reverts: 1, largeCommits: 0, lateNightCommits: 0, lazyMessages: 0 });
        const many = blameScore({ commits: 100, reverts: 1, largeCommits: 0, lateNightCommits: 0, lazyMessages: 0 });
        expect(many).toBeLessThan(few);
    });
});

describe('parseRepositoryInput', () => {
    it.each([
        ['vercel/next.js', 'vercel', 'next.js'],
        ['https://github.com/vercel/next.js', 'vercel', 'next.js'],
        ['github.com/vercel/next.js/tree/canary/packages', 'vercel', 'next.js'],
        ['  https://www.github.com/octo-org/my_repo.git/  ', 'octo-org', 'my_repo'],
        ['git@github.com:octo-org/repo.git', 'octo-org', 'repo'],
        ['https://github.com/a/b?tab=readme', 'a', 'b'],
    ])('parses %j', (input, owner, repo) => {
        expect(parseRepositoryInput(input)).toEqual({ owner, repo });
    });

    it.each(['', 'justowner', '-bad/repo', 'owner/..', 'owner/re po', 'https://gitlab.com/a/b', '<script>/x'])(
        'rejects %j',
        (input) => {
            expect(() => parseRepositoryInput(input)).toThrow(AnalysisError);
        },
    );
});
