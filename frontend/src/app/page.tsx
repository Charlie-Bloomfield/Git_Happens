"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, Copy, GitBranch, GitCommitHorizontal, Search, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spotlight } from "@/components/ui/spotlight-new";
import { AwardChip, ChargeBoard, EvidenceBoard, ScoreExplainer, ScoreMeter } from "@/components/insights";
import type { DetailedRepositoryAnalysis, DeveloperProfile } from "@backend/analysis";
import { parseRepository } from "@/lib/repository";

type ApiError = { code: string; message: string; retryAt?: string };
type State =
  | { status: "loading" }
  | { status: "ready"; analysis: DetailedRepositoryAnalysis }
  | { status: "error"; error: ApiError };

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
  const [arrowLaunching, setArrowLaunching] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [explained, setExplained] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const arrowTimer = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
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

  useEffect(() => () => {
    if (arrowTimer.current !== null) window.clearTimeout(arrowTimer.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    setTagFilter(null);
    setExplained(null);
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
    if (parsed === repository) setAttempt((count) => count + 1);
    else setRepository(parsed);
    window.history.replaceState(null, "", `?repo=${encodeURIComponent(parsed)}`);
    setFormError("");
    setCopied(false);
    setArrowHovered(false);
    if (shouldReduceMotion) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "instant", block: "start" }));
    else {
      setArrowLaunching(true);
      if (arrowTimer.current !== null) window.clearTimeout(arrowTimer.current);
      arrowTimer.current = window.setTimeout(() => {
        setArrowLaunching(false);
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        arrowTimer.current = null;
      }, 500);
    }
  }

  async function copy() {
    if (state.status !== "ready") return;
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
  const arrowHopping = !shouldReduceMotion && arrowHovered && state.status !== "loading" && !arrowLaunching;

  return <MotionConfig reducedMotion="user"><main>
    <header className="site-header shell">
      <a className="brand" href="#top" aria-label="Git Happens home">
        <img className="brand-image" src="/logo/git_happens_transparent.svg" alt="" />
        <span className="brand-name">git<span>happens</span></span>
      </a>
      <a className="header-link" href="https://github.com/Charlie-Bloomfield/Git_Happens" target="_blank" rel="noreferrer"><GitBranch size={17} /> <span>Source code</span> <ArrowUpRight size={16} /></a>
    </header>

    <section className="hero shell" id="top">
      <div className="hero-spotlight" aria-hidden="true"><Spotlight gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(88, 166, 255, .13) 0, rgba(88, 166, 255, .025) 55%, transparent 80%)" gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(121, 184, 255, .07), transparent 80%)" gradientThird="radial-gradient(50% 50% at 50% 50%, rgba(88, 166, 255, .04), transparent 80%)" duration={14} xOffset={36} /></div>
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <h1>The Git history{" "}<br /><em>roast engine</em></h1>
        <Card className="query-card"><form onSubmit={submit} className="repo-form">
          <label htmlFor="repository">ENTER THE SCENE OF THE CRIME</label>
          <div className="query-row"><span className="query-icon" aria-hidden="true"><Search size={19} /></span><Input id="repository" value={input} onChange={(event) => setInput(event.target.value)} placeholder="owner/repository" autoComplete="off" aria-invalid={Boolean(formError)} /><Button type="submit" size="lg" className="judge-button" disabled={state.status === "loading"} onPointerEnter={(event) => { if (event.pointerType === "mouse") setArrowHovered(true); }} onPointerLeave={() => setArrowHovered(false)}>Judge this repo <motion.span key={arrowLaunching ? "launch" : "idle"} className="judge-arrow" aria-hidden="true" initial={{ x: 0, y: 0, opacity: 1 }} animate={arrowLaunching ? { x: [0, 4, 32], y: [0, -8, 0], opacity: [1, 1, 0] } : arrowHopping ? { x: 0, y: [0, -10, 0], opacity: 1 } : { x: 0, y: 0, opacity: 1 }} transition={arrowLaunching ? { duration: .42, ease: "easeIn", times: [0, .25, 1] } : arrowHopping ? { duration: .7, ease: "easeInOut" } : { duration: .15 }}><ArrowRight size={18} /></motion.span></Button></div>
          {formError ? <p className="form-error" role="alert">{formError}</p> : <p className="form-hint">Public GitHub repositories only <span>·</span> URLs work too</p>}
        </form></Card>
      </motion.div>
      <motion.div className="hero-visual" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6, delay: .1 }} aria-hidden="true">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <Card className="terminal-card"><div className="terminal-top"><span className="terminal-lights"><i /><i /><i /></span><span>CASE_FILE_001.LOG</span><span className="terminal-signal">● LIVE</span></div><div className="terminal-body">
          <div className="terminal-line"><span className="line-no">01</span><span className="line-command">$ git log --all --oneline</span></div>
          <div className="terminal-line"><span className="line-no">02</span><span><b>9f2a7c1</b> fix: actually fix the fix</span></div>
          <div className="terminal-line"><span className="line-no">03</span><span><b>72bfe43</b> wip please ignore</span></div>
          <div className="terminal-line"><span className="line-no">04</span><span><b>2ac901d</b> final_final_v3</span></div>
          <div className="terminal-line muted"><span className="line-no">05</span><span>...the evidence is compelling</span></div>
          <div className="terminal-verdict"><span><Zap size={15} fill="currentColor" /> VERDICT</span><strong>GUILTY AS COMMITTED</strong></div>
        </div><div className="terminal-stamp">EXHIBIT A</div></Card>
      </motion.div>
    </section>
    <div className="process-strip"><div className="shell process-inner"><span><b>01</b> ENTER REPO</span><ChevronRight size={15} /><span><b>02</b> EXAMINE COMMITS</span><ChevronRight size={15} /><span><b>03</b> EXPOSE RESULTS</span></div></div>

    <section className="results shell" ref={resultRef} aria-labelledby="results-title" aria-busy={state.status === "loading"} tabIndex={-1}>
      <div className="section-top">
        <div>
          <div className="section-kicker"><span>01</span> / THE VERDICT</div>
          <h2 id="results-title">Hall of <span>shame.</span></h2>
          <p>Ranking the suspects in <strong>{analysis?.repository ?? repository}</strong>{analysis ? <span className="live-tag">ANALYSED {new Date(analysis.analysedAt).toLocaleString()}</span> : null}</p>
        </div>
        <Badge variant="outline" className={`result-badge result-badge-${state.status}`} role="status"><span className="status-dot" /> {statusLabel}</Badge>
      </div>

      <AnimatePresence>{state.status === "error" ? <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ErrorPanel error={state.error} onRetry={() => setAttempt((count) => count + 1)} /></motion.div> : null}</AnimatePresence>

      <motion.div className="preview-layout" key={repository} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
        <Card className="preview-panel"><div className="panel-bar"><span className="panel-dots"><i /><i /><i /></span><code>blame.svg?repo={repository}</code><span className="panel-label">SVG EVIDENCE</span></div><div className="preview-image">{state.status === "loading" ? <div className="skeleton" aria-label="Loading leaderboard"><GitCommitHorizontal size={36} /><span>Reading the receipts…</span></div> : <img key={imagePath} src={imagePath} alt={`Git Happens leaderboard for ${repository}`} />}</div><BorderBeam className="beam" size={95} duration={10} colorFrom="#58a6ff" colorTo="#f78166" borderWidth={1} /></Card>
        <Card className="stats-panel">
          <div className="aside-heading">THE CHARGE SHEET <ArrowUpRight size={18} /></div>
          <div className="stat-row"><span>Suspects identified</span><strong>{analysis ? pad(developers.length) : "—"}</strong></div>
          <div className="stat-row"><span>Commits reviewed</span><strong>{analysis ? totalCommits : "—"}</strong></div>
          <div className="stat-row"><span>Shame awarded</span><strong>{analysis ? pad(totalAwards) : "—"}</strong></div>
          <div className="aside-rule" />
          <p>{analysis ? <MetaNote analysis={analysis} /> : state.status === "loading" ? "Reading the commit history…" : "No verdict this time."}</p>
        </Card>
      </motion.div>

      {analysis && developers.length > 0 ? <>
        <ChargeBoard developers={developers} active={tagFilter} onSelect={setTagFilter} />
        <RapSheet developers={developers} filter={tagFilter} onFilter={(title) => {
          setTagFilter(title === tagFilter ? null : title);
          document.getElementById("charges")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }} onExplain={(username) => {
          setExplained(username);
          document.getElementById("score-maths")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }} />
      </> : null}
      {analysis && developers.length === 0 ? <p className="empty-note">Only merges and bots here. Nobody to blame… yet.</p> : null}
    </section>

    {analysis && developers.length > 0 ? <ScoreExplainer developers={developers} selected={explained} onSelect={setExplained} /> : null}
    {analysis && developers.length > 0 ? <EvidenceBoard analysis={analysis} origin={origin} /> : null}

    <section className="embed shell" aria-labelledby="embed-title"><div><div className="section-kicker"><span>04</span> / THE PUBLIC RECORD</div><h2 id="embed-title">Wear your <span>shame.</span></h2><p>Every README deserves a warning label. Copy the leaderboard embed and let visitors see the verdict. Every chart on the evidence board has its own embed too. GitHub caches images, so updates can lag.</p><ArrowDownRight size={30} className="embed-arrow" /></div><Card className="embed-code"><div className="embed-label">README.MD <span>MARKDOWN / IMAGE</span></div><div className="code-row"><code>{snippet}</code><Button type="button" onClick={copy} disabled={state.status !== "ready"} className="copy-button" aria-label="Copy README Markdown">{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}</Button></div></Card></section>

    <footer className="shell footer"><span className="footer-brand"><img className="footer-brand-image" src="/logo/git_happens_transparent.svg" alt="Git Happens" /></span><span>Built for laughs. Based on commits, not competence.</span><span>© 2026 GIT HAPPENS</span></footer>
  </main></MotionConfig>;
}

