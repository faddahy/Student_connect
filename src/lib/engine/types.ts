/** Shared types for Algorithm v1.1 and Metric Allocation v2.1. */

export type EngagementForm = "like" | "comment" | "share" | "view";
export type TrafficSource = "organic" | "paid" | "fake";
export type ContentKind = "text" | "post" | "live" | "video" | "book";
export type ViewerSurface = "post" | "video" | "live";
export type Region = "nigeria" | "africa" | "foreign";
export type PremiumPlan = "monthly" | "fast_track" | "yearly";
export type PostKind = "original" | "distribute" | "contribute";

export interface LeafInput {
  form: EngagementForm;
  source: TrafficSource;
  isFollower: boolean;
  content: ContentKind;
  /** 1–5 for video/book. Ignored for text, post, and live (always 1). */
  lengthPoints?: number;
}

export interface PoolEligibility {
  /** Verified blue-tick creator. */
  creator: boolean;
  /** At least one verified blue-tick viewer passed eligibility. */
  viewers: boolean;
}

export interface PoolSplit {
  gross: number;
  creator: number;
  viewer: number;
  faddahy: number;
  /** Shares withheld because the party failed eligibility. Not paid out. */
  withheld: number;
}

export interface ViewerDayLog {
  /** Seven entries, index 0 = oldest day. Hours watched that calendar day. */
  hoursPerDay: number[];
  itemsViewed: number;
  itemsAvailable: number;
  qualifyingItems: number;
}

export interface DistributionChannel {
  windowKind: "post" | "account";
  /** Window start (UTC) the channel is currently attached to. */
  openedAt: Date;
  online: boolean;
  closed: boolean;
  /** Set when a like (fresh interest) reopens a closed channel. */
  freshInterest: boolean;
}
