# Identity mapping (`src/analysis/identity.ts`)

One person can appear under several git identities. `createIdentityResolver(commits)` first collects
an email → login map from every commit that has both, then resolves each commit:

1. **GitHub login on the commit.** The key is the lowercased login, so `Dana` and `dana` merge. The
   displayed name is the login as first seen.
2. **No login, but the email matches a login seen elsewhere.** The commit is mapped to that login
   (emails are compared case-insensitively).
3. **Email only.** Grouped by email and shown under the git author name (or the email's local part).
4. **Name only.** Grouped by name.
5. Otherwise the commit goes under `unknown`.

## Not handled (yet)

- Different emails with no shared login (e.g. a work and a personal email, neither linked to GitHub)
  stay as separate developers. A `.mailmap`-style alias table would fix this.
- Co-authored-by trailers are ignored; only the commit author counts.

## Bot detection: `isBotCommit(commit)`

A commit is treated as a bot's if:
- GitHub reports the author's account type as `Bot`, or
- the login, git name, or email local part matches `*[bot]`, `dependabot*`, `renovate*`,
  `github-actions*`, `greenkeeper*`, `snyk-bot*`, `pre-commit-ci*`, `imgbot*` or `allcontributors*`.

Bot commits are skipped unless `includeBots: true` and counted in `meta.botCommitsSkipped`.
