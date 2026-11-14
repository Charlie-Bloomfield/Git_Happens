# Page guide and tone

The hackathon theme is **Hate the User**: the visitor hands over their own repo and the site roasts them for it.
This doc walks through the page and explains how to write copy for it.

## Page walkthrough

| Section | What the visitor sees | Where it lives |
| --- | --- | --- |
| Header | Logo, `git` + `exposed` wordmark, link to the source code | `page.tsx` |
| Hero | "The Git history *roast engine*", input labelled **HAND OVER THE REPO** with a blinking cursor, **Roast me** button, the "EXHIBIT A" terminal card | `page.tsx`, `globals.css` |
| Process strip | 01 Enter repo › 02 Examine commits › 03 Expose results | `page.tsx` |
| **01 / The verdict** | "Hall of shame." Leaderboard card with its Embed bar, the charge sheet, the charges (tags) and the rap sheet | `page.tsx`, `insights.tsx` |
| **02 / The maths** | "How the score works." Signals, formula and a worked example | `insights.tsx` (`ScoreExplainer`) |
| **03 / The evidence board** | "Wear your shame." Four chart cards, each with an Embed bar, plus the theme toggle and Copy all embeds | `insights.tsx` (`EvidenceBoard`) |
| Footer | Logo, "Built for laughs. Based on commits, not competence." | `page.tsx` |

### Demo script (2–3 minutes)

1. Pitch the theme: *developers voluntarily install a card that publicly roasts their Git history.*
2. Paste a public repo into **HAND OVER THE REPO** and press **Roast me**.
3. Walk through the verdict: the leaderboard, a charge (hover it, then click to filter), a rap sheet entry
   and its evidence commits.
4. Click a score's **how?** link to show the maths on that person.
5. On the evidence board, press **Embed** on a chart and paste it into a README.
6. Show the leaderboard rendering in a real GitHub README (GitHub caches images, so prepare one in advance).

## Writing copy

**Talk to the visitor as "you".** They submitted the repo, so they're the one on trial.
Hero copy, hover cards and descriptions all use the second person.

**Roast the habit, never the person.** The README card and charts show *other contributors'* usernames, and
those people didn't opt in. Jokes target reverts, 3am commits, giant diffs and lazy messages, never anyone's
identity, skill as a person, or anything outside the commit history.

**Keep the facts factual.** Insults sit next to rules that are true. Achievement criteria in
`backend/src/analysis/achievements.ts` stay plain and precise; the roast lives in the tagline and description.

**Frame it as a joke.** The site footer says "Built for laughs. Based on commits, not competence." The SVG cards
used to end with "Your commits. Our judgement. · Entertainment only", but PR #11 removed that line, so an embedded
card no longer says it's a joke. Bring it back if the cards end up on READMEs that name people who didn't opt in.

**Keep it short.** The page was deliberately trimmed. One-line taglines, two-sentence descriptions.

## Achievement copy

Display copy is in `frontend/src/lib/achievement-meta.ts`. Rules and criteria are in
`backend/src/analysis/achievements.ts`. Tag-only achievements don't change the blame score.

| Tag | Tagline | Criteria |
| --- | --- | --- |
| 🎯 Most Wanted | Congratulations, you're the problem. | Highest blame score (above 0, at least 2 developers). |
| ↩️ Ctrl+Z Enthusiast | Your best work is the undo. | At least 2 reverts. |
| 🦉 Night Owl | Nothing good is committed at 3am. | At least 3 commits 00:00–05:00, at least 20% of their commits. |
| 💥 The Big Bang | Reviewers fear you. | At least 2 commits touching 500+ lines or 25+ files. |
| ✍️ Commit Message Poet | "fix". Fix what? | At least 3 lazy messages, at least 25% of their commits. |
| ⚔️ Weekend Warrior | No life detected. | At least 5 commits, 40%+ on weekends. Tag only. |
| 🔥 Friday Deployer | Chaos, scheduled weekly. | At least 2 commits on a Friday after 16:00. Tag only. |
| 🏋️ Carrying The Team | Most commits. Most chances to mess up. | Most commits (at least 2 developers). |
| 🎤 One-Hit Wonder | Came, committed, vanished. | Exactly one commit. |
| 🧼 Suspiciously Clean | Nobody is this clean. | At least 10 commits and zero shame points. |
| 😇 Innocent (For Now) | We'll find something. | No other achievement earned. |

## Error copy

| Code | Page title | Where |
| --- | --- | --- |
| `INVALID_REPOSITORY` | That's not a repo. | `page.tsx` `ERROR_COPY`, `leaderboard-svg.ts` |
| `NOT_FOUND` | Repo not found. (the SVG card adds "Coward.") | same |
| `EMPTY_REPOSITORY` | No commits, no crimes. | same |
| `RATE_LIMITED` | GitHub needs a breather. | same |
| `GITHUB_ERROR` | GitHub happened. | same |

The input's own validation message is "That's not a repo. It's owner/repo. Everyone else manages it."
