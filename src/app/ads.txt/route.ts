import { ADSENSE_CLIENT } from "@/lib/config";

export const dynamic = "force-static";

/** Serves /ads.txt from NEXT_PUBLIC_ADSENSE_CLIENT (e.g. ca-pub-123 -> pub-123). */
export function GET() {
  const pub = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense not configured yet. Set NEXT_PUBLIC_ADSENSE_CLIENT.\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
