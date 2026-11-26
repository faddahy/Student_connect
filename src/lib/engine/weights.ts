import type { ContentKind, EngagementForm, LeafInput, TrafficSource } from "./types";

/** Leaf form weights. Likes 0.20, Comments 0.30, Shares 0.30, Views 0.20. */
export const FORM_WEIGHT: Record<EngagementForm, number> = {
  like: 0.2,
  comment: 0.3,
  share: 0.3,
  view: 0.2,
};

/** Organic 0.65, Paid 0.35, Fake 0.00. Fake traffic never scores. */
export const SOURCE_WEIGHT: Record<TrafficSource, number> = {
  organic: 0.65,
  paid: 0.35,
  fake: 0,
};

export const FOLLOWER_WEIGHT = {
  follower: 0.6,
  nonFollower: 0.4,
} as const;

/**
 * Length points: 1 for Text, Post, and Live.
 * Video and Book use an explicit 1–5 score from the metric engine.
 */
export function lengthPoints(content: ContentKind, requested?: number): number {
  if (content === "text" || content === "post" || content === "live") return 1;
  const n = requested ?? 1;
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, n));
}

/** form_weight * source_weight * follower_weight * length_points */
export function leafScore(input: LeafInput): number {
  const follower = input.isFollower ? FOLLOWER_WEIGHT.follower : FOLLOWER_WEIGHT.nonFollower;
  return (
    FORM_WEIGHT[input.form] *
    SOURCE_WEIGHT[input.source] *
    follower *
    lengthPoints(input.content, input.lengthPoints)
  );
}
