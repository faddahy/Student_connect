"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  avatarUri,
  isBlocked,
  personByUsername,
  sharesGroup,
  type DemoComment,
  type DemoPost,
  type HouseAd,
} from "@/lib/demo/data";
import {
  canInteractWithWrapper,
  canOpenDistributionChannel,
  feedAllowsMedia,
  insertInlineAds,
  interactionTargetId,
  repostPermissions,
  type PostKind,
} from "@/lib/engine";
import { hoursAgoLabel } from "@/lib/format";
import { MimicAd } from "@/components/social/MimicAd";

export function FeedView({
  viewer,
  posts,
  ads,
  banner,
}: {
  viewer: string;
  posts: DemoPost[];
  ads: HouseAd[];
  banner?: string;
}) {
  const [items, setItems] = useState<DemoPost[]>(posts);
  const [draft, setDraft] = useState("");
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [openId, setOpenId] = useState<string>("");
  const [notice, setNotice] = useState<string>();

  const visible = useMemo(
    () =>
      items.filter((post) => {
        if (!isBlocked(viewer, post.author)) return true;
        return Boolean(post.groupSlug) && sharesGroup(viewer, post.author);
      }),
    [items, viewer],
  );
  const slots = insertInlineAds(visible, 10, "post");

  function targetOf(post: DemoPost): DemoPost {
    const id = interactionTargetId({ id: post.id, kind: post.kind, originalId: post.originalId });
    return items.find((item) => item.id === id) ?? post;
  }

  function mutateTarget(post: DemoPost, update: (target: DemoPost) => DemoPost) {
    const target = targetOf(post);
    setItems((current) => current.map((item) => (item.id === target.id ? update(item) : item)));
  }

  function toggleLike(post: DemoPost) {
    if (!canInteractWithWrapper(post.kind)) {
      const original = targetOf(post);
      toggleLike(original);
      return;
    }
    mutateTarget(post, (target) => {
      const liked = target.likes.includes(viewer);
      const likes = liked ? target.likes.filter((name) => name !== viewer) : [...target.likes, viewer];
      if (!canOpenDistributionChannel(!liked)) {
        setNotice("Unlike closed the distribution channel. It stays closed until you like the post again.");
      } else {
        setNotice("Like opened a distribution channel for this WAT hour. Staying online rolls it forward.");
      }
      return { ...target, likes };
    });
  }

  function share(post: DemoPost) {
    if (!canInteractWithWrapper(post.kind)) {
      share(targetOf(post));
      return;
    }
    mutateTarget(post, (target) => ({ ...target, shares: target.shares + 1 }));
    const url = `${window.location.origin}/post/${targetOf(post).id}`;
    void navigator.clipboard?.writeText(url);
    setNotice("Share counted on the original post.");
  }

  function rootOriginal(post: DemoPost): DemoPost {
    let current = post;
    const seen = new Set<string>();
    while (current.kind !== "original" && current.originalId && !seen.has(current.id)) {
      seen.add(current.id);
      const next = items.find((item) => item.id === current.originalId);
      if (!next) break;
      current = next;
    }
    return current;
  }

  function distribute(post: DemoPost) {
    const source = post.kind === "distribute" ? rootOriginal(post) : post;
    const perms = repostPermissions(source.kind);
    if (!perms.distribute) {
      setNotice(perms.hint ?? "Quote the original post, or comment on this Contribute post.");
      return;
    }
    const original = source;
    const id = `dist-${original.id}-${Date.now()}`;
    setItems((current) => [
      {
        id,
        author: viewer,
        kind: "distribute",
        body: "",
        originalId: original.id,
        likes: [],
        comments: [],
        shares: 0,
        views: 0,
        hoursAgo: 0,
      },
      ...current,
    ]);
    setNotice("Distributed. People can read your repost, and every interaction goes to the original.");
  }

  function contribute(post: DemoPost) {
    const source = post.kind === "distribute" ? rootOriginal(post) : post;
    const perms = repostPermissions(source.kind);
    if (!perms.contribute) {
      setNotice(perms.hint ?? "Quote the original post, or comment on this Contribute post.");
      return;
    }
    post = source;
    const text = quote.trim();
    if (!text) {
      setQuoteFor(post.id);
      return;
    }
    const id = `contrib-${Date.now()}`;
    setItems((current) => [
      {
        id,
        author: viewer,
        kind: "contribute",
        body: text,
        originalId: post.id,
        likes: [],
        comments: [],
        shares: 0,
        views: 0,
        hoursAgo: 0,
      },
      ...current,
    ]);
    setQuote("");
    setQuoteFor(null);
    setNotice("Contribute posts keep their own likes and comments. They cannot be distributed or quoted again.");
  }

  function addComment(post: DemoPost, body: string) {
    if (!canInteractWithWrapper(post.kind)) {
      addComment(targetOf(post), body);
      return;
    }
    const text = body.trim();
    if (!text) return;
    mutateTarget(post, (target) => ({
      ...target,
      comments: [...target.comments, { id: `local-${Date.now()}`, author: viewer, body: text }],
    }));
  }

  function publish() {
    const text = draft.trim();
    if (!text) return;
    if (!feedAllowsMedia("text")) return;
    setItems((current) => [
      {
        id: `local-${Date.now()}`,
        author: viewer,
        kind: "original",
        body: text,
        likes: [],
        comments: [],
        shares: 0,
        views: 0,
        hoursAgo: 0,
      },
      ...current,
    ]);
    setDraft("");
  }

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
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={publish} disabled={!draft.trim()}>
            Post
          </button>
        </div>
      </section>

      {notice && <p className="mb-3 rounded-2xl bg-white/5 px-3 py-2 text-sm text-ink/80">{notice}</p>}

      <div className="space-y-3">
        {slots.map((slot, index) => {
          if (slot.type === "ad") {
            const ad = ads[Math.floor(slot.after / 10 - 1) % ads.length];
            return <MimicAd key={`ad-${index}`} ad={ad} />;
          }
          const post = slot.item;
          return (
            <PostCard
              key={post.id}
              post={post}
              viewer={viewer}
              original={post.originalId ? items.find((item) => item.id === post.originalId) : undefined}
              commentsOpen={openId === post.id}
              quoting={quoteFor === post.id}
              quote={quote}
              onToggleComments={() => setOpenId((id) => (id === post.id ? "" : post.id))}
              onLike={() => toggleLike(post)}
              onShare={() => share(post)}
              onDistribute={() => distribute(post)}
              onStartQuote={() => {
                const embedded = post.originalId ? items.find((item) => item.id === post.originalId) : undefined;
                const source = post.kind === "distribute" && embedded ? embedded : post;
                const perms = repostPermissions(source.kind);
                if (!perms.contribute) {
                  setNotice(perms.hint);
                  return;
                }
                setQuoteFor(source.id);
              }}
              onQuoteChange={setQuote}
              onContribute={() => contribute(post)}
              onComment={(body) => addComment(post, body)}
              ads={ads}
            />
          );
        })}
      </div>
    </main>
  );
}

