export type WhotSuit = "circle" | "triangle" | "cross" | "square" | "star";
export type WhotCard = { id: string; suit: WhotSuit | "whot"; rank: number | "whot" };

export interface WhotState {
  hands: [WhotCard[], WhotCard[]];
  draw: WhotCard[];
  discard: WhotCard[];
  current: 0 | 1;
  pendingDraw: number;
  calledSuit: WhotSuit | null;
  skipNext: boolean;
  winner: 0 | 1 | null;
  message: string;
  mode: "ai" | "pass";
  names: [string, string];
}

const SUITS: WhotSuit[] = ["circle", "triangle", "cross", "square", "star"];

export function createWhot(mode: "ai" | "pass", rng: () => number = Math.random): WhotState {
  const deck = shuffle(buildDeck(), rng);
  const hands: [WhotCard[], WhotCard[]] = [[], []];
  for (let i = 0; i < 6; i++) {
    hands[0].push(deck.pop()!);
    hands[1].push(deck.pop()!);
  }
  const start = deck.pop()!;
  const state: WhotState = {
    hands,
    draw: deck,
    discard: [start],
    current: 0,
    pendingDraw: 0,
    calledSuit: null,
    skipNext: false,
    winner: null,
    message: "Your turn. Match the shape or the number.",
    mode,
    names: ["You", mode === "ai" ? "Whot AI" : "Player 2"],
  };
  if (start.rank === "whot") {
    state.calledSuit = "star";
    state.message = "Opening Whot calls Star. Match Star or play another Whot.";
  } else if (start.rank === 2) {
    state.pendingDraw = 2;
    state.message = "Opening Pick 2. Play a 2 to stack, or draw two.";
  } else if (start.rank === 1) {
    state.current = 1;
    state.message = "Opening Hold On. Your first turn is skipped.";
  } else if (start.rank === 14) {
    drawInto(state, 0, 1);
    state.message = "Opening General Market. You drew one card.";
  }
  return state;
}

export function topCard(state: WhotState): WhotCard {
  return state.discard[state.discard.length - 1];
}

export function legalCards(state: WhotState, player: 0 | 1): WhotCard[] {
  if (state.winner !== null || state.current !== player) return [];
  const hand = state.hands[player];
  if (state.pendingDraw > 0) return hand.filter((card) => card.rank === 2);
  return hand.filter((card) => matches(card, state));
}

export function playCard(state: WhotState, player: 0 | 1, cardId: string, call?: WhotSuit): WhotState {
  const next = clone(state);
  if (next.winner !== null) return next;
  if (next.current !== player) {
    next.message = `It is ${next.names[next.current]}'s turn.`;
    return next;
  }
  const hand = next.hands[player];
  const index = hand.findIndex((card) => card.id === cardId);
  if (index < 0) return next;
  const card = hand[index];
  const allowed = legalCards(next, player).some((c) => c.id === card.id);
  if (!allowed) {
    next.message = next.pendingDraw
      ? `Play a 2 to stack, or pick ${next.pendingDraw}.`
      : "That card does not match the shape or number.";
    return next;
  }
  if (card.rank === "whot" && !call) {
    next.message = "Call a shape for the Whot card.";
    return next;
  }
  hand.splice(index, 1);
  next.discard.push(card);
  next.calledSuit = card.rank === "whot" ? call! : null;
  if (card.rank === "whot") next.message = `${next.names[player]} played Whot and called ${labelSuit(call!)}.`;
  else next.message = `${next.names[player]} played ${labelCard(card)}.`;
  applySpecial(next, player, card, false);
  if (hand.length === 0) {
    next.winner = player;
    next.message = `${next.names[player]} won.`;
    return next;
  }
  advance(next);
  return next;
}

export function drawForCurrent(state: WhotState): WhotState {
  const next = clone(state);
  if (next.winner !== null) return next;
  const player = next.current;
  if (legalCards(next, player).length > 0 && next.pendingDraw === 0) {
    next.message = "You still have a card you can play.";
    return next;
  }
  const count = next.pendingDraw > 0 ? next.pendingDraw : 1;
  drawInto(next, player, count);
  next.pendingDraw = 0;
  next.message = `${next.names[player]} picked ${count}.`;
  advance(next);
  return next;
}

