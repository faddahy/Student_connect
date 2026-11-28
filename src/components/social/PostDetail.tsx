"use client";

import { useState } from "react";
import Link from "next/link";
import { avatarUri, personByUsername, ADS } from "@/lib/demo/data";
import {
  addComment,
  contributePost,
  distributePost,
  sharePost,
  toggleCommentReaction,
  togglePostReaction,
  usePost,
} from "@/lib/demo/feed-store";
import { canInteractWithWrapper, interactionTargetId, netScore, repostPermissions } from "@/lib/engine";
import { hoursAgoLabel } from "@/lib/format";
import { ActionBar } from "@/components/social/ActionBar";
import { CommentThread } from "@/components/social/CommentThread";
import { RepostSheet } from "@/components/social/RepostSheet";
import { reportContent } from "@/app/actions/social";
import { addContentReport } from "@/lib/demo/requests-store";

export function PostDetail({ id, viewer }: { id: string; viewer: string }) {
  const post = usePost(id);
  const original = usePost(post?.originalId || "");
  const [notice, setNotice] = useState<string>();
  const [repost, setRepost] = useState(false);
  const [reporting, setReporting] = useState<{ type: "post" | "comment"; id: string; label: string } | null>(null);
  const [reason, setReason] = useState("Spam");
  const [details, setDetails] = useState("");

  if (!post) {
    return (
      <main className="px-4">
        <h1 className="text-2xl font-extrabold">Post unavailable</h1>
        <Link href="/feed" className="btn-ghost mt-4">Back to feed</Link>
      </main>
    );
  }

  const engaged = post.kind === "distribute" && original ? original : post;
  const interactive = canInteractWithWrapper(post.kind) ? post : engaged;
  const perms = repostPermissions(interactive.kind);
  const author = personByUsername(post.kind === "distribute" && original ? original.author : post.author);

  return (
    <main className="px-4">
      <Link href="/feed" className="text-sm font-semibold text-brand-200">Feed</Link>
      <article className="card mt-3">
        {post.kind === "distribute" && <p className="mb-3 text-sm text-ink/60"><span className="font-semibold text-ink">@{post.author} reposted</span></p>}
        {post.kind !== "distribute" && (
          <Header username={post.author} name={author?.displayName} color={author?.color} blueTick={Boolean(author?.blueTick)} hours={post.hoursAgo} kind={post.kind} />
        )}
        {post.kind !== "distribute" && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>}
        {original && post.kind !== "original" && (
          <Link href={`/post/${original.id}`} data-testid="embedded-original" className={`block rounded-2xl bg-navy/70 p-3 ring-1 ring-white/10 ${post.kind === "contribute" ? "mt-3" : ""}`}>
            <p className="text-sm font-semibold">@{original.author}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">{original.body}</p>
          </Link>
        )}
        <ActionBar
          views={post.views}
          net={netScore(interactive.likes.length, interactive.dislikes.length)}
          liked={interactive.likes.includes(viewer)}
          disliked={interactive.dislikes.includes(viewer)}
          comments={interactive.comments.filter((comment) => !comment.parentId).length}
          shares={interactive.shares}
          commentHref={`#comments`}
          showRepost={perms.distribute || perms.contribute}
          onLike={() => togglePostReaction(interactive.id, viewer, "like")}
          onDislike={() => togglePostReaction(interactive.id, viewer, "dislike")}
          onShare={() => {
            sharePost(interactive.id);
            void navigator.clipboard?.writeText(`${window.location.origin}/post/${interactive.id}`);
            setNotice("Share link copied.");
          }}
          onRepost={() => setRepost(true)}
        />
        <button type="button" className="mt-2 text-xs font-semibold text-ink/40" onClick={() => setReporting({ type: "post", id: post.id, label: "this post" })}>Report</button>
      </article>
      {notice && <p className="mt-3 text-sm text-ink/70">{notice}</p>}
      <div id="comments">
        <CommentThread
          post={interactive}
          viewer={viewer}
          ads={ADS}
          onReact={(commentId, action) => toggleCommentReaction(interactive.id, commentId, viewer, action)}
          onReply={(parentId, body) => addComment(interactive.id, viewer, body, parentId || undefined)}
          onReport={(commentId, label) => setReporting({ type: "comment", id: commentId, label })}
        />
      </div>
      <RepostSheet
        open={repost}
        onClose={() => setRepost(false)}
        onConfirm={(mode, quote) => {
          const target = interactionTargetId({ id: interactive.id, kind: interactive.kind, originalId: interactive.originalId });
          const result = mode === "distribute" ? distributePost(viewer, target) : contributePost(viewer, target, quote);
          setNotice(result.reason || (mode === "distribute" ? "Reposted." : "Quoted."));
          setRepost(false);
        }}
      />
      {reporting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3" onClick={() => setReporting(null)}>
          <form
            className="w-full max-w-md space-y-3 rounded-3xl bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void reportContent({ targetType: reporting.type, targetId: reporting.id, reason, details });
              addContentReport({ username: viewer, targetType: reporting.type, targetLabel: reporting.label, reason, details });
              setNotice("Report sent to Admin.");
              setReporting(null);
            }}
          >
            <p className="text-lg font-bold">Report {reporting.label}</p>
            <select className="input" value={reason} onChange={(event) => setReason(event.target.value)}>
              {["Spam", "Harassment", "Scam", "Other"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea className="input min-h-20" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What happened?" />
            <button className="btn-primary w-full" type="submit">Send to Admin</button>
          </form>
        </div>
      )}
    </main>
  );
}

function Header({ username, name, color, blueTick, hours, kind }: { username: string; name?: string; color?: string; blueTick: boolean; hours: number; kind: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <Link href={`/u/${username}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(name || username, color || "#334155")} alt="" className="h-10 w-10 rounded-full" />
      </Link>
      <div>
        <p className="font-bold">@{username} {blueTick && <span className="text-sky-400" aria-label="Blue tick">●</span>} {kind === "contribute" && <span className="text-[10px] uppercase tracking-wider text-brand-200">Quote</span>}</p>
        <p className="text-xs text-ink/45">{hoursAgoLabel(hours)}</p>
      </div>
    </div>
  );
}
