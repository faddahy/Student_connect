export const PAID_PLAY_MIN_NGN = 100;
export const PAID_PLAY_MAX_NGN = 1000;
export const PAID_PLAY_STEP_NGN = 100;
export const FADDAHY_PLAY_FEE = 0.01;
export const ORGANIZER_NET_SHARE = 0.3;
export const WINNER_NET_SHARE = 0.7;

export const SECRET_SUBSCRIPTION_NGN = 1000;
export const SECRET_CREATOR_SHARE = 0.7;
export const SECRET_FADDAHY_SHARE = 0.3;

export interface PaidPlayPayout {
  stakeNgn: number;
  players: number;
  gross: number;
  faddahyFee: number;
  net: number;
  organizer: number;
  winner: number;
}

export function isValidStake(stakeNgn: number): boolean {
  return (
    Number.isInteger(stakeNgn) &&
    stakeNgn >= PAID_PLAY_MIN_NGN &&
    stakeNgn <= PAID_PLAY_MAX_NGN &&
    stakeNgn % PAID_PLAY_STEP_NGN === 0
  );
}

export function stakeLadder(): number[] {
  const steps: number[] = [];
  for (let n = PAID_PLAY_MIN_NGN; n <= PAID_PLAY_MAX_NGN; n += PAID_PLAY_STEP_NGN) steps.push(n);
  return steps;
}

/**
 * Paid play: 1% Plugin9ja fee on the gross pool.
 * Of the net, 30% goes to the single tournament host and 70% to the winner
 * (or winning team as one share).
 */
export function paidPlayPayout(stakeNgn: number, players: number): PaidPlayPayout {
  if (!isValidStake(stakeNgn)) {
    throw new Error("Stake must be ₦100–₦1,000 in ₦100 steps.");
  }
  if (!Number.isInteger(players) || players < 2) {
    throw new Error("Paid play needs at least 2 players.");
  }
  const gross = stakeNgn * players;
  const faddahyFee = round2(gross * FADDAHY_PLAY_FEE);
  const net = round2(gross - faddahyFee);
  const organizer = round2(net * ORGANIZER_NET_SHARE);
  const winner = round2(net * WINNER_NET_SHARE);
  return { stakeNgn, players, gross, faddahyFee, net, organizer, winner };
}

export interface SecretSplit {
  months: number;
  gross: number;
  creator: number;
  faddahy: number;
}

/** ₦1,000 per creator per month, settled 70% creator / 30% Plugin9ja at month-end. */
export function secretZoneSplit(months = 1): SecretSplit {
  const m = Math.max(1, Math.floor(months));
  const gross = SECRET_SUBSCRIPTION_NGN * m;
  return {
    months: m,
    gross,
    creator: round2(gross * SECRET_CREATOR_SHARE),
    faddahy: round2(gross * SECRET_FADDAHY_SHARE),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
