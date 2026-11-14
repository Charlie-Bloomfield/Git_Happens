import { getAnalysis, cacheSeconds } from "@/lib/analysis-service";
import { generateErrorSVG, generateLeaderboardSVG } from "@/lib/leaderboard-svg";
import { parseRepository } from "@/lib/repository";

// Octokit and GITHUB_TOKEN need the Node.js runtime.
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const repository = parseRepository(new URL(request.url).searchParams.get("repo") ?? "");
  if (!repository) {
    return new Response("Expected a public GitHub repository as owner/repo or an HTTPS GitHub URL.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const [owner, repo] = repository.split("/") as [string, string];
  const result = await getAnalysis(owner, repo);
  const maxAge = cacheSeconds(result);

  // Analysis failures still return 200: GitHub's image proxy shows a broken image for
  // non-2xx responses, which would hide the error card.
  const svg = result.ok
    ? generateLeaderboardSVG(result.analysis)
    : generateErrorSVG(repository, result.error.code, result.error.retryAt);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}, s-maxage=${maxAge}` : "no-store",
      "X-Git-Happens-Data": result.ok ? "live" : `error:${result.error.code}`,
      "X-Git-Happens-Cache": result.cached ? "hit" : "miss",
    },
  });
}
