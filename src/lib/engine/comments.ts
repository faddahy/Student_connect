export type OwnerReaction = "like" | "dislike" | null;

export interface RankedComment {
  id: string;
  premium: boolean;
  ownerReaction: OwnerReaction;
  /** Net score (likes minus dislikes). Higher ranks first inside a tier. */
  likes: number;
  replies: number;
}

/**
 * 0 owner-liked premium
 * 1 owner-liked non-premium
 * 2 no owner reaction
 * 3 owner-disliked premium
 * 4 owner-disliked non-premium
 */
export function commentTier(comment: Pick<RankedComment, "premium" | "ownerReaction">): number {
  if (comment.ownerReaction === "like") return comment.premium ? 0 : 1;
  if (comment.ownerReaction === "dislike") return comment.premium ? 3 : 4;
  return 2;
}

/**
 * Inside a tier, more likes rank first. Reply count is the next number,
 * so a busier thread breaks a tie and still cannot jump a higher like count.
 */
export function compareComments(a: RankedComment, b: RankedComment): number {
  const tier = commentTier(a) - commentTier(b);
  if (tier !== 0) return tier;
  if (a.likes !== b.likes) return b.likes - a.likes;
  if (a.replies !== b.replies) return b.replies - a.replies;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function sortComments<T extends RankedComment>(comments: readonly T[]): T[] {
  return [...comments].sort(compareComments);
}
