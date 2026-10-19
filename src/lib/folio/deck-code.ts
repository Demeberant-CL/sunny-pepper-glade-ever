const TRAINER_OFFSET = 10_000_000;
const MAX_U24 = 0xffffff;

export type EncodedCard = {
  entityId: number;
  trainer: boolean;
  count: number;
};

function pushU24(bytes: number[], value: number) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_U24) {
    throw new Error("El código de la carta no entra en el formato del juego.");
  }
  bytes.push((value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function bytesToBase64(bytes: number[]): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Base64 payload scanned by Pokémon TCG Pocket (trainer ids, pokémon ids, energies). */
export function encodeDeckCode(cards: EncodedCard[], energies: number[]): string {
  const trainers: number[] = [];
  const pokemon: number[] = [];
  for (const card of cards) {
    if (!Number.isInteger(card.entityId) || card.entityId <= 0) {
      throw new Error("Hay una carta sin código de juego.");
    }
    if (!Number.isInteger(card.count) || card.count < 1) continue;
    const list = card.trainer ? trainers : pokemon;
    for (let copy = 0; copy < card.count; copy += 1) list.push(card.entityId);
  }
  trainers.sort((a, b) => a - b);
  pokemon.sort((a, b) => a - b);
  if (trainers.length > 255 || pokemon.length > 255) {
    throw new Error("El mazo tiene demasiadas cartas.");
  }
  const bytes: number[] = [trainers.length];
  for (const id of trainers) pushU24(bytes, id + TRAINER_OFFSET);
  bytes.push(pokemon.length);
  for (const id of pokemon) pushU24(bytes, id);
  if (energies.length > 3) throw new Error("Máximo 3 energías.");
  bytes.push(energies.length);
  for (const energy of energies) {
    if (!Number.isInteger(energy) || energy < 1 || energy > 8) {
      throw new Error("Energía inválida.");
    }
    bytes.push(energy);
  }
  return bytesToBase64(bytes);
}
