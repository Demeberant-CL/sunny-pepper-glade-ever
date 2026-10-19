import { create } from "zustand";
import { canonSet, findCard, seedHoldings } from "@/lib/folio/catalog";
import { copyLimitReached } from "@/lib/folio/rules";
import type { ChatMessage, CollectionChange, Deck, DeckCard, Holding } from "@/lib/folio/types";

const STORAGE_KEY = "folio-album-v1";

type AlbumData = {
  holdings: Holding[];
  decks: Deck[];
  messages: ChatMessage[];
};

type AlbumState = AlbumData & {
  setQty: (set: string, number: number, qty: number, extra?: { name?: string; rarity?: string }) => void;
  applyChanges: (changes: CollectionChange[]) => void;
  importRows: (rows: { set: string; number: number; qty: number; name?: string; rarity?: string }[], mode: "merge" | "replace") => number;
  resetAlbum: () => void;
  createDeck: (name?: string) => string;
  renameDeck: (id: string, name: string) => void;
  setEnergies: (id: string, energies: number[]) => void;
  toggleEnergy: (id: string, energy: number) => void;
  addToDeck: (id: string, set: string, number: number) => string | null;
  changeDeckCount: (id: string, set: string, number: number, delta: number) => void;
  removeFromDeck: (id: string, set: string, number: number) => void;
  upsertDeck: (deck: { name: string; energies: number[]; cards: DeckCard[] }) => string;
  deleteDeck: (idOrName: string) => void;
  pushMessage: (message: ChatMessage) => void;
};

function uid(): string {
  return crypto.randomUUID();
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 0;
  return Math.max(0, Math.min(99, Math.round(qty)));
}

function sanitizeHolding(value: unknown): Holding | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Holding>;
  if (typeof row.set !== "string" || !row.set.trim()) return null;
  if (typeof row.number !== "number" || !Number.isInteger(row.number) || row.number < 1) return null;
  return {
    set: canonSet(row.set),
    number: row.number,
    qty: clampQty(typeof row.qty === "number" ? row.qty : 0),
    name: typeof row.name === "string" ? row.name : undefined,
    rarity: typeof row.rarity === "string" ? row.rarity : undefined,
  };
}

function sanitizeDeck(value: unknown): Deck | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Deck>;
  if (typeof row.name !== "string" || !row.name.trim()) return null;
  if (!Array.isArray(row.cards)) return null;
  const cards: DeckCard[] = [];
  for (const card of row.cards) {
    if (!card || typeof card !== "object") continue;
    const item = card as Partial<DeckCard>;
    if (typeof item.set !== "string" || typeof item.number !== "number" || typeof item.count !== "number") continue;
    const count = Math.max(1, Math.min(2, Math.round(item.count)));
    cards.push({ set: canonSet(item.set), number: item.number, count });
  }
  const energies = Array.isArray(row.energies)
    ? row.energies.filter((energy): energy is number => typeof energy === "number" && energy >= 1 && energy <= 8).slice(0, 3)
    : [];
  return {
    id: typeof row.id === "string" && row.id ? row.id : uid(),
    name: row.name.trim().slice(0, 48),
    energies,
    cards: cards.slice(0, 20),
    updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : Date.now(),
  };
}

function sanitizeMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<ChatMessage>;
  if ((row.role !== "user" && row.role !== "assistant") || typeof row.content !== "string") return null;
  return {
    id: typeof row.id === "string" ? row.id : uid(),
    role: row.role,
    content: row.content.slice(0, 4000),
    changes: Array.isArray(row.changes) ? row.changes.slice(0, 40) : undefined,
    deckName: typeof row.deckName === "string" ? row.deckName : undefined,
    deckEvent: row.deckEvent === "saved" || row.deckEvent === "deleted" ? row.deckEvent : undefined,
  };
}

function loadData(): AlbumData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AlbumData>;
    if (!Array.isArray(parsed.holdings)) return null;
    return {
      holdings: parsed.holdings.map(sanitizeHolding).filter((row): row is Holding => row !== null),
      decks: Array.isArray(parsed.decks) ? parsed.decks.map(sanitizeDeck).filter((row): row is Deck => row !== null) : [],
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.map(sanitizeMessage).filter((row): row is ChatMessage => row !== null).slice(-40)
        : [],
    };
  } catch {
    return null;
  }
}

function saveData(data: AlbumData) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        holdings: data.holdings,
        decks: data.decks,
        messages: data.messages.slice(-40),
      }),
    );
  } catch {
    /* private mode or a full disk should not break the album */
  }
}

function upsertHolding(holdings: Holding[], set: string, number: number, qty: number, extra?: { name?: string; rarity?: string }): Holding[] {
  const code = canonSet(set);
  const nextQty = clampQty(qty);
  const index = holdings.findIndex((holding) => holding.set === code && holding.number === number);
  if (index === -1) {
    if (nextQty === 0 && !extra?.name) return holdings;
    return [...holdings, { set: code, number, qty: nextQty, name: extra?.name, rarity: extra?.rarity }];
  }
  const copy = holdings.slice();
  copy[index] = {
    ...copy[index],
    qty: nextQty,
    name: extra?.name ?? copy[index].name,
    rarity: extra?.rarity ?? copy[index].rarity,
  };
  return copy;
}

function uniqueDeckName(decks: Deck[], base: string): string {
  const cleaned = base.trim() || "Mazo nuevo";
  if (!decks.some((deck) => deck.name.toLowerCase() === cleaned.toLowerCase())) return cleaned;
  let n = 2;
  while (decks.some((deck) => deck.name.toLowerCase() === `${cleaned} ${n}`.toLowerCase())) n += 1;
  return `${cleaned} ${n}`;
}

