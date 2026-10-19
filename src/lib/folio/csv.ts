import { canonSet, findCard } from "@/lib/folio/catalog";
import { rarityMark } from "@/lib/folio/game";
import type { Holding } from "@/lib/folio/types";

export type CsvRow = {
  set: string;
  number: number;
  qty: number;
  name?: string;
  rarity?: string;
};

function parseTable(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = false;
      } else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(current);
      current = "";
    } else if (char === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else if (char !== "\r") current += char;
  }
  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export function parseCollectionCsv(text: string): CsvRow[] {
  const table = parseTable(text.replace(/^\uFEFF/, ""));
  if (!table.length) return [];
  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = header.includes("set") && (header.includes("id") || header.includes("number") || header.includes("cantidad"));
  const body = hasHeader ? table.slice(1) : table;
  const index = (names: string[], fallback: number) => {
    for (const name of names) {
      const found = header.indexOf(name);
      if (found >= 0) return found;
    }
    return fallback;
  };
  const setIndex = hasHeader ? index(["set"], 1) : 1;
  const idIndex = hasHeader ? index(["id", "number", "numero", "número"], 2) : 2;
  const qtyIndex = hasHeader ? index(["cantidad", "qty", "quantity", "count"], 5) : 5;
  const nameIndex = hasHeader ? index(["nombre", "name"], 3) : 3;
  const rarityIndex = hasHeader ? index(["rareza", "rarity"], 4) : 4;
  const rows: CsvRow[] = [];
  for (const cells of body) {
    const set = canonSet(cells[setIndex] ?? "");
    const number = Number(cells[idIndex]);
    const qty = Number(String(cells[qtyIndex] ?? "").trim() || "0");
    if (!set || !Number.isInteger(number) || number < 1 || !Number.isInteger(qty) || qty < 0) continue;
    const name = (cells[nameIndex] ?? "").trim();
    const rarity = (cells[rarityIndex] ?? "").trim();
    rows.push({
      set,
      number,
      qty: Math.min(99, qty),
      name: name || undefined,
      rarity: rarity || undefined,
    });
  }
  return rows;
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return `"${text}"`;
}

export function holdingsToCsv(holdings: Holding[]): string {
  const lines = ["Seccion,Set,ID,Nombre,Rareza,Cantidad,Registrada"];
  const sorted = [...holdings].sort((a, b) => a.set.localeCompare(b.set) || a.number - b.number);
  for (const holding of sorted) {
    const card = findCard(holding.set, holding.number);
    const name = card?.name ?? holding.name ?? "";
    const rarity = card ? rarityMark(card.rarity) : (holding.rarity ?? "");
    lines.push(
      [csvCell("Cards"), csvCell(holding.set), csvCell(holding.number), csvCell(name), csvCell(rarity), csvCell(holding.qty), csvCell(holding.qty > 0 ? "sí" : "no")].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function downloadText(filename: string, contents: string, type = "text/csv;charset=utf-8"): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
