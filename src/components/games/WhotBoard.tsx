"use client";

import { useEffect, useState } from "react";
import {
  createWhot,
  labelSuit,
  legalCards,
  playCard,
  specialName,
  stepAi,
  topCard,
  drawForCurrent,
  type WhotCard,
  type WhotState,
  type WhotSuit,
} from "@/lib/games/whot";
import { StakeBar } from "@/components/games/StakeBar";

const SUITS: WhotSuit[] = ["circle", "triangle", "cross", "square", "star"];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function WhotBoard() {
  const [mode, setMode] = useState<"ai" | "pass">("ai");
  const [state, setState] = useState<WhotState>(() => createWhot("ai", mulberry32(20261126)));
  const [pendingWhot, setPendingWhot] = useState<string | null>(null);

  useEffect(() => {
    if (state.mode !== "ai" || state.current !== 1 || state.winner !== null) return;
    const timer = window.setTimeout(() => setState((current) => stepAi(current)), 450);
    return () => window.clearTimeout(timer);
  }, [state]);

  function restart(nextMode: "ai" | "pass") {
    setMode(nextMode);
    setPendingWhot(null);
    setState(createWhot(nextMode, mulberry32(nextMode === "ai" ? 20261126 : 7)));
  }

  function onCard(card: WhotCard) {
    if (state.current !== 0 || state.winner !== null) return;
    if (card.rank === "whot") {
      setPendingWhot(card.id);
      return;
    }
    setState((current) => playCard(current, 0, card.id));
  }

  const top = topCard(state);
  const mine = legalCards(state, 0).map((card) => card.id);

  return (
    <div data-testid="whot-board">
      <StakeBar players={2} />
      <div className="mb-3 flex gap-2">
        <button type="button" className={`chip ${mode === "ai" ? "chip-on" : ""}`} onClick={() => restart("ai")}>Vs AI</button>
        <button type="button" className={`chip ${mode === "pass" ? "chip-on" : ""}`} onClick={() => restart("pass")}>Pass and play</button>
        <button type="button" className="chip" onClick={() => restart(mode)}>New deal</button>
      </div>
      <p className="mb-3 text-sm text-ink/70">{state.message}</p>
      <div className="card mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{state.names[1]} · {state.hands[1].length} cards</p>
        <div className="mt-2 flex gap-1">
          {state.hands[1].slice(0, 8).map((card) => (
            <span key={card.id} className="h-12 w-8 rounded-md bg-brand-700 ring-1 ring-white/20" />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center">
          <CardFace card={top} called={state.calledSuit} large />
        </div>
        {state.pendingDraw > 0 && <p className="mt-2 text-center text-sm font-semibold text-amber-200">Pick {state.pendingDraw} unless you stack a 2</p>}
      </div>
      {pendingWhot && (
        <div className="card mb-3">
          <p className="text-sm font-semibold">Call a shape for Whot</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUITS.map((suit) => (
              <button
                key={suit}
                type="button"
                className="chip"
                onClick={() => {
                  setState((current) => playCard(current, 0, pendingWhot, suit));
                  setPendingWhot(null);
                }}
              >
                {labelSuit(suit)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {state.hands[0].map((card) => {
          const legal = mine.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              disabled={!legal || state.current !== 0}
              onClick={() => onCard(card)}
              className={`shrink-0 ${legal && state.current === 0 ? "" : "opacity-50"}`}
            >
              <CardFace card={card} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn-ghost mt-3 w-full"
        disabled={state.current !== 0 || state.winner !== null}
        onClick={() => setState((current) => drawForCurrent(current))}
      >
        {state.pendingDraw > 0 ? `Draw ${state.pendingDraw}` : "Draw one"}
      </button>
      {state.winner !== null && <p className="mt-3 text-center font-bold">{state.names[state.winner]} won this hand.</p>}
    </div>
  );
}

function CardFace({ card, called, large = false }: { card: WhotCard; called?: WhotSuit | null; large?: boolean }) {
  const special = specialName(card);
  return (
    <span className={`grid place-items-center rounded-xl bg-[#f8fafc] text-[#0b1220] shadow-md ${large ? "h-28 w-20" : "h-24 w-16"}`}>
      <SuitMark suit={card.suit === "whot" ? called ?? "star" : card.suit} whot={card.rank === "whot"} />
      <span className="text-xs font-black">{card.rank === "whot" ? "WHOT" : card.rank}</span>
      {special && card.rank !== "whot" && <span className="px-1 text-[8px] font-bold uppercase leading-tight">{special}</span>}
    </span>
  );
}

function SuitMark({ suit, whot }: { suit: WhotSuit; whot?: boolean }) {
  const common = "h-5 w-5";
  if (whot) return <span className="text-sm font-black text-brand-700">W</span>;
  if (suit === "circle") return <span className={`${common} rounded-full border-[3px] border-red-600`} />;
  if (suit === "triangle") return <span className={common} style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)", background: "#16a34a" }} />;
  if (suit === "cross") return <span className={`${common} relative before:absolute before:inset-x-1 before:inset-y-0 before:bg-amber-500 after:absolute after:inset-x-0 after:inset-y-1 after:bg-amber-500`} />;
  if (suit === "square") return <span className={`${common} border-[3px] border-blue-700`} />;
  return <span className={`${common} text-purple-700`}>★</span>;
}