function PostCard({
  post,
  viewer,
  original,
  commentsOpen,
  quoting,
  quote,
  onToggleComments,
  onLike,
  onShare,
  onDistribute,
  onStartQuote,
  onQuoteChange,
  onContribute,
  onComment,
  ads,
}: {
  post: DemoPost;
  viewer: string;
  original?: DemoPost;
  commentsOpen: boolean;
  quoting: boolean;
  quote: string;
  onToggleComments: () => void;
  onLike: () => void;
  onShare: () => void;
  onDistribute: () => void;
  onStartQuote: () => void;
  onQuoteChange: (value: string) => void;
  onContribute: () => void;
  onComment: (body: string) => void;
  ads: HouseAd[];
}) {
  const author = personByUsername(post.author);
  const perms = repostPermissions(post.kind);
  const blockedGroup = Boolean(post.groupSlug) && isBlocked(viewer, post.author);
  const [commentDraft, setCommentDraft] = useState("");
  const engaged = post.kind === "distribute" && original ? original : post;
  const liked = engaged.likes.includes(viewer);

  return (
    <article
      className="card"
      data-testid={post.kind === "distribute" ? "distribute-post" : post.kind === "contribute" ? "contribute-post" : "original-post"}
    >
      {post.kind === "distribute" && (
        <p className="mb-3 flex items-center gap-2 text-sm text-ink/60">
          <RepostIcon />
          <span>
            <Link href={`/u/${post.author}`} className="font-semibold text-ink">@{post.author}</Link> distributed
          </span>
        </p>
      )}
      {post.kind !== "distribute" && author && (
        <Header person={author} hours={post.hoursAgo} group={post.groupSlug} kind={post.kind} />
      )}
      {blockedGroup && (
        <p className="mb-3 rounded-2xl bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
          You blocked @{post.author}. Their profile and DMs stay closed, and this public group post stays visible.
        </p>
      )}
      {post.kind === "contribute" && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>}
      {post.kind === "original" && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>}
      {original && post.kind !== "original" && (
        <div className={`rounded-2xl bg-navy/70 p-3 ring-1 ring-white/10 ${post.kind === "contribute" ? "mt-3" : ""}`}>
          <Embedded original={original} />
        </div>
      )}

      {post.kind === "distribute" ? (
        <p className="mt-3 text-xs text-ink/45">Read-only repost. Likes, comments, shares, Distribute, and Contribute act on the original.</p>
      ) : (
        <Actions
          liked={liked}
          likes={engaged.likes.length}
          comments={engaged.comments.length}
          shares={engaged.shares}
          perms={perms}
          onLike={onLike}
          onComment={onToggleComments}
          onShare={onShare}
          onDistribute={onDistribute}
          onContribute={onStartQuote}
        />
      )}
      {post.kind === "distribute" && original && (
        <div className="mt-2">
          <Actions
            liked={original.likes.includes(viewer)}
            likes={original.likes.length}
            comments={original.comments.length}
            shares={original.shares}
            perms={repostPermissions("original")}
            onLike={onLike}
            onComment={onToggleComments}
            onShare={onShare}
            onDistribute={onDistribute}
            onContribute={onStartQuote}
          />
        </div>
      )}

      {quoting && perms.contribute && (
        <div className="mt-3 space-y-2">
          <textarea value={quote} onChange={(event) => onQuoteChange(event.target.value)} className="input min-h-20" placeholder="Add your commentary. This quote cannot be reposted." />
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={onContribute}>Contribute</button>
        </div>
      )}

      {commentsOpen && post.kind !== "distribute" && (
        <CommentList
          comments={engaged.comments}
          ads={ads}
          draft={commentDraft}
          onDraft={setCommentDraft}
          onSubmit={() => {
            onComment(commentDraft);
            setCommentDraft("");
          }}
        />
      )}
    </article>
  );
}

