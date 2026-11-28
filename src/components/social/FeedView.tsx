"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { avatarUri, isBlocked, personByUsername, sharesGroup, type HouseAd } from "@/lib/demo/data";
import {
  contributePost,
  distributePost,
  publishPost,
  recordView,
  sharePost,
  togglePostReaction,
  useFeedPosts,
  type FeedPost,
} from "@/lib/demo/feed-store";
import { feedAllowsMedia, insertInlineAds, netScore, repostPermissions } from "@/lib/engine";
import { hoursAgoLabel } from "@/lib/format";
import { MimicAd } from "@/components/social/MimicAd";
import { ActionBar } from "@/components/social/ActionBar";
import { RepostSheet } from "@/components/social/RepostSheet";
import { reportContent } from "@/app/actions/social";
import { addContentReport } from "@/lib/demo/requests-store";

export function FeedView({
  viewer,
  ads,
  banner,
}: {
  viewer: string;
  posts?: unknown;
  ads: HouseAd[];
  banner?: string;
}) {
  const items = useFeedPosts();
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string>();
  const [repostId, setRepostId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reason, setReason] = useState("Spam");
  const [details, setDetails] = useState("");

  const visible = useMemo(
    () =>
      items.filter((post) => {
        if (!post.feedVisible) return false;
        if (!isBlocked(viewer, post.author)) return true;
        return Boolean(post.groupSlug) && sharesGroup(viewer, post.author);
      }),
    [items, viewer],
  );
  const slots = insertInlineAds(visible, 10, "post");

  return (
    <main className="px-4" data-testid="feed">
      {banner && <p className="mb-3 rounded-2xl bg-brand-500/10 px-3 py-2 text-sm text-brand-100">{banner}</p>}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Feed</h1>
          <p className="text-sm text-ink/55">Text only. You follow @yagyok.</p>
        </div>
        <Link href="/groups/campus-builders" className="text-sm font-semibold text-brand-200">Groups</Link>
      </div>

      <section className="card mb-4">
        <label className="label" htmlFor="composer">New post</label>
        <textarea
          id="composer"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Write something. Video stays off this feed."
          className="input min-h-24 resize-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-ink/45">No video upload on the main feed.</p>
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            onClick={() => {
              if (!feedAllowsMedia("text")) return;
              publishPost(viewer, draft);
              setDraft("");
            }}
            disabled={!draft.trim()}
          >
            Post
          </button>
        </div>
      </section>

      {notice && <p className="mb-3 rounded-2xl bg-white/5 px-3 py-2 text-sm text-ink/80">{notice}</p>}

      <div className="space-y-3">
        {slots.map((slot, index) => {
          if (slot.type === "ad") {
            const ad = ads[Math.floor(slot.after / 10 - 1) % ads.length];
            return ad ? <MimicAd key={`ad-${index}`} ad={ad} viewer={viewer} /> : null;
          }
          const post = slot.item;
          const original = post.originalId ? items.find((item) => item.id === post.originalId) : undefined;
          return (
            <PostCard
              key={post.id}
              post={post}
              viewer={viewer}
              original={original}
              onNotice={setNotice}
              onRepost={(id) => setRepostId(id)}
              onReport={(id) => setReportId(id)}
            />
          );
        })}
      </div>

      <RepostSheet
        open={Boolean(repostId)}
        onClose={() => setRepostId(null)}
        onConfirm={(mode, quote) => {
          if (!repostId) return;
          const result = mode === "distribute" ? distributePost(viewer, repostId) : contributePost(viewer, repostId, quote);
          setNotice(result.ok ? (mode === "distribute" ? `@${viewer} reposted.` : "Quoted. This post cannot be reposted or quoted again.") : result.reason);
          setRepostId(null);
        }}
      />

      {reportId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3" onClick={() => setReportId(null)}>
          <form
            className="w-full max-w-md space-y-3 rounded-3xl bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void reportContent({ targetType: "post", targetId: reportId, reason, details });
              addContentReport({ username: viewer, targetType: "post", targetLabel: reportId, reason, details });
              setNotice("Report sent to Admin.");
              setReportId(null);
              setDetails("");
            }}
          >
            <p className="text-lg font-bold">Report this post</p>
            <select className="input" value={reason} onChange={(event) => setReason(event.target.value)}>
              {["Spam", "Harassment", "Scam", "Other"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea className="input min-h-20" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What happened?" maxLength={1000} />
            <button className="btn-primary w-full" type="submit">Send to Admin</button>
          </form>
        </div>
      )}
    </main>
  );
}

