"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/config";
import type { MatchRow, Message } from "@/lib/types";
import { SafetyMenu } from "@/components/SafetyMenu";

export function ChatRoom({ match, myId, initial }: { match: MatchRow; myId: string; initial: Message[] }) {
  const supabase = useRef(createClient()).current;
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`match:${match.match_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${match.match_id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, match.match_id]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setError(undefined);
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ match_id: match.match_id, sender: myId, body })
      .select("id,match_id,sender,body,created_at")
      .single<Message>();
    if (err) { setError("Message not sent. This match may have ended."); setText(body); return; }
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  }

  return (
    <main className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-[#fff7f9]">
      <header className="flex items-center gap-3 border-b border-black/5 bg-white px-3 py-2.5">
        <Link href="/matches" className="grid h-9 w-9 place-items-center rounded-full text-xl" aria-label="Back">‹</Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(match.photos[0])} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{match.display_name}, {match.age}</p>
          <p className="truncate text-xs text-ink/50">{[match.department, match.level ? `${match.level}L` : null].filter(Boolean).join(" · ")}</p>
        </div>
        <SafetyMenu userId={match.user_id} name={match.display_name} matchId={match.match_id} />
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-xs text-center text-sm text-ink/50">
            You matched with {match.display_name}! Say hi 👋<br />
            <span className="text-xs">Stay safe: meet in public places on campus and never send money.</span>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender === myId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[78%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2 text-[15px] ${mine ? "rounded-br-md bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white" : "rounded-bl-md bg-white ring-1 ring-black/5"}`}>
                {m.body}
              </p>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {error && <p className="px-4 pb-1 text-center text-xs text-red-600">{error}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-black/5 bg-white p-3 pb-safe">
        <input className="input flex-1 py-2.5" placeholder="Type a message…" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary px-5 py-2.5" disabled={!text.trim()}>Send</button>
      </form>
    </main>
  );
}
