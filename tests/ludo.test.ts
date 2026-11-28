import { describe, expect, it } from "vitest";
import {
  applyMove,
  createLudo,
  legalMoves,
  playRoll,
  SAFE_SQUARES,
  type LudoState,
} from "../src/lib/games/ludo";

function burn(state: LudoState, dice: readonly [number, number]): LudoState {
  let next = playRoll(state, dice);
  let guard = 0;
  while (next.dice.length > 0 && next.winner === null && guard < 8) {
    const move = legalMoves(next)[0];
    if (!move) break;
    next = applyMove(next, move.tokenIndex, move.dieIndex);
    guard += 1;
  }
  return next;
}

describe("classic naija ludo", () => {
  it("starts every token inside the home yard", () => {
    const state = createLudo("pass", 4);
    expect(state.tokens.flat().every((pos) => pos === -1)).toBe(true);
    expect(SAFE_SQUARES.size).toBe(0);
  });

  it("does not treat a combined 6 as a way out of the yard", () => {
    const next = playRoll(createLudo("pass"), [4, 2]);
    expect(next.tokens.flat().every((pos) => pos === -1)).toBe(true);
    expect(next.dice).toEqual([]);
    expect(next.turn).toBe(1);
    expect(next.message).toMatch(/rolled 4 and 2/i);
  });

  it("brings one token out only when a single die is 6, then spends the other die", () => {
    let next = playRoll(createLudo("pass"), [6, 3]);
    expect(next.turn).toBe(0);
    expect(next.dice).toEqual([6, 3]);
    next = applyMove(next, 0, 0);
    expect(next.tokens[0][0]).toBe(0);
    expect(next.dice).toEqual([3]);
    next = applyMove(next, 0, 0);
    expect(next.tokens[0][0]).toBe(3);
    expect(next.turn).toBe(1);
  });

  it("gives an extra roll for a double 6 and forfeits the third in a row", () => {
    let next = burn(createLudo("pass"), [6, 6]);
    expect(next.turn).toBe(0);
    expect(next.dice).toEqual([]);
    expect(next.message).toMatch(/roll again/i);

    next = burn(next, [6, 6]);
    expect(next.turn).toBe(0);

    next = burn(next, [6, 6]);
    expect(next.turn).toBe(1);
    expect(next.message).toMatch(/forfeited/i);
    expect(next.dice).toEqual([]);
  });

  it("sends a captured token home and takes the capturing seed straight home", () => {
    const state = createLudo("pass", 2);
    state.tokens[0][0] = 49;
    state.tokens[1][0] = 24;
    state.dice = [1];
    const next = applyMove(state, 0, 0);
    expect(next.tokens[0][0]).toBe(56);
    expect(next.tokens[1][0]).toBe(-1);
  });

  it("leaves the colored home lane safe and still requires an exact finish", () => {
    const safe = createLudo("pass", 2);
    safe.tokens[0][0] = 50;
    safe.tokens[1][0] = 24;
    safe.dice = [1];
    const entered = applyMove(safe, 0, 0);
    expect(entered.tokens[0][0]).toBe(51);
    expect(entered.tokens[1][0]).toBe(24);

    const finish = createLudo("pass", 2);
    finish.tokens[0][0] = 54;
    finish.dice = [3, 2];
    const moves = legalMoves(finish);
    expect(moves.map((move) => move.dieIndex)).toEqual([1]);
    const done = applyMove(finish, 0, 1);
    expect(done.tokens[0][0]).toBe(56);
  });
});
