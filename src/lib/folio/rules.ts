import { findCard } from "@/lib/folio/catalog";
import { encodeDeckCode } from "@/lib/folio/deck-code";
import { fold } from "@/lib/folio/game";
import type { DeckCard, Holding } from "@/lib/folio/types";

export type ResolvedDeckCard = DeckCard & {
  name: string;
  entityId: number;
  trainer: boolean;
  rarity: string;
  element: string;
};

export function resolveDeck(cards: DeckCard[]): ResolvedDeckCard[] {
  return cards.map((card) => {
    const known = findCard(card.set, card.number);
    return {
      set: known?.set ?? card.set,
      number: card.number,
      count: card.count,
      name: known?.name ?? `${card.set} ${card.number}`,
      entityId: known?.entityId ?? 0,
      trainer: known?.trainer ?? false,
      rarity: known?.rarity ?? "",
      element: known?.element ?? "",
    };
  });
}

export function deckTotal(cards: { count: number }[]): number {
  return cards.reduce((sum, card) => sum + card.count, 0);
}

export function deckProblems(cards: ResolvedDeckCard[], energies: number[]): string[] {
  const problems: string[] = [];
  const total = deckTotal(cards);
  if (total !== 20) {
    problems.push(total < 20 ? `Faltan ${20 - total} cartas para las 20.` : `Sobran ${total - 20} cartas. El mazo lleva 20.`);
  }
  if (energies.length < 1 || energies.length > 3) {
    problems.push("Elegí entre 1 y 3 energías.");
  }
  const byName = new Map<string, { name: string; count: number }>();
  for (const card of cards) {
    if (card.count < 1) problems.push(`${card.name} tiene una cantidad inválida.`);
    if (!card.entityId) problems.push(`${card.name} todavía no tiene código para el QR.`);
    const key = fold(card.name);
    const bucket = byName.get(key) ?? { name: card.name, count: 0 };
    bucket.count += card.count;
    byName.set(key, bucket);
  }
  for (const bucket of byName.values()) {
    if (bucket.count > 2) problems.push(`${bucket.name}: hay ${bucket.count} y el máximo es 2.`);
  }
  const byEntity = new Map<string, { names: Set<string>; count: number }>();
  for (const card of cards) {
    if (!card.entityId) continue;
    const key = `${card.trainer ? "t" : "p"}:${card.entityId}`;
    const bucket = byEntity.get(key) ?? { names: new Set<string>(), count: 0 };
    bucket.names.add(card.name);
    bucket.count += card.count;
    byEntity.set(key, bucket);
  }
  for (const bucket of byEntity.values()) {
    if (bucket.count > 2 && bucket.names.size > 1) {
      problems.push(`${[...bucket.names].join(" / ")}: juntas suman ${bucket.count} y el máximo es 2.`);
    }
  }
  return problems;
}

export function canEncode(cards: ResolvedDeckCard[], energies: number[]): boolean {
  return deckProblems(cards, energies).length === 0;
}

export function encodeResolved(cards: ResolvedDeckCard[], energies: number[]): string {
  return encodeDeckCode(
    cards.map((card) => ({ entityId: card.entityId, trainer: card.trainer, count: card.count })),
    energies,
  );
}

export function qtyOf(holdings: Holding[], set: string, number: number): number {
  return holdings.find((holding) => holding.set === set && holding.number === number)?.qty ?? 0;
}

export function deckCoverage(cards: DeckCard[], holdings: Holding[]): { have: number; total: number } {
  let have = 0;
  for (const card of cards) have += Math.min(card.count, qtyOf(holdings, card.set, card.number));
  return { have, total: deckTotal(cards) };
}

export function nameCopies(cards: DeckCard[], set: string, number: number): number {
  const card = findCard(set, number);
  const name = fold(card?.name ?? `${set} ${number}`);
  return cards.reduce((sum, entry) => {
    const entryName = fold(findCard(entry.set, entry.number)?.name ?? `${entry.set} ${entry.number}`);
    return entryName === name ? sum + entry.count : sum;
  }, 0);
}

export function entityCopies(cards: DeckCard[], set: string, number: number): number {
  const card = findCard(set, number);
  if (!card?.entityId) return 0;
  return cards.reduce((sum, entry) => {
    const known = findCard(entry.set, entry.number);
    if (known && known.entityId === card.entityId && known.trainer === card.trainer) return sum + entry.count;
    return sum;
  }, 0);
}

export function copyLimitReached(cards: DeckCard[], set: string, number: number): boolean {
  return nameCopies(cards, set, number) >= 2 || entityCopies(cards, set, number) >= 2;
}
