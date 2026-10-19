import { useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Minus, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { CardFace, RarityMark } from "@/components/folio/card-face";
import { compareCards, displayCard, searchCards, setInfo, SETS } from "@/lib/folio/catalog";
import { downloadText, holdingsToCsv, parseCollectionCsv } from "@/lib/folio/csv";
import { RARITIES, padNumber } from "@/lib/folio/game";
import { useAlbum } from "@/lib/folio/store";
import type { CardRow, Holding } from "@/lib/folio/types";

type Mode = "owned" | "missing" | "all";

export function Album({ onCreateDeckWith }: { onCreateDeckWith: (set: string, number: number) => void }) {
  const holdings = useAlbum((state) => state.holdings);
  const decks = useAlbum((state) => state.decks);
  const setQty = useAlbum((state) => state.setQty);
  const addToDeck = useAlbum((state) => state.addToDeck);
  const importRows = useAlbum((state) => state.importRows);
  const resetAlbum = useAlbum((state) => state.resetAlbum);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("owned");
  const [setCode, setSetCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{ name: string; rows: ReturnType<typeof parseCollectionCsv> } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deckPick, setDeckPick] = useState("");
  const [deckNote, setDeckNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const owned = holdings.filter((holding) => holding.qty > 0);
    const copies = owned.reduce((sum, holding) => sum + holding.qty, 0);
    const ex = owned.filter((holding) => {
      const card = displayCard(holding);
      return card.rarity === "RR" || /\sex$/i.test(card.name);
    }).length;
    return { unique: owned.length, copies, missing: holdings.filter((holding) => holding.qty === 0).length, ex };
  }, [holdings]);

  const setOptions = useMemo(() => SETS.filter((set) => holdings.some((holding) => holding.set === set.code)), [holdings]);

  const groups = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed) {
      const found = searchCards(trimmed, { set: setCode, limit: 60 });
      return [
        {
          code: "",
          title: "Resultados",
          cards: found.map((card) => ({
            card,
            qty: holdings.find((holding) => holding.set === card.set && holding.number === card.number)?.qty ?? 0,
            tracked: holdings.some((holding) => holding.set === card.set && holding.number === card.number),
          })),
        },
      ];
    }
    const visible = holdings
      .filter((holding) => (setCode ? holding.set === setCode : true))
      .filter((holding) => (mode === "owned" ? holding.qty > 0 : mode === "missing" ? holding.qty === 0 : true))
      .sort(compareCards);
    const buckets = new Map<string, { card: CardRow; qty: number; tracked: boolean }[]>();
    for (const holding of visible) {
      const list = buckets.get(holding.set) ?? [];
      list.push({ card: displayCard(holding), qty: holding.qty, tracked: true });
      buckets.set(holding.set, list);
    }
    return [...buckets.entries()].map(([code, cards]) => ({
      code,
      title: setInfo(code)?.es ?? code,
      cards,
    }));
  }, [holdings, mode, query, setCode]);

  const selectedQty = selected
    ? (holdings.find((holding) => holding.set === selected.set && holding.number === selected.number)?.qty ?? 0)
    : 0;
  const selectedTracked = selected
    ? holdings.some((holding) => holding.set === selected.set && holding.number === selected.number)
    : false;

  function changeQty(card: CardRow, qty: number) {
    setQty(card.set, card.number, qty, { name: card.name, rarity: card.rarity });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">Álbum</p>
          <h2 className="font-display text-4xl text-cream">Tu colección</h2>
          <p className="mt-2 text-sm text-cream-dim tabular-nums">
            {stats.unique} únicas · {stats.copies} copias · {stats.ex} ex
            {stats.missing ? ` · ${stats.missing} rastreadas que faltan` : ""}
          </p>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="btn btn-ghost px-3" aria-label="Más acciones del álbum">
            <MoreHorizontal className="size-5" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-40 min-w-52 rounded-2xl bg-ink-2 p-1 shadow-hair" align="end" sideOffset={8}>
              <DropdownMenu.Item className="rounded-xl px-3 py-3 text-sm outline-none data-[highlighted]:bg-panel" onSelect={() => fileRef.current?.click()}>
                Importar CSV
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="rounded-xl px-3 py-3 text-sm outline-none data-[highlighted]:bg-panel"
                onSelect={() => downloadText("folio-coleccion.csv", holdingsToCsv(holdings))}
              >
                Exportar CSV
              </DropdownMenu.Item>
              <DropdownMenu.Item className="rounded-xl px-3 py-3 text-sm text-gold outline-none data-[highlighted]:bg-panel" onSelect={() => setConfirmReset(true)}>
                Volver al archivo original
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const rows = parseCollectionCsv(await file.text());
            if (!rows.length) {
              setNotice("Ese archivo no tiene filas de cartas.");
              return;
            }
            setPendingImport({ name: file.name, rows });
          }}
        />
      </header>

      {notice ? (
        <p className="rounded-2xl bg-panel px-4 py-3 text-sm text-cream-dim">
          {notice}
          <button type="button" className="ml-3 text-gold" onClick={() => setNotice(null)}>
            Cerrar
          </button>
        </p>
      ) : null}

      {pendingImport ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            {pendingImport.rows.length} filas en {pendingImport.name}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                const count = importRows(pendingImport.rows, "merge");
                setPendingImport(null);
                setNotice(`Combiné ${count} filas con el álbum.`);
              }}
            >
              Combinar
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const count = importRows(pendingImport.rows, "replace");
                setPendingImport(null);
                setNotice(`Reemplacé el álbum con ${count} filas.`);
              }}
            >
              Reemplazar
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setPendingImport(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {confirmReset ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-cream-dim">Vuelve a las cantidades del archivo original. Los mazos y el chat quedan.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                resetAlbum();
                setConfirmReset(false);
                setNotice("Álbum restaurado.");
              }}
            >
              Restaurar
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mute" aria-hidden="true" />
        <input
          className="field pr-12 pl-11"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en el catálogo, por ejemplo Pikachu o A1 25"
          aria-label="Buscar cartas"
        />
        {query ? (
          <button type="button" className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-mute" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["owned", "Tengo"],
            ["missing", "Me faltan"],
            ["all", "Rastreadas"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={`btn ${mode === id && !query ? "btn-gold" : "btn-ghost"}`} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={`btn shrink-0 ${setCode === null ? "btn-gold" : "btn-ghost"}`} onClick={() => setSetCode(null)}>
          Todos
        </button>
        {setOptions.map((set) => (
          <button key={set.code} type="button" className={`btn shrink-0 ${setCode === set.code ? "btn-gold" : "btn-ghost"}`} onClick={() => setSetCode(set.code)}>
            {set.code}
          </button>
        ))}
      </div>

      {groups.every((group) => group.cards.length === 0) ? (
        <EmptySearch query={query} onAdd={(holding) => changeQty(displayCard(holding), holding.qty)} />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) =>
            group.cards.length ? (
              <section key={group.code || "search"} className="flex flex-col gap-3">
                <h3 className="font-display text-2xl">
                  {group.title}
                  {group.code ? <span className="ml-2 text-sm text-mute">{group.code}</span> : null}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {group.cards.map(({ card, qty, tracked }) => (
                    <button
                      key={`${card.set}#${card.number}`}
                      type="button"
                      className="rounded-lg text-left"
                      aria-label={`${card.name}, ${card.set} ${padNumber(card.number)}, ${qty > 0 ? `${qty} copias` : tracked ? "falta" : "sin registrar"}`}
                      onClick={() => {
                        setSelected(card);
                        setDeckPick(decks[0]?.id ?? "");
                        setDeckNote(null);
                      }}
                    >
                      <CardFace set={card.set} number={card.number} name={card.name} rarity={card.rarity} qty={qty} tracked={tracked} />
                    </button>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}

      <Dialog.Root open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-ink-2 p-4 shadow-hair md:p-6">
            {selected ? (
              <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
                <CardFace set={selected.set} number={selected.number} name={selected.name} rarity={selected.rarity} qty={selectedQty} tracked={selectedTracked} eager />
                <div className="flex flex-col gap-4">
                  <div>
                    <Dialog.Title className="font-display text-3xl">{selected.name}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-cream-dim">
                      {setInfo(selected.set)?.es ?? selected.set} · {selected.set} {padNumber(selected.number)}
                    </Dialog.Description>
                    <p className="mt-2 flex items-center gap-2 text-sm text-cream-dim">
                      <RarityMark code={selected.rarity} />
                      <span>{RARITIES[selected.rarity]?.es ?? "Sin rareza de catálogo"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="btn btn-ghost size-11 px-0" aria-label="Una copia menos" onClick={() => changeQty(selected, selectedQty - 1)} disabled={selectedQty <= 0}>
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-16 text-center font-display text-3xl tabular-nums">{selectedQty}</span>
                    <button type="button" className="btn btn-gold size-11 px-0" aria-label="Una copia más" onClick={() => changeQty(selected, selectedQty + 1)}>
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {decks.length ? (
                      <label className="flex flex-col gap-2 text-sm text-mute">
                        Sumar a un mazo
                        <select className="field" value={deckPick} onChange={(event) => setDeckPick(event.target.value)}>
                          {decks.map((deck) => (
                            <option key={deck.id} value={deck.id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {decks.length ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            const reason = addToDeck(deckPick, selected.set, selected.number);
                            setDeckNote(reason ?? "Sumada al mazo.");
                          }}
                        >
                          Sumar
                        </button>
                      ) : (
                        <button type="button" className="btn btn-ghost" onClick={() => onCreateDeckWith(selected.set, selected.number)}>
                          Crear mazo con esta carta
                        </button>
                      )}
                      <Dialog.Close className="btn btn-quiet">Cerrar</Dialog.Close>
                    </div>
                    {deckNote ? <p className="text-sm text-cream-dim">{deckNote}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function EmptySearch({ query, onAdd }: { query: string; onAdd: (holding: Holding) => void }) {
  const [setCode, setSetCode] = useState("A1");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="rounded-3xl bg-panel px-5 py-8">
      <h3 className="font-display text-2xl">{query ? "No hay coincidencias" : "Nada en este filtro"}</h3>
      <p className="mt-2 max-w-lg text-sm text-cream-dim">
        {query
          ? "Probá el nombre en inglés, como figura en el juego, o el código del set y el número."
          : "Este recorte del álbum está vacío. Cambiá el filtro o sumá una carta a mano."}
      </p>
      <form
        className="mt-5 grid gap-2 sm:grid-cols-[8rem_6rem_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(number);
          if (!setCode.trim() || !Number.isInteger(parsed) || parsed < 1) return;
          onAdd({ set: setCode.trim(), number: parsed, qty: 1, name: name.trim() || undefined });
          setNumber("");
          setName("");
        }}
      >
        <input className="field" aria-label="Set" value={setCode} onChange={(event) => setSetCode(event.target.value)} placeholder="A1" />
        <input className="field" aria-label="Número" inputMode="numeric" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="25" />
        <input className="field" aria-label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre si no está en el catálogo" />
        <button type="submit" className="btn btn-gold">
          Agregar
        </button>
      </form>
    </div>
  );
}
