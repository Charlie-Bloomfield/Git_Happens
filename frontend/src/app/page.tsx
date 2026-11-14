"use client";

import { useEffect, useMemo, useState } from "react";
import { mockAnalysis } from "@/lib/mock-analysis";
import { parseRepository } from "@/lib/repository";

export default function Home() {
  const [input, setInput] = useState("");
  const [repository, setRepository] = useState("octocat/Hello-World");
  const [origin, setOrigin] = useState("https://YOUR-DOMAIN");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const analysis = useMemo(() => mockAnalysis(repository), [repository]);
  const imagePath = `/api/blame.svg?repo=${encodeURIComponent(repository)}`;
  const snippet = `![Git Happens leaderboard](${origin}${imagePath})`;

  useEffect(() => setOrigin(window.location.origin), []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(input);
    if (!parsed) {
      setError("Enter owner/repo or a public https://github.com/owner/repo URL.");
      return;
    }
    setRepository(parsed);
    setError("");
    setCopied(false);
  }

  async function copy() {
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
        <div className="hero-note"><span className="note-icon">!</span> Currently showing demo data while live analysis is being connected.</div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-symbol">git<span>!</span></div><div className="art-caption">COMMIT NOW, REGRET LATER_</div></div>
    </section>

    <section className="results shell" aria-labelledby="results-title">
      <div className="section-top"><div><div className="section-kicker">01 / THE VERDICT</div><h2 id="results-title">Hall of Shame <span className="heading-spark">✳</span></h2><p>Rankings for <strong>{repository}</strong> <span className="demo-tag">DEMO DATA</span></p></div><span className="status"><span /> PREVIEW READY</span></div>
      <div className="preview-layout">
        <div className="preview-panel"><div className="panel-bar"><span><i /> <i /> <i /></span><code>blame.svg?repo={repository}</code><span className="panel-label">SVG PREVIEW</span></div><div className="preview-image"><img src={imagePath} alt={`Demo leaderboard for ${repository}`} /></div></div>
        <aside className="stats-panel"><div className="aside-heading">THE CHARGE SHEET <span>↗</span></div><div className="stat-row"><span>Suspects identified</span><strong>{analysis.developers.length.toString().padStart(2, "0")}</strong></div><div className="stat-row"><span>Commits reviewed</span><strong>{analysis.developers.reduce((sum, developer) => sum + developer.commits, 0)}</strong></div><div className="stat-row"><span>Shame awarded</span><strong>{analysis.developers.reduce((sum, developer) => sum + developer.achievements.length, 0).toString().padStart(2, "0")}</strong></div><div className="aside-rule" /><p>These numbers are sample data. The live GitHub analyser will replace them when integration is ready.</p></aside>
      </div>
    </section>

    <section className="embed shell" aria-labelledby="embed-title"><div><div className="section-kicker">02 / TAKE IT WITH YOU</div><h2 id="embed-title">Wear your shame.</h2><p>Drop this Markdown into a README to show the leaderboard. This endpoint currently serves a demo card.</p></div><div className="embed-code"><div className="embed-label">README.MD <span>MARKDOWN</span></div><div className="code-row"><code>{snippet}</code><button type="button" onClick={copy} aria-label="Copy README Markdown">{copied ? "Copied ✓" : "Copy ↗"}</button></div></div></section>

    <footer className="shell footer"><span>git<span className="brand-accent">happens</span><span className="brand-dot">.</span></span><span>Built for laughs. Based on commits, not competence.</span><span>© 2026 GIT HAPPENS</span></footer>
  </main>;
}
