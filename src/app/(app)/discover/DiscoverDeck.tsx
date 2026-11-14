"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AD_EVERY_N_CARDS, ADSENSE_CLIENT, ADSENSE_SLOT_FEED, photoUrl } from "@/lib/config";
import type { FeedProfile } from "@/lib/types";
import { ProfileCard } from "@/components/ProfileCard";
import { AdSlot } from "@/components/AdSlot";
import { SafetyMenu } from "@/components/SafetyMenu";

export function DiscoverDeck({ myId }: { myId: string }) {
  const supabase = useRef(createClient()).current;
  const [queue, setQueue] = useState<FeedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipes, setSwipes] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [match, setMatch] = useState<{ profile: FeedProfile; matchId: string } | null>(null);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const start = useRef(0);
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_discover_feed", { p_limit: 20 });
    setQueue((data as FeedProfile[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function swipe(liked: boolean) {
    const p = queue[0];
    if (!p || busy.current) return;
    busy.current = true;
    setDrag({ x: liked ? 600 : -600, active: false });
    const { error } = await supabase.from("swipes").insert({ swiper: myId, target: p.id, liked });
    if (!error && liked) {
      const [a, b] = myId < p.id ? [myId, p.id] : [p.id, myId];
      const { data } = await supabase.from("matches").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
      if (data) setMatch({ profile: p, matchId: data.id });
    }
    setTimeout(() => {
      setDrag({ x: 0, active: false });
      setQueue((q) => q.slice(1));
      const n = swipes + 1;
      setSwipes(n);
      if (ADSENSE_CLIENT && n % AD_EVERY_N_CARDS === 0) setShowAd(true);
      if (queue.length <= 3) load();
      busy.current = false;
    }, 220);
  }

  const top = queue[0];
  const rot = drag.x / 20;

  return (
    <main className="px-4">
      {showAd ? (
        <div className="space-y-4">
          <AdSlot slot={ADSENSE_SLOT_FEED} className="min-h-[320px]" />
          <button className="btn-primary w-full" onClick={() => setShowAd(false)}>Keep discovering</button>
        </div>
      ) : loading && !top ? (
        <div className="aspect-[3/4] animate-pulse rounded-[28px] bg-white ring-1 ring-black/5" />
      ) : !top ? (
        <div className="card mt-10 text-center">
          <div className="text-5xl">🌙</div>
          <h2 className="mt-3 text-xl font-bold">You&apos;re all caught up</h2>
          <p className="mt-1 text-ink/60">New students join every day. Check back soon, or invite friends from your department.</p>
          <div className="mt-5 flex gap-2">
            <button className="btn-ghost flex-1" onClick={load}>Refresh</button>
            <Link href="/matches" className="btn-primary flex-1">Your matches</Link>
          </div>
        </div>
      ) : (
        <>
          <div
            className="touch-pan-y select-none"
            style={{ transform: `translateX(${drag.x}px) rotate(${rot}deg)`, transition: drag.active ? "none" : "transform 0.22s ease-out" }}
            onPointerDown={(e) => { start.current = e.clientX; setDrag({ x: 0, active: true }); }}
            onPointerMove={(e) => { if (drag.active) setDrag({ x: e.clientX - start.current, active: true }); }}
            onPointerUp={() => {
              if (drag.x > 110) swipe(true);
              else if (drag.x < -110) swipe(false);
              else setDrag({ x: 0, active: false });
            }}
            onPointerCancel={() => setDrag({ x: 0, active: false })}
          >
            {drag.x > 40 && <span className="absolute left-8 top-10 z-10 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-2xl font-black text-emerald-400">LIKE</span>}
            {drag.x < -40 && <span className="absolute right-8 top-10 z-10 rotate-12 rounded-xl border-4 border-red-400 px-3 py-1 text-2xl font-black text-red-400">NOPE</span>}
            <ProfileCard key={top.id} p={top} actions={<SafetyMenu userId={top.id} name={top.display_name} onDone={() => setQueue((q) => q.slice(1))} />} />
          </div>
          <div className="sticky bottom-24 mt-5 flex justify-center gap-6">
            <button aria-label="Pass" onClick={() => swipe(false)} className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-red-500 shadow-lg ring-1 ring-black/5 active:scale-95">✕</button>
            <button aria-label="Like" onClick={() => swipe(true)} className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-3xl text-white shadow-lg shadow-brand-500/30 active:scale-95">♥</button>
          </div>
        </>
      )}

      {match && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-brand-500/95 to-fuchsia-600/95 p-6 text-center text-white">
          <p className="text-4xl font-black">It&apos;s a match!</p>
          <p className="mt-2 text-white/85">You and {match.profile.display_name} liked each other.</p>
          {match.profile.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(match.profile.photos[0])} alt="" className="mt-8 h-40 w-40 rounded-full object-cover ring-4 ring-white" />
          )}
          <Link href={`/chat/${match.matchId}`} className="btn mt-10 w-full max-w-xs bg-white text-brand-600">Send a message</Link>
          <button className="mt-4 font-semibold text-white/85" onClick={() => setMatch(null)}>Keep swiping</button>
        </div>
      )}
    </main>
  );
}
