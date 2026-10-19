import { S as resolveDeck, T as setInfo, _ as fold, f as deckTotal, g as findCard, o as canonSet, t as CARDS, y as parseEnergy } from "./rules-DT9bglOb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/grok.server-DKSuO2EM.js
var MODEL = "grok-4.5";
function asRecord(value) {
	return value && typeof value === "object" ? value : null;
}
function parseInput(input) {
	const row = asRecord(input);
	if (!row) throw new Error("Pedido inválido.");
	const text = typeof row.text === "string" ? row.text.slice(0, 4e3) : "";
	const history = Array.isArray(row.history) ? row.history.slice(-8).map((item) => {
		const message = asRecord(item);
		if (!message) return null;
		if (message.role !== "user" && message.role !== "assistant") return null;
		if (typeof message.content !== "string") return null;
		return {
			role: message.role,
			content: message.content.slice(0, 2e3)
		};
	}).filter((item) => item !== null) : [];
	const images = Array.isArray(row.images) ? row.images.filter((item) => typeof item === "string" && item.startsWith("data:image/") && item.length < 12e5).slice(0, 2) : [];
	const holdings = Array.isArray(row.holdings) ? row.holdings.slice(0, 4e3).map((item) => {
		const holding = asRecord(item);
		if (!holding || typeof holding.set !== "string" || typeof holding.number !== "number" || typeof holding.qty !== "number") return null;
		return {
			set: canonSet(holding.set),
			number: holding.number,
			qty: Math.max(0, Math.min(99, Math.round(holding.qty)))
		};
	}).filter((item) => item !== null) : [];
	const decks = Array.isArray(row.decks) ? row.decks.slice(0, 20).map((item) => {
		const deck = asRecord(item);
		if (!deck || typeof deck.name !== "string" || !Array.isArray(deck.cards)) return null;
		const cards = deck.cards.slice(0, 20).map((card) => {
			const rowCard = asRecord(card);
			if (!rowCard || typeof rowCard.set !== "string" || typeof rowCard.number !== "number" || typeof rowCard.count !== "number") return null;
			return {
				set: canonSet(rowCard.set),
				number: rowCard.number,
				count: Math.max(1, Math.min(2, Math.round(rowCard.count)))
			};
		}).filter((card) => card !== null);
		const energies = Array.isArray(deck.energies) ? deck.energies.filter((energy) => typeof energy === "number").slice(0, 3) : [];
		return {
			name: deck.name.slice(0, 48),
			energies,
			cards
		};
	}).filter((deck) => deck !== null) : [];
	return {
		threadId: typeof row.threadId === "string" && /^[0-9a-f-]{36}$/i.test(row.threadId) ? row.threadId : "00000000-0000-4000-8000-000000000001",
		text,
		history,
		images,
		fileText: typeof row.fileText === "string" ? row.fileText.slice(0, 2e4) : "",
		fileName: typeof row.fileName === "string" ? row.fileName.slice(0, 80) : "",
		holdings,
		decks
	};
}
function ranges(numbers) {
	const sorted = [...numbers].sort((a, b) => a - b);
	if (!sorted.length) return "";
	const parts = [];
	let start = sorted[0];
	let prev = sorted[0];
	for (let i = 1; i <= sorted.length; i += 1) {
		const value = sorted[i];
		if (value === prev + 1) {
			prev = value;
			continue;
		}
		parts.push(start === prev ? String(start) : `${start}-${prev}`);
		start = value;
		prev = value;
	}
	return parts.join(", ");
}
function albumBrief(data) {
	const ownedCount = data.holdings.filter((holding) => holding.qty > 0).length;
	const copies = data.holdings.reduce((sum, holding) => sum + Math.max(0, holding.qty), 0);
	const bySet = /* @__PURE__ */ new Map();
	for (const holding of data.holdings) {
		const bucket = bySet.get(holding.set) ?? {
			owned: [],
			missing: []
		};
		if (holding.qty > 0) {
			const card = findCard(holding.set, holding.number);
			const kind = card?.trainer ? "entrenador" : ENERGY_ES[card?.element ?? ""] ?? "";
			bucket.owned.push(`${String(holding.number).padStart(3, "0")} ${card?.name ?? "Carta"} x${holding.qty}${kind ? ` ${kind}` : ""}`);
		} else bucket.missing.push(holding.number);
		bySet.set(holding.set, bucket);
	}
	const lines = [`Únicas: ${ownedCount}. Copias: ${copies}.`];
	for (const [code, bucket] of bySet) {
		const info = setInfo(code);
		lines.push(`## ${code} ${info?.es ?? ""}`.trim());
		lines.push(bucket.owned.length ? `Tiene: ${bucket.owned.join("; ")}` : "Tiene: nada registrado.");
		if (bucket.missing.length) lines.push(`No tiene (rastreado): ${ranges(bucket.missing)}`);
		else lines.push("El resto de este set no está rastreado.");
	}
	if (!data.decks.length) lines.push("MAZOS: ninguno.");
	else {
		lines.push("MAZOS:");
		for (const deck of data.decks) {
			const list = resolveDeck(deck.cards).map((card) => `${card.count} ${card.name} ${card.set}#${card.number}`).join("; ");
			lines.push(`- ${deck.name} | ${deckTotal(deck.cards)}/20 | energías ${deck.energies.join(",") || "sin elegir"} | ${list}`);
		}
	}
	return lines.join("\n");
}
var ENERGY_ES = {
	grass: "planta",
	fire: "fuego",
	water: "agua",
	lightning: "rayo",
	psychic: "psíquica",
	fighting: "lucha",
	darkness: "oscura",
	metal: "metálica",
	dragon: "dragón",
	colorless: "incolora"
};
var TOOLS = [
	{
		type: "function",
		function: {
			name: "search_catalog",
			description: "Busca cartas del catálogo de TCG Pocket por nombre o por set y número. Usalo antes de inventar un id.",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Nombre, o código como A1 25."
					},
					set: {
						type: "string",
						description: "Código de set opcional, por ejemplo A1 o B4a."
					}
				},
				required: ["query"]
			}
		}
	},
	{
		type: "function",
		function: {
			name: "update_collection",
			description: "Actualiza cantidades del álbum. mode set deja la cantidad absoluta. mode add suma o resta.",
			parameters: {
				type: "object",
				properties: { changes: {
					type: "array",
					items: {
						type: "object",
						properties: {
							set: { type: "string" },
							number: { type: "integer" },
							qty: { type: "integer" },
							mode: {
								type: "string",
								enum: ["set", "add"]
							}
						},
						required: [
							"set",
							"number",
							"qty",
							"mode"
						]
					}
				} },
				required: ["changes"]
			}
		}
	},
	{
		type: "function",
		function: {
			name: "save_deck",
			description: "Crea o reemplaza un mazo. 20 cartas para poder generar el QR, máximo 2 del mismo nombre, 1 a 3 energías.",
			parameters: {
				type: "object",
				properties: {
					name: { type: "string" },
					energies: {
						type: "array",
						items: { type: "string" }
					},
					cards: {
						type: "array",
						items: {
							type: "object",
							properties: {
								set: { type: "string" },
								number: { type: "integer" },
								count: { type: "integer" }
							},
							required: [
								"set",
								"number",
								"count"
							]
						}
					}
				},
				required: [
					"name",
					"energies",
					"cards"
				]
			}
		}
	},
	{
		type: "function",
		function: {
			name: "delete_deck",
			description: "Borra un mazo por nombre exacto.",
			parameters: {
				type: "object",
				properties: { name: { type: "string" } },
				required: ["name"]
			}
		}
	}
];
var SYSTEM = `Sos el asistente de Folio, el álbum de TCG Pocket de esta persona. Hablás en español rioplatense, breve, sin emojis y sin relleno.

Reglas del juego:
- Un mazo jugable tiene exactamente 20 cartas.
- Máximo 2 copias del mismo nombre. Dos impresiones del mismo nombre cuentan juntas.
- Las energías no son cartas del mazo: de 1 a 3 entre planta, fuego, agua, rayo, psíquica, lucha, oscura y metálica. Nunca dragón ni incolora.
- El QR del juego solo sale con 20 cartas conocidas por el catálogo y 1 a 3 energías.

Cómo trabajar:
- El bloque ÁLBUM del último mensaje es el estado real y pisa lo charlado antes.
- Cantidad 0 significa rastreada y no la tiene. Si un set dice que el resto no está rastreado, no asumas que esas cartas están.
- No inventes set ni número. Si dudás, llamá search_catalog y esperá el resultado antes de update_collection o save_deck.
- Todo cambio de cantidad o de mazo va por las herramientas. No digas que actualizaste algo si la herramienta no contestó ok.
- Al armar un mazo, priorizá cartas con cantidad mayor a 0 y usá exactamente el set y el número del álbum. Dos ilustraciones de la misma carta cuentan como una sola: el máximo sigue siendo 2.
- Si hay una foto, leé nombres y cantidades con cuidado. Si no se lee, pedí otra toma.
- Cuando guardes un mazo, resumí la lista en pocas líneas.`;
function runSearch(query, set, holdings) {
	const q = fold(query);
	const wanted = set ? canonSet(set) : null;
	const id = q.match(/([a-z0-9-]+)\s*[#-]?\s*(\d{1,4})$/i);
	return CARDS.map((card) => {
		if (wanted && card.set !== wanted) return null;
		const name = fold(card.name);
		let score = 0;
		if (id && canonSet(id[1]) === card.set && card.number === Number(id[2])) score = 200;
		if (name === q) score = Math.max(score, 100);
		else if (name.startsWith(q)) score = Math.max(score, 70);
		else if (q.length > 1 && name.includes(q)) score = Math.max(score, 40);
		if (!score) return null;
		const owned = holdings.find((holding) => holding.set === card.set && holding.number === card.number);
		return {
			score,
			set: card.set,
			number: card.number,
			name: card.name,
			rarity: card.rarity,
			element: card.element,
			trainer: card.trainer,
			owned: owned?.qty ?? 0,
			tracked: Boolean(owned)
		};
	}).filter((item) => item !== null).sort((a, b) => b.score - a.score || a.number - b.number).slice(0, 12).map(({ score: _score, ...card }) => card);
}
function qtyKey(set, number) {
	return `${set}#${number}`;
}
function executeTool(call, data, working) {
	let args = {};
	try {
		args = JSON.parse(call.args);
	} catch {
		return JSON.stringify({
			ok: false,
			error: "Los argumentos no eran JSON válido."
		});
	}
	if (call.name === "search_catalog") {
		const query = typeof args.query === "string" ? args.query : "";
		const set = typeof args.set === "string" ? args.set : void 0;
		if (!query.trim()) return JSON.stringify({
			ok: false,
			error: "Falta el texto de búsqueda."
		});
		return JSON.stringify({
			ok: true,
			cards: runSearch(query, set, data.holdings.map((holding) => ({
				...holding,
				qty: working.qty.get(qtyKey(holding.set, holding.number)) ?? holding.qty
			})))
		});
	}
	if (call.name === "update_collection") {
		const list = Array.isArray(args.changes) ? args.changes.slice(0, 400) : [];
		const applied = [];
		const errors = [];
		for (const item of list) {
			const row = asRecord(item);
			if (!row) continue;
			const set = canonSet(typeof row.set === "string" ? row.set : "");
			const number = typeof row.number === "number" ? Math.round(row.number) : NaN;
			const qty = typeof row.qty === "number" ? Math.round(row.qty) : NaN;
			const mode = row.mode === "add" ? "add" : "set";
			const card = findCard(set, number);
			if (!card || !Number.isInteger(number)) {
				errors.push(`No está en el catálogo: ${set} ${number}`);
				continue;
			}
			if (!Number.isInteger(qty)) {
				errors.push(`Cantidad inválida para ${card.name}`);
				continue;
			}
			const key = qtyKey(card.set, card.number);
			const from = working.qty.get(key) ?? 0;
			const to = Math.max(0, Math.min(99, mode === "add" ? from + qty : qty));
			working.qty.set(key, to);
			applied.push({
				set: card.set,
				number: card.number,
				name: card.name,
				from,
				to
			});
		}
		for (const change of applied) {
			const index = working.changes.findIndex((item) => item.set === change.set && item.number === change.number);
			if (index === -1) working.changes.push(change);
			else working.changes[index] = {
				...working.changes[index],
				to: change.to
			};
		}
		return JSON.stringify({
			ok: errors.length === 0,
			applied,
			errors
		});
	}
	if (call.name === "save_deck") {
		const name = typeof args.name === "string" ? args.name.trim().slice(0, 48) : "";
		if (!name) return JSON.stringify({
			ok: false,
			error: "El mazo necesita un nombre."
		});
		const energyValues = Array.isArray(args.energies) ? args.energies : [];
		const energies = [];
		for (const value of energyValues) {
			const energy = parseEnergy(value);
			if (!energy) return JSON.stringify({
				ok: false,
				error: `Energía no válida: ${String(value)}. Usá planta, fuego, agua, rayo, psíquica, lucha, oscura o metálica.`
			});
			if (!energies.includes(energy)) energies.push(energy);
		}
		if (energies.length > 3) return JSON.stringify({
			ok: false,
			error: "Máximo 3 energías."
		});
		const rawCards = Array.isArray(args.cards) ? args.cards : [];
		const merged = /* @__PURE__ */ new Map();
		for (const item of rawCards) {
			const row = asRecord(item);
			if (!row) continue;
			const set = canonSet(typeof row.set === "string" ? row.set : "");
			const number = typeof row.number === "number" ? Math.round(row.number) : NaN;
			const count = typeof row.count === "number" ? Math.round(row.count) : 1;
			const card = findCard(set, number);
			if (!card) return JSON.stringify({
				ok: false,
				error: `Carta desconocida: ${set} ${number}. Buscala en el catálogo.`
			});
			const key = qtyKey(card.set, card.number);
			const prev = merged.get(key);
			merged.set(key, {
				set: card.set,
				number: card.number,
				count: (prev?.count ?? 0) + Math.max(1, count)
			});
		}
		const cards = [...merged.values()];
		const resolved = resolveDeck(cards);
		const byName = /* @__PURE__ */ new Map();
		for (const card of resolved) byName.set(fold(card.name), (byName.get(fold(card.name)) ?? 0) + card.count);
		for (const [cardName, count] of byName) if (count > 2) return JSON.stringify({
			ok: false,
			error: `${cardName} suma ${count}. El máximo es 2.`
		});
		const byEntity = /* @__PURE__ */ new Map();
		for (const card of resolved) {
			if (!card.entityId) continue;
			const key = `${card.trainer ? "t" : "p"}:${card.entityId}`;
			byEntity.set(key, (byEntity.get(key) ?? 0) + card.count);
		}
		for (const count of byEntity.values()) if (count > 2) return JSON.stringify({
			ok: false,
			error: "Hay más de 2 copias de la misma carta, contando ilustraciones alternativas."
		});
		const total = deckTotal(cards);
		if (total > 20) return JSON.stringify({
			ok: false,
			error: `El mazo suma ${total} cartas. El máximo es 20.`
		});
		working.deck = {
			name,
			energies,
			cards,
			replaced: data.decks.some((deck) => deck.name.toLowerCase() === name.toLowerCase())
		};
		const missing = resolved.filter((card) => (working.qty.get(qtyKey(card.set, card.number)) ?? 0) < card.count);
		return JSON.stringify({
			ok: true,
			name,
			total,
			draft: total !== 20 || energies.length < 1,
			missing: missing.map((card) => card.name),
			list: resolved.map((card) => `${card.count} ${card.name} ${card.set}#${card.number}`)
		});
	}
	if (call.name === "delete_deck") {
		const name = typeof args.name === "string" ? args.name.trim() : "";
		if (!name) return JSON.stringify({
			ok: false,
			error: "Falta el nombre del mazo."
		});
		if (!data.decks.some((deck) => deck.name.toLowerCase() === name.toLowerCase())) return JSON.stringify({
			ok: false,
			error: `No hay un mazo llamado ${name}.`
		});
		working.deletedDeck = name;
		if (working.deck && working.deck.name.toLowerCase() === name.toLowerCase()) working.deck = null;
		return JSON.stringify({
			ok: true,
			deleted: name
		});
	}
	return JSON.stringify({
		ok: false,
		error: `Herramienta desconocida: ${call.name}`
	});
}
function toolCallsOf(message) {
	const raw = message.tool_calls;
	if (!Array.isArray(raw)) return [];
	return raw.map((item, index) => {
		const row = asRecord(item);
		if (!row) return null;
		const fn = asRecord(row.function);
		const name = typeof fn?.name === "string" ? fn.name : typeof row.name === "string" ? row.name : "";
		const argsSource = fn?.arguments ?? row.arguments ?? "{}";
		const args = typeof argsSource === "string" ? argsSource : JSON.stringify(argsSource);
		if (!name) return null;
		return {
			id: typeof row.id === "string" ? row.id : `call_${index}`,
			name,
			args
		};
	}).filter((item) => item !== null);
}
function messageText(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content.map((part) => {
		const row = asRecord(part);
		return row && typeof row.text === "string" ? row.text : "";
	}).join("");
}
async function complete(apiKey, threadId, body, allowRetry) {
	let response;
	try {
		response = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			signal: AbortSignal.timeout(5e4),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
				"x-grok-conv-id": threadId
			},
			body: JSON.stringify(body)
		});
	} catch {
		return {
			ok: false,
			error: "No hubo respuesta de Grok. Probá de nuevo en un momento."
		};
	}
	if (response.status === 400 && allowRetry && "reasoning_effort" in body) {
		const { reasoning_effort: _drop, ...rest } = body;
		return complete(apiKey, threadId, rest, false);
	}
	if (!response.ok) {
		if (response.status === 429) return {
			ok: false,
			error: "Grok está limitado ahora. Probá de nuevo en un rato."
		};
		return {
			ok: false,
			error: `Grok no pudo responder (${response.status}).`
		};
	}
	const message = (await response.json()).choices?.[0]?.message;
	if (!message) return {
		ok: false,
		error: "Grok volvió sin mensaje."
	};
	return {
		ok: true,
		message
	};
}
async function runAsk(input) {
	const data = parseInput(input);
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Grok no está disponible en este momento."
	};
	if (!data.text.trim() && !data.images.length && !data.fileText.trim()) return {
		ok: false,
		error: "Escribí algo o adjuntá una foto o un archivo."
	};
	const userText = [
		"ÁLBUM ACTUAL",
		albumBrief(data),
		"",
		"PEDIDO",
		data.text.trim() || "(sin texto, mirá el adjunto)",
		data.fileText ? `\nARCHIVO ${data.fileName || "adjunto"}:\n${data.fileText}` : ""
	].join("\n");
	const userContent = [{
		type: "text",
		text: userText
	}];
	for (const image of data.images) userContent.push({
		type: "image_url",
		image_url: { url: image }
	});
	const messages = [
		{
			role: "system",
			content: SYSTEM
		},
		...data.history.map((message) => ({
			role: message.role,
			content: message.content
		})),
		{
			role: "user",
			content: data.images.length ? userContent : userText
		}
	];
	const working = {
		qty: new Map(data.holdings.map((holding) => [qtyKey(holding.set, holding.number), holding.qty])),
		changes: [],
		deck: null,
		deletedDeck: null
	};
	let finalText = "";
	for (let round = 0; round < 4; round += 1) {
		const result = await complete(apiKey, data.threadId, {
			model: MODEL,
			temperature: .3,
			max_tokens: 1600,
			reasoning_effort: "low",
			messages,
			tools: TOOLS,
			tool_choice: "auto"
		}, true);
		if (!result.ok) return result;
		const calls = toolCallsOf(result.message);
		finalText = messageText(result.message.content).trim();
		if (!calls.length) break;
		messages.push({
			role: "assistant",
			content: result.message.content ?? "",
			tool_calls: calls.map((call) => ({
				id: call.id,
				type: "function",
				function: {
					name: call.name,
					arguments: call.args
				}
			}))
		});
		for (const call of calls) messages.push({
			role: "tool",
			tool_call_id: call.id,
			content: executeTool(call, data, working)
		});
	}
	const changes = working.changes.filter((change) => change.from !== change.to);
	if (!finalText) {
		const bits = [];
		if (changes.length) bits.push(`Actualicé ${changes.length} ${changes.length === 1 ? "carta" : "cartas"}.`);
		if (working.deck) bits.push(`Guardé el mazo ${working.deck.name}.`);
		if (working.deletedDeck) bits.push(`Borré el mazo ${working.deletedDeck}.`);
		finalText = bits.join(" ") || "Listo.";
	}
	return {
		ok: true,
		text: finalText,
		changes,
		deck: working.deck,
		deletedDeck: working.deletedDeck
	};
}
//#endregion
export { runAsk };
