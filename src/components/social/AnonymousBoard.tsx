"use client";

import { useState } from "react";
import Link from "next/link";
import { anonymousVisibility, canSendAnonymous } from "@/lib/engine";
import { hoursAgoLabel } from "@/lib/format";
import type { DemoConfession, DemoPerson } from "@/lib/demo/data";

export function AnonymousBoard({
  viewer,
  notes,
  inbox,
}: {
  viewer: DemoPerson;
  notes: DemoConfession[];
  inbox: string;
}) {
  const [items, setItems] = useState(notes);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<string>();
  const link = `/anonymous/${inbox}`;

  function send() {
    if (!canSendAnonymous(viewer.blueTick)) return;
    const text = body.trim();
    if (!text) return;
    setItems((current) => [
      { id: `local-${Date.now()}`, to: inbox, body: text, public: true, hoursAgo: 0 },
      ...current,
    ]);
    setBody("");
    setSent("Sent anonymously. Your name is not attached.");
  }

  return (
    <main className="px-4" data-testid="anonymous">
      <h1 className="text-2xl font-extrabold">Anonymous</h1>
      <p className="mt-1 text-sm text-ink/55">A confession inbox. Blue-tick members can send. Free members read 1 of every 3.</p>

      <section className="card mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Your inbox link</p>
        <p className="mt-1 break-all font-semibold">{link}</p>
        <Link href={link} className="mt-2 inline-block text-sm font-semibold text-brand-200">Open @{inbox}&apos;s inbox</Link>
      </section>

      <section className="card mt-3">
        <label className="label" htmlFor="anon">Send to @{inbox}</label>
        <textarea id="anon" value={body} onChange={(event) => setBody(event.target.value)} className="input min-h-24" placeholder="Say it without your name." disabled={!viewer.blueTick} />
        {viewer.blueTick ? (
          <button type="button" className="btn-primary mt-3 w-full" onClick={send}>Send anonymously</button>
        ) : (
          <p className="mt-3 text-sm text-ink/60">Only blue-tick members can send anonymous notes. <Link href="/verify" className="font-semibold text-brand-200">Upgrade</Link></p>
        )}
        {sent && <p className="mt-2 text-sm text-emerald-300">{sent}</p>}
      </section>

      <div className="mt-4 space-y-3">
        {items.map((note, index) => {
          const visibility = anonymousVisibility(index, viewer.blueTick);
          if (visibility === "locked") {
            return (
              <article key={note.id} className="card relative overflow-hidden" data-testid="anon-locked">
                <p className="select-none blur-sm">{note.body}</p>
                <div className="absolute inset-0 grid place-items-center bg-navy/55 p-4 text-center">
                  <div>
                    <p className="font-bold">Locked note</p>
                    <p className="mt-1 text-sm text-ink/70">Free members see 1 of every 3. Blue tick unlocks the rest.</p>
                    <Link href="/verify" className="btn-primary mt-3 px-4 py-2 text-sm">Upgrade</Link>
                  </div>
                </div>
              </article>
            );
          }
          return (
            <article key={note.id} className="card" data-testid="anon-open">
              <p className="text-xs text-ink/45">To @{note.to} · {hoursAgoLabel(note.hoursAgo)} · anonymous</p>
              <p className="mt-2 leading-relaxed">{note.body}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
