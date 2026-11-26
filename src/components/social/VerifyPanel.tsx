"use client";

import { useState } from "react";
import { BANK } from "@/lib/demo/data";
import {
  earningEligibility,
  subscriptionQuote,
  type PremiumPlan,
  type Region,
} from "@/lib/engine";
import { naira } from "@/lib/format";

const REGIONS: Array<{ id: Region; label: string }> = [
  { id: "nigeria", label: "Nigeria" },
  { id: "africa", label: "Other African country" },
  { id: "foreign", label: "Outside Africa" },
];

export function VerifyPanel({ initialRegion = "nigeria" }: { initialRegion?: Region }) {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [plan, setPlan] = useState<PremiumPlan>(region === "nigeria" ? "monthly" : "yearly");
  const [reference, setReference] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [sent, setSent] = useState(false);

  const plans: PremiumPlan[] = region === "nigeria" ? ["monthly", "fast_track"] : ["yearly"];
  const activePlan = plans.includes(plan) ? plan : plans[0];
  const quote = subscriptionQuote(region, activePlan);
  const preview = earningEligibility({
    region,
    plan: activePlan,
    verified: true,
    straightPremiumMonths: activePlan === "monthly" ? 0 : undefined,
    straightActiveDays: activePlan === "monthly" ? undefined : 0,
  });

  return (
    <div data-testid="verify">
      <section className="card">
        <h2 className="font-bold">Pay {BANK.accountName}</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-ink/50">Bank</dt><dd>{BANK.bank}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink/50">Account</dt><dd className="font-semibold">{BANK.accountNumber}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink/50">Name</dt><dd>{BANK.accountName}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-ink/60">Narration: {BANK.narration}.</p>
      </section>

      <section className="card mt-3">
        <h2 className="font-bold">Region and plan</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {REGIONS.map((item) => (
            <button key={item.id} type="button" className={`chip ${region === item.id ? "chip-on" : ""}`} onClick={() => { setRegion(item.id); setPlan(item.id === "nigeria" ? "monthly" : "yearly"); }}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {plans.map((item) => (
            <button key={item} type="button" className={`chip ${activePlan === item ? "chip-on" : ""}`} onClick={() => setPlan(item)}>
              {subscriptionQuote(region, item).label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-2xl font-black">{quote.currency === "NGN" ? naira(quote.amount) : `$${quote.amount}`}</p>
        <p className="mt-1 text-sm text-ink/60">{preview.reason}</p>
        {region === "africa" && <p className="mt-2 text-sm text-ink/60">Other paid features for African members outside Nigeria stay at ₦1,000.</p>}
        {region === "foreign" && <p className="mt-2 text-sm text-ink/60">Wallet deposits start at $10, and every foreign price is capped at a $10 minimum.</p>}
      </section>

      <form
        className="card mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!reference.trim() || !receiptName) return;
          setSent(true);
        }}
      >
        <h2 className="font-bold">Send the receipt</h2>
        <div>
          <label className="label" htmlFor="reference">Transfer reference</label>
          <input id="reference" className="input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="FS-YOURNAME-1001" required />
        </div>
        <div>
          <label className="label" htmlFor="receipt">Receipt image</label>
          <input id="receipt" className="block w-full text-sm" type="file" accept="image/*,application/pdf" required onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")} />
        </div>
        <button className="btn-primary w-full" type="submit">Submit for approval</button>
        {sent && <p className="text-sm text-emerald-300">Receipt {receiptName} is in the founder queue under {reference}.</p>}
      </form>
    </div>
  );
}
