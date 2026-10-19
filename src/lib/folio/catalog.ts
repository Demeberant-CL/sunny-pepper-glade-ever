import { RAW_CARDS, SEED, SETS } from "@/data/catalog";
import type { CardRow, Holding } from "@/lib/folio/types";
import { fold } from "@/lib/folio/game";

export { SEED, SETS };

export const CARDS: CardRow[] = RAW_CARDS.map((row) => ({
  set: row[0],
  number: row[1],
  name: row[2],
  rarity: row[3],
  entityId: row[4],
  trainer: row[5] === 1,
  element: row[6],
}));

const BY_KEY = new Map(CARDS.map((card) => [`${card.set}#${card.number}`, card]));
const SET_INDEX = new Map(SETS.map((set, index) => [set.code, index]));

const IMAGE_SET: Record<string, string> = {
  "PROMO-A": "P-A",
  "PROMO-B": "P-B",
};

const ALIASES: Record<string, string> = {
  "p-a": "PROMO-A",
  pa: "PROMO-A",
  "promo a": "PROMO-A",
  "promo-a": "PROMO-A",
  "p-b": "PROMO-B",
  pb: "PROMO-B",
  "promo b": "PROMO-B",
  "promo-b": "PROMO-B",
};

export function canonSet(input: string): string {
  const compact = fold(input).replace(/[\s_]+/g, "");
  const spaced = fold(input).replace(/\s+/g, " ");
  if (ALIASES[spaced]) return ALIASES[spaced];
  if (ALIASES[compact]) return ALIASES[compact];
  const hit = SETS.find((set) => set.code.toLowerCase() === compact);
  return hit?.code ?? input.trim();
}

export function findCard(set: string, number: number): CardRow | null {
  return BY_KEY.get(`${canonSet(set)}#${number}`) ?? null;
}

export function cardKey(set: string, number: number): string {
  return `${set}#${number}`;
}

export function cardImageUrl(set: string, number: number): string {
  const code = IMAGE_SET[set] ?? set;
  const num = String(number).padStart(3, "0");
  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/pocket/${code}/${code}_${num}_EN.webp`;
}

export function setInfo(code: string) {
  return SETS.find((set) => set.code === code) ?? null;
}

export function compareCards(a: { set: string; number: number }, b: { set: string; number: number }): number {
  const ia = SET_INDEX.get(a.set) ?? 999;
  const ib = SET_INDEX.get(b.set) ?? 999;
  if (ia !== ib) return ia - ib;
  return a.number - b.number;
}

export function displayCard(holding: Holding): CardRow {
  return (
    findCard(holding.set, holding.number) ?? {
      set: holding.set,
      number: holding.number,
      name: holding.name?.trim() || `${holding.set} ${holding.number}`,
      rarity: holding.rarity ?? "",
      entityId: 0,
      trainer: false,
      element: "",
    }
  );
}

export function searchCards(query: string, options?: { set?: string | null; limit?: number }): CardRow[] {
  const limit = Math.min(80, Math.max(1, options?.limit ?? 40));
  const setFilter = options?.set ? canonSet(options.set) : null;
  const raw = query.trim();
  const q = fold(raw);
  if (!q) return [];

  const idMatch = q.match(/^([a-z]+-?[a-z0-9]+)\s*[#-]\s*(\d{1,4})$/) ?? q.match(/^([a-z]\d[a-z]?|promo-[ab])\s+(\d{1,4})$/);
  const hits: { card: CardRow; score: number }[] = [];

  for (const card of CARDS) {
    if (setFilter && card.set !== setFilter) continue;
    let score = 0;
    const name = fold(card.name);
    if (idMatch) {
      const wantedSet = canonSet(idMatch[1]);
      const wantedNumber = Number(idMatch[2]);
      if (card.set === wantedSet && card.number === wantedNumber) score = 200;
    }
    if (name === q) score = Math.max(score, 100);
    else if (name.startsWith(q)) score = Math.max(score, 80);
    else if (name.includes(q)) score = Math.max(score, 50);
    else if (q.length >= 2 && `${card.set} ${card.number}`.toLowerCase().includes(q)) score = Math.max(score, 40);
    if (score > 0) hits.push({ card, score });
  }

  hits.sort((a, b) => b.score - a.score || compareCards(a.card, b.card));
  return hits.slice(0, limit).map((hit) => hit.card);
}

export function seedHoldings(): Holding[] {
  return SEED.map((row) => ({ set: row.set, number: row.number, qty: row.qty }));
}
