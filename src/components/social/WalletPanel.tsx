"use client";

import type { DemoPerson } from "@/lib/demo/data";
import { allocateRevenue, earningEligibility, evaluateViewerEligibility } from "@/lib/engine";
import { naira } from "@/lib/format";
import { WithdrawalForm } from "@/components/social/WithdrawalForm";

export function WalletPanel({ person }: { person: DemoPerson }) {
  const eligibility = earningEligibility({
    region: person.region,
    plan: person.plan ?? "monthly",
    verified: person.blueTick,
    straightPremiumMonths: person.straightPremiumMonths,
    straightActiveDays: person.straightActiveDays,
  });
  const pools = allocateRevenue(50000, { creator: person.blueTick, viewers: true });
  const viewer = evaluateViewerEligibility({
    hoursPerDay: person.blueTick ? [1, 1, 1, 1, 1, 1, 1] : [1, 1, 0, 1, 1, 1, 1],
    itemsViewed: person.blueTick ? 18 : 12,
    itemsAvailable: 20,
    qualifyingItems: person.blueTick ? 12 : 8,
  });
  return (
    <div className="space-y-3" data-testid="wallet">
      <section className="card">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{"D'Luck"} earnings</p>
        <p className="mt-1 text-3xl font-black">{naira(person.earningsNgn)}</p>
        <p className="mt-2 text-sm text-ink/65">{eligibility.reason}</p>
        {eligibility.monthsRemaining !== undefined && <p className="mt-1 text-sm font-semibold">{eligibility.monthsRemaining} premium month(s) left</p>}
        {eligibility.daysRemaining !== undefined && <p className="mt-1 text-sm font-semibold">{eligibility.daysRemaining} active day(s) left</p>}
      </section>
      <section className="card">
        <h2 className="font-bold">Ad pools on ₦50,000</h2>
        <p className="mt-1 text-xs text-ink/45">Eligibility is checked before the split. Only blue-tick creators and viewers are paid.</p>
        <div className="mt-3 space-y-2 text-sm">
          <Pool label="Creators 50%" value={pools.creator} />
          <Pool label="Viewers 20%" value={pools.viewer} />
          <Pool label="D'Luck 30%" value={pools.faddahy} />
          {pools.withheld > 0 && <Pool label="Withheld" value={pools.withheld} />}
        </div>
        <p className="mt-3 text-sm text-ink/60">
          Viewer check: {viewer.eligible ? "eligible this week" : viewer.reasons[0]} Hours logged {viewer.hoursThisWeek}.
        </p>
      </section>
      <WithdrawalForm person={person} />
    </div>
  );
}

function Pool({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-bold">{naira(value)}</span>
    </div>
  );
}
