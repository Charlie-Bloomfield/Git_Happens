// Pure SVG chart renderers. Used by /api/charts/<id>.svg (README embeds) and rendered
// inline on the landing page, so the page and the embed always match.
import type { DeveloperStats } from "@shared/analysis";
import { ACHIEVEMENTS } from "./achievement-meta";
import { escapeXml, FONT } from "./leaderboard-svg";
import { SIGNALS, scoreBreakdown } from "./score";

export type ChartTheme = "dark" | "light";

export interface ChartInput {
  repository: string;
  developers: DeveloperStats[];
  meta?: { activity?: number[][]; timeZone?: string };
}

interface Tokens {
  surface: string; border: string; text: string; secondary: string; muted: string;
  grid: string; empty: string; brand: string; alert: string;
  series: string[]; other: string; sequential: string[];
}

// Categorical slots validated (CVD + contrast) against each surface; see the dataviz palette.
// Light mode sits below 3:1 for some slots, so every chart direct-labels its values.
const THEMES: Record<ChartTheme, Tokens> = {
  dark: {
    surface: "#0d1013", border: "#3f4852", text: "#e6edf3", secondary: "#97a2af", muted: "#7c8897",
    grid: "#262d36", empty: "#161b22", brand: "#58a6ff", alert: "#f78166",
    series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"], other: "#5c6773",
    sequential: ["#104281", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4"],
  },
  light: {
    surface: "#ffffff", border: "#d0d7de", text: "#1f2328", secondary: "#57606a", muted: "#6e7781",
    grid: "#eaeef2", empty: "#f3f5f7", brand: "#0969da", alert: "#cf222e",
    series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"], other: "#a8b1bb",
    sequential: ["#cde2fb", "#9ec5f4", "#5598e7", "#2a78d6", "#184f95"],
  },
};

const W = 760;
const BODY_TOP = 150;
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (part: number, total: number) => (total > 0 ? `${Math.round((100 * part) / total)}%` : "0%");
const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
const r1 = (n: number) => Math.round(n * 10) / 10;

function frame(t: Tokens, o: { id: string; title: string; subtitle: string; height: number; body: string; label: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${o.height}" viewBox="0 0 ${W} ${o.height}" font-family="${FONT}" role="img" aria-labelledby="gh-${o.id}-t">
  <title id="gh-${o.id}-t">${escapeXml(o.label)}</title>
  <rect width="${W}" height="${o.height}" rx="22" fill="${t.surface}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${o.height - 1}" rx="21.5" fill="none" stroke="${t.border}"/>
  <text x="28" y="54" fill="${t.brand}" font-size="13" font-weight="800" letter-spacing="3">GIT HAPPENS</text>
  <text x="28" y="92" fill="${t.text}" font-size="27" font-weight="800">${escapeXml(o.title)}</text>
  <text x="28" y="120" fill="${t.secondary}" font-size="14">${escapeXml(o.subtitle)}</text>
  ${o.body}
  <text x="28" y="${o.height - 23}" fill="${t.muted}" font-size="12">Your commits. Our judgement. · Entertainment only</text>
</svg>`;
}

function emptyNote(t: Tokens, y: number, text: string): string {
  return `<text x="${W / 2}" y="${y}" text-anchor="middle" fill="${t.secondary}" font-size="16">${escapeXml(text)}</text>`;
}

/** Donut segment; angles in radians, clockwise from 12 o'clock. */
function arc(cx: number, cy: number, inner: number, outer: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${r1(cx + r * Math.sin(a))} ${r1(cy - r * Math.cos(a))}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(outer, a0)}A${outer} ${outer} 0 ${large} 1 ${p(outer, a1)}L${p(inner, a1)}A${inner} ${inner} 0 ${large} 0 ${p(inner, a0)}Z`;
}

interface Slice { label: string; value: number; color: string; detail: string; tooltip: string }

function donut(t: Tokens, slices: Slice[], center: { value: string; label: string }): string {
  const cx = 190, cy = 300, outer = 118, inner = 76;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let angle = 0;
  const marks = slices.filter((s) => s.value > 0).map((s, _, live) => {
    const sweep = (2 * Math.PI * s.value) / total;
    const shape = live.length === 1
      ? `<circle cx="${cx}" cy="${cy}" r="${(outer + inner) / 2}" fill="none" stroke="${s.color}" stroke-width="${outer - inner}"><title>${escapeXml(s.tooltip)}</title></circle>`
      : `<path d="${arc(cx, cy, inner, outer, angle, angle + sweep)}" fill="${s.color}" stroke="${t.surface}" stroke-width="2" stroke-linejoin="round"><title>${escapeXml(s.tooltip)}</title></path>`;
    angle += sweep;
    return shape;
  }).join("");

  const legendTop = cy - (slices.length * 50) / 2 + 12;
  const legend = slices.map((s, i) => {
    const y = legendTop + i * 50;
    return `<g><title>${escapeXml(s.tooltip)}</title>
      <rect x="370" y="${y - 13}" width="14" height="14" rx="4" fill="${s.color}"/>
      <text x="396" y="${y}" fill="${t.text}" font-size="16" font-weight="700">${escapeXml(truncate(s.label, 24))}</text>
      <text x="396" y="${y + 20}" fill="${t.secondary}" font-size="12.5">${escapeXml(s.detail)}</text>
      <text x="732" y="${y + 6}" text-anchor="end" fill="${t.text}" font-size="22" font-weight="800">${pct(s.value, total)}</text>
    </g>`;
  }).join("");

  return `${marks}
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="${t.text}" font-size="34" font-weight="800">${escapeXml(center.value)}</text>
    <text x="${cx}" y="${cy + 30}" text-anchor="middle" fill="${t.secondary}" font-size="12" letter-spacing="1.5">${escapeXml(center.label.toUpperCase())}</text>
    ${legend}`;
}

// ── Charts ───────────────────────────────────────────────────────────────────

function shameMix(a: ChartInput, t: Tokens): string {
  const totals = SIGNALS.map((signal, i) => {
    const count = a.developers.reduce((s, d) => s + d[signal.key], 0);
    return { signal, count, points: count * signal.weight, color: t.series[i]! };
  });
  const total = totals.reduce((s, x) => s + x.points, 0);
  const height = 490;
  const body = total === 0
    ? emptyNote(t, 300, "No shame detected. Suspiciously clean.")
    : donut(t, totals.map((x) => ({
        label: x.signal.label,
        value: x.points,
        color: x.color,
        detail: `${fmt(x.count)} × ${x.signal.weight} weight = ${fmt(x.points)} pts`,
        tooltip: `${x.signal.label}: ${x.count} × ${x.signal.weight} = ${x.points} shame points (${pct(x.points, total)})`,
      })), { value: fmt(total), label: "shame points" });
  return frame(t, {
    id: "shame-mix", title: "Anatomy of shame", height, body,
    subtitle: `${a.repository} · where the repo's shame points come from`,
    label: `Shame points by signal for ${a.repository}: ${totals.map((x) => `${x.signal.label} ${x.points}`).join(", ")}`,
  });
}

function scoreBreakdownChart(a: ChartInput, t: Tokens): string {
  const devs = a.developers.slice(0, 8);
  const x0 = 200, plotW = 450, rowH = 40, barH = 20;
  const legend = SIGNALS.map((s, i) => {
    const x = 28 + i * 180;
    return `<rect x="${x}" y="${BODY_TOP}" width="12" height="12" rx="3" fill="${t.series[i]}"/>
      <text x="${x + 19}" y="${BODY_TOP + 11}" fill="${t.secondary}" font-size="12.5">${escapeXml(s.label)} ×${s.weight}</text>`;
  }).join("");
  const formula = `<text x="28" y="${BODY_TOP + 40}" fill="${t.muted}" font-size="12">score = 100 × (3·reverts + 2·large + late-night + suspicious) ÷ 2·(commits + 5), capped at 100</text>`;
  const top = BODY_TOP + 68;
  const plotBottom = top + Math.max(devs.length, 1) * rowH;
  const grid = [0, 25, 50, 75, 100].map((v) => {
    const x = x0 + (v / 100) * plotW;
    return `<line x1="${x}" y1="${top - 6}" x2="${x}" y2="${plotBottom - 8}" stroke="${t.grid}" stroke-width="1"/>
      <text x="${x}" y="${plotBottom + 10}" text-anchor="middle" fill="${t.muted}" font-size="11">${v}</text>`;
  }).join("");
  const rows = devs.map((d, i) => {
    const b = scoreBreakdown(d);
    const y = top + i * rowH;
    const barY = y + (rowH - barH) / 2 - 4;
    const totalW = b.contributions.reduce((s, c) => s + (c.scoreShare / 100) * plotW, 0);
    let x = x0;
    const segs = b.contributions.map((c, j) => {
      const w = (c.scoreShare / 100) * plotW;
      if (w <= 0) return "";
      const rect = `<rect x="${r1(x)}" y="${barY}" width="${r1(w)}" height="${barH}" fill="${t.series[j]}" stroke="${t.surface}" stroke-width="2"><title>${escapeXml(`${d.username} · ${c.label}: ${c.count} × ${c.weight} = ${c.points} pts → ${r1(c.scoreShare)} score`)}</title></rect>`;
      x += w;
      return rect;
    }).join("");
    const clip = `gh-sb-clip-${i}`;
    return `<g>
      <text x="28" y="${barY + 15}" fill="${t.text}" font-size="14" font-weight="700">${escapeXml(truncate(d.username, 20))}</text>
      <clipPath id="${clip}"><rect x="${x0}" y="${barY}" width="${r1(Math.max(totalW, 0))}" height="${barH}" rx="4"/></clipPath>
      ${totalW > 0 ? `<g clip-path="url(#${clip})">${segs}</g>` : `<line x1="${x0}" y1="${barY + barH / 2}" x2="${x0 + 6}" y2="${barY + barH / 2}" stroke="${t.muted}" stroke-width="2"/>`}
      <text x="${r1(x0 + totalW + 10)}" y="${barY + 15}" fill="${t.text}" font-size="15" font-weight="800">${b.score}</text>
      <text x="732" y="${barY + 15}" text-anchor="end" fill="${t.muted}" font-size="11.5">${b.shamePoints} pts ÷ ${b.denominator}${b.capped ? " · capped" : ""}</text>
    </g>`;
  }).join("");
  const height = plotBottom + 70;
  return frame(t, {
    id: "score-breakdown", title: "How the blame score adds up", height,
    subtitle: `${a.repository} · each bar splits a suspect's score by the sin behind it`,
    body: legend + formula + grid + (devs.length ? rows : emptyNote(t, top + 20, "No contributors found yet.")),
    label: `Blame score breakdown for ${a.repository}: ${devs.map((d) => `${d.username} ${d.blameScore}`).join(", ")}`,
  });
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function heatmap(a: ChartInput, t: Tokens): string {
  const activity = a.meta?.activity;
  const tz = a.meta?.timeZone ?? "UTC";
  const x0 = 72, cellW = (732 - x0) / 24, cellH = 26, top = BODY_TOP + 46;
  const max = activity ? Math.max(0, ...activity.flat()) : 0;
  const steps = t.sequential;

  const scale = `<text x="28" y="${BODY_TOP + 12}" fill="${t.secondary}" font-size="12.5">Hours in ${escapeXml(tz)} · hover a cell for counts</text>
    <text x="${732 - steps.length * 18 - 44}" y="${BODY_TOP + 12}" text-anchor="end" fill="${t.muted}" font-size="12">Fewer</text>
    ${steps.map((c, i) => `<rect x="${732 - steps.length * 18 - 38 + i * 18}" y="${BODY_TOP + 1}" width="14" height="14" rx="3" fill="${c}"/>`).join("")}
    <text x="732" y="${BODY_TOP + 12}" text-anchor="end" fill="${t.muted}" font-size="12">More</text>`;

  if (!activity || max === 0) {
    return frame(t, { id: "heatmap", title: "Crime-time heatmap", height: 320, subtitle: `${a.repository} · when the commits land`, body: emptyNote(t, 230, "No commit times available."), label: `Commit time heatmap for ${a.repository}` });
  }

  const cells = WEEK_ORDER.map((day, row) => {
    const y = top + row * cellH;
    const label = `<text x="28" y="${y + 17}" fill="${t.secondary}" font-size="12">${DAY_NAMES[day]}</text>`;
    return label + (activity[day] ?? []).map((v, hour) => {
      const fill = v === 0 ? t.empty : steps[Math.min(steps.length - 1, Math.ceil((v / max) * steps.length) - 1)];
      return `<rect x="${r1(x0 + hour * cellW + 1.5)}" y="${y + 1.5}" width="${r1(cellW - 3)}" height="${cellH - 3}" rx="4" fill="${fill}"><title>${DAY_NAMES[day]} ${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59 · ${v} commit${v === 1 ? "" : "s"}</title></rect>`;
    }).join("");
  }).join("");

  const bottom = top + 7 * cellH;
  const hours = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => `<text x="${r1(x0 + h * cellW + cellW / 2)}" y="${bottom + 18}" text-anchor="middle" fill="${t.muted}" font-size="11">${String(h).padStart(2, "0")}</text>`).join("");

  const fri = WEEK_ORDER.indexOf(5);
  const zones = `<rect x="${x0 - 1}" y="${top - 1}" width="${r1(cellW * 5 + 2)}" height="${7 * cellH + 2}" rx="6" fill="none" stroke="${t.alert}" stroke-width="1.5" stroke-dasharray="5 4"/>
    <rect x="${r1(x0 + 16 * cellW - 1)}" y="${top + fri * cellH - 1}" width="${r1(cellW * 8 + 2)}" height="${cellH + 2}" rx="6" fill="none" stroke="${t.text}" stroke-width="1.5" stroke-dasharray="2 3"/>`;
  const zoneLegend = `<rect x="28" y="${bottom + 38}" width="22" height="13" rx="3" fill="none" stroke="${t.alert}" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="58" y="${bottom + 49}" fill="${t.secondary}" font-size="12">Late-night zone, 00:00–05:00 (adds to blame score)</text>
    <rect x="410" y="${bottom + 38}" width="22" height="13" rx="3" fill="none" stroke="${t.text}" stroke-width="1.5" stroke-dasharray="2 3"/>
    <text x="440" y="${bottom + 49}" fill="${t.secondary}" font-size="12">Friday after 16:00 (Friday Deployer)</text>`;

  const total = activity.flat().reduce((s, v) => s + v, 0);
  const late = activity.reduce((s, row) => s + row.slice(0, 5).reduce((x, v) => x + v, 0), 0);
  return frame(t, {
    id: "heatmap", title: "Crime-time heatmap", height: bottom + 100,
    subtitle: `${a.repository} · ${fmt(total)} commits by weekday and hour · ${pct(late, total)} after midnight`,
    body: scale + cells + zones + hours + zoneLegend,
    label: `Commit time heatmap for ${a.repository}: ${total} commits, ${late} between midnight and 5am`,
  });
}

function awards(a: ChartInput, t: Tokens): string {
  const counts = ACHIEVEMENTS.map((info) => ({ info, count: a.developers.filter((d) => d.achievements.includes(info.title)).length }))
    .filter((x) => x.count > 0)
    .sort((x, y) => y.count - x.count);
  // Bars are a share of all suspects, so a full bar means "everyone has this".
  const max = Math.max(1, a.developers.length);
  const x0 = 250, plotW = 400, rowH = 34, barH = 18, top = BODY_TOP + 4;
  const rows = counts.map(({ info, count }, i) => {
    const y = top + i * rowH;
    const w = Math.max(4, (count / max) * plotW);
    return `<g><title>${escapeXml(`${info.title}: ${count} of ${a.developers.length} suspects. ${info.criteria}`)}</title>
      <text x="28" y="${y + 14}" fill="${t.text}" font-size="14" font-weight="700">${escapeXml(info.title)}</text>
      <rect x="${x0}" y="${y}" width="${r1(w)}" height="${barH}" rx="4" fill="${t.series[0]}"/>
      <text x="${r1(x0 + w + 10)}" y="${y + 14}" fill="${t.text}" font-size="14" font-weight="800">${count}<tspan fill="${t.muted}" font-weight="500"> / ${a.developers.length}</tspan></text>
    </g>`;
  }).join("");
  const height = top + Math.max(counts.length, 1) * rowH + 52;
  return frame(t, {
    id: "awards", title: "Charges filed", height,
    subtitle: `${a.repository} · how many of ${a.developers.length} suspects hold each title`,
    body: counts.length ? rows : emptyNote(t, top + 20, "No achievements awarded yet."),
    label: `Achievement counts for ${a.repository}: ${counts.map((c) => `${c.info.title} ${c.count}`).join(", ")}`,
  });
}

function commitShare(a: ChartInput, t: Tokens): string {
  const sorted = [...a.developers].sort((x, y) => y.commits - x.commits);
  const total = sorted.reduce((s, d) => s + d.commits, 0);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const slices: Slice[] = top.map((d, i) => ({
    label: d.username, value: d.commits, color: t.series[i]!,
    detail: `${fmt(d.commits)} commit${d.commits === 1 ? "" : "s"} · blame ${d.blameScore}`,
    tooltip: `${d.username}: ${d.commits} commits (${pct(d.commits, total)})`,
  }));
  if (rest.length) {
    const value = rest.reduce((s, d) => s + d.commits, 0);
    slices.push({ label: `${rest.length} others`, value, color: t.other, detail: `${fmt(value)} commits combined`, tooltip: `${rest.length} other contributors: ${value} commits` });
  }
  return frame(t, {
    id: "commit-share", title: "Who's carrying the team", height: 490,
    subtitle: `${a.repository} · share of ${fmt(total)} analysed commits`,
    body: total ? donut(t, slices, { value: fmt(total), label: "commits" }) : emptyNote(t, 300, "No commits to share."),
    label: `Commit share for ${a.repository}: ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`,
  });
}

export const CHARTS = {
  "score-breakdown": { title: "Score breakdown", description: "Stacked bars showing which sins make up each suspect's blame score.", render: scoreBreakdownChart },
  "shame-mix": { title: "Anatomy of shame", description: "Donut of the repo's total shame points by signal.", render: shameMix },
  "commit-share": { title: "Commit share", description: "Donut of who wrote the commits.", render: commitShare },
  heatmap: { title: "Crime-time heatmap", description: "Commits by weekday and hour, with the late-night zone outlined.", render: heatmap },
  awards: { title: "Charges filed", description: "How many suspects hold each achievement.", render: awards },
} as const satisfies Record<string, { title: string; description: string; render: (a: ChartInput, t: Tokens) => string }>;

export type ChartId = keyof typeof CHARTS;
export const CHART_IDS = Object.keys(CHARTS) as ChartId[];

export function isChartId(value: string): value is ChartId {
  return Object.hasOwn(CHARTS, value);
}

export function renderChart(id: ChartId, analysis: ChartInput, theme: ChartTheme = "dark"): string {
  return CHARTS[id].render(analysis, THEMES[theme]);
}
