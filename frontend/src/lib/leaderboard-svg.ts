import type { RepositoryAnalysis } from "@shared/analysis";

export const FONT = "'Space Grotesk', 'Segoe UI', Helvetica, Arial, sans-serif";
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
}

export function generateLeaderboardSVG(analysis: RepositoryAnalysis, options: { demo?: boolean } = {}): string {
  const developers = [...analysis.developers].sort((a, b) => b.blameScore - a.blameScore).slice(0, 5);
  const width = 760;
  const height = 198 + Math.max(developers.length, 1) * 94;
  const rows = developers.length
    ? developers.map((developer, index) => {
        const y = 158 + index * 94;
        const firstAchievement = developer.achievements[0] ?? "No awards yet";
        return `<g>
          <rect x="28" y="${y}" width="704" height="80" rx="14" fill="${index === 0 ? "#1b2531" : "#171b20"}" stroke="${index === 0 ? "#3b6aa1" : "#303842"}"/>
          <text x="48" y="${y + 49}" fill="${index === 0 ? "#58a6ff" : "#7c8897"}" font-size="24" font-weight="800">${String(index + 1).padStart(2, "0")}</text>
          <text x="98" y="${y + 34}" fill="#e6edf3" font-size="17" font-weight="700">${escapeXml(developer.username)}</text>
          <text x="98" y="${y + 59}" fill="#97a2af" font-size="13">${escapeXml(firstAchievement)} · ${plural(developer.commits, "commit")} · ${plural(developer.reverts, "revert")} · ${developer.lateNightCommits} late-night</text>
          <text x="704" y="${y + 49}" text-anchor="end" fill="${index === 0 ? "#58a6ff" : "#e6edf3"}" font-size="28" font-weight="800">${Number.isFinite(developer.blameScore) ? developer.blameScore : 0}</text>
        </g>`;
      }).join("")
    : `<text x="380" y="208" text-anchor="middle" fill="#97a2af" font-size="17">No contributors found yet.</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" role="img" aria-label="Git Happens ${options.demo ? "demo " : ""}leaderboard for ${escapeXml(analysis.repository)}">
    <rect width="${width}" height="${height}" rx="22" fill="#0d1013"/>
    <rect x="0.5" y="0.5" width="759" height="${height - 1}" rx="21.5" fill="none" stroke="#3f4852"/>
    <text x="28" y="54" fill="#58a6ff" font-size="13" font-weight="800" letter-spacing="3">GIT HAPPENS</text>
    <text x="28" y="92" fill="#e6edf3" font-size="27" font-weight="800">Hall of Shame</text>
    <text x="28" y="120" fill="#97a2af" font-size="14">${escapeXml(analysis.repository)}</text>
    ${options.demo ? `<rect x="608" y="30" width="124" height="30" rx="15" fill="#5b2825"/>
    <text x="670" y="50" text-anchor="middle" fill="#ffb0a8" font-size="12" font-weight="800">DEMO DATA</text>` : ""}
    ${rows}
    <text x="28" y="${height - 23}" fill="#7c8897" font-size="12">Your commits. Our judgement. · Entertainment only</text>
  </svg>`;
}

const ERROR_COPY: Record<string, { title: string; detail: string }> = {
  INVALID_REPOSITORY: { title: "That's not a repo.", detail: "Use owner/repo or a github.com URL." },
  NOT_FOUND: { title: "Repo not found.", detail: "It doesn't exist, or it's private. Coward." },
  EMPTY_REPOSITORY: { title: "No commits, no crimes.", detail: "Yet." },
  RATE_LIMITED: { title: "GitHub needs a breather.", detail: "Rate limit reached." },
  GITHUB_ERROR: { title: "GitHub happened.", detail: "Couldn't reach GitHub. Try again later." },
};

export function generateErrorSVG(repository: string, code: string, retryAt?: string): string {
  const copy = ERROR_COPY[code] ?? ERROR_COPY.GITHUB_ERROR!;
  const retry = code !== "RATE_LIMITED" ? ""
    : retryAt ? ` Try again after ${new Date(retryAt).toUTCString().slice(17, 22)} UTC.`
    : " Try again shortly.";
  const width = 760;
  const height = 220;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" role="img" aria-label="Git Happens: ${escapeXml(copy.title)}">
    <rect width="${width}" height="${height}" rx="22" fill="#0d1013"/>
    <rect x="0.5" y="0.5" width="759" height="${height - 1}" rx="21.5" fill="none" stroke="#914740"/>
    <text x="28" y="54" fill="#58a6ff" font-size="13" font-weight="800" letter-spacing="3">GIT HAPPENS</text>
    <text x="28" y="98" fill="#e6edf3" font-size="27" font-weight="800">${escapeXml(copy.title)}</text>
    <text x="28" y="130" fill="#ff9b91" font-size="15">${escapeXml(copy.detail + retry)}</text>
    <text x="28" y="158" fill="#7c8897" font-size="13">${escapeXml(repository)}</text>
    <text x="28" y="${height - 23}" fill="#7c8897" font-size="12">Your commits. Our judgement. · Entertainment only</text>
  </svg>`;
}