function PostCard({
  post,
  viewer,
  original,
  onNotice,
  onRepost,
  onReport,
}: {
  post: FeedPost;
  viewer: string;
  original?: FeedPost;
  onNotice: (message: string) => void;
  onRepost: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const engaged = post.kind === "distribute" && original ? original : post;
  const perms = repostPermissions(engaged.kind);
  const author = personByUsername(post.kind === "distribute" && original ? original.author : post.author);
  const blockedGroup = Boolean(post.groupSlug) && isBlocked(viewer, post.author);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) recordView(post.id, viewer);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [post.id, viewer]);

  function share() {
    sharePost(engaged.id);
    const url = `${window.location.origin}/post/${engaged.id}`;
    void navigator.clipboard?.writeText(url);
    onNotice("Share link copied.");
  }

  return (
    <article
      ref={ref}
      className="card"
      data-testid={post.kind === "distribute" ? "distribute-post" : post.kind === "contribute" ? "contribute-post" : "original-post"}
    >
      {post.kind === "distribute" && (
        <p className="mb-3 text-sm text-ink/60">
          <span className="font-semibold text-ink">@{post.author} reposted</span>
        </p>
      )}
      {post.kind !== "distribute" && (
        <Header username={post.author} personName={author?.displayName} blueTick={Boolean(author?.blueTick)} color={author?.color} hours={post.hoursAgo} group={post.groupSlug} kind={post.kind} />
      )}
      {blockedGroup && (
        <p className="mb-3 rounded-2xl bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
          You blocked @{post.author}. Their profile and DMs stay closed, and this public group post stays visible.
        </p>
      )}
      {post.kind !== "distribute" && post.kind !== "contribute" && (
        <Link href={`/post/${post.id}`} className="block whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</Link>
      )}
      {post.kind === "contribute" && (
        <Link href={`/post/${post.id}`} className="block whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</Link>
      )}
      {original && post.kind !== "original" && (
        <Link href={`/post/${original.id}`} data-testid="embedded-original" className={`block rounded-2xl bg-navy/70 p-3 ring-1 ring-white/10 ${post.kind === "contribute" ? "mt-3" : ""}`}>
          <EmbeddedAuthor post={original} />
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{original.body}</p>
        </Link>
      )}
      <ActionBar
        views={post.views}
        net={netScore(engaged.likes.length, engaged.dislikes.length)}
        liked={engaged.likes.includes(viewer)}
        disliked={engaged.dislikes.includes(viewer)}
        comments={engaged.comments.filter((comment) => !comment.parentId).length}
        shares={engaged.shares}
        commentHref={`/post/${engaged.id}`}
        showRepost={perms.distribute || perms.contribute}
        onLike={() => togglePostReaction(engaged.id, viewer, "like")}
        onDislike={() => {
          togglePostReaction(engaged.id, viewer, "dislike");
          onNotice("Dislike lowers the score by 1 and blocks you from distributing this post.");
        }}
        onShare={share}
        onRepost={() => onRepost(engaged.id)}
      />
      <button type="button" className="mt-2 text-xs font-semibold text-ink/40" onClick={() => onReport(post.id)}>Report</button>
    </article>
  );
}

function Header({
  username,
  personName,
  blueTick,
  color,
  hours,
  group,
  kind,
}: {
  username: string;
  personName?: string;
  blueTick: boolean;
  color?: string;
  hours: number;
  group?: string;
  kind: FeedPost["kind"];
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <Link href={`/u/${username}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(personName || username, color || "#334155")} alt="" className="h-10 w-10 rounded-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-bold">
          <Link href={`/u/${username}`}>@{username}</Link>
          {blueTick && <BlueTick />}
          {kind === "contribute" && <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">Quote</span>}
        </p>
        <p className="text-xs text-ink/45">
          {hoursAgoLabel(hours)}
          {group && <> · <Link href={`/groups/${group}`} className="underline">Campus Builders</Link></>}
        </p>
      </div>
    </div>
  );
}

function EmbeddedAuthor({ post }: { post: FeedPost }) {
  const person = personByUsername(post.author);
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUri(person?.displayName || post.author, person?.color || "#334155")} alt="" className="h-8 w-8 rounded-full" />
      <p className="text-sm font-semibold">
        @{post.author} {person?.blueTick && <BlueTick />}
        {post.sponsored && <span className="ml-1 text-[10px] uppercase tracking-wider text-ink/50">Sponsored</span>}
      </p>
    </div>
  );
}

function BlueTick() {
  return (
    <svg viewBox="0 0 16 16" className="inline h-3.5 w-3.5 text-sky-400" aria-label="Blue tick">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.5 8.2 6.7 10.4 11.5 5.6" fill="none" stroke="#082038" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
