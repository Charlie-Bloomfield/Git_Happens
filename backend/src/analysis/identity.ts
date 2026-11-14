import type { CommitRecord } from './types';

export interface Identity {
    /** Stable grouping key (lowercased). */
    key: string;
    /** Name shown on the leaderboard. */
    username: string;
}

const BOT_NAME_PATTERN = /(\[bot\]$|^dependabot|^renovate|^github-actions|^greenkeeper|^snyk-bot|^pre-commit-ci|^imgbot|^allcontributors)/i;

export function isBotCommit(commit: CommitRecord): boolean {
    if (commit.authorType === 'Bot') return true;
    return [commit.authorLogin, commit.authorName, commit.authorEmail?.split('@')[0]]
        .some((value) => value != null && BOT_NAME_PATTERN.test(value));
}

/**
 * Maps commits to developers. Preference order:
 *  1. GitHub login on the commit.
 *  2. A login seen on another commit with the same author email.
 *  3. The author email (or name if no email), displayed using the author name.
 */
export function createIdentityResolver(commits: readonly CommitRecord[]): (commit: CommitRecord) => Identity {
    const loginByEmail = new Map<string, string>();
    for (const commit of commits) {
        const email = normaliseEmail(commit.authorEmail);
        if (commit.authorLogin && email && !loginByEmail.has(email)) {
            loginByEmail.set(email, commit.authorLogin);
        }
    }

    return (commit) => {
        const email = normaliseEmail(commit.authorEmail);
        const login = commit.authorLogin ?? (email ? loginByEmail.get(email) : undefined);
        if (login) return { key: `login:${login.toLowerCase()}`, username: login };

        const name = commit.authorName?.trim();
        if (email) return { key: `email:${email}`, username: name || email.split('@')[0] || 'unknown' };
        if (name) return { key: `name:${name.toLowerCase()}`, username: name };
        return { key: 'unknown', username: 'unknown' };
    };
}

function normaliseEmail(email: string | null): string | null {
    const value = email?.trim().toLowerCase();
    return value ? value : null;
}
