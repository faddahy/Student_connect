"use client";

import { useState } from "react";
import { paidPlayPayout, stakeLadder } from "@/lib/engine";
import { naira } from "@/lib/format";

export function StakeBar({ players = 2 }: { players?: number }) {
  const [paid, setPaid] = useState(false);
  const [stake, setStake] = useState(500);
  const payout = paidPlayPayout(stake, players);

  return (
    <section className="card mb-4" data-testid="stake-bar">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Table</h2>
        <div className="flex rounded-full bg-navy p-1 text-sm font-semibold">
          <button type="button" className={`rounded-full px-3 py-1 ${!paid ? "bg-brand-500 text-white" : "text-ink/60"}`} onClick={() => setPaid(false)}>Free play</button>
          <button type="button" className={`rounded-full px-3 py-1 ${paid ? "bg-brand-500 text-white" : "text-ink/60"}`} onClick={() => setPaid(true)}>Paid play</button>
        </div>
      </div>
      {paid ? (
        <>
          <label className="label mt-3" htmlFor="stake">Stake · ₦100 to ₦1,000</label>
          <input
            id="stake"
            type="range"
            min={100}
            max={1000}
            step={100}
            value={stake}
            onChange={(event) => setStake(Number(event.target.value))}
            className="w-full accent-brand-500"
          />
          <p className="text-sm text-ink/60">{stakeLadder().map((n) => (n === stake ? naira(n) : null)).filter(Boolean)} per player · {players} players</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-navy/80 px-3 py-2"><dt className="text-ink/45">Gross pool</dt><dd className="font-bold">{naira(payout.gross)}</dd></div>
            <div className="rounded-2xl bg-navy/80 px-3 py-2"><dt className="text-ink/45">Faddahy 1%</dt><dd className="font-bold">{naira(payout.faddahyFee)}</dd></div>
            <div className="rounded-2xl bg-navy/80 px-3 py-2"><dt className="text-ink/45">Host 30% of net</dt><dd className="font-bold">{naira(payout.organizer)}</dd></div>
            <div className="rounded-2xl bg-navy/80 px-3 py-2"><dt className="text-ink/45">Winner 70% of net</dt><dd className="font-bold">{naira(payout.winner)}</dd></div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink/60">Nothing is staked on a free table. Switch to paid play to see the 1% / 30% / 70% split.</p>
      )}
    </section>
  );
}
