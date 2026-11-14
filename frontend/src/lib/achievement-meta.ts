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
  "Most Wanted": { emoji: "🎯", tone: "danger", tagline: "Congratulations, you're the problem.", description: "Highest blame score in the repo. Commit for commit, nobody here has done more damage. Your team has been too polite to say it." },
  "Ctrl+Z Enthusiast": { emoji: "↩️", tone: "danger", tagline: "Your best work is the undo.", description: "You shipped it, it broke, you un-shipped it. More than once. Reverts weigh ×3 because someone had to clean up after you." },
  "Night Owl": { emoji: "🦉", tone: "night", tagline: "Nothing good is committed at 3am.", description: "A fifth of your commits landed between midnight and 5am. Nobody reviewed them, including you." },
  "The Big Bang": { emoji: "💥", tone: "warning", tagline: "Reviewers fear you.", description: "500+ lines or 25+ files in one go, repeatedly. Your PRs get approved out of exhaustion, not trust." },
  "Commit Message Poet": { emoji: "✍️", tone: "warning", tagline: "\"fix\". Fix what?", description: "A quarter of your messages say nothing. git blame leads straight to you, and you have nothing to say for yourself." },
  "Weekend Warrior": { emoji: "⚔️", tone: "night", tagline: "No life detected.", description: "40% of your commits are on weekends. Doesn't hurt your score. Hurts to read, though." },
  "Friday Deployer": { emoji: "🔥", tone: "danger", tagline: "Chaos, scheduled weekly.", description: "Pushing after 4pm on a Friday, more than once. Someone's weekend got ruined, and it wasn't yours." },
  "Carrying The Team": { emoji: "🏋️", tone: "good", tagline: "Most commits. Most chances to mess up.", description: "You commit the most. Volume isn't punished, which is the only reason you're not higher up the board." },
  "One-Hit Wonder": { emoji: "🎤", tone: "neutral", tagline: "Came, committed, vanished.", description: "Exactly one commit. You'll still put this repo on your CV." },
  "Suspiciously Clean": { emoji: "🧼", tone: "good", tagline: "Nobody is this clean.", description: "10+ commits and not one shame point. Either you're flawless or you squash your evidence. We know which." },
  "Innocent (For Now)": { emoji: "😇", tone: "neutral", tagline: "We'll find something.", description: "No charges yet. Not because you're good, but because we haven't looked hard enough." },
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
