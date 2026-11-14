import { generateLeaderboardSVG } from "@/lib/leaderboard-svg";
import { mockAnalysis } from "@/lib/mock-analysis";
import { parseRepository } from "@/lib/repository";

export function GET(request: Request): Response {
  const repository = parseRepository(new URL(request.url).searchParams.get("repo") ?? "");
  if (!repository) {
    return new Response("Expected a public GitHub repository as owner/repo or an HTTPS GitHub URL.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(generateLeaderboardSVG(mockAnalysis(repository)), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Git-Happens-Data": "demo",
    },
  });
}
