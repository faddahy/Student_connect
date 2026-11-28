import type { PoolEligibility, PoolSplit, ViewerDayLog, ViewerSurface } from "./types";

/** Creator 50%, Viewer 20%, D'Luck 30%. */
export const POOL_SHARES = {
  creator: 0.5,
  viewer: 0.2,
  faddahy: 0.3,
} as const;

/**
 * Viewer pool is only for Post, Video, and Live, rescaled 2/7, 3/7, 2/7.
 * Text is not a viewer-pool surface.
 */
export const VIEWER_SURFACE_SHARE: Record<ViewerSurface, number> = {
  post: 2 / 7,
  video: 3 / 7,
  live: 2 / 7,
};

/** Metric 4 activity inside the viewer pool. */
export const VIEWER_ACTIVITY = {
  view: 0.6,
  share: 0.25,
  comment: 0.1,
  like: 0.05,
} as const;

export interface ActivityCounts {
  views: number;
  shares: number;
  comments: number;
  likes: number;
}

/**
 * Eligibility is applied before any naira/dollar is assigned.
 * Only verified blue-tick creators and viewers earn from ads.
 * Ineligible shares are withheld (they are not quietly added to D'Luck).
 * D'Luck's 30% is the platform share and is always allocated.
 */
export function allocateRevenue(gross: number, eligibility: PoolEligibility): PoolSplit {
  const amount = roundMoney(Math.max(0, gross));
  const creatorNominal = roundMoney(amount * POOL_SHARES.creator);
  const viewerNominal = roundMoney(amount * POOL_SHARES.viewer);
  const faddahy = roundMoney(amount * POOL_SHARES.faddahy);
  const creator = eligibility.creator ? creatorNominal : 0;
  const viewer = eligibility.viewers ? viewerNominal : 0;
  const withheld = roundMoney(
    (eligibility.creator ? 0 : creatorNominal) + (eligibility.viewers ? 0 : viewerNominal),
  );
  return { gross: amount, creator, viewer, faddahy, withheld };
}

export function viewerSurfaceBudgets(viewerPool: number): Record<ViewerSurface, number> {
  return {
    post: viewerPool * VIEWER_SURFACE_SHARE.post,
    video: viewerPool * VIEWER_SURFACE_SHARE.video,
    live: viewerPool * VIEWER_SURFACE_SHARE.live,
  };
}

/** Metric 4: Views 60%, Shares 25%, Comments 10%, Likes 5%, then the surface weight. */
export function viewerActivityScore(counts: ActivityCounts, surface: ViewerSurface): number {
  const activity =
    counts.views * VIEWER_ACTIVITY.view +
    counts.shares * VIEWER_ACTIVITY.share +
    counts.comments * VIEWER_ACTIVITY.comment +
    counts.likes * VIEWER_ACTIVITY.like;
  return activity * VIEWER_SURFACE_SHARE[surface];
}

export interface ViewerEligibility {
  eligible: boolean;
  reasons: string[];
  hoursThisWeek: number;
  viewedRatio: number;
}

/**
 * Per creator, a viewer must:
 * - watch at least 1 hour on each of 7 days (no makeup days),
 * - reach 7 hours in the week,
 * - view 90% of the creator's items,
 * - have 10 or more qualifying items.
 */
export function evaluateViewerEligibility(log: ViewerDayLog): ViewerEligibility {
  const reasons: string[] = [];
  const hours = log.hoursPerDay;
  if (hours.length !== 7) reasons.push("Need a full 7-day window.");
  const everyDay = hours.length === 7 && hours.every((h) => h >= 1);
  if (!everyDay) {
    reasons.push("Watch at least 1 hour on each of the 7 days. Missed days cannot be made up.");
  }
  const hoursThisWeek = hours.reduce((sum, h) => sum + (Number.isFinite(h) ? h : 0), 0);
  if (hoursThisWeek < 7) reasons.push("Watch at least 7 hours in the week.");
  const viewedRatio = log.itemsAvailable <= 0 ? 0 : log.itemsViewed / log.itemsAvailable;
  if (viewedRatio < 0.9) reasons.push("View at least 90% of this creator's items.");
  if (log.qualifyingItems < 10) reasons.push("Need 10 or more qualifying items.");
  return {
    eligible: reasons.length === 0,
    reasons,
    hoursThisWeek,
    viewedRatio,
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
