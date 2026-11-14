"use client";
import { useState } from "react";
import { photoUrl } from "@/lib/config";
import type { FeedProfile } from "@/lib/types";

export function ProfileCard({ p, actions }: { p: FeedProfile; actions?: React.ReactNode }) {
  const [idx, setIdx] = useState(0);
  const photos = p.photos.length ? p.photos : [""];
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-white shadow-xl shadow-brand-500/10 ring-1 ring-black/5">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-brand-100 to-fuchsia-100">
        {photos[idx] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(photos[idx])} alt={p.display_name} className="h-full w-full object-cover" draggable={false} />
        )}
        {photos.length > 1 && (
          <>
            <div className="absolute inset-x-3 top-3 flex gap-1">
              {photos.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
            </div>
            <button aria-label="Previous photo" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
            <button aria-label="Next photo" className="absolute inset-y-0 right-0 w-1/3" onClick={() => setIdx((i) => Math.min(photos.length - 1, i + 1))} />
          </>
        )}
        <div className="absolute right-3 top-6">{actions}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16 text-white">
          <h2 className="text-2xl font-extrabold">{p.display_name}, {p.age}</h2>
          <p className="text-sm text-white/85">
            {[p.department, p.level ? `${p.level}L` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {(p.bio || p.interests.length > 0) && (
        <div className="space-y-3 p-5">
          {p.bio && <p className="whitespace-pre-line text-[15px] text-ink/80">{p.bio}</p>}
          {p.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.interests.map((i) => <span key={i} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{i}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
