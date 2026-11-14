import { getAnalysis, cacheSeconds } from "@/lib/analysis-service";
import { parseRepository } from "@/lib/repository";

export const runtime = "nodejs";

const STATUS_BY_CODE: Record<string, number> = {
  INVALID_REPOSITORY: 400,
  NOT_FOUND: 404,
  EMPTY_REPOSITORY: 422,
  RATE_LIMITED: 429,
  GITHUB_ERROR: 502,
};

/**
 * GET /api/analysis?repo=owner/repo
 * 200 → DetailedRepositoryAnalysis (contract fields + evidence links + meta) for the landing page / dashboard.
 * 4xx/5xx → { error: { code, message, retryAt? } }
 */
export async function GET(request: Request): Promise<Response> {
  const repository = parseRepository(new URL(request.url).searchParams.get("repo") ?? "");
  if (!repository) {
    return Response.json(
      { error: { code: "INVALID_REPOSITORY", message: "Expected owner/repo or an HTTPS GitHub URL." } },
      { status: 400 },
    );
  }

  const [owner, repo] = repository.split("/") as [string, string];
  const result = await getAnalysis(owner, repo);
  const maxAge = cacheSeconds(result);
  const headers = {
    "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}, s-maxage=${maxAge}` : "no-store",
    "X-Git-Happens-Cache": result.cached ? "hit" : "miss",
  };

  return result.ok
    ? Response.json(result.analysis, { headers })
    : Response.json({ error: result.error }, { status: STATUS_BY_CODE[result.error.code] ?? 502, headers });
}
