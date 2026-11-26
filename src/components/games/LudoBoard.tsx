"use client";

import { useState } from "react";
import {
  createLudo,
  legalTokenIndexes,
  LUDO_COLORS,
  LUDO_HOME,
  LUDO_NAMES,
  LUDO_TRACK,
  LUDO_YARD,
  moveToken,
  nameOf,
  playRoll,
  rollDice,
  SAFE_SQUARES,
  stepAi,
  tokenCell,
  type LudoState,
} from "@/lib/games/ludo";
import { StakeBar } from "@/components/games/StakeBar";

export function LudoBoard() {
  const [mode, setMode] = useState<"ai" | "pass">("ai");
  const [players, setPlayers] = useState<2 | 4>(2);
  const [state, setState] = useState<LudoState>(() => createLudo("ai", 2));

  function restart(nextMode: "ai" | "pass", count: 2 | 4) {
    setMode(nextMode);
    setPlayers(count);
    setState(createLudo(nextMode, count));
  }

  function roll() {
    setState((current) => {
      const rolled = playRoll(current, rollDice());
      if (rolled.mode === "ai" && rolled.turn !== 0 && rolled.winner === null) return stepAi(rolled);
      return rolled;
    });
  }

  function move(index: number) {
    setState((current) => {
      const moved = moveToken(current, index);
      if (moved.mode === "ai" && moved.turn !== 0 && moved.winner === null) return stepAi(moved);
      return moved;
    });
  }

  const legal = new Set(legalTokenIndexes(state));
  const cells = boardCells(state, legal);

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
      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-[repeat(15,minmax(0,1fr))] gap-px rounded-2xl bg-[#10203a] p-1">
        {cells.map((cell) => (
          <div key={cell.key} className="relative" style={{ background: cell.bg }}>
            {cell.safe && <span className="absolute inset-0.5 rounded-full border border-white/50" />}
            {cell.tokens.map((token) => (
              <button
                key={token.key}
                type="button"
                disabled={!token.legal}
                onClick={() => move(token.index)}
                className="absolute inset-0.5 rounded-full ring-2 ring-black/40"
                style={{ background: token.color, outline: token.legal ? "2px solid white" : undefined }}
                aria-label={`${token.name} token`}
              />
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="btn-primary mt-4 w-full" disabled={state.dice !== null || state.winner !== null || (mode === "ai" && state.turn !== 0)} onClick={roll}>
        {state.winner !== null ? `${nameOf(state, state.winner)} wins` : `Roll for ${nameOf(state)}`}
      </button>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/60">
        <li>Roll a 6 to leave the yard.</li>
        <li>Land on a token to capture it, except on safe squares.</li>
        <li>Need the exact roll down the home stretch.</li>
        <li>Three sixes in a row forfeits the turn.</li>
      </ul>
    </div>
  );
}

function boardCells(state: LudoState, legal: Set<number>) {
  const paint = new Map<string, { bg: string; safe: boolean; tokens: Array<{ key: string; color: string; legal: boolean; index: number; name: string }> }>();
  const keyOf = (row: number, col: number) => `${row}-${col}`;
  const ensure = (row: number, col: number, bg = "#1a2a49") => {
    const key = keyOf(row, col);
    if (!paint.has(key)) paint.set(key, { bg, safe: false, tokens: [] });
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
    cell.safe = SAFE_SQUARES.has(index);
    if ([0, 13, 26, 39].includes(index)) {
      const seat = [0, 13, 26, 39].indexOf(index);
      cell.bg = LUDO_COLORS[seat];
    }
  });
  LUDO_HOME.forEach((path, seat) => {
    path.forEach((point) => {
      ensure(point[0], point[1], LUDO_COLORS[seat]);
    });
  });
  LUDO_YARD.forEach((spots, seat) => {
    spots.forEach((point) => ensure(point[0], point[1], LUDO_COLORS[seat]));
  });

  state.tokens.forEach((tokens, turn) => {
    const seat = state.seats[turn];
    tokens.forEach((pos, index) => {
      const [row, col] = tokenCell(seat, pos, index);
      const cell = ensure(row, col);
      cell.tokens.push({
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
      cells.push({ key: keyOf(row, col), bg: found?.bg ?? "transparent", safe: found?.safe ?? false, tokens: found?.tokens ?? [] });
    }
  }
  return cells;
}
