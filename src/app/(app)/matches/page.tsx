import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ADSENSE_SLOT_MATCHES, photoUrl } from "@/lib/config";
import type { MatchRow } from "@/lib/types";
import { AdSlot } from "@/components/AdSlot";

export const metadata = { title: "Matches" };

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default async function MatchesPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.rpc("get_matches");
  const matches = (data as MatchRow[]) ?? [];
  const fresh = matches.filter((m) => !m.last_message);
  const convos = matches.filter((m) => m.last_message);

  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">Matches</h1>
      {matches.length === 0 && (
        <div className="card mt-6 text-center">
          <div className="text-5xl">💌</div>
          <p className="mt-3 font-semibold">No matches yet</p>
          <p className="mt-1 text-sm text-ink/60">When someone you liked likes you back, they&apos;ll show up here.</p>
          <Link href="/discover" className="btn-primary mt-5">Start discovering</Link>
        </div>
      )}
      {fresh.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">New matches</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {fresh.map((m) => (
              <Link key={m.match_id} href={`/chat/${m.match_id}`} className="w-20 shrink-0 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(m.photos[0])} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-400 ring-offset-2" />
                <p className="mt-1 truncate text-sm font-semibold">{m.display_name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <AdSlot slot={ADSENSE_SLOT_MATCHES} className="mt-5" />
      {convos.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink/50">Messages</h2>
          <ul className="divide-y divide-black/5 rounded-3xl bg-white ring-1 ring-black/5">
            {convos.map((m) => (
              <li key={m.match_id}>
                <Link href={`/chat/${m.match_id}`} className="flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(m.photos[0])} alt="" className="h-14 w-14 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="font-bold">{m.display_name}</p>
                      <span className="text-xs text-ink/40">{timeAgo(m.last_message_at!)}</span>
                    </div>
                    <p className="truncate text-sm text-ink/60">{m.last_sender === user.id ? "You: " : ""}{m.last_message}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
