"use client";

import { useState } from "react";
import type { DemoPerson } from "@/lib/demo/data";
import { regionalWithdrawalMinimum, withdrawalRequestAllowed } from "@/lib/engine";
import { naira, usd } from "@/lib/format";
import { requestWithdrawal } from "@/app/actions/social";
import { addWithdrawal } from "@/lib/demo/requests-store";

export function WithdrawalForm({ person }: { person: DemoPerson }) {
  const minimum = regionalWithdrawalMinimum(person.region);
  const balance = person.region === "foreign" ? 0 : person.earningsNgn;
  const [amount, setAmount] = useState(minimum.amount);
  const [sent, setSent] = useState<string>();
  const gate = withdrawalRequestAllowed(person.region, amount);
  const overBalance = amount > balance;
  const reason = !gate.ok ? gate.reason : overBalance ? "That is more than the spendable balance." : "This becomes a query to Admin. Nothing is paid until the founder approves it.";

  return (
    <section className="card" data-testid="withdrawal-request">
      <h2 className="font-bold">Request withdrawal</h2>
      <p className="mt-1 text-sm text-ink/60">
        Minimum {minimum.label}. Nigerians ₦30,000 · other Africans ₦50,000 · everyone else $50.
      </p>
      <label className="mt-3 block text-xs text-ink/50">
        Amount ({minimum.currency})
        <input className="input mt-1" type="number" min={minimum.amount} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
      </label>
      <p className="mt-2 text-sm text-ink/70">
        Balance {person.region === "foreign" ? usd(balance) : naira(balance)}. {reason}
      </p>
      <button
        type="button"
        className="btn-primary mt-3 w-full"
        disabled={!gate.ok || overBalance}
        onClick={() => {
          void requestWithdrawal(amount).then((result) => {
            if ("error" in result && result.error) {
              setSent(result.error);
              return;
            }
            addWithdrawal({ username: person.username, region: person.region, amount, currency: minimum.currency });
            setSent("Withdrawal query sent to Admin.");
          });
        }}
      >
        Request withdrawal
      </button>
      {sent && <p className="mt-2 text-sm text-emerald-300">{sent}</p>}
    </section>
  );
}
