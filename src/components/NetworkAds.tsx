"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT } from "@/lib/config";
import { allowsThirdPartyAds } from "@/lib/engine";

/**
 * Loads the AdSense script only outside the Secret Zone.
 * Secret Zone routes fail the allowsThirdPartyAds check and render nothing.
 */
export function NetworkAds() {
  const path = usePathname() || "/";
  if (!allowsThirdPartyAds(path) || !ADSENSE_CLIENT) return null;
  return (
    <Script
      id="adsense"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
