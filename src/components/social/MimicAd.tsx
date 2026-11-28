"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT, ADSENSE_SLOT_FEED } from "@/lib/config";
import { allowsThirdPartyAds, netScore, repostPermissions } from "@/lib/engine";
import { avatarUri, type HouseAd } from "@/lib/demo/data";
import { adPostId, contributePost, distributePost, sharePost, togglePostReaction, usePost } from "@/lib/demo/feed-store";
import { AdSlot } from "@/components/AdSlot";
import { ActionBar } from "@/components/social/ActionBar";
import { RepostSheet } from "@/components/social/RepostSheet";

export function MimicAd({ ad, viewer = "ada", compact = false }: { ad: HouseAd; viewer?: string; compact?: boolean }) {
  const path = usePathname() || "/";
  const post = usePost(adPostId(ad.id));
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string>();
  const network = allowsThirdPartyAds(path) && Boolean(ADSENSE_CLIENT);
  if (!allowsThirdPartyAds(path)) return null;
  const likes = post?.likes ?? [];
  const dislikes = post?.dislikes ?? [];

  return (
    <article
      data-testid={compact ? "comment-ad" : "mimic-ad"}
      className={compact ? "rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10" : "card"}
    >
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(ad.name, ad.color)} alt="" className={compact ? "h-8 w-8 rounded-full" : "h-10 w-10 rounded-full"} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="truncate">@{ad.username}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/60">Sponsored</span>
          </p>
          <p className="truncate text-xs text-ink/50">{ad.name}</p>
        </div>
      </div>
      <p className={`text-ink/85 ${compact ? "mt-2 text-sm" : "mt-3 text-[15px] leading-relaxed"}`}>{ad.copy}</p>
      <ActionBar
        views={post?.views ?? ad.impressions}
        net={netScore(likes.length, dislikes.length)}
        liked={likes.includes(viewer)}
        disliked={false}
        comments={0}
        shares={post?.shares ?? 0}
        showViews={false}
        showDislike={false}
        showComment={false}
        showRepost={repostPermissions("original").distribute}
        onLike={() => togglePostReaction(adPostId(ad.id), viewer, "like")}
        onShare={() => {
          sharePost(adPostId(ad.id));
          const url = `${window.location.origin}/post/${adPostId(ad.id)}`;
          void navigator.clipboard?.writeText(url);
          setNote("Shared. The ad stays in this slot.");
        }}
        onRepost={() => setOpen(true)}
      />
      <button type="button" className="mt-2 text-sm font-semibold text-brand-200">
        {ad.cta}
      </button>
      {note && <p className="mt-2 text-xs text-ink/50">{note}</p>}
      {network && !compact && <AdSlot slot={ADSENSE_SLOT_FEED} className="mt-3" />}
      <RepostSheet
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(mode, quote) => {
          const result = mode === "distribute"
            ? distributePost(viewer, adPostId(ad.id))
            : contributePost(viewer, adPostId(ad.id), quote);
          setNote(result.ok ? "Posted. This ad stays where it is in the feed." : result.reason);
          setOpen(false);
        }}
      />
    </article>
  );
}
