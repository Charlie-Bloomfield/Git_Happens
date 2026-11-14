import { cacheSeconds, getAnalysis } from "@/lib/analysis-service";
import { CHART_IDS, isChartId, renderChart, type ChartTheme } from "@/lib/charts-svg";
import { generateErrorSVG } from "@/lib/leaderboard-svg";
import { parseRepository } from "@/lib/repository";

// Octokit and GITHUB_TOKEN need the Node.js runtime.
export const runtime = "nodejs";

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/**
 * GET /api/charts/<id>.svg?repo=owner/repo[&theme=light|dark]
 * ids: score-breakdown, shame-mix, heatmap, awards, commit-share
 */
export async function GET(request: Request, { params }: { params: Promise<{ chart: string }> }): Promise<Response> {
  const id = (await params).chart.replace(/\.svg$/i, "");
  if (!isChartId(id)) return text(`Unknown chart. Use one of: ${CHART_IDS.map((c) => `${c}.svg`).join(", ")}`, 404);

  const url = new URL(request.url);
  const repository = parseRepository(url.searchParams.get("repo") ?? "");
  if (!repository) return text("Expected a public GitHub repository as owner/repo or an HTTPS GitHub URL.", 400);
  const theme: ChartTheme = url.searchParams.get("theme") === "light" ? "light" : "dark";

  const [owner, repo] = repository.split("/") as [string, string];
  const result = await getAnalysis(owner, repo);
  const maxAge = cacheSeconds(result);

  // Failures still return 200 so GitHub's image proxy shows the error card instead of a broken image.
  const svg = result.ok
    ? renderChart(id, result.analysis, theme)
    : generateErrorSVG(repository, result.error.code, result.error.retryAt);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}, s-maxage=${maxAge}` : "no-store",
      "X-Git-Exposed-Data": result.ok ? "live" : `error:${result.error.code}`,
      "X-Git-Exposed-Cache": result.cached ? "hit" : "miss",
    },
  });
}
