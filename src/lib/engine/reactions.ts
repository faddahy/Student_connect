export type Reaction = "like" | "dislike";

/** Pressing the active reaction again clears it. The other reaction replaces it. */
export function toggleReaction(current: Reaction | null, action: Reaction): Reaction | null {
  return current === action ? null : action;
}

function reactionValue(reaction: Reaction | null): number {
  if (reaction === "like") return 1;
  if (reaction === "dislike") return -1;
  return 0;
}

/** Like moves the shared score by +1. Dislike moves it by -1. */
export function netDelta(from: Reaction | null, to: Reaction | null): number {
  return reactionValue(to) - reactionValue(from);
}

/** One score for the pair of buttons: likes minus dislikes. */
export function netScore(likes: number, dislikes: number): number {
  const up = Number.isFinite(likes) ? likes : 0;
  const down = Number.isFinite(dislikes) ? dislikes : 0;
  return up - down;
}
