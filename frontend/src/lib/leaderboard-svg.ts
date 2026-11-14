import type { RepositoryAnalysis } from "@shared/analysis";

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
}

export function generateLeaderboardSVG(analysis: RepositoryAnalysis, demo = false): string {
  const developers = [...analysis.developers].sort((a, b) => b.blameScore - a.blameScore).slice(0, 5);
  const width = 760;
  const height = 198 + Math.max(developers.length, 1) * 94;
  const rows = developers.length
    ? developers.map((developer, index) => {
        const y = 158 + index * 94;
        const firstAchievement = developer.achievements[0] ?? "No awards yet";
        const username = developer.username.length > 28 ? `${developer.username.slice(0, 27)}…` : developer.username;
        return `<g>
          <rect x="28" y="${y}" width="704" height="80" rx="14" fill="${index === 0 ? "#272313" : "#171b23"}" stroke="${index === 0 ? "#796329" : "#2b303b"}"/>
          <text x="48" y="${y + 49}" fill="${index === 0 ? "#f8cb66" : "#85909e"}" font-size="24" font-weight="800">${String(index + 1).padStart(2, "0")}</text>
          <text x="98" y="${y + 34}" fill="#f2f1eb" font-size="17" font-weight="700">${escapeXml(username)}</text>
          <text x="98" y="${y + 59}" fill="#9ca6b4" font-size="13">${escapeXml(firstAchievement)} · ${developer.commits} commits · ${developer.reverts} reverts</text>
          <text x="704" y="${y + 49}" text-anchor="end" fill="${index === 0 ? "#f8cb66" : "#f2f1eb"}" font-size="28" font-weight="800">${Number.isFinite(developer.blameScore) ? developer.blameScore : 0}</text>
        </g>`;
      }).join("")
    : `<text x="380" y="208" text-anchor="middle" fill="#9ca6b4" font-size="17">No contributors found yet.</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Git Happens ${demo ? "demo " : ""}leaderboard for ${escapeXml(analysis.repository)}">
    <rect width="${width}" height="${height}" rx="22" fill="#101318"/>
    <rect x="0.5" y="0.5" width="759" height="${height - 1}" rx="21.5" fill="none" stroke="#333946"/>
    <text x="28" y="54" fill="#f8cb66" font-size="13" font-weight="800" letter-spacing="3">GIT HAPPENS</text>
    <text x="28" y="92" fill="#f2f1eb" font-size="27" font-weight="800">Hall of Shame</text>
    <text x="28" y="120" fill="#9ca6b4" font-size="14">${escapeXml(analysis.repository)}</text>
    ${demo ? `<rect x="608" y="30" width="124" height="30" rx="15" fill="#5a371e"/><text x="670" y="50" text-anchor="middle" fill="#ffd6a3" font-size="12" font-weight="800">DEMO DATA</text>` : ""}
    ${rows}
    <text x="28" y="${height - 23}" fill="#85909e" font-size="12">Your commits. Our judgement. · Entertainment only</text>
  </svg>`;
}

export function generateErrorSVG(message: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="230" viewBox="0 0 760 230" role="img" aria-label="Git Happens error: ${escapeXml(message)}">
    <rect width="760" height="230" rx="22" fill="#101318"/>
    <rect x="0.5" y="0.5" width="759" height="229" rx="21.5" fill="none" stroke="#7b4d3c"/>
    <text x="28" y="52" fill="#f8cb66" font-size="13" font-weight="800" letter-spacing="3">GIT HAPPENS</text>
    <text x="28" y="110" fill="#f2f1eb" font-size="27" font-weight="800">No verdict yet.</text>
    <text x="28" y="148" fill="#e6aa98" font-size="16">${escapeXml(message)}</text>
    <text x="28" y="202" fill="#85909e" font-size="12">Your commits. Our judgement. · Entertainment only</text>
  </svg>`;
}
