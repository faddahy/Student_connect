"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { avatarUri, DEMO_DATE_HOLD, type DemoPerson } from "@/lib/demo/data";
import { DATE_FEE_NGN, placeDateHold, resolveDateHold, type DateHold } from "@/lib/engine";
import { naira } from "@/lib/format";

export function DatingDeck({
  viewer,
  candidates,
}: {
  viewer: DemoPerson;
  candidates: DemoPerson[];
}) {
  const initialHold = useMemo(() => {
    if (viewer.username !== DEMO_DATE_HOLD.from) return null;
    const placedAt = new Date(Date.now() - DEMO_DATE_HOLD.placedHoursAgo * 60 * 60 * 1000);
    return {
      withUser: DEMO_DATE_HOLD.to,
      hold: {
        amountNgn: DATE_FEE_NGN,
        placedAt,
        expiresAt: new Date(placedAt.getTime() + 48 * 60 * 60 * 1000),
        spent: false,
        released: false,
      } satisfies DateHold,
    };
  }, [viewer.username]);

  const [earnings, setEarnings] = useState(viewer.earningsNgn);
  const [held, setHeld] = useState(viewer.username === "ada" ? DATE_FEE_NGN : 0);
  const [hold, setHold] = useState<{ withUser: string; hold: DateHold } | null>(initialHold);
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState<string>();

  if (!viewer.blueTick) {
    return (
      <main className="px-4" data-testid="dating-locked">
        <h1 className="text-2xl font-extrabold">Dating</h1>
        <div className="card mt-4">
          <p className="text-sm font-semibold text-brand-200">Blue tick only</p>
          <h2 className="mt-2 text-xl font-bold">Verify before you can match</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            Dating is limited to blue-tick members. The ₦100 fee comes from {"D'Luck"} earnings and sits in a 48-hour hold until both people confirm.
          </p>
          <Link href="/verify" className="btn-primary mt-5 w-full">Get the blue tick</Link>
        </div>
      </main>
    );
  }

  const person = candidates[index];
  const active = hold && !hold.hold.spent && !hold.hold.released ? hold : null;
  const remaining = active ? Math.max(0, active.hold.expiresAt.getTime() - Date.now()) : 0;

  function like() {
    if (!person) return;
    if (active) {
      setNote("You already have an unspendable dating hold. Confirm it, unmatch, or wait for the 48 hours to end.");
      return;
    }
    const placed = placeDateHold({
      blueTick: true,
      earningsNgn: earnings,
      alreadyHeldNgn: held,
      now: new Date(),
    });
    if (!placed.ok || !placed.hold) {
      setNote(placed.reason);
      return;
    }
    setHeld(placed.heldAfter);
    setHold({ withUser: person.username, hold: placed.hold });
    setNote(`₦100 is on hold for @${person.username}. Your earnings stay at ${naira(placed.earningsAfter)} until both of you confirm.`);
  }

  function confirm() {
    if (!active) return;
    const result = resolveDateHold({
      hold: active.hold,
      earningsNgn: earnings,
      heldNgn: held,
      now: new Date(),
      event: "both_confirm",
    });
    setEarnings(result.earningsAfter);
    setHeld(result.heldAfter);
    setHold({ withUser: active.withUser, hold: result.hold });
    setNote(`Match confirmed. ${naira(result.deductedNgn)} was deducted from D'Luck earnings.`);
  }

  function unmatch() {
    if (!active) return;
    const result = resolveDateHold({
      hold: active.hold,
      earningsNgn: earnings,
      heldNgn: held,
      now: new Date(),
      event: "unmatch",
    });
    setEarnings(result.earningsAfter);
    setHeld(result.heldAfter);
    setHold({ withUser: active.withUser, hold: result.hold });
    setNote("Unmatched. The hold was released and nothing was deducted.");
  }

  return (
    <main className="px-4" data-testid="dating">
      <h1 className="text-2xl font-extrabold">Dating</h1>
      <p className="mt-1 text-sm text-ink/55">Blue tick · {naira(DATE_FEE_NGN)} hold from earnings · 48 hours</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="card py-3"><p className="text-ink/50">Earnings</p><p className="text-lg font-black">{naira(earnings)}</p></div>
        <div className="card py-3"><p className="text-ink/50">On hold</p><p className="text-lg font-black">{naira(held)}</p></div>
      </div>

      {active && (
        <section className="card mt-3" data-testid="dating-hold">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">48-hour hold</p>
          <p className="mt-1 font-bold">₦100 locked for @{active.withUser}</p>
          <p className="mt-1 text-sm text-ink/65">
            Not deducted. {Math.floor(remaining / 36e5)}h {Math.floor((remaining % 36e5) / 6e4)}m left. Both people confirm to spend it, or unmatch to release it.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-primary flex-1 py-2 text-sm" onClick={confirm}>We both confirm</button>
            <button type="button" className="btn-ghost flex-1 py-2 text-sm" onClick={unmatch}>Unmatch</button>
          </div>
        </section>
      )}

      {note && <p className="mt-3 text-sm text-ink/70">{note}</p>}

      {person ? (
        <article className="card mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUri(person.displayName, person.color)} alt="" className="h-48 w-full rounded-2xl object-cover" />
          <h2 className="mt-3 text-xl font-black">{person.displayName}, {person.age}</h2>
          <p className="text-sm text-ink/55">{person.department} · {person.level} level</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{person.bio}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="btn-ghost" onClick={() => setIndex((n) => n + 1)}>Pass</button>
            <button type="button" className="btn-primary" onClick={like}>Like · hold ₦100</button>
          </div>
        </article>
      ) : (
        <div className="card mt-4 text-center">
          <p className="font-bold">No one new right now</p>
          <Link href="/matches" className="btn-primary mt-4">Open matches</Link>
        </div>
      )}
    </main>
  );
}
