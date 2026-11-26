"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT } from "@/lib/config";
import { allowsThirdPartyAds } from "@/lib/engine";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/** Renders a Google AdSense unit. Renders nothing when NEXT_PUBLIC_ADSENSE_CLIENT is empty. */
export function AdSlot({ slot, format = "auto", className = "" }: { slot?: string; format?: string; className?: string }) {
  const path = usePathname() || "/";
  const pushed = useRef(false);
  useEffect(() => {
    if (!ADSENSE_CLIENT || !allowsThirdPartyAds(path) || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad blockers etc. */
    }
  }, [path]);

  if (!ADSENSE_CLIENT || !allowsThirdPartyAds(path)) return null;
  return (
    <div className={`overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-black/5 ${className}`}>
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/40">Sponsored</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
