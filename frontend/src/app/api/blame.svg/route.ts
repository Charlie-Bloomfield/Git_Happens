import { isAnalysisError } from "../../../../../backend/src/analysis";
import { generateErrorSVG, generateLeaderboardSVG } from "@/lib/leaderboard-svg";
import { mockAnalysis } from "@/lib/mock-analysis";
import { parseRepository } from "@/lib/repository";
import { getRepositoryAnalysis } from "@/lib/server-analysis";

export const runtime = "nodejs";

function svgResponse(svg: string, cacheControl: string, error?: string): Response {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cacheControl,
      ...(error ? { "X-Git-Happens-Error": error } : {}),
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const repository = parseRepository(url.searchParams.get("repo") ?? "");
  if (!repository) {
    return svgResponse(generateErrorSVG("Enter a GitHub repository as owner/repo."), "public, max-age=60", "INVALID_REPOSITORY");
  }

  if (url.searchParams.get("demo") === "1") {
    return svgResponse(generateLeaderboardSVG(mockAnalysis(repository), true), "public, max-age=300");
  }

  try {
    const analysis = await getRepositoryAnalysis(repository);
    return svgResponse(generateLeaderboardSVG(analysis), "public, max-age=60, s-maxage=300");
  } catch (error) {
    if (isAnalysisError(error)) {
      const message = {
        INVALID_REPOSITORY: "That's not a repository. Try owner/repo.",
        NOT_FOUND: "Repository not found or private.",
        EMPTY_REPOSITORY: "No commits, no crimes. Yet.",
        RATE_LIMITED: "GitHub needs a breather. Try again later.",
        GITHUB_ERROR: "GitHub happened. Try again shortly.",
      }[error.code];
      return svgResponse(generateErrorSVG(message), "public, max-age=60", error.code);
    }
    console.error("SVG analysis failed", error);
    return svgResponse(generateErrorSVG("Analysis failed. Try again shortly."), "public, max-age=30", "GITHUB_ERROR");
  }
}