function Header({
  person,
  hours,
  group,
  kind,
}: {
  person: NonNullable<ReturnType<typeof personByUsername>>;
  hours: number;
  group?: string;
  kind: PostKind;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <Link href={`/u/${person.username}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(person.displayName, person.color)} alt="" className="h-10 w-10 rounded-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-bold">
          <Link href={`/u/${person.username}`}>@{person.username}</Link>
          {person.blueTick && <BlueTick />}
          {kind === "contribute" && <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">Contribute</span>}
        </p>
        <p className="text-xs text-ink/45">
          {hoursAgoLabel(hours)}
          {group && <> · <Link href={`/groups/${group}`} className="underline">Campus Builders</Link></>}
        </p>
      </div>
    </div>
  );
}

function Embedded({ original }: { original: DemoPost }) {
  const author = personByUsername(original.author);
  return (
    <div>
      <p className="text-sm font-semibold">@{original.author} {author?.blueTick && <BlueTick />}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/75">{original.body}</p>
    </div>
  );
}

function Actions({
  liked,
  likes,
  comments,
  shares,
  perms,
  onLike,
  onComment,
  onShare,
  onDistribute,
  onContribute,
}: {
  liked: boolean;
  likes: number;
  comments: number;
  shares: number;
  perms: ReturnType<typeof repostPermissions>;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onDistribute: () => void;
  onContribute: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
      <button type="button" className={`chip ${liked ? "chip-on" : ""}`} onClick={onLike}>{liked ? "Unlike" : "Like"} {likes}</button>
      <button type="button" className="chip" onClick={onComment}>Comments {comments}</button>
      <button type="button" className="chip" onClick={onShare}>Share {shares}</button>
      <button
        type="button"
        className="chip disabled:opacity-40"
        disabled={!perms.distribute}
        title={perms.hint}
        onClick={onDistribute}
      >
        Distribute
      </button>
      <button
        type="button"
        className="chip disabled:opacity-40"
        disabled={!perms.contribute}
        title={perms.hint}
        onClick={onContribute}
      >
        Contribute
      </button>
      {!perms.distribute && perms.hint && <p className="basis-full pt-1 text-[11px] font-medium text-ink/45">{perms.hint}</p>}
    </div>
  );
}

function CommentList({
  comments,
  ads,
  draft,
  onDraft,
  onSubmit,
}: {
  comments: DemoComment[];
  ads: HouseAd[];
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: () => void;
}) {
  const slots = insertInlineAds(comments, 10, "comment");
  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      {slots.map((slot, index) => {
        if (slot.type === "ad") return <MimicAd key={`c-ad-${index}`} ad={ads[index % ads.length]} compact />;
        const comment = slot.item;
        return (
          <p key={comment.id} className="text-sm leading-relaxed">
            <Link href={`/u/${comment.author}`} className="font-semibold">@{comment.author}</Link>{" "}
            <span className="text-ink/75">{comment.body}</span>
          </p>
        );
      })}
      <form
        className="flex gap-2 pt-1"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input value={draft} onChange={(event) => onDraft(event.target.value)} className="input py-2" placeholder="Comment on this post" />
        <button className="btn-primary px-3 py-2 text-sm" type="submit">Send</button>
      </form>
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

function RepostIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 7h9a4 4 0 0 1 4 4v1" strokeLinecap="round" />
      <path d="M17 17H8a4 4 0 0 1-4-4v-1" strokeLinecap="round" />
      <path d="m16 4 4 3-4 3M8 20l-4-3 4-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