/** Apply the AI move when it is player 1 in AI mode. Returns the same state if it is not the AI's turn. */
export function stepAi(state: WhotState): WhotState {
  if (state.mode !== "ai" || state.current !== 1 || state.winner !== null) return state;
  const legal = legalCards(state, 1);
  if (state.pendingDraw > 0 && legal.length === 0) return drawForCurrent(state);
  if (legal.length === 0) return drawForCurrent(state);
  const whot = legal.find((card) => card.rank === "whot");
  const plain = legal.find((card) => card.rank !== "whot");
  const chosen = plain ?? whot!;
  let call: WhotSuit | undefined;
  if (chosen.rank === "whot") call = bestSuit(state.hands[1]);
  return playCard(state, 1, chosen.id, call);
}

export function labelCard(card: WhotCard): string {
  if (card.rank === "whot") return "Whot";
  return `${card.rank} ${labelSuit(card.suit as WhotSuit)}`;
}

export function labelSuit(suit: WhotSuit): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

export function specialName(card: WhotCard): string | null {
  if (card.rank === 1) return "Hold On";
  if (card.rank === 2) return "Pick 2";
  if (card.rank === 14) return "General Market";
  if (card.rank === "whot") return "Whot";
  return null;
}

function matches(card: WhotCard, state: WhotState): boolean {
  if (card.rank === "whot") return true;
  const top = topCard(state);
  if (top.rank === "whot") return card.suit === state.calledSuit;
  return card.suit === top.suit || card.rank === top.rank;
}

function applySpecial(state: WhotState, player: 0 | 1, card: WhotCard, opening: boolean) {
  const other = (player === 0 ? 1 : 0) as 0 | 1;
  if (card.rank === 1) {
    state.skipNext = true;
    if (!opening) state.message += " Hold On.";
    else state.message = "Opening Hold On. Opponent is skipped — your turn.";
  } else if (card.rank === 2) {
    state.pendingDraw += 2;
    if (!opening) state.message += ` Pick 2 (stack ${state.pendingDraw}).`;
    else {
      state.message = "Opening Pick 2. Draw two or stack a 2.";
      state.current = 0;
    }
  } else if (card.rank === 14) {
    drawInto(state, other, 1);
    if (!opening) state.message += " General Market.";
    else state.message = "Opening General Market. You drew one.";
  }
}

function advance(state: WhotState) {
  if (state.skipNext) {
    state.skipNext = false;
    state.message += ` ${state.names[state.current === 0 ? 1 : 0]} is held.`;
    return;
  }
  state.current = state.current === 0 ? 1 : 0;
}

function drawInto(state: WhotState, player: 0 | 1, count: number) {
  for (let i = 0; i < count; i++) {
    if (state.draw.length === 0) refill(state);
    const card = state.draw.pop();
    if (!card) return;
    state.hands[player].push(card);
  }
}

function refill(state: WhotState) {
  const top = state.discard.pop();
  const rest = shuffle(state.discard, Math.random);
  state.discard = top ? [top] : [];
  state.draw = rest;
}

function bestSuit(hand: WhotCard[]): WhotSuit {
  const counts = new Map<WhotSuit, number>(SUITS.map((suit) => [suit, 0]));
  for (const card of hand) {
    if (card.suit !== "whot") counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildDeck(): WhotCard[] {
  const cards: WhotCard[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 14; rank++) cards.push({ id: `${suit}-${rank}`, suit, rank });
  }
  for (let i = 1; i <= 5; i++) cards.push({ id: `whot-${i}`, suit: "whot", rank: "whot" });
  return cards;
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function clone(state: WhotState): WhotState {
  return {
    ...state,
    hands: [state.hands[0].map((c) => ({ ...c })), state.hands[1].map((c) => ({ ...c }))],
    draw: state.draw.map((c) => ({ ...c })),
    discard: state.discard.map((c) => ({ ...c })),
  };
}
