"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Filter, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { DetailedRepositoryAnalysis, DeveloperProfile } from "@backend/analysis";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS, achievementInfo } from "@/lib/achievement-meta";
import { CHART_IDS, CHARTS, renderChart, type ChartId } from "@/lib/charts-svg";
import { SCORE_CONSTANTS, SIGNALS, scoreBreakdown } from "@/lib/score";

const TAGS_ONLY = ["Weekend Warrior", "Friday Deployer"];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch {
      window.prompt("Copy this snippet:", text);
    }
  }
  return { copied, copy };
}

// ── Achievement tags ─────────────────────────────────────────────────────────

/** A tag with a hover/focus card. Clicking it filters the rap sheet. */
export function AwardChip({ title, active, count, onSelect }: { title: string; active: boolean; count?: number; onSelect: (title: string) => void }) {
  const info = achievementInfo(title);
  const tipId = useId();
  return <span className="chip-wrap">
    <button type="button" className={`award tone-${info.tone}${count !== undefined ? " award-lg" : ""}`} aria-pressed={active} aria-describedby={tipId} onClick={() => onSelect(title)}>
      <span aria-hidden="true">{info.emoji}</span>{title}{count !== undefined ? <b className="award-count">{count}</b> : null}
    </button>
    <span role="tooltip" id={tipId} className="chip-pop">
      <strong>{info.emoji} {title}</strong>
      {info.tagline ? <span className="chip-pop-tagline">{info.tagline}</span> : null}
      <span className="chip-pop-rule">{info.criteria}</span>
      <span className="chip-pop-hint">{active ? "Click to clear filter" : "Click to see who's charged"}</span>
    </span>
  </span>;
}

