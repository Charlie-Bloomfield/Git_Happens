"use client";

import { useEffect, useRef, useState } from "react";
import { mockAnalysis } from "@/lib/mock-analysis";
import { parseRepository } from "@/lib/repository";
import type { RepositoryAnalysis } from "@shared/analysis";

type ViewMode = "demo" | "loading" | "live" | "error";

export default function Home() {
  const [input, setInput] = useState("");
  const [repository, setRepository] = useState("octocat/Hello-World");
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(() => mockAnalysis("octocat/Hello-World"));
  const [mode, setMode] = useState<ViewMode>("demo");
  const [resultMessage, setResultMessage] = useState("");
  const [origin, setOrigin] = useState("https://YOUR-DOMAIN");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const imagePath = `/api/blame.svg?repo=${encodeURIComponent(repository)}`;
  const previewPath = mode === "demo" ? `${imagePath}&demo=1` : imagePath;
  const snippet = `![Git Happens leaderboard](${origin}${imagePath})`;

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => requestRef.current?.abort();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(input);
    if (!parsed) {
      setError("Enter owner/repo or a public https://github.com/owner/repo URL.");
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRepository(parsed);
    setAnalysis(null);
    setMode("loading");
    setResultMessage("");
    setError("");
    setCopied(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    try {
      const response = await fetch(`/api/analysis?repo=${encodeURIComponent(parsed)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Analysis failed. Please try again.");
      setAnalysis(data as RepositoryAnalysis);
      setMode("live");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setResultMessage(cause instanceof Error ? cause.message : "Analysis failed. Please try again.");
      setMode("error");
    }
  }

  async function copy() {
    if (mode !== "live") return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. Select and copy the snippet below.");
    }
  }

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
          <div className="input-row"><span className="input-prefix" aria-hidden="true">↳</span><input id="repository" value={input} onChange={(event) => setInput(event.target.value)} placeholder="owner/repository" autoComplete="off" /><button type="submit">Judge this repo <span aria-hidden="true">→</span></button></div>
          {error ? <p className="form-error" role="alert">{error}</p> : <p className="form-hint">Try a GitHub URL or just owner/repo. Public repositories only.</p>}
        </form>
        <div className="hero-note"><span className="note-icon">!</span> {mode === "demo" ? "Previewing sample data. Enter a public repository to see its real verdict." : mode === "loading" ? `Reading the public Git history for ${repository}…` : mode === "live" ? `Showing live results for ${repository}.` : "The analysis could not finish. Check the message below and try again."}</div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-symbol">git<span>!</span></div><div className="art-caption">COMMIT NOW, REGRET LATER_</div></div>
    </section>

    <section className="results shell" ref={resultRef} aria-labelledby="results-title" tabIndex={-1}>
      <div className="section-top"><div><div className="section-kicker">01 / THE VERDICT</div><h2 id="results-title">Hall of Shame <span className="heading-spark">✳</span></h2><p>Rankings for <strong>{repository}</strong> {mode === "demo" && <span className="demo-tag">DEMO DATA</span>}{mode === "live" && <span className="demo-tag">LIVE GITHUB DATA</span>}</p></div><span className={`status status-${mode}`}><span /> {mode === "loading" ? "ANALYSING REPO" : mode === "error" ? "ANALYSIS FAILED" : mode === "live" ? "LIVE RESULTS" : "DEMO PREVIEW"}</span></div>
      {mode === "loading" ? <div className="result-state" role="status" aria-live="polite"><h3>Reading the commit history…</h3><p>This may take a moment for larger repositories.</p></div> : mode === "error" ? <div className="result-state result-state-error" role="alert"><h3>We couldn’t judge this repository.</h3><p>{resultMessage}</p></div> : analysis && <div className="preview-layout">
        <div className="preview-panel"><div className="panel-bar"><span><i /> <i /> <i /></span><code>blame.svg?repo={repository}</code><span className="panel-label">SVG PREVIEW</span></div><div className="preview-image"><img src={previewPath} alt={`${mode === "demo" ? "Demo" : "Live"} leaderboard for ${repository}`} /></div></div>
        <aside className="stats-panel"><div className="aside-heading">THE CHARGE SHEET <span>↗</span></div><div className="stat-row"><span>Suspects identified</span><strong>{analysis.developers.length.toString().padStart(2, "0")}</strong></div><div className="stat-row"><span>Commits reviewed</span><strong>{analysis.developers.reduce((sum, developer) => sum + developer.commits, 0)}</strong></div><div className="stat-row"><span>Shame awarded</span><strong>{analysis.developers.reduce((sum, developer) => sum + developer.achievements.length, 0).toString().padStart(2, "0")}</strong></div><div className="aside-rule" /><p>{mode === "demo" ? "These numbers are sample data. Enter a public repository to see real GitHub results." : "Based on the public commit history available from GitHub."}</p></aside>
      </div>}
    </section>

    <section className="embed shell" aria-labelledby="embed-title"><div><div className="section-kicker">02 / TAKE IT WITH YOU</div><h2 id="embed-title">Wear your shame.</h2><p>{mode === "live" ? "Drop this Markdown into a README to show the live leaderboard." : "Run a public repository to get its live README embed."}</p></div><div className="embed-code"><div className="embed-label">README.MD <span>MARKDOWN</span></div><div className="code-row"><code>{mode === "live" ? snippet : "Analyse a repository to generate an embed."}</code><button type="button" onClick={copy} disabled={mode !== "live"} aria-label="Copy README Markdown">{copied ? "Copied ✓" : "Copy ↗"}</button></div></div></section>

    <footer className="shell footer"><span>git<span className="brand-accent">happens</span><span className="brand-dot">.</span></span><span>Built for laughs. Based on commits, not competence.</span><span>© 2026 GIT HAPPENS</span></footer>
  </main>;
}
