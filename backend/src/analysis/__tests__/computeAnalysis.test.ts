import { describe, expect, it } from 'vitest';
import { computeAnalysis, toRepositoryAnalysis } from '../computeAnalysis';
import { teamRepoCommits } from './fixtures/teamRepo';

const NOW = new Date('2026-11-14T12:00:00Z');

describe('computeAnalysis (acme/widgets fixture)', () => {
    const result = computeAnalysis('acme/widgets', teamRepoCommits, { now: NOW });
    const byName = Object.fromEntries(result.developers.map((d) => [d.username, d]));

    it('groups commits by developer, maps login-less commits by email and skips bots + merges', () => {
        expect(result.developers.map((d) => d.username)).toEqual(['bob', 'alice', 'Carol C']);
        expect(byName.bob!.commits).toBe(7);
        expect(byName.alice!.commits).toBe(12);
        expect(byName.alice!.linesChanged).toBe(180);
        expect(byName['Carol C']!.linesChanged).toBe(0); // no line stats fetched
        expect(result.meta).toMatchObject({ mergeCommitsSkipped: 1, botCommitsSkipped: 2, commitsAnalysed: 20 });
    });

    it('counts bob’s bad habits', () => {
        expect(byName.bob).toMatchObject({
            reverts: 2,
            lateNightCommits: 4,
            largeCommits: 2,
            suspiciousMessages: 3,
            fridayEveningCommits: 2,
            linesChanged: 960, // 6 commits with stats: 15·4 + 820 + 80; the login-less one has none
            shamePoints: 17,
            blameScore: 71,
        });
        expect(byName.bob!.evidence.reverts).toHaveLength(2);
        expect(byName.bob!.evidence.large[0]).toMatch(/^https:\/\/github\.com\/acme\/widgets\/commit\//);
    });

    it('awards documented achievements in rule order', () => {
        expect(byName.bob!.achievements).toEqual([
            'Most Wanted',
            'Ctrl+Z Enthusiast',
            'Night Owl',
            'The Big Bang',
            'Commit Message Poet',
            'Friday Deployer',
        ]);
        expect(byName.alice!.achievements).toEqual(['Carrying The Team', 'Suspiciously Clean']);
        expect(byName['Carol C']!.achievements).toEqual(['One-Hit Wonder']);
    });

    it('is deterministic regardless of input order', () => {
        const reversed = computeAnalysis('acme/widgets', [...teamRepoCommits].reverse(), { now: NOW });
        expect(toRepositoryAnalysis(reversed)).toEqual(toRepositoryAnalysis(result));
    });

    it('can include bots when asked', () => {
        const withBots = computeAnalysis('acme/widgets', teamRepoCommits, { now: NOW, includeBots: true });
        expect(withBots.developers.map((d) => d.username)).toContain('dependabot[bot]');
    });

    it('respects the configured time zone for late-night detection', () => {
        // In New York, bob's 01:30–03:00 UTC commits land the previous evening (EST, UTC-5).
        // Only 04:15 UTC on 9 March counts: US DST began 8 March, so that's 00:15 EDT.
        const ny = computeAnalysis('acme/widgets', teamRepoCommits, { now: NOW, timeZone: 'America/New_York' });
        expect(ny.developers.find((d) => d.username === 'bob')!.lateNightCommits).toBe(1);
    });

    it('handles no commits', () => {
        const empty = computeAnalysis('acme/empty', [], { now: NOW });
        expect(empty.developers).toEqual([]);
    });
});

describe('toRepositoryAnalysis', () => {
    it('returns exactly the shared contract shape', () => {
        const contract = toRepositoryAnalysis(computeAnalysis('acme/widgets', teamRepoCommits, { now: NOW }));
        expect(Object.keys(contract).sort()).toEqual(['analysedAt', 'developers', 'repository']);
        expect(contract.analysedAt).toBe('2026-11-14T12:00:00.000Z');
        expect(Object.keys(contract.developers[0]!).sort()).toEqual(
            [
                'achievements',
                'blameScore',
                'commits',
                'largeCommits',
                'lateNightCommits',
                'linesChanged',
                'reverts',
                'suspiciousMessages',
                'username',
            ].sort(),
        );
        expect(() => JSON.parse(JSON.stringify(contract))).not.toThrow();
    });
});
