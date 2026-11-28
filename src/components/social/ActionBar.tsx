"use client";

import Link from "next/link";

export function ActionBar({
  views,
  net,
  liked,
  disliked,
  comments,
  shares,
  commentHref,
  showRepost = true,
  showDislike = true,
  showComment = true,
  showViews = true,
  onLike,
  onDislike,
  onShare,
  onRepost,
}: {
  views: number;
  net: number;
  liked: boolean;
  disliked: boolean;
  comments: number;
  shares: number;
  commentHref?: string;
  showRepost?: boolean;
  showDislike?: boolean;
  showComment?: boolean;
  showViews?: boolean;
  onLike: () => void;
  onDislike?: () => void;
  onShare: () => void;
  onRepost?: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-1 text-ink/80">
      {showViews && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold" aria-label={`${views} views`}>
          <BarsIcon />
          {views}
        </span>
      )}
      <button type="button" aria-label="Like" className={`inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-sm ${liked ? "text-sky-300" : ""}`} onClick={onLike}>
        <span aria-hidden>🩵</span>
        <span className="text-xs font-semibold">{net}</span>
      </button>
      {showDislike && (
        <button type="button" aria-label="Dislike" className={`inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-sm ${disliked ? "text-rose-300" : ""}`} onClick={onDislike}>
          <span aria-hidden>💔</span>
        </button>
      )}
      {showComment && commentHref && (
        <Link href={commentHref} aria-label="Comment" className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-sm">
          <BubbleIcon />
          <span className="text-xs font-semibold">{comments}</span>
        </Link>
      )}
      {showRepost && (
        <button type="button" aria-label="Repost or quote" className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-sm" onClick={onRepost}>
          <RepostIcon />
        </button>
      )}
      <button type="button" aria-label="Share" className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-sm" onClick={onShare}>
        <ShareIcon />
        <span className="text-xs font-semibold">{shares}</span>
      </button>
    </div>
  );
}

function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M4 18h3V8H4v10zm6.5 0h3V4h-3v14zM17 18h3v-7h-3v7z" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 16.5 4 20l4.2-1.6A8 8 0 1 0 6 16.5z" strokeLinejoin="round" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 7h9a4 4 0 0 1 4 4v1" strokeLinecap="round" />
      <path d="M17 17H8a4 4 0 0 1-4-4v-1" strokeLinecap="round" />
      <path d="m16 4 4 3-4 3M8 20l-4-3 4-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 4v11" strokeLinecap="round" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 13.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4.5" strokeLinecap="round" />
    </svg>
  );
}
