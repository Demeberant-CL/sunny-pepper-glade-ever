export const ENERGIES = [
  { id: 1, key: "grass", es: "Planta" },
  { id: 2, key: "fire", es: "Fuego" },
  { id: 3, key: "water", es: "Agua" },
  { id: 4, key: "lightning", es: "Rayo" },
  { id: 5, key: "psychic", es: "Psíquica" },
  { id: 6, key: "fighting", es: "Lucha" },
  { id: 7, key: "darkness", es: "Oscura" },
  { id: 8, key: "metal", es: "Metálica" },
] as const;

export type EnergyId = (typeof ENERGIES)[number]["id"];

const ENERGY_ALIASES: Record<string, EnergyId> = {
  grass: 1,
  planta: 1,
  hoja: 1,
  fire: 2,
  fuego: 2,
  water: 3,
  agua: 3,
  lightning: 4,
  electric: 4,
  electrico: 4,
  rayo: 4,
  psychic: 5,
  psiquica: 5,
  psiquico: 5,
  fighting: 6,
  fight: 6,
  lucha: 6,
  darkness: 7,
  dark: 7,
  oscura: 7,
  oscuro: 7,
  metal: 8,
  steel: 8,
  metalica: 8,
  acero: 8,
};

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’‘ʼ]/g, "")
    .toLowerCase()
    .trim();
}

export function energyById(id: number) {
  return ENERGIES.find((energy) => energy.id === id) ?? null;
}

export function parseEnergy(value: unknown): EnergyId | null {
  if (typeof value === "number" && ENERGIES.some((energy) => energy.id === value)) {
    return value as EnergyId;
  }
  if (typeof value !== "string") return null;
  const key = fold(value).replace(/[^a-z]/g, "");
  return ENERGY_ALIASES[key] ?? null;
}

export function energyLabel(ids: number[]): string {
  const names = ids.map((id) => energyById(id)?.es).filter(Boolean);
  return names.join(" · ");
}

export const RARITIES: Record<string, { es: string; group: "diamond" | "star" | "crown"; count: number }> = {
  C: { es: "Común", group: "diamond", count: 1 },
  U: { es: "Poco común", group: "diamond", count: 2 },
  R: { es: "Rara", group: "diamond", count: 3 },
  RR: { es: "Doble rara", group: "diamond", count: 4 },
  AR: { es: "Arte rara", group: "star", count: 1 },
  SR: { es: "Súper rara", group: "star", count: 2 },
  SAR: { es: "Arte especial", group: "star", count: 2 },
  IM: { es: "Inmersiva", group: "star", count: 3 },
  UR: { es: "Corona", group: "crown", count: 1 },
  S: { es: "Shiny", group: "star", count: 1 },
  SSR: { es: "Shiny súper rara", group: "star", count: 2 },
};

const MARKS: Record<string, string> = {
  C: "♦",
  U: "♦♦",
  R: "♦♦♦",
  RR: "♦♦♦♦",
  AR: "★",
  SR: "★★",
  SAR: "★★",
  IM: "★★★",
  UR: "♛",
  S: "★",
  SSR: "★★",
};

export function rarityMark(code: string): string {
  return MARKS[code] ?? code;
}

export function padNumber(number: number): string {
  return String(number).padStart(3, "0");
}
