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
export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const LUDO_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6"] as const;
export const LUDO_NAMES = ["Red", "Green", "Yellow", "Blue"] as const;

export interface LudoState {
  /** -1 yard, 0–50 main-track steps from that player's start, 51–55 home stretch, 56 finished. */
  tokens: number[][];
  /** Active seat indexes into the 4-player board. */
  seats: number[];
  turn: number;
  dice: number | null;
  sixStreak: number;
  winner: number | null;
  message: string;
  mode: "ai" | "pass";
}

export function createLudo(mode: "ai" | "pass", players: 2 | 4 = 2): LudoState {
  const seats = players === 2 ? [0, 2] : [0, 1, 2, 3];
  const tokens = seats.map(() => [-1, -1, -1, -1]);
  tokens[0][0] = 4;
  tokens[1][0] = 6;
  return {
    tokens,
    seats,
    turn: 0,
    dice: null,
    sixStreak: 0,
    winner: null,
    message: mode === "ai" ? "You are Red. Roll a 6 to bring a token out." : "Pass-and-play. Red rolls first.",
    mode,
  };
}

export function rollDice(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 6);
}

export function globalSquare(seat: number, steps: number): number | null {
  if (steps < 0 || steps > 50) return null;
  return (LUDO_OFFSET[seat] + steps) % 52;
}

export function legalTokenIndexes(state: LudoState): number[] {
  if (state.dice === null || state.winner !== null) return [];
  const dice = state.dice;
  return state.tokens[state.turn]
    .map((pos, index) => ({ pos, index }))
    .filter(({ pos }) => {
      if (pos === 56) return false;
      if (pos < 0) return dice === 6;
      return pos + dice <= 56;
    })
    .map(({ index }) => index);
}

export function playRoll(state: LudoState, dice: number): LudoState {
  if (state.winner !== null || state.dice !== null) return state;
  const next = clone(state);
  if (dice === 6) {
    next.sixStreak += 1;
    if (next.sixStreak >= 3) {
      next.sixStreak = 0;
      next.dice = null;
      next.turn = (next.turn + 1) % next.seats.length;
      next.message = "Three sixes in a row. The turn is forfeited.";
      return next;
    }
  } else {
    next.sixStreak = 0;
  }
  next.dice = dice;
  const moves = legalTokenIndexes(next);
  if (moves.length === 0) {
    next.message = `${nameOf(next)} rolled ${dice} and cannot move.`;
    return passTurn(next, dice === 6);
  }
  next.message = `${nameOf(next)} rolled ${dice}. Choose a token.`;
  return next;
}

export function moveToken(state: LudoState, tokenIndex: number): LudoState {
  const next = clone(state);
  if (next.dice === null || !legalTokenIndexes(next).includes(tokenIndex)) {
    next.message = "That token cannot use this roll.";
    return next;
  }
  const dice = next.dice;
  const pos = next.tokens[next.turn][tokenIndex];
  const seat = next.seats[next.turn];
  if (pos < 0) next.tokens[next.turn][tokenIndex] = 0;
  else next.tokens[next.turn][tokenIndex] = pos + dice;
  const landed = next.tokens[next.turn][tokenIndex];
  let captured = false;
  if (landed <= 50) {
    const square = globalSquare(seat, landed);
    if (square !== null && !SAFE_SQUARES.has(square)) {
      next.tokens.forEach((tokens, owner) => {
        if (owner === next.turn) return;
        tokens.forEach((their, i) => {
          if (their < 0 || their > 50) return;
          if (globalSquare(next.seats[owner], their) === square) {
            tokens[i] = -1;
            captured = true;
          }
        });
      });
    }
  }
  const finished = next.tokens[next.turn].every((p) => p === 56);
  if (finished) {
    next.winner = next.turn;
    next.dice = null;
    next.message = `${nameOf(next)} brought every token home.`;
    return next;
  }
  const extra = dice === 6 || captured;
  next.message = captured
    ? `${nameOf(next)} captured a token${dice === 6 ? " and rolls again" : ""}.`
    : landed === 56
      ? `${nameOf(next)} got a token home.`
      : `${nameOf(next)} moved.`;
  return passTurn(next, extra);
}

export function stepAi(state: LudoState, rng: () => number = Math.random): LudoState {
  if (state.mode !== "ai" || state.turn === 0 || state.winner !== null) return state;
  let next = state;
  if (next.dice === null) next = playRoll(next, rollDice(rng));
  if (next.winner !== null || next.turn === 0 || next.dice === null) return next;
  const moves = legalTokenIndexes(next);
  if (moves.length === 0) return next;
  const pick = pickAiToken(next, moves);
  return moveToken(next, pick);
}

function pickAiToken(state: LudoState, moves: number[]): number {
  const dice = state.dice ?? 0;
  const seat = state.seats[state.turn];
  const capturing = moves.find((index) => {
    const pos = state.tokens[state.turn][index];
    if (pos < 0) return false;
    const dest = pos + dice;
    if (dest > 50) return false;
    const square = globalSquare(seat, dest);
    if (square === null || SAFE_SQUARES.has(square)) return false;
    return state.tokens.some((tokens, owner) => {
      if (owner === state.turn) return false;
      return tokens.some((their) => their >= 0 && their <= 50 && globalSquare(state.seats[owner], their) === square);
    });
  });
  if (capturing !== undefined) return capturing;
  const exiting = moves.find((index) => state.tokens[state.turn][index] < 0);
  if (exiting !== undefined) return exiting;
  return [...moves].sort((a, b) => state.tokens[state.turn][b] - state.tokens[state.turn][a])[0];
}

function passTurn(state: LudoState, extra: boolean): LudoState {
  state.dice = null;
  if (!extra) state.turn = (state.turn + 1) % state.seats.length;
  return state;
}

export function nameOf(state: LudoState, turn = state.turn): string {
  return LUDO_NAMES[state.seats[turn]];
}

export function tokenCell(seat: number, pos: number, yardIndex: number): readonly [number, number] {
  if (pos < 0) return LUDO_YARD[seat][yardIndex];
  if (pos > 50) return LUDO_HOME[seat][pos - 51];
  return LUDO_TRACK[globalSquare(seat, pos)!];
}

function clone(state: LudoState): LudoState {
  return { ...state, tokens: state.tokens.map((row) => [...row]), seats: [...state.seats] };
}
