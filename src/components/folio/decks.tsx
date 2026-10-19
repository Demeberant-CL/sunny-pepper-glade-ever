import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { CardFace } from "@/components/folio/card-face";
import { searchCards } from "@/lib/folio/catalog";
import { deckCodeToQr } from "@/lib/folio/qr";
import { ENERGIES, energyLabel, padNumber } from "@/lib/folio/game";
import { canEncode, copyLimitReached, deckCoverage, deckProblems, deckTotal, encodeResolved, qtyOf, resolveDeck } from "@/lib/folio/rules";
import { useAlbum } from "@/lib/folio/store";

export function Decks({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const decks = useAlbum((state) => state.decks);
  const createDeck = useAlbum((state) => state.createDeck);
  const selected = decks.find((deck) => deck.id === selectedId) ?? null;

  return (
    <div className="deck-split h-full min-h-0">
      <aside className={`${selected ? "hidden md:flex" : "flex"} min-h-0 flex-col gap-3 overflow-y-auto px-4 py-5 md:px-5 md:py-8`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl">Mazos</h2>
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => onSelect(createDeck())}
          >
            Nuevo
          </button>
        </div>
        {decks.length === 0 ? (
          <p className="text-sm text-cream-dim">Todavía no hay mazos. Creá uno acá o pedile a Grok que arme uno con lo que tenés.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {decks.map((deck) => (
              <li key={deck.id}>
                <DeckRow id={deck.id} active={deck.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className={`${selected ? "block" : "hidden md:block"} min-h-0 overflow-y-auto px-4 py-5 md:px-8 md:py-8`}>
        {selected ? <DeckEditor deckId={selected.id} onBack={() => onSelect(null)} /> : <p className="hidden text-sm text-mute md:block">Elegí un mazo o creá uno nuevo.</p>}
      </section>
    </div>
  );
}

function DeckRow({ id, active, onSelect }: { id: string; active: boolean; onSelect: (id: string) => void }) {
  const deck = useAlbum((state) => state.decks.find((item) => item.id === id));
  const holdings = useAlbum((state) => state.holdings);
  if (!deck) return null;
  const coverage = deckCoverage(deck.cards, holdings);
  return (
    <button type="button" onClick={() => onSelect(id)} className={`w-full rounded-2xl px-3 py-3 text-left ${active ? "bg-gold text-ink" : "bg-panel text-cream"}`}>
      <span className="block font-medium">{deck.name}</span>
      <span className={`mt-1 block text-sm tabular-nums ${active ? "text-ink/70" : "text-mute"}`}>
        {deckTotal(deck.cards)}/20 · tenés {coverage.have}/{coverage.total || 0}
        {energyLabel(deck.energies) ? ` · ${energyLabel(deck.energies)}` : ""}
      </span>
    </button>
  );
}

function DeckEditor({ deckId, onBack }: { deckId: string; onBack: () => void }) {
  const deck = useAlbum((state) => state.decks.find((item) => item.id === deckId));
  const holdings = useAlbum((state) => state.holdings);
  const renameDeck = useAlbum((state) => state.renameDeck);
  const toggleEnergy = useAlbum((state) => state.toggleEnergy);
  const addToDeck = useAlbum((state) => state.addToDeck);
  const changeDeckCount = useAlbum((state) => state.changeDeckCount);
  const removeFromDeck = useAlbum((state) => state.removeFromDeck);
  const deleteDeck = useAlbum((state) => state.deleteDeck);
  const [name, setName] = useState(deck?.name ?? "");
  const [query, setQuery] = useState("");
  const [onlyOwned, setOnlyOwned] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setName(deck?.name ?? "");
  }, [deck?.id, deck?.name]);

  if (!deck) return null;
  const resolved = resolveDeck(deck.cards);
  const problems = deckProblems(resolved, deck.energies);
  const ready = canEncode(resolved, deck.energies);
  const hits = query.trim()
    ? searchCards(query, { limit: 12 }).filter((card) => (onlyOwned ? qtyOf(holdings, card.set, card.number) > 0 : true))
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <button type="button" className="btn btn-quiet -ml-3 w-fit md:hidden" onClick={onBack}>
        <ChevronLeft className="size-4" />
        Mazos
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Nombre del mazo</span>
          <input
            className="field font-display text-2xl"
            value={name}
            aria-label="Nombre del mazo"
            onChange={(event) => setName(event.target.value)}
            onBlur={() => renameDeck(deck.id, name)}
          />
        </label>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            deleteDeck(deck.id);
            onBack();
          }}
        >
          <Trash2 className="size-4" />
          Borrar
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm text-mute">Energías · {deck.energies.length}/3</p>
        <div className="flex flex-wrap gap-2">
          {ENERGIES.map((energy) => {
            const on = deck.energies.includes(energy.id);
            return (
              <button key={energy.id} type="button" className={`btn ${on ? "btn-gold" : "btn-ghost"}`} onClick={() => toggleEnergy(deck.id, energy.id)}>
                {energy.es}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-3xl tabular-nums">
          {deckTotal(deck.cards)}
          <span className="text-lg text-mute">/20</span>
        </p>
        <button type="button" className="btn btn-gold" disabled={!ready} onClick={() => setQrOpen(true)}>
          Código QR
        </button>
      </div>
      {problems.length ? (
        <ul className="flex flex-col gap-1 text-sm text-cream-dim">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cream-dim">Listo para escanear en el juego.</p>
      )}

      <ul className="flex flex-col gap-2">
        {resolved.map((card) => {
          const owned = qtyOf(holdings, card.set, card.number);
          return (
            <li key={`${card.set}#${card.number}`} className="flex items-center gap-3 rounded-2xl bg-panel p-2">
              <span className="w-14 shrink-0">
                <CardFace set={card.set} number={card.number} name={card.name} rarity={card.rarity} qty={0} tracked={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{card.name}</span>
                <span className="block text-sm text-mute tabular-nums">
                  {card.set} {padNumber(card.number)} · tenés {owned}
                </span>
              </span>
              <button type="button" className="btn btn-ghost size-11 px-0" aria-label={`Quitar una ${card.name}`} onClick={() => changeDeckCount(deck.id, card.set, card.number, -1)}>
                <Minus className="size-4" />
              </button>
              <span className="w-4 text-center tabular-nums">{card.count}</span>
              <button
                type="button"
                className="btn btn-ghost size-11 px-0"
                aria-label={`Sumar una ${card.name}`}
                disabled={card.count >= 2 || copyLimitReached(deck.cards, card.set, card.number) || deckTotal(deck.cards) >= 20}
                onClick={() => changeDeckCount(deck.id, card.set, card.number, 1)}
              >
                <Plus className="size-4" />
              </button>
              <button type="button" className="btn btn-quiet size-11 px-0" aria-label={`Sacar ${card.name}`} onClick={() => removeFromDeck(deck.id, card.set, card.number)}>
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-xl">Sumar carta</h3>
          <button type="button" className={`btn ${onlyOwned ? "btn-gold" : "btn-ghost"}`} onClick={() => setOnlyOwned((value) => !value)}>
            Solo las que tengo
          </button>
        </div>
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o A4 149" aria-label="Buscar carta para el mazo" />
        {note ? <p className="text-sm text-cream-dim">{note}</p> : null}
        <ul className="flex flex-col gap-2">
          {hits.map((card) => (
            <li key={`${card.set}#${card.number}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-ink-2 px-3 py-2 text-left"
                onClick={() => {
                  const reason = addToDeck(deck.id, card.set, card.number);
                  setNote(reason ?? "Sumada al mazo.");
                }}
              >
                <span className="w-12 shrink-0">
                  <CardFace set={card.set} number={card.number} name={card.name} rarity={card.rarity} qty={qtyOf(holdings, card.set, card.number)} tracked={holdings.some((holding) => holding.set === card.set && holding.number === card.number)} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{card.name}</span>
                  <span className="block text-sm text-mute">
                    {card.set} {padNumber(card.number)} · tenés {qtyOf(holdings, card.set, card.number)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <QrDialog open={qrOpen} onOpenChange={setQrOpen} name={deck.name} code={ready ? encodeResolved(resolved, deck.energies) : null} />
    </div>
  );
}

function QrDialog({ open, onOpenChange, name, code }: { open: boolean; onOpenChange: (open: boolean) => void; name: string; code: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !code) return;
    let cancel = false;
    setSrc(null);
    setError(null);
    deckCodeToQr(code)
      .then((url) => {
        if (!cancel) setSrc(url);
      })
      .catch(() => {
        if (!cancel) setError("No pude armar el QR.");
      });
    return () => {
      cancel = true;
    };
  }, [open, code]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/75" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-paper p-5 text-paper-ink">
          <Dialog.Title className="font-display text-3xl">{name}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-foil">
            En el juego: Mazos, Crear, Escanear código. Si estás en este mismo teléfono, descargá la imagen y abrila en otra pantalla.
          </Dialog.Description>
          <div className="mt-4 overflow-hidden rounded-2xl bg-paper">
            {src ? <img src={src} alt={`Código QR del mazo ${name}`} className="mx-auto w-full max-w-80" /> : <p className="py-16 text-center text-sm">{error ?? "Preparando el código…"}</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {src ? (
              <a className="btn btn-gold" href={src} download={`${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`}>
                Descargar
              </a>
            ) : null}
            <Dialog.Close className="btn btn-ghost text-paper-ink">Cerrar</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
