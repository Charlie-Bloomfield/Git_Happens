import { AnalysisError } from './types';

export interface RepositoryRef {
    owner: string;
    repo: string;
}

// GitHub rules: owner is 1–39 alphanumerics or single hyphens, not starting with a hyphen.
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export function isValidRepositoryRef(owner: string, repo: string): boolean {
    return OWNER_PATTERN.test(owner) && REPO_PATTERN.test(repo) && repo !== '.' && repo !== '..';
}

/**
 * Accepts `owner/repo`, `https://github.com/owner/repo`, `github.com/owner/repo/tree/main`,
 * `git@github.com:owner/repo.git`, etc. Throws AnalysisError('INVALID_REPOSITORY') otherwise.
 */
export function parseRepositoryInput(input: string): RepositoryRef {
    let value = input.trim();

    value = value
        .replace(/^git@github\.com:/i, '')
        .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '')
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '');

    const [owner, rawRepo] = value.split('/');
    const repo = rawRepo?.replace(/\.git$/i, '');

    if (!owner || !repo || !isValidRepositoryRef(owner, repo)) {
        throw new AnalysisError(
            'INVALID_REPOSITORY',
            `"${input}" is not a valid GitHub repository. Use owner/repo or a github.com URL.`,
        );
    }
    return { owner, repo };
}