export function ChargeBoard({ developers, active, onSelect }: { developers: DeveloperProfile[]; active: string | null; onSelect: (title: string | null) => void }) {
  const charges = ACHIEVEMENTS
    .map((info) => ({ info, holders: developers.filter((d) => d.achievements.includes(info.title)) }))
    .filter((c) => c.holders.length > 0);
  const selected = charges.find((c) => c.info.title === active);

  return <div className="charge-board" id="charges">
    <div className="charge-board-top">
      <div className="section-kicker">THE CHARGES</div>
      {active ? <button type="button" className="clear-filter" onClick={() => onSelect(null)}><X size={13} /> Clear filter</button> : null}
    </div>
    <div className="charge-list">
      {charges.map(({ info, holders }) => <AwardChip key={info.title} title={info.title} count={holders.length} active={info.title === active} onSelect={(t) => onSelect(t === active ? null : t)} />)}
    </div>
    <AnimatePresence mode="wait">
      {selected ? <motion.div key={selected.info.title} className={`charge-detail tone-${selected.info.tone}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }} aria-live="polite">
        <div className="charge-emoji" aria-hidden="true">{selected.info.emoji}</div>
        <div className="charge-body">
          <div className="charge-meta"><Filter size={12} /> FILTERING · {selected.holders.length} OF {developers.length} SUSPECTS</div>
          <h3>{selected.info.title}</h3>
          <p className="charge-tagline">{selected.info.tagline}</p>
          <p>{selected.info.description}</p>
          <div className="charge-rule"><span>RULE</span>{selected.info.criteria}</div>
          {TAGS_ONLY.includes(selected.info.title) ? <div className="charge-rule"><span>SCORE</span>Bragging rights only. This tag doesn&apos;t change the blame score.</div> : null}
        </div>
      </motion.div> : null}
    </AnimatePresence>
  </div>;
}

// ── Score ────────────────────────────────────────────────────────────────────

/** Thin stacked bar: how much each signal contributes to the 0–100 score. */
export function ScoreMeter({ developer }: { developer: DeveloperProfile }) {
  const breakdown = scoreBreakdown(developer);
  const label = breakdown.contributions.filter((c) => c.count > 0).map((c) => `${c.label} ${Math.round(c.scoreShare)}`).join(", ") || "No shame points";
  return <div className="score-meter" role="img" aria-label={`Score breakdown: ${label}`}>
    {breakdown.contributions.map((c, i) => c.scoreShare > 0
      ? <span key={c.key} style={{ width: `${c.scoreShare}%`, background: `var(--sig-${i})` }} title={`${c.label}: ${c.count} × ${c.weight} = ${c.points} pts → ${c.scoreShare.toFixed(1)}`} />
      : null)}
  </div>;
}

const fixed = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(1));

export function ScoreExplainer({ developers, selected, onSelect }: { developers: DeveloperProfile[]; selected: string | null; onSelect: (username: string) => void }) {
  const developer = developers.find((d) => d.username === selected) ?? developers[0];
  if (!developer) return null;
  const b = scoreBreakdown(developer);
  const { priorCommits, pointsForMaxPerCommit } = SCORE_CONSTANTS;
  const noLineStats = developer.commitsWithLineStats === 0;

  return <section className="explainer shell" id="score-maths" aria-labelledby="explainer-title">
    <div className="section-kicker"><span>02</span> / THE MATHS</div>
    <h2 id="explainer-title">How the score <span>works.</span></h2>
    <p className="explainer-lede">0 to 100. How <em>concentrated</em> the bad habits are, not how much you commit.</p>

    <div className="explainer-grid">
      <ol className="formula-steps">
        <li>
          <span className="step-no">1</span>
          <div><h3>Count the sins</h3>
            <div className="signal-cards">{SIGNALS.map((s, i) => <div key={s.key} className="signal-card" style={{ ["--c" as string]: `var(--sig-${i})` }}>
              <div className="signal-head"><i /> {s.label}<b>×{s.weight}</b></div><p>{s.description}</p>
            </div>)}</div>
          </div>
        </li>
        <li><span className="step-no">2</span><div><h3>Normalise and cap</h3>
          <p><code>min(100, 100 × points ÷ {pointsForMaxPerCommit}·(commits + {priorCommits}))</code></p>
          <p className="formula-foot">The <code>+ {priorCommits}</code> stops one bad commit topping the board.</p>
        </div></li>
      </ol>

      <div className="worked-example">
        <div className="worked-top">
          <span className="aside-heading">WORKED EXAMPLE</span>
          <label className="suspect-select"><span className="sr-only">Suspect</span>
            <select value={developer.username} onChange={(e) => onSelect(e.target.value)}>
              {developers.map((d) => <option key={d.username} value={d.username}>{d.username} ({d.blameScore})</option>)}
            </select>
          </label>
        </div>
        <table className="worked-table">
          <thead><tr><th scope="col">Signal</th><th scope="col">Count</th><th scope="col">Weight</th><th scope="col">Points</th></tr></thead>
          <tbody>
            {b.contributions.map((c, i) => <tr key={c.key} className={c.count === 0 ? "is-zero" : undefined}>
              <th scope="row"><i style={{ background: `var(--sig-${i})` }} />{c.label}</th>
              <td>{c.key === "largeCommits" && noLineStats ? "—" : c.count}</td><td>×{c.weight}</td><td>{c.points}</td>
            </tr>)}
          </tbody>
          <tfoot><tr><th scope="row" colSpan={3}>Shame points</th><td>{b.shamePoints}</td></tr></tfoot>
        </table>
        <div className="equation" aria-label="Score calculation">
          <span>100 × {b.shamePoints}</span><span className="eq-op">÷</span><span>{pointsForMaxPerCommit}·({developer.commits} + {priorCommits})</span>
          <span className="eq-op">=</span><span>{fixed(b.raw)}</span><span className="eq-op">→</span><strong>{b.score}</strong>
        </div>
        <ScoreMeter developer={developer} />
        <p className="worked-note">
          {b.capped ? "Capped at 100. " : ""}
          {noLineStats ? "No line stats, so large commits not counted. " : ""}
          {developer.achievements.filter((a) => TAGS_ONLY.includes(a)).length ? `${developer.achievements.filter((a) => TAGS_ONLY.includes(a)).join(" and ")}: tag only.` : ""}
        </p>
      </div>
    </div>
  </section>;
}

// ── Charts ───────────────────────────────────────────────────────────────────

type EmbedTheme = "auto" | "dark" | "light";
// Charts shown on the evidence board. awards.svg is still served by the API for existing embeds.
const BOARD_CHARTS = CHART_IDS.filter((id) => id !== "awards");
const WIDE: ChartId[] = ["score-breakdown", "heatmap"];

export function chartSnippet(origin: string, repository: string, id: ChartId, theme: EmbedTheme): string {
  const base = `${origin}/api/charts/${id}.svg?repo=${encodeURIComponent(repository)}`;
  const alt = `Git Exposed · ${CHARTS[id].title}`;
  if (theme === "auto") {
    return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${base}">\n  <img alt="${alt}" src="${base}&theme=light">\n</picture>`;
  }
  return `![${alt}](${base}${theme === "light" ? "&theme=light" : ""})`;
}

/** README snippet shown next to its copy button. Shared by the leaderboard and every chart card. */
export function EmbedBar({ snippet, copied, onCopy, label, disabled = false }: { snippet: string; copied: boolean; onCopy: () => void; label: string; disabled?: boolean }) {
  return <div className="embed-bar">
    <code title={snippet}>{snippet}</code>
    <button type="button" className="chart-copy" onClick={onCopy} disabled={disabled} aria-label={label}>
      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Embed</>}
    </button>
  </div>;
}

