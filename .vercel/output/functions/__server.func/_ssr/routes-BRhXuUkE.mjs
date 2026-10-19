import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { C as searchCards, S as resolveDeck, T as setInfo, a as canEncode, b as qtyOf, c as compareCards, d as deckProblems, f as deckTotal, g as findCard, h as energyLabel, i as SETS, l as copyLimitReached, m as encodeResolved, n as ENERGIES, o as canonSet, p as displayCard, r as RARITIES, s as cardImageUrl, u as deckCoverage, v as padNumber, w as seedHoldings, x as rarityMark } from "./rules-DT9bglOb.mjs";
import { a as Send, c as Minus, d as Layers, f as ImagePlus, h as ChevronLeft, i as Star, l as MessageSquareText, m as Crown, o as Search, p as Ellipsis, r as Trash2, s as Plus, t as X, u as Library } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as DropdownMenuTrigger, i as DropdownMenuPortal, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BRhXuUkE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RarityMark({ code }) {
	const rarity = RARITIES[code];
	if (!rarity) return null;
	if (rarity.group === "crown") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, {
		className: "size-3.5 text-foil",
		"aria-hidden": "true"
	});
	if (rarity.group === "star") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex gap-0.5",
		"aria-hidden": "true",
		children: Array.from({ length: rarity.count }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-foil text-foil" }, index))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex gap-1",
		"aria-hidden": "true",
		children: Array.from({ length: rarity.count }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-1.5 rotate-45 bg-foil" }, index))
	});
}
function CardFace({ set, number, name, rarity, qty, tracked, eager = false }) {
	const src = cardImageUrl(set, number);
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setFailed(false);
	}, [src]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "card-tile relative block overflow-hidden rounded-lg bg-paper text-paper-ink shadow-hair",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "aspect-card relative block",
			children: [
				failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex h-full flex-col justify-between p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between text-xs text-foil",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: set }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: padNumber(number)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg leading-tight",
							children: name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { code: rarity })
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: "",
					loading: eager ? "eager" : "lazy",
					decoding: "async",
					referrerPolicy: "no-referrer",
					className: "absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-cream/15",
					onError: () => setFailed(true)
				}),
				tracked && qty === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-xs text-cream-dim",
					children: "Falta"
				}) : null,
				qty > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "absolute right-1.5 bottom-1.5 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink tabular-nums",
					children: ["×", qty]
				}) : null
			]
		})
	});
}
function parseTable(text) {
	const rows = [];
	let row = [];
	let current = "";
	let quoted = false;
	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (quoted) {
			if (char === "\"") {
				if (text[i + 1] === "\"") {
					current += "\"";
					i += 1;
				} else quoted = false;
			} else current += char;
		} else if (char === "\"") quoted = true;
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
function parseCollectionCsv(text) {
	const table = parseTable(text.replace(/^\uFEFF/, ""));
	if (!table.length) return [];
	const header = table[0].map((cell) => cell.trim().toLowerCase());
	const hasHeader = header.includes("set") && (header.includes("id") || header.includes("number") || header.includes("cantidad"));
	const body = hasHeader ? table.slice(1) : table;
	const index = (names, fallback) => {
		for (const name of names) {
			const found = header.indexOf(name);
			if (found >= 0) return found;
		}
		return fallback;
	};
	const setIndex = hasHeader ? index(["set"], 1) : 1;
	const idIndex = hasHeader ? index([
		"id",
		"number",
		"numero",
		"número"
	], 2) : 2;
	const qtyIndex = hasHeader ? index([
		"cantidad",
		"qty",
		"quantity",
		"count"
	], 5) : 5;
	const nameIndex = hasHeader ? index(["nombre", "name"], 3) : 3;
	const rarityIndex = hasHeader ? index(["rareza", "rarity"], 4) : 4;
	const rows = [];
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
			name: name || void 0,
			rarity: rarity || void 0
		});
	}
	return rows;
}
function csvCell(value) {
	const text = String(value);
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
	return `"${text}"`;
}
function holdingsToCsv(holdings) {
	const lines = ["Seccion,Set,ID,Nombre,Rareza,Cantidad,Registrada"];
	const sorted = [...holdings].sort((a, b) => a.set.localeCompare(b.set) || a.number - b.number);
	for (const holding of sorted) {
		const card = findCard(holding.set, holding.number);
		const name = card?.name ?? holding.name ?? "";
		const rarity = card ? rarityMark(card.rarity) : holding.rarity ?? "";
		lines.push([
			csvCell("Cards"),
			csvCell(holding.set),
			csvCell(holding.number),
			csvCell(name),
			csvCell(rarity),
			csvCell(holding.qty),
			csvCell(holding.qty > 0 ? "sí" : "no")
		].join(","));
	}
	return `${lines.join("\n")}\n`;
}
function downloadText(filename, contents, type = "text/csv;charset=utf-8") {
	const blob = new Blob([contents], { type });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
var STORAGE_KEY = "folio-album-v1";
function uid() {
	return crypto.randomUUID();
}
function clampQty(qty) {
	if (!Number.isFinite(qty)) return 0;
	return Math.max(0, Math.min(99, Math.round(qty)));
}
function sanitizeHolding(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (typeof row.set !== "string" || !row.set.trim()) return null;
	if (typeof row.number !== "number" || !Number.isInteger(row.number) || row.number < 1) return null;
	return {
		set: canonSet(row.set),
		number: row.number,
		qty: clampQty(typeof row.qty === "number" ? row.qty : 0),
		name: typeof row.name === "string" ? row.name : void 0,
		rarity: typeof row.rarity === "string" ? row.rarity : void 0
	};
}
function sanitizeDeck(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (typeof row.name !== "string" || !row.name.trim()) return null;
	if (!Array.isArray(row.cards)) return null;
	const cards = [];
	for (const card of row.cards) {
		if (!card || typeof card !== "object") continue;
		const item = card;
		if (typeof item.set !== "string" || typeof item.number !== "number" || typeof item.count !== "number") continue;
		const count = Math.max(1, Math.min(2, Math.round(item.count)));
		cards.push({
			set: canonSet(item.set),
			number: item.number,
			count
		});
	}
	const energies = Array.isArray(row.energies) ? row.energies.filter((energy) => typeof energy === "number" && energy >= 1 && energy <= 8).slice(0, 3) : [];
	return {
		id: typeof row.id === "string" && row.id ? row.id : uid(),
		name: row.name.trim().slice(0, 48),
		energies,
		cards: cards.slice(0, 20),
		updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : Date.now()
	};
}
function sanitizeMessage(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (row.role !== "user" && row.role !== "assistant" || typeof row.content !== "string") return null;
	return {
		id: typeof row.id === "string" ? row.id : uid(),
		role: row.role,
		content: row.content.slice(0, 4e3),
		changes: Array.isArray(row.changes) ? row.changes.slice(0, 40) : void 0,
		deckName: typeof row.deckName === "string" ? row.deckName : void 0,
		deckEvent: row.deckEvent === "saved" || row.deckEvent === "deleted" ? row.deckEvent : void 0
	};
}
function loadData() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.holdings)) return null;
		return {
			holdings: parsed.holdings.map(sanitizeHolding).filter((row) => row !== null),
			decks: Array.isArray(parsed.decks) ? parsed.decks.map(sanitizeDeck).filter((row) => row !== null) : [],
			messages: Array.isArray(parsed.messages) ? parsed.messages.map(sanitizeMessage).filter((row) => row !== null).slice(-40) : []
		};
	} catch {
		return null;
	}
}
function saveData(data) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			holdings: data.holdings,
			decks: data.decks,
			messages: data.messages.slice(-40)
		}));
	} catch {}
}
function upsertHolding(holdings, set, number, qty, extra) {
	const code = canonSet(set);
	const nextQty = clampQty(qty);
	const index = holdings.findIndex((holding) => holding.set === code && holding.number === number);
	if (index === -1) {
		if (nextQty === 0 && !extra?.name) return holdings;
		return [...holdings, {
			set: code,
			number,
			qty: nextQty,
			name: extra?.name,
			rarity: extra?.rarity
		}];
	}
	const copy = holdings.slice();
	copy[index] = {
		...copy[index],
		qty: nextQty,
		name: extra?.name ?? copy[index].name,
		rarity: extra?.rarity ?? copy[index].rarity
	};
	return copy;
}
function uniqueDeckName(decks, base) {
	const cleaned = base.trim() || "Mazo nuevo";
	if (!decks.some((deck) => deck.name.toLowerCase() === cleaned.toLowerCase())) return cleaned;
	let n = 2;
	while (decks.some((deck) => deck.name.toLowerCase() === `${cleaned} ${n}`.toLowerCase())) n += 1;
	return `${cleaned} ${n}`;
}
var useAlbum = create((set, get) => ({
	holdings: seedHoldings(),
	decks: [],
	messages: [],
	setQty: (setCode, number, qty, extra) => {
		set({ holdings: upsertHolding(get().holdings, setCode, number, qty, extra) });
	},
	applyChanges: (changes) => {
		let holdings = get().holdings;
		for (const change of changes) holdings = upsertHolding(holdings, change.set, change.number, change.to, { name: change.name });
		set({ holdings });
	},
	importRows: (rows, mode) => {
		let holdings = mode === "replace" ? [] : get().holdings.slice();
		for (const row of rows) {
			const known = findCard(row.set, row.number);
			holdings = upsertHolding(holdings, row.set, row.number, row.qty, {
				name: known?.name ?? row.name,
				rarity: known?.rarity ?? row.rarity
			});
		}
		set({ holdings });
		return rows.length;
	},
	resetAlbum: () => set({ holdings: seedHoldings() }),
	createDeck: (name) => {
		const deck = {
			id: uid(),
			name: uniqueDeckName(get().decks, name || "Mazo nuevo"),
			energies: [],
			cards: [],
			updatedAt: Date.now()
		};
		set({ decks: [deck, ...get().decks] });
		return deck.id;
	},
	renameDeck: (id, name) => {
		const trimmed = name.trim().slice(0, 48);
		if (!trimmed) return;
		set({ decks: get().decks.map((deck) => deck.id === id ? {
			...deck,
			name: trimmed,
			updatedAt: Date.now()
		} : deck) });
	},
	setEnergies: (id, energies) => {
		const unique = [...new Set(energies.filter((energy) => energy >= 1 && energy <= 8))].slice(0, 3);
		set({ decks: get().decks.map((deck) => deck.id === id ? {
			...deck,
			energies: unique,
			updatedAt: Date.now()
		} : deck) });
	},
	toggleEnergy: (id, energy) => {
		const deck = get().decks.find((item) => item.id === id);
		if (!deck) return;
		const energies = deck.energies.includes(energy) ? deck.energies.filter((item) => item !== energy) : deck.energies.length >= 3 ? deck.energies : [...deck.energies, energy];
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
		if (index >= 0) cards[index] = {
			...cards[index],
			count: cards[index].count + 1
		};
		else cards.push({
			set: code,
			number,
			count: 1
		});
		set({ decks: get().decks.map((item) => item.id === id ? {
			...item,
			cards,
			updatedAt: Date.now()
		} : item) });
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
		const cards = deck.cards.map((card) => card.set === code && card.number === number ? {
			...card,
			count: card.count + delta
		} : card).filter((card) => card.count > 0);
		set({ decks: get().decks.map((item) => item.id === id ? {
			...item,
			cards,
			updatedAt: Date.now()
		} : item) });
	},
	removeFromDeck: (id, setCode, number) => {
		const code = canonSet(setCode);
		set({ decks: get().decks.map((deck) => deck.id === id ? {
			...deck,
			cards: deck.cards.filter((card) => !(card.set === code && card.number === number)),
			updatedAt: Date.now()
		} : deck) });
	},
	upsertDeck: ({ name, energies, cards }) => {
		const trimmed = name.trim().slice(0, 48) || "Mazo de Grok";
		const existing = get().decks.find((deck) => deck.name.toLowerCase() === trimmed.toLowerCase());
		const next = {
			id: existing?.id ?? uid(),
			name: trimmed,
			energies: [...new Set(energies.filter((energy) => energy >= 1 && energy <= 8))].slice(0, 3),
			cards: cards.map((card) => ({
				set: canonSet(card.set),
				number: card.number,
				count: Math.max(1, Math.min(2, Math.round(card.count)))
			})).slice(0, 20),
			updatedAt: Date.now()
		};
		set({ decks: existing ? get().decks.map((deck) => deck.id === existing.id ? next : deck) : [next, ...get().decks] });
		return next.id;
	},
	deleteDeck: (idOrName) => {
		const key = idOrName.trim().toLowerCase();
		set({ decks: get().decks.filter((deck) => deck.id !== idOrName && deck.name.toLowerCase() !== key) });
	},
	pushMessage: (message) => {
		set({ messages: [...get().messages, message].slice(-40) });
	}
}));
var persistenceBound = false;
function bindAlbumPersistence() {
	if (persistenceBound || typeof window === "undefined") return;
	persistenceBound = true;
	const stored = loadData();
	if (stored) useAlbum.setState(stored);
	useAlbum.subscribe((state) => {
		saveData({
			holdings: state.holdings,
			decks: state.decks,
			messages: state.messages
		});
	});
}
function threadId() {
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
function Album({ onCreateDeckWith }) {
	const holdings = useAlbum((state) => state.holdings);
	const decks = useAlbum((state) => state.decks);
	const setQty = useAlbum((state) => state.setQty);
	const addToDeck = useAlbum((state) => state.addToDeck);
	const importRows = useAlbum((state) => state.importRows);
	const resetAlbum = useAlbum((state) => state.resetAlbum);
	const [query, setQuery] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("owned");
	const [setCode, setSetCode] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [pendingImport, setPendingImport] = (0, import_react.useState)(null);
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	const [deckPick, setDeckPick] = (0, import_react.useState)("");
	const [deckNote, setDeckNote] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const stats = (0, import_react.useMemo)(() => {
		const owned = holdings.filter((holding) => holding.qty > 0);
		const copies = owned.reduce((sum, holding) => sum + holding.qty, 0);
		const ex = owned.filter((holding) => {
			const card = displayCard(holding);
			return card.rarity === "RR" || /\sex$/i.test(card.name);
		}).length;
		return {
			unique: owned.length,
			copies,
			missing: holdings.filter((holding) => holding.qty === 0).length,
			ex
		};
	}, [holdings]);
	const setOptions = (0, import_react.useMemo)(() => SETS.filter((set) => holdings.some((holding) => holding.set === set.code)), [holdings]);
	const groups = (0, import_react.useMemo)(() => {
		const trimmed = query.trim();
		if (trimmed) return [{
			code: "",
			title: "Resultados",
			cards: searchCards(trimmed, {
				set: setCode,
				limit: 60
			}).map((card) => ({
				card,
				qty: holdings.find((holding) => holding.set === card.set && holding.number === card.number)?.qty ?? 0,
				tracked: holdings.some((holding) => holding.set === card.set && holding.number === card.number)
			}))
		}];
		const visible = holdings.filter((holding) => setCode ? holding.set === setCode : true).filter((holding) => mode === "owned" ? holding.qty > 0 : mode === "missing" ? holding.qty === 0 : true).sort(compareCards);
		const buckets = /* @__PURE__ */ new Map();
		for (const holding of visible) {
			const list = buckets.get(holding.set) ?? [];
			list.push({
				card: displayCard(holding),
				qty: holding.qty,
				tracked: true
			});
			buckets.set(holding.set, list);
		}
		return [...buckets.entries()].map(([code, cards]) => ({
			code,
			title: setInfo(code)?.es ?? code,
			cards
		}));
	}, [
		holdings,
		mode,
		query,
		setCode
	]);
	const selectedQty = selected ? holdings.find((holding) => holding.set === selected.set && holding.number === selected.number)?.qty ?? 0 : 0;
	const selectedTracked = selected ? holdings.some((holding) => holding.set === selected.set && holding.number === selected.number) : false;
	function changeQty(card, qty) {
		setQty(card.set, card.number, qty, {
			name: card.name,
			rarity: card.rarity
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-end justify-between gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-mute",
							children: "Álbum"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-4xl text-cream",
							children: "Tu colección"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-cream-dim tabular-nums",
							children: [
								stats.unique,
								" únicas · ",
								stats.copies,
								" copias · ",
								stats.ex,
								" ex",
								stats.missing ? ` · ${stats.missing} rastreadas que faltan` : ""
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
						className: "btn btn-ghost px-3",
						"aria-label": "Más acciones del álbum",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
						className: "z-40 min-w-52 rounded-2xl bg-ink-2 p-1 shadow-hair",
						align: "end",
						sideOffset: 8,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "rounded-xl px-3 py-3 text-sm outline-none data-[highlighted]:bg-panel",
								onSelect: () => fileRef.current?.click(),
								children: "Importar CSV"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "rounded-xl px-3 py-3 text-sm outline-none data-[highlighted]:bg-panel",
								onSelect: () => downloadText("folio-coleccion.csv", holdingsToCsv(holdings)),
								children: "Exportar CSV"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "rounded-xl px-3 py-3 text-sm text-gold outline-none data-[highlighted]:bg-panel",
								onSelect: () => setConfirmReset(true),
								children: "Volver al archivo original"
							})
						]
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: ".csv,text/csv,text/plain",
						className: "sr-only",
						onChange: async (event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (!file) return;
							const rows = parseCollectionCsv(await file.text());
							if (!rows.length) {
								setNotice("Ese archivo no tiene filas de cartas.");
								return;
							}
							setPendingImport({
								name: file.name,
								rows
							});
						}
					})
				]
			}),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-2xl bg-panel px-4 py-3 text-sm text-cream-dim",
				children: [notice, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ml-3 text-gold",
					onClick: () => setNotice(null),
					children: "Cerrar"
				})]
			}) : null,
			pendingImport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 rounded-2xl bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: [
						pendingImport.rows.length,
						" filas en ",
						pendingImport.name,
						"."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-gold",
							onClick: () => {
								const count = importRows(pendingImport.rows, "merge");
								setPendingImport(null);
								setNotice(`Combiné ${count} filas con el álbum.`);
							},
							children: "Combinar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => {
								const count = importRows(pendingImport.rows, "replace");
								setPendingImport(null);
								setNotice(`Reemplacé el álbum con ${count} filas.`);
							},
							children: "Reemplazar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet",
							onClick: () => setPendingImport(null),
							children: "Cancelar"
						})
					]
				})]
			}) : null,
			confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 rounded-2xl bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-cream-dim",
					children: "Vuelve a las cantidades del archivo original. Los mazos y el chat quedan."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-gold",
						onClick: () => {
							resetAlbum();
							setConfirmReset(false);
							setNotice("Álbum restaurado.");
						},
						children: "Restaurar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-quiet",
						onClick: () => setConfirmReset(false),
						children: "Cancelar"
					})]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mute",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field pr-12 pl-11",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Buscar en el catálogo, por ejemplo Pikachu o A1 25",
						"aria-label": "Buscar cartas"
					}),
					query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-mute",
						onClick: () => setQuery(""),
						"aria-label": "Limpiar búsqueda",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					["owned", "Tengo"],
					["missing", "Me faltan"],
					["all", "Rastreadas"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `btn ${mode === id && !query ? "btn-gold" : "btn-ghost"}`,
					onClick: () => setMode(id),
					children: label
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `btn shrink-0 ${setCode === null ? "btn-gold" : "btn-ghost"}`,
					onClick: () => setSetCode(null),
					children: "Todos"
				}), setOptions.map((set) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `btn shrink-0 ${setCode === set.code ? "btn-gold" : "btn-ghost"}`,
					onClick: () => setSetCode(set.code),
					children: set.code
				}, set.code))]
			}),
			groups.every((group) => group.cards.length === 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptySearch, {
				query,
				onAdd: (holding) => changeQty(displayCard(holding), holding.qty)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-8",
				children: groups.map((group) => group.cards.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-display text-2xl",
						children: [group.title, group.code ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-sm text-mute",
							children: group.code
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
						children: group.cards.map(({ card, qty, tracked }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-lg text-left",
							"aria-label": `${card.name}, ${card.set} ${padNumber(card.number)}, ${qty > 0 ? `${qty} copias` : tracked ? "falta" : "sin registrar"}`,
							onClick: () => {
								setSelected(card);
								setDeckPick(decks[0]?.id ?? "");
								setDeckNote(null);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
								set: card.set,
								number: card.number,
								name: card.name,
								rarity: card.rarity,
								qty,
								tracked
							})
						}, `${card.set}#${card.number}`))
					})]
				}, group.code || "search") : null)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: selected !== null,
				onOpenChange: (open) => !open && setSelected(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-ink/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-ink-2 p-4 shadow-hair md:p-6",
					children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-5 md:grid-cols-[12rem_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							set: selected.set,
							number: selected.number,
							name: selected.name,
							rarity: selected.rarity,
							qty: selectedQty,
							tracked: selectedTracked,
							eager: true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
										className: "font-display text-3xl",
										children: selected.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
										className: "mt-1 text-sm text-cream-dim",
										children: [
											setInfo(selected.set)?.es ?? selected.set,
											" · ",
											selected.set,
											" ",
											padNumber(selected.number)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 flex items-center gap-2 text-sm text-cream-dim",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RarityMark, { code: selected.rarity }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: RARITIES[selected.rarity]?.es ?? "Sin rareza de catálogo" })]
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn btn-ghost size-11 px-0",
											"aria-label": "Una copia menos",
											onClick: () => changeQty(selected, selectedQty - 1),
											disabled: selectedQty <= 0,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "min-w-16 text-center font-display text-3xl tabular-nums",
											children: selectedQty
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn btn-gold size-11 px-0",
											"aria-label": "Una copia más",
											onClick: () => changeQty(selected, selectedQty + 1),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [
										decks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "flex flex-col gap-2 text-sm text-mute",
											children: ["Sumar a un mazo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												className: "field",
												value: deckPick,
												onChange: (event) => setDeckPick(event.target.value),
												children: decks.map((deck) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: deck.id,
													children: deck.name
												}, deck.id))
											})]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2",
											children: [decks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "btn btn-ghost",
												onClick: () => {
													const reason = addToDeck(deckPick, selected.set, selected.number);
													setDeckNote(reason ?? "Sumada al mazo.");
												},
												children: "Sumar"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "btn btn-ghost",
												onClick: () => onCreateDeckWith(selected.set, selected.number),
												children: "Crear mazo con esta carta"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
												className: "btn btn-quiet",
												children: "Cerrar"
											})]
										}),
										deckNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-cream-dim",
											children: deckNote
										}) : null
									]
								})
							]
						})]
					}) : null
				})] })
			})
		]
	});
}
function EmptySearch({ query, onAdd }) {
	const [setCode, setSetCode] = (0, import_react.useState)("A1");
	const [number, setNumber] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl bg-panel px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-2xl",
				children: query ? "No hay coincidencias" : "Nada en este filtro"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-lg text-sm text-cream-dim",
				children: query ? "Probá el nombre en inglés, como figura en el juego, o el código del set y el número." : "Este recorte del álbum está vacío. Cambiá el filtro o sumá una carta a mano."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-5 grid gap-2 sm:grid-cols-[8rem_6rem_1fr_auto]",
				onSubmit: (event) => {
					event.preventDefault();
					const parsed = Number(number);
					if (!setCode.trim() || !Number.isInteger(parsed) || parsed < 1) return;
					onAdd({
						set: setCode.trim(),
						number: parsed,
						qty: 1,
						name: name.trim() || void 0
					});
					setNumber("");
					setName("");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						"aria-label": "Set",
						value: setCode,
						onChange: (event) => setSetCode(event.target.value),
						placeholder: "A1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						"aria-label": "Número",
						inputMode: "numeric",
						value: number,
						onChange: (event) => setNumber(event.target.value),
						placeholder: "25"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						"aria-label": "Nombre",
						value: name,
						onChange: (event) => setName(event.target.value),
						placeholder: "Nombre si no está en el catálogo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn btn-gold",
						children: "Agregar"
					})
				]
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var askGrok = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("a96c6497cea2cdb49d52d9e1537c3c8fc1aec6dbca47e007211cb86bf0dff857"));
var SUGGESTIONS = [
	"Armame un mazo de 20 con las cartas que tengo y dejalo listo para el QR",
	"¿Qué ex tengo y cuáles me faltan de las que ya registré?",
	"De Genes Formidables, ¿qué línea de fuego puedo armar con lo que tengo?"
];
function Chat({ onOpenDeck }) {
	const messages = useAlbum((state) => state.messages);
	const holdings = useAlbum((state) => state.holdings);
	const decks = useAlbum((state) => state.decks);
	const pushMessage = useAlbum((state) => state.pushMessage);
	const applyChanges = useAlbum((state) => state.applyChanges);
	const upsertDeck = useAlbum((state) => state.upsertDeck);
	const deleteDeck = useAlbum((state) => state.deleteDeck);
	const importRows = useAlbum((state) => state.importRows);
	const [text, setText] = (0, import_react.useState)("");
	const [images, setImages] = (0, import_react.useState)([]);
	const [file, setFile] = (0, import_react.useState)(null);
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const endRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [messages.length, sending]);
	async function onFiles(list) {
		if (!list?.length) return;
		const nextImages = [...images];
		let nextFile = file;
		for (const item of list) if (item.type.startsWith("image/")) {
			if (nextImages.length >= 2) continue;
			const url = await compressImage(item);
			nextImages.push({
				name: item.name,
				url
			});
		} else {
			const raw = await item.text();
			nextFile = {
				name: item.name,
				text: raw.slice(0, 2e4)
			};
		}
		setImages(nextImages);
		setFile(nextFile);
	}
	async function send(body) {
		const value = (body ?? text).trim();
		if (sending) return;
		if (!value && !images.length && !file) return;
		setError(null);
		if (file && !value && !images.length && looksLikeCollection(file.text)) {
			const rows = parseCollectionCsv(file.text);
			const count = importRows(rows, "merge");
			pushMessage({
				id: crypto.randomUUID(),
				role: "user",
				content: `Adjunté ${file.name}`
			});
			pushMessage({
				id: crypto.randomUUID(),
				role: "assistant",
				content: `Combiné ${count} filas de ${file.name} con el álbum. Si querés un mazo con eso, decime el estilo.`
			});
			setFile(null);
			setText("");
			return;
		}
		const userContent = [
			value,
			file ? `Archivo: ${file.name}` : "",
			images.length ? `${images.length} imagen${images.length === 1 ? "" : "es"}` : ""
		].filter(Boolean).join("\n");
		pushMessage({
			id: crypto.randomUUID(),
			role: "user",
			content: userContent
		});
		setText("");
		const sentImages = images.map((image) => image.url);
		const sentFile = file;
		setImages([]);
		setFile(null);
		setSending(true);
		try {
			const history = useAlbum.getState().messages.slice(0, -1).slice(-8).map((message) => ({
				role: message.role,
				content: message.content
			}));
			const result = await askGrok({ data: {
				threadId: threadId(),
				text: value,
				history,
				images: sentImages,
				fileText: sentFile?.text ?? "",
				fileName: sentFile?.name ?? "",
				holdings: holdings.map((holding) => ({
					set: holding.set,
					number: holding.number,
					qty: holding.qty
				})),
				decks: decks.map((deck) => ({
					name: deck.name,
					energies: deck.energies,
					cards: deck.cards
				}))
			} });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			if (result.changes.length) applyChanges(result.changes);
			if (result.deck) upsertDeck(result.deck);
			if (result.deletedDeck) deleteDeck(result.deletedDeck);
			pushMessage({
				id: crypto.randomUUID(),
				role: "assistant",
				content: result.text,
				changes: result.changes,
				deckName: result.deck?.name ?? result.deletedDeck ?? void 0,
				deckEvent: result.deck ? "saved" : result.deletedDeck ? "deleted" : void 0
			});
		} catch {
			setError("No pude hablar con Grok. Probá de nuevo.");
		} finally {
			setSending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-4 py-5 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mute",
						children: "Grok"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-4xl",
						children: "Hablale al álbum"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-cream-dim",
						children: "Lee tu colección, actualiza cantidades con texto o fotos, arma mazos y los deja listos para el QR."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4",
				children: [
					messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-2",
						children: SUGGESTIONS.map((suggestion) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-2xl bg-panel px-4 py-3 text-left text-sm",
							onClick: () => void send(suggestion),
							children: suggestion
						}, suggestion))
					}) : messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: message.role === "user" ? "ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-paper px-4 py-3 text-paper-ink" : "max-w-[40rem]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm whitespace-pre-wrap",
								children: renderInline(message.content)
							}),
							message.changes?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 flex flex-col gap-1 text-sm text-cream-dim",
								children: [message.changes.slice(0, 12).map((change) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									change.name,
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular-nums",
										children: [
											change.from,
											" → ",
											change.to
										]
									})
								] }, `${change.set}-${change.number}`)), message.changes.length > 12 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"y ",
									message.changes.length - 12,
									" más"
								] }) : null]
							}) : null,
							message.deckName && message.deckEvent === "saved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "btn btn-gold mt-3",
								onClick: () => onOpenDeck(message.deckName),
								children: ["Abrir ", message.deckName]
							}) : null
						]
					}, message.id)),
					sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gold",
						children: "Grok está leyendo el álbum…"
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-cream-dim",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "sticky bottom-0 flex flex-col gap-2 bg-ink pt-2",
				onSubmit: (event) => {
					event.preventDefault();
					send();
				},
				children: [
					images.length || file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [images.map((image) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "overflow-hidden rounded-xl",
							onClick: () => setImages((current) => current.filter((item) => item.url !== image.url)),
							"aria-label": `Quitar ${image.name}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: image.url,
								alt: "",
								className: "h-16 w-12 object-cover"
							})
						}, image.url)), file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "rounded-full bg-panel px-3 py-2 text-sm",
							onClick: () => setFile(null),
							children: [file.name, " · quitar"]
						}) : null]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost size-11 shrink-0 px-0",
								"aria-label": "Adjuntar imagen o archivo",
								onClick: () => fileRef.current?.click(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								className: "sr-only",
								type: "file",
								accept: "image/*,.csv,.txt,.json,text/plain",
								multiple: true,
								onChange: (event) => {
									onFiles(event.target.files);
									event.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "field max-h-32 min-h-11 resize-none rounded-3xl py-3",
								rows: 1,
								value: text,
								placeholder: "Contale qué abriste, o pedile un mazo",
								"aria-label": "Mensaje para Grok",
								onChange: (event) => setText(event.target.value),
								onKeyDown: (event) => {
									if (event.key === "Enter" && !event.shiftKey) {
										event.preventDefault();
										send();
									}
								},
								onPaste: (event) => {
									const files = [...event.clipboardData.files];
									if (!files.length) return;
									event.preventDefault();
									const list = new DataTransfer();
									for (const item of files) list.items.add(item);
									onFiles(list.files);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn btn-gold size-11 shrink-0 px-0",
								disabled: sending,
								"aria-label": "Enviar",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-mute",
						children: "La colección queda en este navegador. Cada mensaje le muestra el álbum a Grok."
					})
				]
			})
		]
	});
}
function looksLikeCollection(text) {
	const head = text.slice(0, 300).toLowerCase();
	return head.includes("set") && (head.includes("cantidad") || head.includes("id"));
}
function renderInline(text) {
	return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: part.slice(2, -2) }, index) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, index));
}
async function compressImage(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const context = canvas.getContext("2d");
	if (!context) throw new Error("No pude leer la imagen.");
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .72));
	if (!blob) throw new Error("No pude preparar la imagen.");
	const dataUrl = await blobToDataUrl(blob);
	if (dataUrl.length > 11e5) throw new Error("La imagen es demasiado pesada.");
	return dataUrl;
}
function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(/* @__PURE__ */ new Error("No pude leer la imagen."));
		reader.readAsDataURL(blob);
	});
}
var INK = "#14120e";
var QUIET = "#fffdf8";
async function deckCodeToQr(code) {
	const loaded = await import("../_libs/qrcode.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const toDataURL = loaded.toDataURL ?? loaded.default?.toDataURL;
	if (!toDataURL) throw new Error("No pude preparar el código QR.");
	const options = {
		errorCorrectionLevel: "H",
		margin: 4,
		width: 640,
		color: {
			dark: INK,
			light: QUIET
		}
	};
	try {
		return await toDataURL(code, {
			...options,
			version: 9
		});
	} catch {
		return toDataURL(code, options);
	}
}
function Decks({ selectedId, onSelect }) {
	const decks = useAlbum((state) => state.decks);
	const createDeck = useAlbum((state) => state.createDeck);
	const selected = decks.find((deck) => deck.id === selectedId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "deck-split h-full min-h-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: `${selected ? "hidden md:flex" : "flex"} min-h-0 flex-col gap-3 overflow-y-auto px-4 py-5 md:px-5 md:py-8`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl",
					children: "Mazos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-gold",
					onClick: () => onSelect(createDeck()),
					children: "Nuevo"
				})]
			}), decks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-cream-dim",
				children: "Todavía no hay mazos. Creá uno acá o pedile a Grok que arme uno con lo que tenés."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: decks.map((deck) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckRow, {
					id: deck.id,
					active: deck.id === selectedId,
					onSelect
				}) }, deck.id))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: `${selected ? "block" : "hidden md:block"} min-h-0 overflow-y-auto px-4 py-5 md:px-8 md:py-8`,
			children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckEditor, {
				deckId: selected.id,
				onBack: () => onSelect(null)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hidden text-sm text-mute md:block",
				children: "Elegí un mazo o creá uno nuevo."
			})
		})]
	});
}
function DeckRow({ id, active, onSelect }) {
	const deck = useAlbum((state) => state.decks.find((item) => item.id === id));
	const holdings = useAlbum((state) => state.holdings);
	if (!deck) return null;
	const coverage = deckCoverage(deck.cards, holdings);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onSelect(id),
		className: `w-full rounded-2xl px-3 py-3 text-left ${active ? "bg-gold text-ink" : "bg-panel text-cream"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block font-medium",
			children: deck.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `mt-1 block text-sm tabular-nums ${active ? "text-ink/70" : "text-mute"}`,
			children: [
				deckTotal(deck.cards),
				"/20 · tenés ",
				coverage.have,
				"/",
				coverage.total || 0,
				energyLabel(deck.energies) ? ` · ${energyLabel(deck.energies)}` : ""
			]
		})]
	});
}
function DeckEditor({ deckId, onBack }) {
	const deck = useAlbum((state) => state.decks.find((item) => item.id === deckId));
	const holdings = useAlbum((state) => state.holdings);
	const renameDeck = useAlbum((state) => state.renameDeck);
	const toggleEnergy = useAlbum((state) => state.toggleEnergy);
	const addToDeck = useAlbum((state) => state.addToDeck);
	const changeDeckCount = useAlbum((state) => state.changeDeckCount);
	const removeFromDeck = useAlbum((state) => state.removeFromDeck);
	const deleteDeck = useAlbum((state) => state.deleteDeck);
	const [name, setName] = (0, import_react.useState)(deck?.name ?? "");
	const [query, setQuery] = (0, import_react.useState)("");
	const [onlyOwned, setOnlyOwned] = (0, import_react.useState)(true);
	const [qrOpen, setQrOpen] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setName(deck?.name ?? "");
	}, [deck?.id, deck?.name]);
	if (!deck) return null;
	const resolved = resolveDeck(deck.cards);
	const problems = deckProblems(resolved, deck.energies);
	const ready = canEncode(resolved, deck.energies);
	const hits = query.trim() ? searchCards(query, { limit: 12 }).filter((card) => onlyOwned ? qtyOf(holdings, card.set, card.number) > 0 : true) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-3xl flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "btn btn-quiet -ml-3 w-fit md:hidden",
				onClick: onBack,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Mazos"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "Nombre del mazo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field font-display text-2xl",
						value: name,
						"aria-label": "Nombre del mazo",
						onChange: (event) => setName(event.target.value),
						onBlur: () => renameDeck(deck.id, name)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "btn btn-quiet",
					onClick: () => {
						deleteDeck(deck.id);
						onBack();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Borrar"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-2 text-sm text-mute",
				children: [
					"Energías · ",
					deck.energies.length,
					"/3"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: ENERGIES.map((energy) => {
					const on = deck.energies.includes(energy.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `btn ${on ? "btn-gold" : "btn-ghost"}`,
						onClick: () => toggleEnergy(deck.id, energy.id),
						children: energy.es
					}, energy.id);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-3xl tabular-nums",
					children: [deckTotal(deck.cards), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg text-mute",
						children: "/20"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-gold",
					disabled: !ready,
					onClick: () => setQrOpen(true),
					children: "Código QR"
				})]
			}),
			problems.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-1 text-sm text-cream-dim",
				children: problems.map((problem) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: problem }, problem))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-cream-dim",
				children: "Listo para escanear en el juego."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: resolved.map((card) => {
					const owned = qtyOf(holdings, card.set, card.number);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-2xl bg-panel p-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-14 shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									set: card.set,
									number: card.number,
									name: card.name,
									rarity: card.rarity,
									qty: 0,
									tracked: false
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-medium",
									children: card.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-sm text-mute tabular-nums",
									children: [
										card.set,
										" ",
										padNumber(card.number),
										" · tenés ",
										owned
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost size-11 px-0",
								"aria-label": `Quitar una ${card.name}`,
								onClick: () => changeDeckCount(deck.id, card.set, card.number, -1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-4 text-center tabular-nums",
								children: card.count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost size-11 px-0",
								"aria-label": `Sumar una ${card.name}`,
								disabled: card.count >= 2 || copyLimitReached(deck.cards, card.set, card.number) || deckTotal(deck.cards) >= 20,
								onClick: () => changeDeckCount(deck.id, card.set, card.number, 1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-quiet size-11 px-0",
								"aria-label": `Sacar ${card.name}`,
								onClick: () => removeFromDeck(deck.id, card.set, card.number),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})
						]
					}, `${card.set}#${card.number}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-xl",
							children: "Sumar carta"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `btn ${onlyOwned ? "btn-gold" : "btn-ghost"}`,
							onClick: () => setOnlyOwned((value) => !value),
							children: "Solo las que tengo"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Nombre o A4 149",
						"aria-label": "Buscar carta para el mazo"
					}),
					note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-cream-dim",
						children: note
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: hits.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full items-center gap-3 rounded-2xl bg-ink-2 px-3 py-2 text-left",
							onClick: () => {
								const reason = addToDeck(deck.id, card.set, card.number);
								setNote(reason ?? "Sumada al mazo.");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-12 shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									set: card.set,
									number: card.number,
									name: card.name,
									rarity: card.rarity,
									qty: qtyOf(holdings, card.set, card.number),
									tracked: holdings.some((holding) => holding.set === card.set && holding.number === card.number)
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate",
									children: card.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-sm text-mute",
									children: [
										card.set,
										" ",
										padNumber(card.number),
										" · tenés ",
										qtyOf(holdings, card.set, card.number)
									]
								})]
							})]
						}) }, `${card.set}#${card.number}`))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrDialog, {
				open: qrOpen,
				onOpenChange: setQrOpen,
				name: deck.name,
				code: ready ? encodeResolved(resolved, deck.energies) : null
			})
		]
	});
}
function QrDialog({ open, onOpenChange, name, code }) {
	const [src, setSrc] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open || !code) return;
		let cancel = false;
		setSrc(null);
		setError(null);
		deckCodeToQr(code).then((url) => {
			if (!cancel) setSrc(url);
		}).catch(() => {
			if (!cancel) setError("No pude armar el QR.");
		});
		return () => {
			cancel = true;
		};
	}, [open, code]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-ink/75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-paper p-5 text-paper-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display text-3xl",
					children: name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-1 text-sm text-foil",
					children: "En el juego: Mazos, Crear, Escanear código. Si estás en este mismo teléfono, descargá la imagen y abrila en otra pantalla."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 overflow-hidden rounded-2xl bg-paper",
					children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src,
						alt: `Código QR del mazo ${name}`,
						className: "mx-auto w-full max-w-80"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-16 text-center text-sm",
						children: error ?? "Preparando el código…"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "btn btn-gold",
						href: src,
						download: `${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`,
						children: "Descargar"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						className: "btn btn-ghost text-paper-ink",
						children: "Cerrar"
					})]
				})
			]
		})] })
	});
}
var NAV = [
	{
		id: "album",
		label: "Álbum",
		icon: Library
	},
	{
		id: "decks",
		label: "Mazos",
		icon: Layers
	},
	{
		id: "grok",
		label: "Grok",
		icon: MessageSquareText
	}
];
function FolioApp() {
	const [view, setView] = (0, import_react.useState)("album");
	const [deckId, setDeckId] = (0, import_react.useState)(null);
	const createDeck = useAlbum((state) => state.createDeck);
	const addToDeck = useAlbum((state) => state.addToDeck);
	(0, import_react.useEffect)(() => {
		bindAlbumPersistence();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell bg-ink text-cream",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "hidden flex-col gap-8 border-r border-cream/10 px-4 py-8 md:flex",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
					view,
					onChange: setView
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-auto text-xs text-mute",
					children: "La colección vive en este navegador. Exportala si cambiás de dispositivo."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-dvh min-w-0 flex-col md:h-dvh",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "flex items-center justify-between px-4 pt-4 md:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, { compact: true })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `min-h-0 flex-1 ${view === "grok" || view === "decks" ? "flex flex-col overflow-hidden" : "overflow-y-auto"} pb-24 md:pb-0`,
					children: [
						view === "album" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Album, { onCreateDeckWith: (set, number) => {
							const id = createDeck();
							addToDeck(id, set, number);
							setDeckId(id);
							setView("decks");
						} }) : null,
						view === "decks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Decks, {
							selectedId: deckId,
							onSelect: setDeckId
						}) : null,
						view === "grok" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chat, { onOpenDeck: (name) => {
							const deck = useAlbum.getState().decks.find((item) => item.name.toLowerCase() === name.toLowerCase());
							setDeckId(deck?.id ?? null);
							setView("decks");
						} }) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "dock fixed inset-x-0 bottom-0 z-30 flex border-t border-cream/10 bg-ink md:hidden",
					"aria-label": "Secciones",
					children: NAV.map((item) => {
						const Icon = item.icon;
						const active = view === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs ${active ? "text-gold" : "text-mute"}`,
							onClick: () => setView(item.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								"aria-hidden": "true"
							}), item.label]
						}, item.id);
					})
				})
			]
		})]
	});
}
function Wordmark({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-block size-2.5 rotate-45 bg-gold",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl leading-none",
			children: "Folio"
		}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-mute",
			children: "Álbum de TCG Pocket"
		})] })]
	});
}
function Nav({ view, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex flex-col gap-1",
		"aria-label": "Secciones",
		children: NAV.map((item) => {
			const Icon = item.icon;
			const active = view === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `flex min-h-11 items-center gap-3 rounded-full px-3 text-left ${active ? "bg-gold text-ink" : "text-cream-dim"}`,
				onClick: () => onChange(item.id),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					"aria-hidden": "true"
				}), item.label]
			}, item.id);
		})
	});
}
var SplitComponent = FolioApp;
//#endregion
export { SplitComponent as component };
