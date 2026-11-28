"use client";

import { useState } from "react";
import Link from "next/link";
import { insertInlineAds, netScore, sortComments, type OwnerReaction } from "@/lib/engine";
import { personByUsername } from "@/lib/demo/data";
import type { HouseAd } from "@/lib/demo/data";
import type { FeedComment, FeedPost } from "@/lib/demo/feed-store";
import { MimicAd } from "@/components/social/MimicAd";

export function CommentThread({
  post,
  viewer,
  ads,
  onReact,
  onReply,
  onReport,
}: {
  post: FeedPost;
  viewer: string;
  ads: HouseAd[];
  onReact: (commentId: string, action: "like" | "dislike") => void;
  onReply: (parentId: string, body: string) => void;
  onReport: (commentId: string, label: string) => void;
}) {
  const [replyTo, setReplyTo] = useState("");
  const [draft, setDraft] = useState("");
  const [rootDraft, setRootDraft] = useState("");
  const top = post.comments.filter((comment) => !comment.parentId);
  const ranked = sortComments(top.map((comment) => rank(post, comment)));
  const slots = insertInlineAds(ranked, 10, "comment");

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4" data-testid="comment-thread">
      <h2 className="text-sm font-bold">Comments</h2>
      {slots.map((slot, index) => {
        if (slot.type === "ad") {
          const ad = ads[index % ads.length];
          return ad ? <MimicAd key={`c-ad-${index}`} ad={ad} viewer={viewer} compact /> : null;
        }
        const comment = post.comments.find((item) => item.id === slot.item.id);
        if (!comment) return null;
        const replies = sortComments(
          post.comments.filter((item) => item.parentId === comment.id).map((item) => rank(post, item)),
        );
        return (
          <div key={comment.id}>
            <CommentRow
              comment={comment}
              post={post}
              viewer={viewer}
              onReact={onReact}
              onReport={onReport}
              onStartReply={() => setReplyTo(comment.id)}
            />
            {replies.length > 0 && (
              <div className="ml-6 mt-2 space-y-2 border-l border-white/10 pl-3">
                {replies.map((reply) => {
                  const row = post.comments.find((item) => item.id === reply.id);
                  if (!row) return null;
                  return (
                    <CommentRow
                      key={row.id}
                      comment={row}
                      post={post}
                      viewer={viewer}
                      onReact={onReact}
                      onReport={onReport}
                      onStartReply={() => setReplyTo(comment.id)}
                    />
                  );
                })}
              </div>
            )}
            {replyTo === comment.id && (
              <form
                className="ml-6 mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onReply(comment.id, draft);
                  setDraft("");
                  setReplyTo("");
                }}
              >
                <input value={draft} onChange={(event) => setDraft(event.target.value)} className="input py-2" placeholder={`Reply to @${comment.author}`} />
                <button className="btn-primary px-3 py-2 text-sm" type="submit">Reply</button>
              </form>
            )}
          </div>
        );
      })}
      <form
        className="flex gap-2 pt-1"
        onSubmit={(event) => {
          event.preventDefault();
          onReply("", rootDraft);
          setRootDraft("");
        }}
      >
        <input value={rootDraft} onChange={(event) => setRootDraft(event.target.value)} className="input py-2" placeholder="Comment on this post" />
        <button className="btn-primary px-3 py-2 text-sm" type="submit">Send</button>
      </form>
    </div>
  );
}

function rank(post: FeedPost, comment: FeedComment) {
  const ownerReaction: OwnerReaction = comment.likes.includes(post.author)
    ? "like"
    : comment.dislikes.includes(post.author)
      ? "dislike"
      : null;
  return {
    id: comment.id,
    premium: Boolean(personByUsername(comment.author)?.blueTick),
    ownerReaction,
    likes: netScore(comment.likes.length, comment.dislikes.length),
    replies: post.comments.filter((item) => item.parentId === comment.id).length,
  };
}

function CommentRow({
  comment,
  post,
  viewer,
  onReact,
  onReport,
  onStartReply,
}: {
  comment: FeedComment;
  post: FeedPost;
  viewer: string;
  onReact: (commentId: string, action: "like" | "dislike") => void;
  onReport: (commentId: string, label: string) => void;
  onStartReply: () => void;
}) {
  const info = rank(post, { ...comment });
  const badge =
    info.ownerReaction === "like" ? "Post owner liked" : info.ownerReaction === "dislike" ? "Post owner disliked" : null;
  const score = netScore(comment.likes.length, comment.dislikes.length);
  return (
    <article className="text-sm leading-relaxed">
      <p>
        <Link href={`/u/${comment.author}`} className="font-semibold">@{comment.author}</Link>
        {info.premium && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">Premium</span>}
        {badge && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-ink/45">{badge}</span>}
      </p>
      <p className="text-ink/80">{comment.body}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" aria-label="Like comment" className={comment.likes.includes(viewer) ? "text-sky-300" : "text-ink/55"} onClick={() => onReact(comment.id, "like")}>🩵 {score}</button>
        <button type="button" aria-label="Dislike comment" className={comment.dislikes.includes(viewer) ? "text-rose-300" : "text-ink/55"} onClick={() => onReact(comment.id, "dislike")}>💔</button>
        <button type="button" className="text-ink/55" onClick={onStartReply}>Reply</button>
        <button type="button" className="text-ink/45" onClick={() => onReport(comment.id, `@${comment.author}`)}>Report</button>
      </div>
    </article>
  );
}