export const useAlbum = create<AlbumState>((set, get) => ({
  holdings: seedHoldings(),
  decks: [],
  messages: [],

  setQty: (setCode, number, qty, extra) => {
    set({ holdings: upsertHolding(get().holdings, setCode, number, qty, extra) });
  },

  applyChanges: (changes) => {
    let holdings = get().holdings;
    for (const change of changes) {
      holdings = upsertHolding(holdings, change.set, change.number, change.to, { name: change.name });
    }
    set({ holdings });
  },

  importRows: (rows, mode) => {
    let holdings = mode === "replace" ? [] : get().holdings.slice();
    for (const row of rows) {
      const known = findCard(row.set, row.number);
      holdings = upsertHolding(holdings, row.set, row.number, row.qty, {
        name: known?.name ?? row.name,
        rarity: known?.rarity ?? row.rarity,
      });
    }
    set({ holdings });
    return rows.length;
  },

  resetAlbum: () => set({ holdings: seedHoldings() }),

  createDeck: (name) => {
    const deck: Deck = {
      id: uid(),
      name: uniqueDeckName(get().decks, name || "Mazo nuevo"),
      energies: [],
      cards: [],
      updatedAt: Date.now(),
    };
    set({ decks: [deck, ...get().decks] });
    return deck.id;
  },

  renameDeck: (id, name) => {
    const trimmed = name.trim().slice(0, 48);
    if (!trimmed) return;
    set({
      decks: get().decks.map((deck) => (deck.id === id ? { ...deck, name: trimmed, updatedAt: Date.now() } : deck)),
    });
  },

  setEnergies: (id, energies) => {
    const unique = [...new Set(energies.filter((energy) => energy >= 1 && energy <= 8))].slice(0, 3);
    set({
      decks: get().decks.map((deck) => (deck.id === id ? { ...deck, energies: unique, updatedAt: Date.now() } : deck)),
    });
  },

  toggleEnergy: (id, energy) => {
    const deck = get().decks.find((item) => item.id === id);
    if (!deck) return;
    const has = deck.energies.includes(energy);
    const energies = has ? deck.energies.filter((item) => item !== energy) : deck.energies.length >= 3 ? deck.energies : [...deck.energies, energy];
    get().setEnergies(id, energies);
  },

  addToDeck: (id, setCode, number) => {
    const deck = get().decks.find((item) => item.id === id);
    if (!deck) return "No encontré el mazo.";
    const code = canonSet(setCode);
    const total = deck.cards.reduce((sum, card) => sum + card.count, 0);
    if (copyLimitReached(deck.cards, code, number)) return "Ya hay 2 copias de esa carta.";
    if (total >= 20) return "El mazo ya tiene 20 cartas.";
    const cards = deck.cards.slice();
    const index = cards.findIndex((card) => card.set === code && card.number === number);
    if (index >= 0) cards[index] = { ...cards[index], count: cards[index].count + 1 };
    else cards.push({ set: code, number, count: 1 });
    set({
      decks: get().decks.map((item) => (item.id === id ? { ...item, cards, updatedAt: Date.now() } : item)),
    });
    return null;
  },

  changeDeckCount: (id, setCode, number, delta) => {
    const deck = get().decks.find((item) => item.id === id);
    if (!deck) return;
    const code = canonSet(setCode);
    if (delta > 0) {
      get().addToDeck(id, code, number);
      return;
    }
    const cards = deck.cards
      .map((card) => (card.set === code && card.number === number ? { ...card, count: card.count + delta } : card))
      .filter((card) => card.count > 0);
    set({
      decks: get().decks.map((item) => (item.id === id ? { ...item, cards, updatedAt: Date.now() } : item)),
    });
  },

  removeFromDeck: (id, setCode, number) => {
    const code = canonSet(setCode);
    set({
      decks: get().decks.map((deck) =>
        deck.id === id
          ? { ...deck, cards: deck.cards.filter((card) => !(card.set === code && card.number === number)), updatedAt: Date.now() }
          : deck,
      ),
    });
  },

  upsertDeck: ({ name, energies, cards }) => {
    const trimmed = name.trim().slice(0, 48) || "Mazo de Grok";
    const existing = get().decks.find((deck) => deck.name.toLowerCase() === trimmed.toLowerCase());
    const next: Deck = {
      id: existing?.id ?? uid(),
      name: trimmed,
      energies: [...new Set(energies.filter((energy) => energy >= 1 && energy <= 8))].slice(0, 3),
      cards: cards
        .map((card) => ({ set: canonSet(card.set), number: card.number, count: Math.max(1, Math.min(2, Math.round(card.count))) }))
        .slice(0, 20),
      updatedAt: Date.now(),
    };
    const decks = existing ? get().decks.map((deck) => (deck.id === existing.id ? next : deck)) : [next, ...get().decks];
    set({ decks });
    return next.id;
  },

  deleteDeck: (idOrName) => {
    const key = idOrName.trim().toLowerCase();
    set({
      decks: get().decks.filter((deck) => deck.id !== idOrName && deck.name.toLowerCase() !== key),
    });
  },

  pushMessage: (message) => {
    set({ messages: [...get().messages, message].slice(-40) });
  },
}));

let persistenceBound = false;

export function bindAlbumPersistence() {
  if (persistenceBound || typeof window === "undefined") return;
  persistenceBound = true;
  const stored = loadData();
  if (stored) useAlbum.setState(stored);
  useAlbum.subscribe((state) => {
    saveData({ holdings: state.holdings, decks: state.decks, messages: state.messages });
  });
}

export function threadId(): string {
  const key = "folio-thread";
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = uid();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}
