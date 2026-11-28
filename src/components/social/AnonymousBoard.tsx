"use client";

import { useState } from "react";
import Link from "next/link";
import { anonymousVisibility, canCreateAnonymousGroup, canSendAnonymous } from "@/lib/engine";
import { hoursAgoLabel } from "@/lib/format";
import type { DemoConfession, DemoPerson } from "@/lib/demo/data";
import { createAnonymousGroup } from "@/app/actions/social";

interface Group {
  slug: string;
  name: string;
  about: string;
  messages: DemoConfession[];
}

export function AnonymousBoard({
  viewer,
  notes,
  inbox,
}: {
  viewer: DemoPerson;
  notes: DemoConfession[];
  inbox: string;
}) {
  const [groups, setGroups] = useState<Group[]>([
    {
      slug: "campus-gossip",
      name: "Campus Gossip",
      about: "A public group. Anyone can join. Tutors can tease a lecture here, then convert members to premium.",
      messages: notes,
    },
  ]);
  const [active, setActive] = useState("campus-gossip");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<string>();
  const group = groups.find((item) => item.slug === active) ?? groups[0];
  const canCreate = canCreateAnonymousGroup(viewer.blueTick);

  async function create() {
    if (!canCreate) return;
    const title = name.trim();
    if (title.length < 3) return;
    const result = await createAnonymousGroup(title, "Public anonymous group");
    if ("error" in result && result.error) {
      setSent(result.error);
      return;
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    setGroups((current) => [...current, { slug, name: title, about: "Public. Anyone can join.", messages: [] }]);
    setActive(slug);
    setName("");
    setSent("Group created. Anyone can join.");
  }

  function send() {
    if (!group || !canSendAnonymous(viewer.blueTick)) return;
    const text = body.trim();
    if (!text) return;
    const note: DemoConfession = { id: `local-${Date.now()}`, to: inbox, body: text, public: true, hoursAgo: 0 };
    setGroups((current) => current.map((item) => (item.slug === group.slug ? { ...item, messages: [note, ...item.messages] } : item)));
    setBody("");
    setSent("Sent anonymously. Your name is not attached.");
  }

  return (
    <main className="px-4" data-testid="anonymous">
      <h1 className="text-2xl font-extrabold">Anonymous</h1>
      <p className="mt-1 text-sm text-ink/55">Public gossip groups. Anyone can join. Free members read 1 of every 3 messages.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {groups.map((item) => (
          <button key={item.slug} type="button" className={`chip shrink-0 ${item.slug === group?.slug ? "chip-on" : ""}`} onClick={() => setActive(item.slug)}>
            {item.name}
          </button>
        ))}
      </div>

      <section className="card mt-3">
        <p className="font-bold">{group?.name}</p>
        <p className="mt-1 text-sm text-ink/60">{group?.about} Joined.</p>
        {canCreate ? (
          <div className="mt-3 flex gap-2">
            <input value={name} onChange={(event) => setName(event.target.value)} className="input py-2" placeholder="New group name" />
            <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => void create()}>Create</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink/60">
            Non-premium users cannot create an anonymous group.{" "}
            <Link href="/verify" className="font-semibold text-brand-200">Subscribe Premium</Link>
          </p>
        )}
      </section>

      <section className="card mt-3">
        <label className="label" htmlFor="anon">Message {group?.name}</label>
        <textarea id="anon" value={body} onChange={(event) => setBody(event.target.value)} className="input min-h-24" placeholder="Say it without your name." disabled={!viewer.blueTick} />
        {viewer.blueTick ? (
          <button type="button" className="btn-primary mt-3 w-full" onClick={send}>Send anonymously</button>
        ) : (
          <p className="mt-3 text-sm text-ink/60">Only premium members can send. <Link href="/verify" className="font-semibold text-brand-200">Upgrade</Link></p>
        )}
        {sent && <p className="mt-2 text-sm text-emerald-300">{sent}</p>}
      </section>

      <div className="mt-4 space-y-3">
        {(group?.messages ?? []).map((note, index) => {
          const visibility = anonymousVisibility(index, viewer.blueTick);
          if (visibility === "locked") {
            return (
              <article key={note.id} className="card relative overflow-hidden" data-testid="anon-locked">
                <p className="select-none blur-sm">{note.body}</p>
                <div className="absolute inset-0 grid place-items-center bg-navy/55 p-4 text-center">
                  <div>
                    <p className="font-bold">Subscribe Premium to view</p>
                    <p className="mt-1 text-sm text-ink/70">A message was sent. Free members see 1 of every 3.</p>
                    <Link href="/verify" className="btn-primary mt-3 px-4 py-2 text-sm">Subscribe Premium</Link>
                  </div>
                </div>
              </article>
            );
          }
          return (
            <article key={note.id} className="card" data-testid="anon-open">
              <p className="text-xs text-ink/45">{group?.name} · {hoursAgoLabel(note.hoursAgo)} · anonymous</p>
              <p className="mt-2 leading-relaxed">{note.body}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
