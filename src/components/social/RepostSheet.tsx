"use client";

import { useState } from "react";

export function RepostSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: "distribute" | "contribute", quote: string) => void;
}) {
  const [mode, setMode] = useState<"distribute" | "contribute" | null>(null);
  const [quote, setQuote] = useState("");
  if (!open) return null;

  function close() {
    setMode(null);
    setQuote("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3" onClick={close}>
      <div className="w-full max-w-md rounded-3xl bg-surface p-5 pb-safe ring-1 ring-white/10" onClick={(event) => event.stopPropagation()}>
        {!mode ? (
          <>
            <p className="text-lg font-bold">Repost or quote</p>
            <p className="mt-1 text-sm text-ink/60">Repost passes it on. Quote adds your own line. Confirm before it goes out.</p>
            <div className="mt-4 space-y-2">
              <button type="button" className="btn-primary w-full" onClick={() => setMode("distribute")}>Repost · Distribute</button>
              <button type="button" className="btn-ghost w-full" onClick={() => setMode("contribute")}>Quote · Contribute</button>
              <button type="button" className="w-full py-2 text-sm text-ink/50" onClick={close}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg font-bold">{mode === "distribute" ? "Repost this?" : "Quote this?"}</p>
            <p className="mt-1 text-sm text-ink/60">
              {mode === "distribute"
                ? "People will see that you reposted it. Likes and comments stay on the original."
                : "Your quote keeps its own likes and comments. It cannot be reposted or quoted again."}
            </p>
            {mode === "contribute" && (
              <textarea
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                className="input mt-3 min-h-24"
                placeholder="Add your commentary"
                maxLength={500}
              />
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setMode(null)}>Back</button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={mode === "contribute" && !quote.trim()}
                onClick={() => {
                  onConfirm(mode, quote.trim());
                  setMode(null);
                  setQuote("");
                }}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
