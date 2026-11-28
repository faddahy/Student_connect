import type { PostKind } from "./types";

export interface PostRef {
  id: string;
  kind: PostKind;
  originalId?: string | null;
}

export interface RepostPermissions {
  distribute: boolean;
  contribute: boolean;
  hint?: string;
}

/**
 * Distribute is a normal repost. The wrapper is read-only: likes, comments,
 * shares, distribute, and contribute all target the original post.
 * Contribute is a quote. It earns its own engagement, but it cannot be
 * distributed or quoted again.
 */
export function repostPermissions(kind: PostKind): RepostPermissions {
  if (kind === "contribute") {
    return {
      distribute: false,
      contribute: false,
      hint: "Quote the original post, or comment on this Contribute post.",
    };
  }
  if (kind === "distribute") {
    return {
      distribute: false,
      contribute: false,
      hint: "This repost is read-only. Interact with the original post.",
    };
  }
  return { distribute: true, contribute: true };
}

/** True when the viewer may like, comment, or share this row itself. */
export function canInteractWithWrapper(kind: PostKind): boolean {
  return kind !== "distribute";
}

/** Engagement on a distribute wrapper is redirected to the original. */
export function interactionTargetId(post: PostRef): string {
  if (post.kind === "distribute") {
    if (!post.originalId) throw new Error("A distribute post must reference the original.");
    return post.originalId;
  }
  return post.id;
}

export function canDistributeTarget(targetKind: PostKind): boolean {
  return targetKind === "original";
}

export function canContributeTarget(targetKind: PostKind): boolean {
  return targetKind === "original";
}

export interface BlockView {
  /** Direct messages are refused while a block exists in either direction. */
  canDm: boolean;
  /** Likes, comments, follows, and other direct interactions. */
  canDirectInteract: boolean;
  canViewProfile: boolean;
  /**
   * Public posts inside a group both people belong to stay visible.
   * The block does not hide that shared public-group copy.
   */
  canSeePublicGroupPost: boolean;
}

export function blockView(blocked: boolean, sharesPublicGroup: boolean): BlockView {
  if (!blocked) {
    return {
      canDm: true,
      canDirectInteract: true,
      canViewProfile: true,
      canSeePublicGroupPost: true,
    };
  }
  return {
    canDm: false,
    canDirectInteract: false,
    canViewProfile: false,
    canSeePublicGroupPost: sharesPublicGroup,
  };
}

/** Main feed is text-only so hosting stays on the free tier. */
export function feedAllowsMedia(media: "text" | "image" | "video" | "audio"): boolean {
  return media === "text";
}

export const AD_EVERY_N_POSTS = 10;
export const AD_EVERY_N_COMMENTS = 10;

export type FeedSlot<T> =
  | { type: "item"; item: T; index: number }
  | { type: "ad"; after: number; slot: "post" | "comment" };

/** Insert one inline ad after every 10 items. */
export function insertInlineAds<T>(items: T[], every: number, slot: "post" | "comment"): FeedSlot<T>[] {
  const cadence = Math.max(1, Math.floor(every));
  const out: FeedSlot<T>[] = [];
  items.forEach((item, index) => {
    out.push({ type: "item", item, index });
    if ((index + 1) % cadence === 0) out.push({ type: "ad", after: index + 1, slot });
  });
  return out;
}

export type AnonymousVisibility = "full" | "locked";

/**
 * Free members see 1 of every 3 anonymous messages (indexes 0, 3, 6…).
 * The other two are locked. Blue-tick members see every message.
 */
export function anonymousVisibility(index: number, blueTick: boolean): AnonymousVisibility {
  if (blueTick) return "full";
  if (index < 0) return "locked";
  return index % 3 === 0 ? "full" : "locked";
}

/** Only blue-tick members may send an anonymous message. */
export function canSendAnonymous(blueTick: boolean): boolean {
  return blueTick;
}

/** Anonymous groups are public to join, and only premium members may create one. */
export function canCreateAnonymousGroup(blueTick: boolean): boolean {
  return blueTick;
}

/** The 18+ tab itself requires an active premium (blue-tick) account. */
export function canEnterSecretZone(blueTick: boolean): boolean {
  return blueTick;
}

/**
 * A premium member still pays ₦1,000/month to watch one creator.
 * The creator can open their own channel without subscribing to themselves.
 */
export function canViewSecretCreator(input: {
  viewerIsPremium: boolean;
  isOwnChannel: boolean;
  subscribed: boolean;
}): boolean {
  if (!input.viewerIsPremium) return false;
  if (input.isOwnChannel) return true;
  return input.subscribed;
}

/** A viewer's dislike blocks them from distributing that post. */
export function distributeBlockedByDislike(dislikedByViewer: boolean): boolean {
  return dislikedByViewer;
}

/**
 * Third-party ad scripts are forbidden on every Secret Zone route.
 * House UI that merely says a post is sponsored is still an ad script if it
 * loads a network; this gate is about network ads, and Secret Zone has neither.
 */
export function allowsThirdPartyAds(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return !(path === "/secret" || path.startsWith("/secret/"));
}
