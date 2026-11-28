/** 52-square main track on a 15×15 board, indexed clockwise from red's start. */
export const LUDO_TRACK: ReadonlyArray<readonly [number, number]> = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

export const LUDO_HOME: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
];

export const LUDO_YARD: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[1, 1], [1, 4], [4, 1], [4, 4]],
  [[1, 10], [1, 13], [4, 10], [4, 13]],
  [[10, 10], [10, 13], [13, 10], [13, 13]],
  [[10, 1], [10, 4], [13, 1], [13, 4]],
];

/** Red, green, yellow, blue. Two-player games use red (0) and yellow (2). */
export const LUDO_OFFSET = [0, 13, 26, 39] as const;

/**
 * The outer track has no safe squares. Only a player's own colored home lane
 * (steps 51–55) cannot be pecked. Kept as an empty set so callers can ask.
 */
export const SAFE_SQUARES = new Set<number>();

export const LUDO_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6"] as const;
export const LUDO_NAMES = ["Red", "Green", "Yellow", "Blue"] as const;

export const DICE_COLORS = ["#facc15", "#22d3ee"] as const;

export interface DieMove {
  tokenIndex: number;
  dieIndex: number;
}

export interface LudoState {
  /** -1 yard, 0–50 main-track steps from that player's start, 51–55 home lane, 56 finished. */
  tokens: number[][];
  /** Active seat indexes into the 4-player board. */
  seats: number[];
  turn: number;
  /** Dice still waiting to be played. Empty while the turn is waiting for a roll. */
  dice: number[];
  /** The two numbers from the latest roll, kept visible in the center box. */
  shownDice: [number, number] | null;
  bonusRoll: boolean;
  doubleSixStreak: number;
  winner: number | null;
  message: string;
  mode: "ai" | "pass";
}

export function createLudo(mode: "ai" | "pass", players: 2 | 4 = 2): LudoState {
  const seats = players === 2 ? [0, 2] : [0, 1, 2, 3];
  return {
    tokens: seats.map(() => [-1, -1, -1, -1]),
    seats,
    turn: 0,
    dice: [],
    shownDice: null,
    bonusRoll: false,
    doubleSixStreak: 0,
    winner: null,
    message:
      mode === "ai"
        ? "You are Red. All four tokens start at home. Only a single 6 brings one out."
        : "Pass-and-play. All tokens start at home. Red rolls first.",
    mode,
  };
}

export function rollDie(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 6);
}

export function rollTwoDice(rng: () => number = Math.random): [number, number] {
  return [rollDie(rng), rollDie(rng)];
}

/** @deprecated Use rollDie. Kept so older callers still compile. */
export function rollDice(rng: () => number = Math.random): number {
  return rollDie(rng);
}

export function globalSquare(seat: number, steps: number): number | null {
  if (steps < 0 || steps > 50) return null;
  return (LUDO_OFFSET[seat] + steps) % 52;
}

