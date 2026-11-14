import { analyseRepository } from "../../../backend/src/analysis";
import type { RepositoryAnalysis } from "@shared/analysis";

type CacheEntry = { analysis: RepositoryAnalysis; expiresAt: number };
type AnalysisStore = {
  cache: Map<string, CacheEntry>;
  pending: Map<string, Promise<RepositoryAnalysis>>;
};

const scope = globalThis as typeof globalThis & { gitHappensAnalysisStore?: AnalysisStore };
const store = scope.gitHappensAnalysisStore ??= { cache: new Map(), pending: new Map() };
const ttlMs = 15 * 60 * 1000;

export async function getRepositoryAnalysis(repository: string): Promise<RepositoryAnalysis> {
  const key = repository.toLowerCase();
  const cached = store.cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.analysis;
  if (cached) store.cache.delete(key);

  const existing = store.pending.get(key);
  if (existing) return existing;

  const [owner, repo] = repository.split("/");
  const pending = analyseRepository(owner, repo).then((analysis) => {
    store.cache.set(key, { analysis, expiresAt: Date.now() + ttlMs });
    if (store.cache.size > 100) store.cache.delete(store.cache.keys().next().value!);
    return analysis;
  }).finally(() => store.pending.delete(key));

  store.pending.set(key, pending);
  return pending;
}
