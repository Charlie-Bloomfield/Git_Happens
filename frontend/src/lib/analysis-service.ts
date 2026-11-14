// Server-only: wraps Charlie's analyser with an in-memory cache.
// Never import this from a client component — it reads GITHUB_TOKEN from the environment.
import {
  analyseRepositoryDetailed,
  isAnalysisError,
  type AnalysisErrorCode,
  type DetailedRepositoryAnalysis,
} from "@backend/analysis";

export interface AnalysisFailure {
  code: AnalysisErrorCode;
  message: string;
  retryAt?: string;
}

type Settled = { ok: true; analysis: DetailedRepositoryAnalysis } | { ok: false; error: AnalysisFailure };

export type AnalysisResult = Settled & { cached: boolean };

const MINUTE = 60_000;
const SUCCESS_TTL = 60 * MINUTE;
const MAX_ENTRIES = 200;

/** How long to remember each kind of failure before asking GitHub again. */
const ERROR_TTL: Record<AnalysisErrorCode, number> = {
  INVALID_REPOSITORY: 60 * MINUTE,
  NOT_FOUND: 10 * MINUTE,
  EMPTY_REPOSITORY: 10 * MINUTE,
  RATE_LIMITED: 15 * MINUTE, // replaced by retryAt when GitHub tells us
  GITHUB_ERROR: 1 * MINUTE,
};

type Entry = { result: Settled; expiresAt: number };

// Module-level state persists for the lifetime of the server instance (single-instance demo).
const cache = new Map<string, Entry>();
const inFlight = new Map<string, Promise<Settled>>();

export function cacheKey(owner: string, repo: string): string {
  return `${owner}/${repo}`.toLowerCase();
}

export async function getAnalysis(owner: string, repo: string): Promise<AnalysisResult> {
  const key = cacheKey(owner, repo);
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return { ...hit.result, cached: true };
  if (hit) cache.delete(key);

  // De-duplicate concurrent requests (e.g. GitHub's image proxy + the landing page at once).
  let pending = inFlight.get(key);
  if (!pending) {
    pending = run(owner, repo).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  const result = await pending;
  store(key, result);
  return { ...result, cached: false };
}

async function run(owner: string, repo: string): Promise<Settled> {
  try {
    return { ok: true, analysis: await analyseRepositoryDetailed(owner, repo) };
  } catch (error) {
    if (isAnalysisError(error)) {
      return { ok: false, error: { code: error.code, message: error.message, retryAt: error.retryAt } };
    }
    console.error("Unexpected analyser failure", error);
    return { ok: false, error: { code: "GITHUB_ERROR", message: "Something went wrong analysing this repository." } };
  }
}

function store(key: string, result: Settled): void {
  const now = Date.now();
  let ttl = SUCCESS_TTL;
  if (!result.ok) {
    ttl = ERROR_TTL[result.error.code];
    const retryAt = result.error.retryAt ? Date.parse(result.error.retryAt) : NaN;
    if (result.error.code === "RATE_LIMITED" && Number.isFinite(retryAt)) {
      ttl = Math.min(Math.max(retryAt - now, MINUTE), 60 * MINUTE);
    }
  }
  cache.delete(key); // re-insert so Map order tracks recency
  cache.set(key, { result, expiresAt: now + ttl });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
}

/** Seconds a CDN / browser may cache a response for this result. */
export function cacheSeconds(result: AnalysisResult): number {
  if (result.ok) return 600;
  return result.error.code === "GITHUB_ERROR" ? 0 : 300;
}
