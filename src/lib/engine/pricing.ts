import type { PremiumPlan, Region } from "./types";

export const NIGERIA_MONTHLY_NGN = 1000;
export const NIGERIA_FAST_TRACK_NGN = 3000;
export const NIGERIA_PREMIUM_MONTHS_BEFORE_EARNING = 3;
export const FAST_TRACK_ACTIVE_DAYS = 30;

export const AFRICA_YEARLY_NGN = 10000;
export const AFRICA_OTHER_FEATURES_NGN = 1000;

export const FOREIGN_YEARLY_USD = 10;
export const FOREIGN_MIN_WALLET_DEPOSIT_USD = 10;
export const FOREIGN_MIN_PRICE_USD = 10;

export const WITHDRAWAL_MIN_USD = 30;

export interface EarningEligibilityInput {
  region: Region;
  plan: PremiumPlan;
  /** Blue tick must already be approved. */
  verified: boolean;
  straightPremiumMonths?: number;
  straightActiveDays?: number;
}

export interface EarningEligibility {
  eligible: boolean;
  reason: string;
  monthsRemaining?: number;
  daysRemaining?: number;
}

/**
 * Nigerians on the monthly plan earn only after 3 straight premium months.
 * The ₦3,000 fast-track (and yearly plans that include fast-track) earn
 * after 30 straight active days.
 */
export function earningEligibility(input: EarningEligibilityInput): EarningEligibility {
  if (!input.verified) {
    return { eligible: false, reason: "Blue tick approval is required before ad earning starts." };
  }
  if (input.region === "nigeria" && input.plan === "monthly") {
    const months = input.straightPremiumMonths ?? 0;
    if (months >= NIGERIA_PREMIUM_MONTHS_BEFORE_EARNING) {
      return { eligible: true, reason: "Three straight premium months completed." };
    }
    return {
      eligible: false,
      monthsRemaining: NIGERIA_PREMIUM_MONTHS_BEFORE_EARNING - months,
      reason: "Stay premium for 3 straight months before ad earning starts.",
    };
  }
  const days = input.straightActiveDays ?? 0;
  if (days >= FAST_TRACK_ACTIVE_DAYS) {
    return { eligible: true, reason: "30 straight active days completed." };
  }
  return {
    eligible: false,
    daysRemaining: FAST_TRACK_ACTIVE_DAYS - days,
    reason: "Fast-track earning starts after 30 straight active days.",
  };
}

export interface PriceQuote {
  region: Region;
  plan: PremiumPlan;
  amount: number;
  currency: "NGN" | "USD";
  label: string;
  coversFastTrack: boolean;
}

export function subscriptionQuote(region: Region, plan: PremiumPlan): PriceQuote {
  if (region === "nigeria" && plan === "monthly") {
    return {
      region,
      plan,
      amount: NIGERIA_MONTHLY_NGN,
      currency: "NGN",
      label: "₦1,000 / month",
      coversFastTrack: false,
    };
  }
  if (region === "nigeria") {
    return {
      region,
      plan: "fast_track",
      amount: NIGERIA_FAST_TRACK_NGN,
      currency: "NGN",
      label: "₦3,000 fast-track",
      coversFastTrack: true,
    };
  }
  if (region === "africa") {
    return {
      region,
      plan: "yearly",
      amount: AFRICA_YEARLY_NGN,
      currency: "NGN",
      label: "₦10,000 / year (includes fast-track)",
      coversFastTrack: true,
    };
  }
  return {
    region: "foreign",
    plan: "yearly",
    amount: FOREIGN_YEARLY_USD,
    currency: "USD",
    label: "$10 / year (includes fast-track)",
    coversFastTrack: true,
  };
}

/** Other paid features for non-Nigerian Africans stay at ₦1,000. */
export function otherFeaturePrice(region: Region): { amount: number; currency: "NGN" | "USD" } {
  if (region === "foreign") return { amount: FOREIGN_MIN_PRICE_USD, currency: "USD" };
  return { amount: AFRICA_OTHER_FEATURES_NGN, currency: "NGN" };
}

/**
 * Foreign prices have a $10 minimum cap, including when a lower currency
 * would convert to less than $10. Wallet deposits follow the same floor.
 */
export function capForeignPriceUsd(amountUsd: number): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return FOREIGN_MIN_PRICE_USD;
  return Math.max(FOREIGN_MIN_PRICE_USD, amountUsd);
}

export function minForeignWalletDepositUsd(): number {
  return FOREIGN_MIN_WALLET_DEPOSIT_USD;
}

export interface WithdrawalQuote {
  ok: boolean;
  reason?: string;
  /** Live USD→NGN rate, locked at the moment of payout. */
  lockedRate: number;
  /** User-covered conversion fee, in USD. */
  feeUsd: number;
  netUsd: number;
  payoutNgn: number;
}

/**
 * Minimum withdrawal is $30. The live rate is locked for that payout.
 * The user pays the conversion fee; it is subtracted before NGN conversion.
 */
export function quoteWithdrawal(input: {
  amountUsd: number;
  usdToNgn: number;
  conversionFeeUsd: number;
}): WithdrawalQuote {
  const lockedRate = input.usdToNgn;
  if (!(input.amountUsd >= WITHDRAWAL_MIN_USD)) {
    return {
      ok: false,
      reason: "Minimum withdrawal is $30 USD.",
      lockedRate,
      feeUsd: 0,
      netUsd: 0,
      payoutNgn: 0,
    };
  }
  if (!(lockedRate > 0)) {
    return {
      ok: false,
      reason: "A live USD to NGN rate is required to lock the payout.",
      lockedRate,
      feeUsd: 0,
      netUsd: 0,
      payoutNgn: 0,
    };
  }
  const feeUsd = Math.max(0, input.conversionFeeUsd);
  const netUsd = round2(input.amountUsd - feeUsd);
  if (netUsd <= 0) {
    return {
      ok: false,
      reason: "Conversion fee is covered by you and cannot consume the withdrawal.",
      lockedRate,
      feeUsd,
      netUsd: 0,
      payoutNgn: 0,
    };
  }
  return {
    ok: true,
    lockedRate,
    feeUsd,
    netUsd,
    payoutNgn: round2(netUsd * lockedRate),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
