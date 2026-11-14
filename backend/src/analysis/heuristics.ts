import type { CommitRecord } from './types';

/**
 * Commit-level heuristics. These are deliberately simple and transparent —
 * they describe habits, they do not prove bugs or incompetence.
 */
export const THRESHOLDS = {
    /** Late night = author hour in [lateNightStartHour, lateNightEndHour) in the analysis time zone. */
    lateNightStartHour: 0,
    lateNightEndHour: 5,
    /** Large commit = at least this many changed lines (additions + deletions)… */
    largeCommitLines: 500,
    /** …or at least this many changed files. */
    largeCommitFiles: 25,
    /** "Friday deploy" = Friday at or after this hour. */
    fridayEveningHour: 16,
} as const;

const REVERT_PATTERN = /^revert\b|\brevert(?:s|ed|ing)?\s+(?:"|commit\b|[0-9a-f]{7,40}\b)|this reverts commit [0-9a-f]{7,40}/i;

const LAZY_MESSAGE_PATTERN =
    /^(?:wip|fix(?:es|ed)?|bug ?fix|update[sd]?|changes?|stuff|things|test(?:ing)?|tmp|temp|minor|misc|oops+|cleanup|done|commit|final|final final|idk|lol|ugh|whatever|please work|pls work|works now|it works|(?:asdf)+|(?:qwerty)+|[a-z]|\.+|-+|\?+|!+|[0-9]+)[.!?\s]*$/i;

export function firstLine(message: string): string {
    return message.split('\n', 1)[0]?.trim() ?? '';
}

export function isMergeCommit(commit: CommitRecord): boolean {
    return commit.parentCount > 1;
}

export function isRevertCommit(commit: CommitRecord): boolean {
    return REVERT_PATTERN.test(commit.message);
}

export function isLazyMessage(commit: CommitRecord): boolean {
    const subject = firstLine(commit.message);
    return subject.length < 4 || LAZY_MESSAGE_PATTERN.test(subject);
}

/** Returns null when line stats were not fetched for this commit. */
export function isLargeCommit(commit: CommitRecord): boolean | null {
    if (commit.additions === undefined && commit.deletions === undefined && commit.filesChanged === undefined) {
        return null;
    }
    const lines = (commit.additions ?? 0) + (commit.deletions ?? 0);
    return lines >= THRESHOLDS.largeCommitLines || (commit.filesChanged ?? 0) >= THRESHOLDS.largeCommitFiles;
}

export interface LocalTime {
    hour: number;
    /** 0 = Sunday … 6 = Saturday */
    weekday: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * GitHub's REST API reports author dates in UTC, so the author's own time zone is lost.
 * We evaluate time-of-day in a configurable zone (default UTC) and say so in the docs.
 */
export function localTime(isoDate: string, timeZone: string): LocalTime | null {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return null;

    let formatter = formatterCache.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23', weekday: 'short' });
        formatterCache.set(timeZone, formatter);
    }
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const weekday = WEEKDAYS.indexOf(parts.find((p) => p.type === 'weekday')?.value ?? '');
    if (Number.isNaN(hour) || weekday < 0) return null;
    return { hour, weekday };
}

export function isLateNight(time: LocalTime | null): boolean {
    return time !== null && time.hour >= THRESHOLDS.lateNightStartHour && time.hour < THRESHOLDS.lateNightEndHour;
}

export function isWeekend(time: LocalTime | null): boolean {
    return time !== null && (time.weekday === 0 || time.weekday === 6);
}

export function isFridayEvening(time: LocalTime | null): boolean {
    return time !== null && time.weekday === 5 && time.hour >= THRESHOLDS.fridayEveningHour;
}
