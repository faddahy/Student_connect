import type { DistributionChannel } from "./types";

/** West Africa Time is a fixed UTC+1 offset (no daylight saving). */
export const WAT_OFFSET_MS = 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export interface WatWindow {
  kind: "post" | "account";
  start: Date;
  end: Date;
  id: string;
}

function watParts(date: Date) {
  const wat = new Date(date.getTime() + WAT_OFFSET_MS);
  return {
    y: wat.getUTCFullYear(),
    m: wat.getUTCMonth(),
    d: wat.getUTCDate(),
    h: wat.getUTCHours(),
  };
}

/**
 * Fixed WAT windows.
 * Posts roll every clock hour. Accounts roll every WAT calendar day (24h).
 */
export function watWindow(date: Date, kind: "post" | "account"): WatWindow {
  const p = watParts(date);
  if (kind === "post") {
    const startUtc = Date.UTC(p.y, p.m, p.d, p.h) - WAT_OFFSET_MS;
    const start = new Date(startUtc);
    const end = new Date(startUtc + HOUR_MS);
    return { kind, start, end, id: `post:${start.toISOString()}` };
  }
  const startUtc = Date.UTC(p.y, p.m, p.d) - WAT_OFFSET_MS;
  const start = new Date(startUtc);
  const end = new Date(startUtc + DAY_MS);
  return { kind, start, end, id: `account:${start.toISOString()}` };
}

/**
 * Staying online rolls the channel into the window that contains `now`.
 * Going offline and coming back after the boundary closes the channel
 * until a fresh interest event (a like) opens a new one.
 */
export function rollChannel(channel: DistributionChannel, now: Date): DistributionChannel {
  const window = watWindow(channel.openedAt, channel.windowKind);
  if (now < window.end) return channel;
  if (channel.online) {
    const next = watWindow(now, channel.windowKind);
    return { ...channel, openedAt: next.start, closed: false };
  }
  return { ...channel, closed: true, freshInterest: false };
}

/** A like is fresh interest. An unlike never opens a channel. */
export function canOpenDistributionChannel(liked: boolean): boolean {
  return liked === true;
}

export function reopenOnFreshInterest(
  channel: DistributionChannel,
  now: Date,
  liked: boolean,
): DistributionChannel {
  if (!canOpenDistributionChannel(liked)) {
    return { ...channel, closed: true, freshInterest: false, online: channel.online };
  }
  const window = watWindow(now, channel.windowKind);
  return {
    ...channel,
    openedAt: window.start,
    closed: false,
    freshInterest: true,
    online: true,
  };
}

/**
 * New creators with zero online followers get a test audience of up to
 * 100 matched users who are online right now.
 */
export function coldStartAudience(onlineFollowers: number, matchedOnlineUsers: number): number {
  const followers = Math.max(0, Math.floor(onlineFollowers));
  if (followers > 0) return followers;
  return Math.min(100, Math.max(0, Math.floor(matchedOnlineUsers)));
}
