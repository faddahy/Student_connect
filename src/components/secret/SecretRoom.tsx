"use client";

import { useState } from "react";
import Link from "next/link";
import { SECRET_CREATORS, avatarUri, personByUsername } from "@/lib/demo/data";
import { secretZoneSplit } from "@/lib/engine";
import { naira } from "@/lib/format";

export function SecretRoom({ focus }: { focus?: string }) {
  const [adult, setAdult] = useState(false);
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState("");
  const creators = focus ? SECRET_CREATORS.filter((creator) => creator.username === focus) : SECRET_CREATORS;
  const split = secretZoneSplit(1);

  if (!adult) {
    return (
      <main className="px-4" data-testid="secret-gate">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">18+</p>
        <h1 className="mt-2 text-3xl font-black">Secret Zone</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Verified creators post short videos here. Subscribers pay {naira(1000)} a month per creator. This room does not load third-party ad scripts.
        </p>
        <button type="button" className="btn-primary mt-6 w-full" onClick={() => setAdult(true)}>I am 18 or older</button>
        <Link href="/feed" className="btn-ghost mt-2 w-full">Leave</Link>
      </main>
    );
  }

  return (
    <main className="px-4" data-testid="secret-room">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Ad-free · 18+</p>
      <h1 className="mt-1 text-2xl font-extrabold">{focus ? `@${focus}` : "Secret Zone"}</h1>
      <p className="mt-1 text-sm text-ink/55">
        {naira(split.gross)} / month. Month-end settlement is {naira(split.creator)} to the creator and {naira(split.faddahy)} to Faddahy.
      </p>
      <div className="mt-4 space-y-4">
        {(creators.length ? creators : SECRET_CREATORS).map((creator) => {
          const person = personByUsername(creator.username) ?? personByUsername("zara")!;
          const on = subscribed.includes(creator.username);
          return (
            <article key={creator.username} className="card">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUri(person.displayName, person.color)} alt="" className="h-12 w-12 rounded-full" />
                <div>
                  <p className="font-bold">@{creator.username}</p>
                  <p className="text-sm text-ink/55">{creator.title} · {creator.subscribers} subscribers</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink/70">{creator.about}</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-black">
                <video
                  data-testid="secret-player"
                  className="aspect-[9/16] max-h-80 w-full bg-[#120814] object-cover"
                  controls
                  playsInline
                  poster={avatarUri(person.displayName, person.color)}
                />
                <p className="px-3 py-2 text-xs text-ink/50">Placeholder playback. Upload a short video to your creator storage when Supabase is connected.</p>
              </div>
              <label className="mt-3 block text-sm">
                Upload a short video
                <input
                  className="mt-1 block w-full text-sm"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(event) => setUploadName(event.target.files?.[0]?.name ?? "")}
                />
              </label>
              {uploadName && <p className="mt-1 text-xs text-ink/50">Ready to store: {uploadName}</p>}
              <button
                type="button"
                className="btn-primary mt-3 w-full"
                onClick={() => setSubscribed((current) => current.includes(creator.username) ? current : [...current, creator.username])}
              >
                {on ? `Subscribed · ${naira(1000)} this month` : `Subscribe · ${naira(1000)} / month`}
              </button>
              {!focus && <Link href={`/secret/${creator.username}`} className="mt-2 inline-block text-sm font-semibold text-brand-200">Open creator room</Link>}
            </article>
          );
        })}
      </div>
    </main>
  );
}
