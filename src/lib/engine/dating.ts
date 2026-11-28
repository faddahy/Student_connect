export const DATE_FEE_NGN = 100;
export const DATE_HOLD_MS = 48 * 60 * 60 * 1000;

export interface DateHold {
  amountNgn: number;
  placedAt: Date;
  expiresAt: Date;
  /** True only after both people confirm. Until then the fee is unspendable, not deducted. */
  spent: boolean;
  released: boolean;
}

export interface PlaceHoldResult {
  ok: boolean;
  reason?: string;
  hold?: DateHold;
  /** Earnings balance is unchanged when a hold is placed. */
  earningsAfter: number;
  /** Portion of earnings locked and unspendable. */
  heldAfter: number;
}

/**
 * Each blue-tick member places their own ₦100 hold from Plugin9ja earnings.
 * The hold does not deduct. It expires after 48 hours or on unmatch.
 */
export function placeDateHold(input: {
  blueTick: boolean;
  earningsNgn: number;
  alreadyHeldNgn: number;
  now: Date;
}): PlaceHoldResult {
  if (!input.blueTick) {
    return {
      ok: false,
      reason: "Dating is limited to blue-tick members.",
      earningsAfter: input.earningsNgn,
      heldAfter: input.alreadyHeldNgn,
    };
  }
  const spendable = input.earningsNgn - input.alreadyHeldNgn;
  if (spendable < DATE_FEE_NGN) {
    return {
      ok: false,
      reason: "You need ₦100 of spendable Plugin9ja earnings for the 48-hour hold.",
      earningsAfter: input.earningsNgn,
      heldAfter: input.alreadyHeldNgn,
    };
  }
  const placedAt = input.now;
  return {
    ok: true,
    earningsAfter: input.earningsNgn,
    heldAfter: input.alreadyHeldNgn + DATE_FEE_NGN,
    hold: {
      amountNgn: DATE_FEE_NGN,
      placedAt,
      expiresAt: new Date(placedAt.getTime() + DATE_HOLD_MS),
      spent: false,
      released: false,
    },
  };
}

export interface ResolveHoldResult {
  hold: DateHold;
  /** Amount actually deducted from earnings. 0 unless both confirmed in time. */
  deductedNgn: number;
  earningsAfter: number;
  heldAfter: number;
}

export function resolveDateHold(input: {
  hold: DateHold;
  earningsNgn: number;
  heldNgn: number;
  now: Date;
  event: "both_confirm" | "unmatch" | "tick";
}): ResolveHoldResult {
  const { hold } = input;
  if (hold.spent || hold.released) {
    return { hold, deductedNgn: 0, earningsAfter: input.earningsNgn, heldAfter: input.heldNgn };
  }
  const expired = input.now.getTime() >= hold.expiresAt.getTime();
  if (input.event === "both_confirm" && !expired) {
    const next: DateHold = { ...hold, spent: true };
    return {
      hold: next,
      deductedNgn: hold.amountNgn,
      earningsAfter: round2(input.earningsNgn - hold.amountNgn),
      heldAfter: round2(Math.max(0, input.heldNgn - hold.amountNgn)),
    };
  }
  if (input.event === "unmatch" || expired || input.event === "tick") {
    if (input.event === "both_confirm") {
      // Expired confirmation does not deduct.
    }
    if (input.event === "unmatch" || expired) {
      const next: DateHold = { ...hold, released: true };
      return {
        hold: next,
        deductedNgn: 0,
        earningsAfter: input.earningsNgn,
        heldAfter: round2(Math.max(0, input.heldNgn - hold.amountNgn)),
      };
    }
  }
  return { hold, deductedNgn: 0, earningsAfter: input.earningsNgn, heldAfter: input.heldNgn };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
