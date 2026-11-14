/**
 * Usage: npm run analyse -- <owner/repo | github url> [--detailed] [--tz=Europe/London] [--max=300]
 * Set GITHUB_TOKEN for higher rate limits and line stats on more commits.
 */
import { analyseRepository, analyseRepositoryDetailed, isAnalysisError, parseRepositoryInput } from '../src/analysis';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

if (!input) {
    console.error('Usage: npm run analyse -- owner/repo [--detailed] [--tz=UTC] [--max=300]');
    process.exit(1);
}

try {
    const { owner, repo } = parseRepositoryInput(input);
    const options = { timeZone: flag('tz'), maxCommits: flag('max') ? Number(flag('max')) : undefined };
    const result = args.includes('--detailed')
        ? await analyseRepositoryDetailed(owner, repo, options)
        : await analyseRepository(owner, repo, options);
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    if (isAnalysisError(error)) {
        console.error(`[${error.code}] ${error.message}${error.retryAt ? ` (retry at ${error.retryAt})` : ''}`);
        process.exit(2);
    }
    throw error;
}
