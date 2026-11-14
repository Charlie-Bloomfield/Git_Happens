"use client";

import { useEffect, useState } from "react";
// Import the rules file directly (not "@backend/analysis") so Octokit never reaches the client bundle.
import { ACHIEVEMENT_RULES, FALLBACK_ACHIEVEMENT } from "@backend/analysis/achievements";
import type { DetailedRepositoryAnalysis, DeveloperProfile } from "@backend/analysis";
import { parseRepository } from "@/lib/repository";

type ApiError = { code: string; message: string; retryAt?: string };
type State =
  | { status: "loading" }
  | { status: "ready"; analysis: DetailedRepositoryAnalysis }
  | { status: "error"; error: ApiError };

const CRITERIA: Record<string, string> = Object.fromEntries(
  [...ACHIEVEMENT_RULES, FALLBACK_ACHIEVEMENT].map((rule) => [rule.title, rule.criteria]),
);

const ERROR_COPY: Record<string, { title: string; detail: string }> = {
  INVALID_REPOSITORY: { title: "That's not a repo.", detail: "Enter owner/repo or a public https://github.com/owner/repo URL." },
  NOT_FOUND: { title: "Repo not found.", detail: "It doesn't exist, or it's private. We only judge public repositories." },
  EMPTY_REPOSITORY: { title: "No commits, no crimes.", detail: "This repository is empty. Come back once someone has made a mistake." },
  RATE_LIMITED: { title: "GitHub needs a breather.", detail: "We've hit GitHub's rate limit." },
  GITHUB_ERROR: { title: "GitHub happened.", detail: "We couldn't reach GitHub. Try again in a minute." },
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const pad = (value: number) => value.toString().padStart(2, "0");

export default function Home() {
  const [input, setInput] = useState("");
  const [repository, setRepository] = useState("octocat/Hello-World");
  const [origin, setOrigin] = useState("https://YOUR-DOMAIN");
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const imagePath = `/api/blame.svg?repo=${encodeURIComponent(repository)}`;
  const snippet = `![Git Happens leaderboard](${origin}${imagePath})`;

  useEffect(() => {
    setOrigin(window.location.origin);
    // Shareable links: /?repo=owner/repo opens straight to that verdict.
    const shared = parseRepository(new URLSearchParams(window.location.search).get("repo") ?? "");
    if (shared) {
      setRepository(shared);
      setInput(shared);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch(`/api/analysis?repo=${encodeURIComponent(repository)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.ok && body) setState({ status: "ready", analysis: body as DetailedRepositoryAnalysis });
        else setState({ status: "error", error: body?.error ?? { code: "GITHUB_ERROR", message: "Unexpected response." } });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", error: { code: "GITHUB_ERROR", message: "Network error." } });
      });
    return () => controller.abort();
  }, [repository, attempt]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(input);
    if (!parsed) {
      setFormError("Enter owner/repo or a public https://github.com/owner/repo URL.");
      return;
    }
    setRepository(parsed);
    window.history.replaceState(null, "", `?repo=${encodeURIComponent(parsed)}`);
    setFormError("");
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormError("Clipboard access was blocked. Select and copy the snippet below.");
    }
  }

  const analysis = state.status === "ready" ? state.analysis : null;
  const developers = analysis?.developers ?? [];
  const totalCommits = developers.reduce((sum, developer) => sum + developer.commits, 0);
  const totalAwards = developers.reduce((sum, developer) => sum + developer.achievements.length, 0);
  const statusLabel = state.status === "loading" ? "JUDGING…" : state.status === "ready" ? "VERDICT READY" : "MISTRIAL";

  return <main>
    <header className="site-header shell">
      <a className="brand" href="#top"><span className="brand-mark">&gt;_</span><span>git<span className="brand-accent">happens</span><span className="brand-dot">.</span></span></a>
      <a className="header-link" href="https://github.com/Charlie-Bloomfield/Git_Happens" target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
    </header>

    <section className="hero shell" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-pulse" /> THE GIT HISTORY JUDGEMENT ENGINE</div>
        <h1>Your commits.<br /><em>Our judgement.</em></h1>
        <p className="hero-description">Every repository has a story. Some are better left in the reflog. Turn your team’s Git history into a public, gloriously questionable leaderboard.</p>
        <form onSubmit={submit} className="repo-form">
          <label htmlFor="repository">PASTE A PUBLIC GITHUB REPOSITORY</label>
          <div className="input-row"><span className="input-prefix" aria-hidden="true">↳</span><input id="repository" value={input} onChange={(event) => setInput(event.target.value)} placeholder="owner/repository" autoComplete="off" /><button type="submit" disabled={state.status === "loading"}>Judge this repo <span aria-hidden="true">→</span></button></div>
          {formError ? <p className="form-error" role="alert">{formError}</p> : <p className="form-hint">Try a GitHub URL or just owner/repo. Public repositories only.</p>}
        </form>
        <div className="hero-note"><span className="note-icon">!</span> We read the latest 300 commits on the default branch. Scores are for entertainment, not performance reviews.</div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-symbol">git<span>!</span></div><div className="art-caption">COMMIT NOW, REGRET LATER_</div></div>
    </section>

    <section className="results shell" aria-labelledby="results-title" aria-busy={state.status === "loading"}>
      <div className="section-top">
        <div>
          <div className="section-kicker">01 / THE VERDICT</div>
          <h2 id="results-title">Hall of Shame <span className="heading-spark">✳</span></h2>
          <p>Rankings for <strong>{analysis?.repository ?? repository}</strong>{analysis ? <span className="live-tag">ANALYSED {new Date(analysis.analysedAt).toLocaleString()}</span> : null}</p>
        </div>
        <span className={`status status-${state.status}`} role="status"><span /> {statusLabel}</span>
      </div>

      {state.status === "error" ? <ErrorPanel error={state.error} onRetry={() => setAttempt((count) => count + 1)} /> : null}

      <div className="preview-layout">
        <div className="preview-panel"><div className="panel-bar"><span><i /> <i /> <i /></span><code>blame.svg?repo={repository}</code><span className="panel-label">SVG PREVIEW</span></div><div className="preview-image">{state.status === "loading" ? <div className="skeleton" aria-label="Loading leaderboard" /> : <img key={imagePath} src={imagePath} alt={`Git Happens leaderboard for ${repository}`} />}</div></div>
        <aside className="stats-panel">
          <div className="aside-heading">THE CHARGE SHEET <span>↗</span></div>
          <div className="stat-row"><span>Suspects identified</span><strong>{analysis ? pad(developers.length) : "—"}</strong></div>
          <div className="stat-row"><span>Commits reviewed</span><strong>{analysis ? totalCommits : "—"}</strong></div>
          <div className="stat-row"><span>Shame awarded</span><strong>{analysis ? pad(totalAwards) : "—"}</strong></div>
          <div className="aside-rule" />
          <p>{analysis ? <MetaNote analysis={analysis} /> : state.status === "loading" ? "Reading the commit history…" : "No verdict this time."}</p>
        </aside>
      </div>

      {analysis && developers.length > 0 ? <RapSheet developers={developers} /> : null}
      {analysis && developers.length === 0 ? <p className="empty-note">Only merges and bots here. Nobody to blame… yet.</p> : null}
    </section>

    <section className="embed shell" aria-labelledby="embed-title"><div><div className="section-kicker">02 / TAKE IT WITH YOU</div><h2 id="embed-title">Wear your shame.</h2><p>Drop this Markdown into a README to show the live leaderboard. GitHub caches images, so updates can take a little while to appear.</p></div><div className="embed-code"><div className="embed-label">README.MD <span>MARKDOWN</span></div><div className="code-row"><code>{snippet}</code><button type="button" onClick={copy} aria-label="Copy README Markdown">{copied ? "Copied ✓" : "Copy ↗"}</button></div></div></section>

    <footer className="shell footer"><span>git<span className="brand-accent">happens</span><span className="brand-dot">.</span></span><span>Built for laughs. Based on commits, not competence.</span><span>© 2026 GIT HAPPENS</span></footer>
  </main>;
}

function ErrorPanel({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const copy = ERROR_COPY[error.code] ?? ERROR_COPY.GITHUB_ERROR!;
  const retry = error.code !== "RATE_LIMITED" ? ""
    : error.retryAt ? ` Try again after ${new Date(error.retryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    : " Try again shortly.";
  return <div className="error-panel" role="alert">
    <strong>{copy.title}</strong>
    <p>{copy.detail}{retry}</p>
    {error.code === "GITHUB_ERROR" ? <button type="button" onClick={onRetry}>Try again</button> : null}
  </div>;
}

function MetaNote({ analysis }: { analysis: DetailedRepositoryAnalysis }) {
  const { meta } = analysis;
  const skipped = meta.mergeCommitsSkipped + meta.botCommitsSkipped;
  return <>
    {meta.truncated ? `Latest ${meta.commitsAnalysed + skipped} commits only. ` : ""}
    {skipped ? `Skipped ${plural(meta.mergeCommitsSkipped, "merge")} and ${plural(meta.botCommitsSkipped, "bot commit")}. ` : ""}
    Line stats cover the newest {meta.commitsWithLineStats} commits. Late-night means 00:00–05:00 {meta.timeZone}.
  </>;
}

const RAP_SHEET_LIMIT = 12;

function RapSheet({ developers }: { developers: DeveloperProfile[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? developers : developers.slice(0, RAP_SHEET_LIMIT);
  return <div className="rap-sheet">
    <div className="section-kicker">THE RAP SHEET</div>
    <ol>
      {visible.map((developer, index) => {
        // Line stats are only fetched for the newest commits; unknown is not the same as zero.
        const hasLineStats = developer.commitsWithLineStats > 0;
        return <li key={developer.username} className="suspect">
        <div className="suspect-head">
          <span className="suspect-rank">{pad(index + 1)}</span>
          <span className="suspect-name">{developer.username}</span>
          <span className="suspect-score" title="Blame score (0–100)">{developer.blameScore}</span>
        </div>
        <div className="suspect-awards">
          {developer.achievements.map((title) => <span key={title} className="award" title={CRITERIA[title]}>{title}</span>)}
        </div>
        <dl className="suspect-stats">
          <Stat label="Commits" value={developer.commits} />
          <Stat label="Reverts" value={developer.reverts} evidence={developer.evidence.reverts} />
          <Stat label="Late-night" value={developer.lateNightCommits} evidence={developer.evidence.lateNight} />
          <Stat label="Large" value={hasLineStats ? developer.largeCommits : null} evidence={developer.evidence.large} />
          <Stat label="Suspicious msgs" value={developer.suspiciousMessages} evidence={developer.evidence.suspiciousMessages} />
          <Stat label="Lines changed" value={hasLineStats ? developer.linesChanged : null} />
        </dl>
      </li>;
      })}
    </ol>
    {developers.length > RAP_SHEET_LIMIT ? <button type="button" className="show-all" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
      {showAll ? "Show top suspects only" : `Show all ${developers.length} suspects`}
    </button> : null}
  </div>;
}

function Stat({ label, value, evidence = [] }: { label: string; value: number | null; evidence?: string[] }) {
  return <div>
    <dt>{label}</dt>
    <dd title={value === null ? "None of their commits were in the line-stats sample" : undefined}>
      {value === null ? "—" : value.toLocaleString()}
      {evidence.length > 0 ? <span className="evidence">{evidence.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer" title={`View commit ${url.slice(-40, -33)}`}>#{i + 1}</a>)}</span> : null}
    </dd>
  </div>;
}