export function EvidenceBoard({ analysis, origin }: { analysis: DetailedRepositoryAnalysis; origin: string }) {
  const [theme, setTheme] = useState<EmbedTheme>("auto");
  const { copied, copy } = useCopy();
  const preview = theme === "light" ? "light" : "dark";
  const svgs = useMemo(
    () => Object.fromEntries(BOARD_CHARTS.map((id) => [id, renderChart(id, analysis, preview)])) as Record<ChartId, string>,
    [analysis, preview],
  );
  const all = BOARD_CHARTS.map((id) => chartSnippet(origin, analysis.repository, id, theme)).join("\n\n");

  return <section className="evidence-board shell" aria-labelledby="evidence-title">
    <div className="section-top">
      <div>
        <div className="section-kicker"><span>03</span> / THE EVIDENCE BOARD</div>
        <h2 id="evidence-title">Wear your <span>shame.</span></h2>
        <p>Every chart is a live SVG endpoint. Hover marks for details, then copy any of them into a README.</p>
      </div>
      <div className="evidence-controls">
        <div className="theme-toggle" role="radiogroup" aria-label="Embed theme">
          {(["auto", "dark", "light"] as const).map((t) => <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)}>{t === "auto" ? "Auto (match GitHub)" : t}</button>)}
        </div>
        <Button type="button" variant="outline" className="copy-all" onClick={() => copy("all", all)}>{copied === "all" ? <><Check size={15} /> Copied all</> : <><Copy size={15} /> Copy all embeds</>}</Button>
      </div>
    </div>
    <div className="chart-grid">
      {BOARD_CHARTS.map((id) => <figure key={id} className={`chart-card${WIDE.includes(id) ? " chart-wide" : ""}`}>
        <figcaption>
          <strong>{CHARTS[id].title}</strong>
          <EmbedBar snippet={chartSnippet(origin, analysis.repository, id, theme)} copied={copied === id} onCopy={() => copy(id, chartSnippet(origin, analysis.repository, id, theme))} label={`Copy README embed for ${CHARTS[id].title}`} />
        </figcaption>
        {/* Generated by our own renderer; every user-supplied string is XML-escaped there. */}
        <div className="chart-svg" dangerouslySetInnerHTML={{ __html: svgs[id] }} />
      </figure>)}
    </div>
  </section>;
}
