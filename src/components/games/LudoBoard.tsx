"use client";

import { useState } from "react";
import {
  applyMove,
  createLudo,
  DICE_COLORS,
  diceForToken,
  legalTokenIndexes,
  LUDO_COLORS,
  LUDO_HOME,
  LUDO_NAMES,
  LUDO_TRACK,
  LUDO_YARD,
  nameOf,
  playRoll,
  rollTwoDice,
  stepAi,
  tokenCell,
  type LudoState,
} from "@/lib/games/ludo";
import { StakeBar } from "@/components/games/StakeBar";

export function LudoBoard() {
  const [mode, setMode] = useState<"ai" | "pass">("ai");
  const [players, setPlayers] = useState<2 | 4>(2);
  const [state, setState] = useState<LudoState>(() => createLudo("ai", 2));
  const [choice, setChoice] = useState<{ token: number; dice: number[] } | null>(null);

  function restart(nextMode: "ai" | "pass", count: 2 | 4) {
    setMode(nextMode);
    setPlayers(count);
    setChoice(null);
    setState(createLudo(nextMode, count));
  }

  function after(next: LudoState): LudoState {
    if (next.mode === "ai" && next.turn !== 0 && next.winner === null) return stepAi(next);
    return next;
  }

  function roll() {
    setChoice(null);
    setState((current) => after(playRoll(current, rollTwoDice())));
  }

  function move(tokenIndex: number, dieIndex: number) {
    setChoice(null);
    setState((current) => after(applyMove(current, tokenIndex, dieIndex)));
  }

  function onToken(index: number) {
    const options = diceForToken(state, index);
    if (options.length === 1) move(index, options[0]);
    else if (options.length > 1) setChoice({ token: index, dice: options });
  }

  const legal = new Set(legalTokenIndexes(state));
  const cells = boardCells(state, legal);
  const shown = state.shownDice;

  return (
    <div data-testid="ludo-board">
      <StakeBar players={players} />
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={`chip ${mode === "ai" ? "chip-on" : ""}`} onClick={() => restart("ai", players)}>Vs AI</button>
        <button type="button" className={`chip ${mode === "pass" ? "chip-on" : ""}`} onClick={() => restart("pass", players)}>Pass and play</button>
        <button type="button" className={`chip ${players === 4 ? "chip-on" : ""}`} onClick={() => restart(mode, players === 4 ? 2 : 4)}>
          {players === 4 ? "4 players" : "2 players"}
        </button>
      </div>
      <p className="mb-3 text-sm text-ink/70">{state.message}</p>
      {shown && <p className="mb-2 text-center text-sm font-semibold">Rolled {shown[0]} and {shown[1]}.</p>}
      <div className="relative mx-auto aspect-square w-full max-w-md">
        <div className="grid h-full w-full grid-cols-[repeat(15,minmax(0,1fr))] gap-px rounded-2xl bg-[#10203a] p-1">
          {cells.map((cell) => (
            <div key={cell.key} className="relative" style={{ background: cell.bg }}>
              {cell.tokens.map((token) => (
                <button
                  key={token.key}
                  type="button"
                  disabled={!token.legal}
                  onClick={() => onToken(token.index)}
                  className="absolute inset-0.5 rounded-full ring-2 ring-black/40"
                  style={{ background: token.color, outline: token.legal ? "2px solid white" : undefined }}
                  aria-label={`${token.name} token`}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute flex items-center justify-center gap-1"
          style={{ left: "40%", top: "40%", width: "20%", height: "20%" }}
          data-testid="ludo-dice"
        >
          {[0, 1].map((index) => (
            <span
              key={index}
              className="text-2xl font-black leading-none"
              style={{ color: DICE_COLORS[index] }}
            >
              {shown ? shown[index] : "·"}
            </span>
          ))}
        </div>
      </div>
      {choice && (
        <div className="mt-3 flex gap-2">
          {choice.dice.map((dieIndex) => (
            <button key={dieIndex} type="button" className="btn-primary flex-1 py-2 text-sm" onClick={() => move(choice.token, dieIndex)}>
              Use {state.dice[dieIndex]}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn-primary mt-4 w-full" disabled={state.dice.length > 0 || state.winner !== null || (mode === "ai" && state.turn !== 0)} onClick={roll}>
        {state.winner !== null ? `${nameOf(state, state.winner)} wins` : `Roll for ${nameOf(state)}`}
      </button>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/60">
        <li>Two dice. Only a single 6 leaves home.</li>
        <li>No safe squares on the outer track.</li>
        <li>A capture sends them home and your seed counts out.</li>
        <li>Double 6 rolls again. Three in a row forfeits.</li>
      </ul>
    </div>
  );
}

function boardCells(state: LudoState, legal: Set<number>) {
  const paint = new Map<string, { bg: string; tokens: Array<{ key: string; color: string; legal: boolean; index: number; name: string }> }>();
  const keyOf = (row: number, col: number) => `${row}-${col}`;
  const ensure = (row: number, col: number, bg = "#1a2a49") => {
    const key = keyOf(row, col);
    if (!paint.has(key)) paint.set(key, { bg, tokens: [] });
    return paint.get(key)!;
  };

  const yards: Array<[number, number, number, number, string]> = [
    [0, 0, 5, 5, "#7f1d1d"],
    [0, 9, 5, 14, "#14532d"],
    [9, 9, 14, 14, "#713f12"],
    [9, 0, 14, 5, "#1e3a8a"],
  ];
  for (const [r0, c0, r1, c1, bg] of yards) {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) ensure(r, c, bg);
  }
  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) ensure(r, c, "#0b1220");

  LUDO_TRACK.forEach((point, index) => {
    const cell = ensure(point[0], point[1], "#e8eefc");
    if ([0, 13, 26, 39].includes(index)) {
      const seat = [0, 13, 26, 39].indexOf(index);
      cell.bg = LUDO_COLORS[seat];
    }
  });
  LUDO_HOME.forEach((path, seat) => {
    path.forEach((point) => ensure(point[0], point[1], LUDO_COLORS[seat]));
  });
  LUDO_YARD.forEach((spots, seat) => {
    spots.forEach((point) => ensure(point[0], point[1], LUDO_COLORS[seat]));
  });

  state.tokens.forEach((tokens, turn) => {
    const seat = state.seats[turn];
    tokens.forEach((pos, index) => {
      const [row, col] = tokenCell(seat, pos, index);
      ensure(row, col).tokens.push({
        key: `${turn}-${index}`,
        color: LUDO_COLORS[seat],
        legal: state.turn === turn && legal.has(index),
        index,
        name: LUDO_NAMES[seat],
      });
    });
  });

  const cells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const found = paint.get(keyOf(row, col));
      cells.push({ key: keyOf(row, col), bg: found?.bg ?? "transparent", tokens: found?.tokens ?? [] });
    }
  }
  return cells;
}