function dieIsPlayable(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function canApply(pos: number, die: number): boolean {
  if (pos === 56) return false;
  if (pos < 0) return die === 6;
  return pos + die <= 56;
}

export function legalMoves(state: LudoState): DieMove[] {
  if (state.winner !== null || state.dice.length === 0) return [];
  const moves: DieMove[] = [];
  state.dice.forEach((die, dieIndex) => {
    if (!dieIsPlayable(die)) return;
    state.tokens[state.turn].forEach((pos, tokenIndex) => {
      if (canApply(pos, die)) moves.push({ tokenIndex, dieIndex });
    });
  });
  return moves;
}

export function legalTokenIndexes(state: LudoState): number[] {
  return [...new Set(legalMoves(state).map((move) => move.tokenIndex))];
}

export function diceForToken(state: LudoState, tokenIndex: number): number[] {
  return legalMoves(state).filter((move) => move.tokenIndex === tokenIndex).map((move) => move.dieIndex);
}

export function playRoll(state: LudoState, dice: readonly [number, number]): LudoState {
  if (state.winner !== null || state.dice.length > 0) return state;
  if (!dieIsPlayable(dice[0]) || !dieIsPlayable(dice[1])) return state;
  const next = clone(state);
  const [first, second] = dice;
  next.shownDice = [first, second];
  const doubleSix = first === 6 && second === 6;
  if (doubleSix) {
    next.doubleSixStreak += 1;
    if (next.doubleSixStreak >= 3) {
      next.doubleSixStreak = 0;
      next.bonusRoll = false;
      next.dice = [];
      next.turn = (next.turn + 1) % next.seats.length;
      next.message = `${nameOf(state)} rolled 6 and 6. Three double sixes in a row. The turn is forfeited.`;
      return next;
    }
    next.bonusRoll = true;
  } else {
    next.doubleSixStreak = 0;
    next.bonusRoll = false;
  }
  next.dice = [first, second];
  if (legalMoves(next).length === 0) {
    return finishDice(next, `${nameOf(next)} rolled ${first} and ${second} and cannot move.`);
  }
  next.message = `${nameOf(next)} rolled ${first} and ${second}. Choose a token.`;
  return next;
}

export function applyMove(state: LudoState, tokenIndex: number, dieIndex: number): LudoState {
  const next = clone(state);
  const allowed = legalMoves(next).some((move) => move.tokenIndex === tokenIndex && move.dieIndex === dieIndex);
  if (!allowed) {
    next.message = "That token cannot use this die.";
    return next;
  }
  const die = next.dice[dieIndex];
  const pos = next.tokens[next.turn][tokenIndex];
  const seat = next.seats[next.turn];
  if (pos < 0) next.tokens[next.turn][tokenIndex] = 0;
  else next.tokens[next.turn][tokenIndex] = pos + die;
  let landed = next.tokens[next.turn][tokenIndex];
  let captured = false;
  if (landed <= 50) {
    const square = globalSquare(seat, landed);
    if (square !== null) {
      next.tokens.forEach((tokens, owner) => {
        if (owner === next.turn) return;
        tokens.forEach((their, index) => {
          if (their < 0 || their > 50) return;
          if (globalSquare(next.seats[owner], their) === square) {
            tokens[index] = -1;
            captured = true;
          }
        });
      });
    }
  }
  if (captured) {
    next.tokens[next.turn][tokenIndex] = 56;
    landed = 56;
  }
  next.dice = next.dice.filter((_, index) => index !== dieIndex);
  if (next.tokens[next.turn].every((cell) => cell === 56)) {
    next.winner = next.turn;
    next.dice = [];
    next.bonusRoll = false;
    next.message = `${nameOf(next)} brought every token home.`;
    return next;
  }
  const detail = captured
    ? `${nameOf(next)} pecked a token and that seed went straight home.`
    : pos < 0
      ? `${nameOf(next)} brought a token out with a single 6.`
      : landed === 56
        ? `${nameOf(next)} finished a token on an exact roll.`
        : `${nameOf(next)} moved.`;
  return finishDice(next, detail);
}

/** Uses the only legal die for a token, or the first when several are legal. */
export function moveToken(state: LudoState, tokenIndex: number): LudoState {
  const dice = diceForToken(state, tokenIndex);
  if (dice.length === 0) {
    const next = clone(state);
    next.message = "That token cannot use this roll.";
    return next;
  }
  return applyMove(state, tokenIndex, dice[0]);
}

export function stepAi(state: LudoState, rng: () => number = Math.random): LudoState {
  if (state.mode !== "ai" || state.turn === 0 || state.winner !== null) return state;
  let next = state;
  let guard = 0;
  while (next.turn !== 0 && next.winner === null && guard < 24) {
    guard += 1;
    if (next.dice.length === 0) {
      next = playRoll(next, rollTwoDice(rng));
      if (next.winner !== null || next.turn === 0) break;
      if (next.dice.length === 0) continue;
    }
    const moves = legalMoves(next);
    if (moves.length === 0) {
      next = finishDice(next, next.message);
      continue;
    }
    const pick = pickAiMove(next, moves);
    next = applyMove(next, pick.tokenIndex, pick.dieIndex);
  }
  return next;
}

function pickAiMove(state: LudoState, moves: DieMove[]): DieMove {
  const seat = state.seats[state.turn];
  const capturing = moves.find((move) => {
    const die = state.dice[move.dieIndex];
    const pos = state.tokens[state.turn][move.tokenIndex];
    if (pos < 0 || die === undefined) return false;
    const dest = pos + die;
    if (dest > 50) return false;
    const square = globalSquare(seat, dest);
    if (square === null) return false;
    return state.tokens.some((tokens, owner) => {
      if (owner === state.turn) return false;
      return tokens.some((their) => their >= 0 && their <= 50 && globalSquare(state.seats[owner], their) === square);
    });
  });
  if (capturing) return capturing;
  const exiting = moves.find((move) => state.tokens[state.turn][move.tokenIndex] < 0);
  if (exiting) return exiting;
  return [...moves].sort(
    (a, b) => state.tokens[state.turn][b.tokenIndex] - state.tokens[state.turn][a.tokenIndex],
  )[0];
}

function finishDice(state: LudoState, message: string): LudoState {
  if (legalMoves(state).length > 0) {
    state.message = message;
    return state;
  }
  state.dice = [];
  if (state.bonusRoll) {
    state.bonusRoll = false;
    state.message = `${message} Double six — roll again.`;
    return state;
  }
  state.turn = (state.turn + 1) % state.seats.length;
  state.message = message;
  return state;
}

export function nameOf(state: LudoState, turn = state.turn): string {
  return LUDO_NAMES[state.seats[turn]];
}

export function tokenCell(seat: number, pos: number, yardIndex: number): readonly [number, number] {
  if (pos < 0) return LUDO_YARD[seat][yardIndex];
  if (pos > 50) return LUDO_HOME[seat][Math.min(pos - 51, LUDO_HOME[seat].length - 1)];
  return LUDO_TRACK[globalSquare(seat, pos)!];
}

function clone(state: LudoState): LudoState {
  return {
    ...state,
    tokens: state.tokens.map((row) => [...row]),
    seats: [...state.seats],
    dice: [...state.dice],
    shownDice: state.shownDice ? [state.shownDice[0], state.shownDice[1]] : null,
  };
}
