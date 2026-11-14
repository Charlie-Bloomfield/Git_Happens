// Display copy for achievements. The rules and criteria live in the backend
// (ACHIEVEMENT_RULES); this file only adds the longer story told in the UI.
import { ACHIEVEMENT_RULES, FALLBACK_ACHIEVEMENT } from "@backend/analysis/achievements";

export type AchievementTone = "danger" | "warning" | "night" | "neutral" | "good";

export interface AchievementInfo {
  title: string;
  criteria: string;
  /** One-line hook shown in the hover card. */
  tagline: string;
  /** Longer explanation shown when the tag is selected. */
  description: string;
  emoji: string;
  tone: AchievementTone;
}

const COPY: Record<string, Omit<AchievementInfo, "title" | "criteria">> = {
  "Most Wanted": { emoji: "🎯", tone: "danger", tagline: "Top of the blame board.", description: "The highest blame score in the repository. Their commit history has the densest mix of reverts, giant commits, late nights and lazy messages relative to how much they commit." },
  "Ctrl+Z Enthusiast": { emoji: "↩️", tone: "danger", tagline: "Ships it. Un-ships it.", description: "Has authored multiple revert commits. Reverts carry the heaviest weight in the score (×3) because something made it in that had to come straight back out." },
  "Night Owl": { emoji: "🦉", tone: "night", tagline: "Commits after midnight.", description: "A meaningful share of their commits landed between 00:00 and 05:00 in the analysis time zone (UTC by default). Code written at 3am is rarely reviewed at 3am." },
  "The Big Bang": { emoji: "💥", tone: "warning", tagline: "One commit, entire universe.", description: "Repeatedly commits 500+ changed lines or 25+ files at once. Large commits weigh ×2 because they are hard to review, hard to revert and hard to bisect." },
  "Commit Message Poet": { emoji: "✍️", tone: "warning", tagline: "\"fix\". \"wip\". \"asdf\".", description: "A quarter or more of their commit messages say nothing useful. Future archaeologists running git blame will not thank them." },
  "Weekend Warrior": { emoji: "⚔️", tone: "night", tagline: "Saturday is a work day.", description: "At least 40% of their commits were made on a Saturday or Sunday. Dedicated or burnt out? The commit log can't tell. This tag doesn't add to the score." },
  "Friday Deployer": { emoji: "🔥", tone: "danger", tagline: "Pushes at 5pm on Friday.", description: "Has committed after 16:00 on a Friday more than once, the classic recipe for a ruined weekend. This tag doesn't add to the score." },
  "Carrying The Team": { emoji: "🏋️", tone: "good", tagline: "Most commits in the repo.", description: "The most prolific committer. Because the score divides by commit count, doing lots of work doesn't count against you." },
  "One-Hit Wonder": { emoji: "🎤", tone: "neutral", tagline: "One commit and gone.", description: "Exactly one commit in the analysed history. Drive-by contributor, typo fixer, or a mystery." },
  "Suspiciously Clean": { emoji: "🧼", tone: "good", tagline: "Zero shame. Too clean.", description: "Ten or more commits without a single revert, large commit, late-night commit or lazy message. Either a model engineer or very good at squashing." },
  "Innocent (For Now)": { emoji: "😇", tone: "neutral", tagline: "Nothing to see here… yet.", description: "Earned no other achievement. Every leaderboard row needs a title, so this is theirs until they slip up." },
};

const FALLBACK_COPY: Omit<AchievementInfo, "title" | "criteria"> = { emoji: "🏷️", tone: "neutral", tagline: "", description: "" };

/** Every achievement, in rule order, with the fallback last. */
export const ACHIEVEMENTS: readonly AchievementInfo[] = [...ACHIEVEMENT_RULES, FALLBACK_ACHIEVEMENT].map((rule) => ({
  title: rule.title,
  criteria: rule.criteria,
  ...(COPY[rule.title] ?? FALLBACK_COPY),
}));

const BY_TITLE = new Map(ACHIEVEMENTS.map((a) => [a.title, a]));

export function achievementInfo(title: string): AchievementInfo {
  return BY_TITLE.get(title) ?? { title, criteria: "", ...FALLBACK_COPY };
}
