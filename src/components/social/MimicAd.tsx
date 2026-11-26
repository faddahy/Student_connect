"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT, ADSENSE_SLOT_FEED } from "@/lib/config";
import { allowsThirdPartyAds } from "@/lib/engine";
import { avatarUri, type HouseAd } from "@/lib/demo/data";
import { AdSlot } from "@/components/AdSlot";

export function MimicAd({ ad, compact = false }: { ad: HouseAd; compact?: boolean }) {
  const path = usePathname() || "/";
  const [clicks, setClicks] = useState(ad.clicks);
  const network = allowsThirdPartyAds(path) && Boolean(ADSENSE_CLIENT);
  if (!allowsThirdPartyAds(path)) return null;

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
      <button
        type="button"
        className="mt-3 text-sm font-semibold text-brand-200"
        onClick={() => setClicks((n) => n + 1)}
      >
        {ad.cta} · {clicks.toLocaleString()} clicks
      </button>
      {network && !compact && <AdSlot slot={ADSENSE_SLOT_FEED} className="mt-3" />}
    </article>
  );
}
