"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import {
  ADS,
  PEOPLE,
  TRANSFERS,
  avatarUri,
  personByUsername,
  type DemoTransfer,
} from "@/lib/demo/data";
import { allocateRevenue, earningEligibility } from "@/lib/engine";
import { naira } from "@/lib/format";

export function AdminConsole() {
  const [transfers, setTransfers] = useState<DemoTransfer[]>(TRANSFERS);
  const [receipt, setReceipt] = useState<string | null>(TRANSFERS[0]?.id ?? null);

  const selected = transfers.find((item) => item.id === receipt) ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6" data-testid="admin">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Founder view · @yagyok</p>
          <h1 className="text-2xl font-extrabold">Admin</h1>
        </div>
        <Link href="/feed" className="chip">Back to feed</Link>
      </div>

      <section className="mt-6" data-testid="admin-transfers">
        <h2 className="text-lg font-bold">Bank transfer receipts</h2>
        <p className="mt-1 text-sm text-ink/55">Approve a receipt to turn on the blue tick. The earning clock is shown beside each person.</p>
        <div className="mt-3 space-y-3">
          {transfers.map((item) => {
            const person = personByUsername(item.username);
            const clock = person
              ? earningEligibility({
                  region: person.region,
                  plan: item.plan,
                  verified: true,
                  straightPremiumMonths: person.straightPremiumMonths,
                  straightActiveDays: person.straightActiveDays,
                })
              : null;
            return (
              <article key={item.id} className="card">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => setReceipt(item.id)} className="shrink-0 text-left">
                    <ReceiptGraphic reference={item.reference} amount={item.amountLabel} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">@{item.username} · {item.amountLabel}</p>
                    <p className="text-sm text-ink/55">{item.region} · {item.plan.replace("_", " ")} · {item.reference}</p>
                    <p className="mt-1 text-sm">{clock?.reason}</p>
                    {clock?.monthsRemaining !== undefined && <p className="text-xs font-semibold text-amber-200">{clock.monthsRemaining} month(s) until earning</p>}
                    {clock?.daysRemaining !== undefined && <p className="text-xs font-semibold text-amber-200">{clock.daysRemaining} active day(s) until earning</p>}
                    {clock?.eligible && <p className="text-xs font-semibold text-emerald-300">Earning starts once this receipt is approved.</p>}
                    <p className="mt-1 text-xs uppercase tracking-wider text-ink/40">{item.status}</p>
                  </div>
                </div>
                {item.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-primary py-2 text-sm" onClick={() => setStatus(setTransfers, item.id, "approved")}>Approve blue tick</button>
                    <button type="button" className="btn-ghost py-2 text-sm" onClick={() => setStatus(setTransfers, item.id, "rejected")}>Reject</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {selected && (
          <p className="mt-2 text-xs text-ink/40">Open receipt: {selected.reference}. This is a demo slip, not a real bank file.</p>
        )}
      </section>

      <AdPerformance />
    </main>
  );
}

function AdPerformance() {
  const rows = useMemo(
    () =>
      ADS.map((ad) => {
        const split = allocateRevenue(ad.spendNgn, { creator: true, viewers: true });
        const ctr = ad.impressions === 0 ? 0 : (ad.clicks / ad.impressions) * 100;
        return { ad, split, ctr };
      }),
    [],
  );
  return (
    <section className="mt-10" data-testid="ad-performance">
      <h2 className="text-lg font-bold">Ad performance</h2>
      <p className="mt-1 text-sm text-ink/55">Mimic advertiser accounts. Spend splits 50% creator / 20% viewer / 30% Faddahy after eligibility.</p>
      <div className="mt-3 space-y-3">
        {rows.map(({ ad, split, ctr }) => (
          <article key={ad.id} className="card">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUri(ad.name, ad.color)} alt="" className="h-11 w-11 rounded-full" />
              <div>
                <p className="font-bold">@{ad.username}</p>
                <p className="text-xs text-ink/50">{ad.name} · Sponsored</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <Stat label="Impressions" value={ad.impressions.toLocaleString()} />
              <Stat label="Clicks" value={ad.clicks.toLocaleString()} />
              <Stat label="CTR" value={`${ctr.toFixed(2)}%`} />
            </dl>
            <p className="mt-3 text-xs text-ink/50">
              Spend {naira(ad.spendNgn)} · creators {naira(split.creator)} · viewers {naira(split.viewer)} · Faddahy {naira(split.faddahy)}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink/40">{PEOPLE.filter((person) => person.admin).length} founder account can approve receipts. Members never self-approve a blue tick.</p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-navy/80 px-2 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-ink/40">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function ReceiptGraphic({ reference, amount }: { reference: string; amount: string }) {
  return (
    <span className="grid h-20 w-16 place-items-center rounded-xl bg-[#f8fafc] px-1 text-center text-[9px] font-bold leading-tight text-[#0b1220]">
      RECEIPT
      <span className="font-black">{amount}</span>
      <span className="font-medium">{reference.slice(-4)}</span>
    </span>
  );
}

function setStatus(set: Dispatch<SetStateAction<DemoTransfer[]>>, id: string, status: DemoTransfer["status"]) {
  set((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
}
