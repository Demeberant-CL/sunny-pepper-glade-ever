export type CardRow = {
  set: string;
  number: number;
  name: string;
  rarity: string;
  entityId: number;
  trainer: boolean;
  element: string;
};

export type Holding = {
  set: string;
  number: number;
  qty: number;
  name?: string;
  rarity?: string;
};

export type DeckCard = {
  set: string;
  number: number;
  count: number;
};

export type Deck = {
  id: string;
  name: string;
  energies: number[];
  cards: DeckCard[];
  updatedAt: number;
};

export type CollectionChange = {
  set: string;
  number: number;
  name: string;
  from: number;
  to: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  changes?: CollectionChange[];
  deckName?: string;
  deckEvent?: "saved" | "deleted";
};

export type AskInput = {
  threadId: string;
  text: string;
  history: { role: "user" | "assistant"; content: string }[];
  images: string[];
  fileText: string;
  fileName: string;
  holdings: { set: string; number: number; qty: number }[];
  decks: { name: string; energies: number[]; cards: DeckCard[] }[];
};

export type SavedDeckPayload = {
  name: string;
  energies: number[];
  cards: DeckCard[];
  replaced: boolean;
};

export type AskResult =
  | {
      ok: true;
      text: string;
      changes: CollectionChange[];
      deck: SavedDeckPayload | null;
      deletedDeck: string | null;
    }
  | { ok: false; error: string };
