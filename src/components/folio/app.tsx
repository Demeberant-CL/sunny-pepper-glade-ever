import { useEffect, useState } from "react";
import { Layers3, Library, MessageSquareText } from "lucide-react";
import { Album } from "@/components/folio/album";
import { Chat } from "@/components/folio/chat";
import { Decks } from "@/components/folio/decks";
import { bindAlbumPersistence, useAlbum } from "@/lib/folio/store";

type View = "album" | "decks" | "grok";

const NAV: { id: View; label: string; icon: typeof Library }[] = [
  { id: "album", label: "Álbum", icon: Library },
  { id: "decks", label: "Mazos", icon: Layers3 },
  { id: "grok", label: "Grok", icon: MessageSquareText },
];

export function FolioApp() {
  const [view, setView] = useState<View>("album");
  const [deckId, setDeckId] = useState<string | null>(null);
  const createDeck = useAlbum((state) => state.createDeck);
  const addToDeck = useAlbum((state) => state.addToDeck);

  useEffect(() => {
    bindAlbumPersistence();
  }, []);

  return (
    <div className="app-shell bg-ink text-cream">
      <aside className="hidden flex-col gap-8 border-r border-cream/10 px-4 py-8 md:flex">
        <Wordmark />
        <Nav view={view} onChange={setView} />
        <p className="mt-auto text-xs text-mute">La colección vive en este navegador. Exportala si cambiás de dispositivo.</p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col md:h-dvh">
        <header className="flex items-center justify-between px-4 pt-4 md:hidden">
          <Wordmark compact />
        </header>
        <div className={`min-h-0 flex-1 ${view === "grok" || view === "decks" ? "flex flex-col overflow-hidden" : "overflow-y-auto"} pb-24 md:pb-0`}>
          {view === "album" ? (
            <Album
              onCreateDeckWith={(set, number) => {
                const id = createDeck();
                addToDeck(id, set, number);
                setDeckId(id);
                setView("decks");
              }}
            />
          ) : null}
          {view === "decks" ? <Decks selectedId={deckId} onSelect={setDeckId} /> : null}
          {view === "grok" ? (
            <Chat
              onOpenDeck={(name) => {
                const deck = useAlbum.getState().decks.find((item) => item.name.toLowerCase() === name.toLowerCase());
                setDeckId(deck?.id ?? null);
                setView("decks");
              }}
            />
          ) : null}
        </div>
        <nav className="dock fixed inset-x-0 bottom-0 z-30 flex border-t border-cream/10 bg-ink md:hidden" aria-label="Secciones">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} type="button" className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs ${active ? "text-gold" : "text-mute"}`} onClick={() => setView(item.id)}>
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block size-2.5 rotate-45 bg-gold" aria-hidden="true" />
      <div>
        <h1 className="font-display text-3xl leading-none">Folio</h1>
        {compact ? null : <p className="mt-1 text-sm text-mute">Álbum de TCG Pocket</p>}
      </div>
    </div>
  );
}

function Nav({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Secciones">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button key={item.id} type="button" className={`flex min-h-11 items-center gap-3 rounded-full px-3 text-left ${active ? "bg-gold text-ink" : "text-cream-dim"}`} onClick={() => onChange(item.id)}>
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
