import { isAnalysisError } from "../../../../../backend/src/analysis";
import { parseRepository } from "@/lib/repository";
import { getRepositoryAnalysis } from "@/lib/server-analysis";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const repository = parseRepository(new URL(request.url).searchParams.get("repo") ?? "");
  if (!repository) {
    return Response.json({ code: "INVALID_REPOSITORY", message: "Enter a GitHub repository as owner/repo or an HTTPS GitHub URL." }, { status: 400 });
  }

  try {
    return Response.json(await getRepositoryAnalysis(repository), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (isAnalysisError(error)) {
      const status = {
        INVALID_REPOSITORY: 400,
        NOT_FOUND: 404,
        EMPTY_REPOSITORY: 409,
        RATE_LIMITED: 429,
        GITHUB_ERROR: 502,
      }[error.code];
      return Response.json({ code: error.code, message: error.message, retryAt: error.retryAt }, { status });
    }
    console.error("Repository analysis failed", error);
    return Response.json({ code: "GITHUB_ERROR", message: "Analysis failed. Please try again shortly." }, { status: 500 });
  }
}
