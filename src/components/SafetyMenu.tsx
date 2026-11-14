"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { blockUser, reportUser, unmatch } from "@/app/actions/safety";
import { REPORT_REASONS } from "@/lib/config";

export function SafetyMenu({ userId, name, matchId, onDone }: { userId: string; name: string; matchId?: string; onDone?: () => void }) {
  const [open, setOpen] = useState<"menu" | "report" | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  function finish(text: string) {
    setMsg(text);
    setTimeout(() => {
      setOpen(null);
      setMsg(undefined);
      onDone?.();
      if (matchId) router.push("/matches");
      router.refresh();
    }, 900);
  }

  return (
    <>
      <button type="button" aria-label="Safety options" onClick={() => setOpen("menu")} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg font-bold shadow ring-1 ring-black/5">⋯</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 pb-safe" onClick={(e) => e.stopPropagation()}>
            {msg ? (
              <p className="py-6 text-center font-semibold">{msg}</p>
            ) : open === "menu" ? (
              <div className="space-y-2">
                <p className="mb-2 text-center text-sm text-ink/50">{name}</p>
                {matchId && (
                  <button className="btn-ghost w-full" disabled={pending}
                    onClick={() => start(async () => { const r = await unmatch(matchId); finish(r.error ?? "Unmatched"); })}>Unmatch</button>
                )}
                <button className="btn-ghost w-full" disabled={pending}
                  onClick={() => start(async () => { const r = await blockUser(userId); finish(r.error ?? `${name} is blocked`); })}>Block</button>
                <button className="btn w-full bg-red-50 text-red-700 ring-1 ring-red-200" onClick={() => setOpen("report")}>Report</button>
                <button className="w-full py-2 text-sm text-ink/50" onClick={() => setOpen(null)}>Cancel</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg font-bold">Report {name}</p>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-3 rounded-2xl px-3 py-2 ring-1 ring-black/10">
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-brand-500" />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
                <textarea className="input min-h-20" maxLength={1000} placeholder="Anything else we should know? (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
                <p className="text-xs text-ink/50">Reports are confidential. We&apos;ll also block {name} for you.</p>
                <button className="btn-primary w-full" disabled={!reason || pending}
                  onClick={() => start(async () => { const r = await reportUser(userId, reason, details, true); finish(r.error ?? "Thanks. Our team will review this."); })}>Submit report</button>
                <button className="w-full py-2 text-sm text-ink/50" onClick={() => setOpen("menu")}>Back</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