function ErrorPanel({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const copy = ERROR_COPY[error.code] ?? ERROR_COPY.GITHUB_ERROR!;
  const retry = error.code !== "RATE_LIMITED" ? ""
    : error.retryAt ? ` Try again after ${new Date(error.retryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    : " Try again shortly.";
  return <div className="error-panel" role="alert">
    <strong>{copy.title}</strong>
    <p>{copy.detail}{retry}</p>
    {error.code === "GITHUB_ERROR" ? <Button type="button" onClick={onRetry}>Try again <ArrowRight size={15} /></Button> : null}
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

function RapSheet({ developers, filter, onFilter, onExplain }: { developers: DeveloperProfile[]; filter: string | null; onFilter: (title: string) => void; onExplain: (username: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  // Keep each suspect's overall rank even when filtered.
  const ranked = developers.map((developer, index) => ({ developer, rank: index + 1 }));
  const matching = filter ? ranked.filter(({ developer }) => developer.achievements.includes(filter)) : ranked;
  const visible = showAll || filter ? matching : matching.slice(0, RAP_SHEET_LIMIT);
  return <div className="rap-sheet">
    <div className="section-kicker">THE RAP SHEET{filter ? <span className="filter-note"> · {matching.length} charged with {filter}</span> : null}</div>
    <ol>
      {visible.map(({ developer, rank }) => {
        // Line stats are only fetched for the newest commits; unknown is not the same as zero.
        const hasLineStats = developer.commitsWithLineStats > 0;
        return <li key={developer.username} className={`suspect${filter ? " is-match" : ""}`}>
        <div className="suspect-head">
          <span className="suspect-rank">{pad(rank)}</span>
          <span className="suspect-name">{developer.username}</span>
          <button type="button" className="suspect-score" onClick={() => onExplain(developer.username)} title="How was this calculated?" aria-label={`Blame score ${developer.blameScore}. Show how it was calculated`}>{developer.blameScore}<span>how?</span></button>
        </div>
        <ScoreMeter developer={developer} />
        <div className="suspect-awards">
          {developer.achievements.map((title) => <AwardChip key={title} title={title} active={title === filter} onSelect={onFilter} />)}
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
    {!filter && developers.length > RAP_SHEET_LIMIT ? <Button type="button" variant="outline" className="show-all" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
      {showAll ? "Show top suspects only" : `Show all ${developers.length} suspects`}
    </Button> : null}
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
