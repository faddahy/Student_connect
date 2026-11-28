"use client";

import { useState } from "react";
import Link from "next/link";
import { SECRET_CREATORS, avatarUri, personByUsername } from "@/lib/demo/data";
import { canEnterSecretZone, canViewSecretCreator, secretZoneSplit } from "@/lib/engine";
import { naira } from "@/lib/format";

export function SecretRoom({ focus, blueTick = false, username = "you" }: { focus?: string; blueTick?: boolean; username?: string }) {
  const [adult, setAdult] = useState(false);
  const [tab, setTab] = useState<"viewer" | "creator">("viewer");
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [mine, setMine] = useState<Array<{ id: string; caption: string }>>([]);
  const [caption, setCaption] = useState("");
  const [uploadName, setUploadName] = useState("");
  const creators = focus ? SECRET_CREATORS.filter((creator) => creator.username === focus) : SECRET_CREATORS;
  const split = secretZoneSplit(1);
  const premium = canEnterSecretZone(blueTick);

  if (!adult) {
    return (
      <main className="px-4" data-testid="secret-gate">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">18+</p>
        <h1 className="mt-2 text-3xl font-black">Secret Zone</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Verified creators post short videos here. This room does not load third-party ad scripts.
        </p>
        <button type="button" className="btn-primary mt-6 w-full" onClick={() => setAdult(true)}>I am 18 or older</button>
        <Link href="/feed" className="btn-ghost mt-2 w-full">Leave</Link>
      </main>
    );
  }

  if (!premium) {
    return (
      <main className="px-4" data-testid="secret-premium-gate">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">18+</p>
        <h1 className="mt-2 text-3xl font-black">Only premium users allowed — Sub for premium today</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          The 18+ zone needs an active premium account, then {naira(1000)} a month for each creator you want to watch.
        </p>
        <Link href="/verify" className="btn-primary mt-6 w-full">Sub for premium today</Link>
        <Link href="/feed" className="btn-ghost mt-2 w-full">Back to feed</Link>
      </main>
    );
  }

  return (
    <main className="px-4" data-testid="secret-room">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Ad-free · 18+</p>
      <h1 className="mt-1 text-2xl font-extrabold">{focus ? `@${focus}` : "Secret Zone"}</h1>
      <p className="mt-1 text-sm text-ink/55">
        {naira(split.gross)} / month per creator. Month-end settlement is {naira(split.creator)} to the creator and {naira(split.faddahy)} to Plugin9ja.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className={`chip ${tab === "creator" ? "chip-on" : ""}`} onClick={() => setTab("creator")}>Creator</button>
        <button type="button" className={`chip ${tab === "viewer" ? "chip-on" : ""}`} onClick={() => setTab("viewer")}>Viewer</button>
      </div>

      {tab === "creator" ? (
        <section className="card mt-4" data-testid="secret-creator">
          <h2 className="font-bold">Your 18+ posts</h2>
          <p className="mt-1 text-sm text-ink/60">Post and manage your own videos. Subscribers pay {naira(1000)} / month to watch you.</p>
          <label className="mt-3 block text-sm">
            Caption
            <input className="input mt-1" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Twerking, dance, or any other 18+ clip" />
          </label>
          <label className="mt-3 block text-sm">
            Video
            <input className="mt-1 block w-full text-sm" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setUploadName(event.target.files?.[0]?.name ?? "")} />
          </label>
          <button
            type="button"
            className="btn-primary mt-3 w-full"
            onClick={() => {
              if (!caption.trim() && !uploadName) return;
              setMine((current) => [{ id: `mine-${Date.now()}`, caption: caption.trim() || uploadName }, ...current]);
              setCaption("");
              setUploadName("");
            }}
          >
            Post to your channel
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {mine.length === 0 && <li className="text-ink/50">Nothing posted yet, @{username}.</li>}
            {mine.map((item) => <li key={item.id} className="rounded-2xl bg-navy/70 px-3 py-2">{item.caption}</li>)}
          </ul>
        </section>
      ) : (
        <div className="mt-4 space-y-4">
          {(creators.length ? creators : SECRET_CREATORS).map((creator) => {
            const person = personByUsername(creator.username) ?? personByUsername("zara");
            const own = creator.username === username;
            const on = subscribed.includes(creator.username);
            const unlocked = canViewSecretCreator({ viewerIsPremium: true, isOwnChannel: own, subscribed: on });
            return (
              <article key={creator.username} className="card">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUri(person?.displayName || creator.username, person?.color || "#9d174d")} alt="" className="h-12 w-12 rounded-full" />
                  <div>
                    <p className="font-bold">@{creator.username}</p>
                    <p className="text-sm text-ink/55">{creator.title} · {creator.subscribers} subscribers</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/70">{creator.about}</p>
                {unlocked ? (
                  <div className="mt-3 overflow-hidden rounded-2xl bg-black">
                    <video data-testid="secret-player" className="aspect-[9/16] max-h-80 w-full bg-[#120814] object-cover" controls playsInline poster={avatarUri(person?.displayName || creator.username, person?.color || "#9d174d")} />
                    <p className="px-3 py-2 text-xs text-ink/50">Subscribed. Playback stays inside this ad-free room.</p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-navy/70 px-3 py-4 text-sm text-ink/70">Subscribe for {naira(1000)} / month to watch @{creator.username}.</p>
                )}
                {!own && (
                  <button
                    type="button"
                    className="btn-primary mt-3 w-full"
                    onClick={() => setSubscribed((current) => current.includes(creator.username) ? current : [...current, creator.username])}
                  >
                    {on ? `Subscribed · ${naira(1000)} this month` : `Subscribe · ${naira(1000)} / month`}
                  </button>
                )}
                {!focus && <Link href={`/secret/${creator.username}`} className="mt-2 inline-block text-sm font-semibold text-brand-200">Open creator room</Link>}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
