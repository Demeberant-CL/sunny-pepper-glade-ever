import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { askGrok } from "@/lib/folio/ask";
import { parseCollectionCsv } from "@/lib/folio/csv";
import { threadId, useAlbum } from "@/lib/folio/store";

const SUGGESTIONS = [
  "Armame un mazo de 20 con las cartas que tengo y dejalo listo para el QR",
  "¿Qué ex tengo y cuáles me faltan de las que ya registré?",
  "De Genes Formidables, ¿qué línea de fuego puedo armar con lo que tengo?",
];

export function Chat({ onOpenDeck }: { onOpenDeck: (name: string) => void }) {
  const messages = useAlbum((state) => state.messages);
  const holdings = useAlbum((state) => state.holdings);
  const decks = useAlbum((state) => state.decks);
  const pushMessage = useAlbum((state) => state.pushMessage);
  const applyChanges = useAlbum((state) => state.applyChanges);
  const upsertDeck = useAlbum((state) => state.upsertDeck);
  const deleteDeck = useAlbum((state) => state.deleteDeck);
  const importRows = useAlbum((state) => state.importRows);
  const [text, setText] = useState("");
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const nextImages = [...images];
    let nextFile = file;
    for (const item of list) {
      if (item.type.startsWith("image/")) {
        if (nextImages.length >= 2) continue;
        const url = await compressImage(item);
        nextImages.push({ name: item.name, url });
      } else {
        const raw = await item.text();
        nextFile = { name: item.name, text: raw.slice(0, 20_000) };
      }
    }
    setImages(nextImages);
    setFile(nextFile);
  }

  async function send(body?: string) {
    const value = (body ?? text).trim();
    if (sending) return;
    if (!value && !images.length && !file) return;
    setError(null);

    if (file && !value && !images.length && looksLikeCollection(file.text)) {
      const rows = parseCollectionCsv(file.text);
      const count = importRows(rows, "merge");
      pushMessage({ id: crypto.randomUUID(), role: "user", content: `Adjunté ${file.name}` });
      pushMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Combiné ${count} filas de ${file.name} con el álbum. Si querés un mazo con eso, decime el estilo.`,
      });
      setFile(null);
      setText("");
      return;
    }

    const userContent = [value, file ? `Archivo: ${file.name}` : "", images.length ? `${images.length} imagen${images.length === 1 ? "" : "es"}` : ""]
      .filter(Boolean)
      .join("\n");
    pushMessage({ id: crypto.randomUUID(), role: "user", content: userContent });
    setText("");
    const sentImages = images.map((image) => image.url);
    const sentFile = file;
    setImages([]);
    setFile(null);
    setSending(true);
    try {
      const history = useAlbum
        .getState()
        .messages.slice(0, -1)
        .slice(-8)
        .map((message) => ({ role: message.role, content: message.content }));
      const result = await askGrok({
        data: {
          threadId: threadId(),
          text: value,
          history,
          images: sentImages,
          fileText: sentFile?.text ?? "",
          fileName: sentFile?.name ?? "",
          holdings: holdings.map((holding) => ({ set: holding.set, number: holding.number, qty: holding.qty })),
          decks: decks.map((deck) => ({ name: deck.name, energies: deck.energies, cards: deck.cards })),
        },
      });
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
        deckName: result.deck?.name ?? result.deletedDeck ?? undefined,
        deckEvent: result.deck ? "saved" : result.deletedDeck ? "deleted" : undefined,
      });
    } catch {
      setError("No pude hablar con Grok. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-4 py-5 md:px-8 md:py-8">
      <header className="mb-4">
        <p className="text-sm text-mute">Grok</p>
        <h2 className="font-display text-4xl">Hablale al álbum</h2>
        <p className="mt-2 max-w-xl text-sm text-cream-dim">Lee tu colección, actualiza cantidades con texto o fotos, arma mazos y los deja listos para el QR.</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" className="rounded-2xl bg-panel px-4 py-3 text-left text-sm" onClick={() => void send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-paper px-4 py-3 text-paper-ink" : "max-w-[40rem]"}>
              <p className="text-sm whitespace-pre-wrap">{renderInline(message.content)}</p>
              {message.changes?.length ? (
                <ul className="mt-3 flex flex-col gap-1 text-sm text-cream-dim">
                  {message.changes.slice(0, 12).map((change) => (
                    <li key={`${change.set}-${change.number}`}>
                      {change.name} <span className="tabular-nums">{change.from} → {change.to}</span>
                    </li>
                  ))}
                  {message.changes.length > 12 ? <li>y {message.changes.length - 12} más</li> : null}
                </ul>
              ) : null}
              {message.deckName && message.deckEvent === "saved" ? (
                <button type="button" className="btn btn-gold mt-3" onClick={() => onOpenDeck(message.deckName!)}>
                  Abrir {message.deckName}
                </button>
              ) : null}
            </article>
          ))
        )}
        {sending ? <p className="text-sm text-gold">Grok está leyendo el álbum…</p> : null}
        {error ? <p className="text-sm text-cream-dim">{error}</p> : null}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-0 flex flex-col gap-2 bg-ink pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        {images.length || file ? (
          <div className="flex flex-wrap gap-2">
            {images.map((image) => (
              <button key={image.url} type="button" className="overflow-hidden rounded-xl" onClick={() => setImages((current) => current.filter((item) => item.url !== image.url))} aria-label={`Quitar ${image.name}`}>
                <img src={image.url} alt="" className="h-16 w-12 object-cover" />
              </button>
            ))}
            {file ? (
              <button type="button" className="rounded-full bg-panel px-3 py-2 text-sm" onClick={() => setFile(null)}>
                {file.name} · quitar
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <button type="button" className="btn btn-ghost size-11 shrink-0 px-0" aria-label="Adjuntar imagen o archivo" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-5" />
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="image/*,.csv,.txt,.json,text/plain"
            multiple
            onChange={(event) => {
              void onFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <textarea
            className="field max-h-32 min-h-11 resize-none rounded-3xl py-3"
            rows={1}
            value={text}
            placeholder="Contale qué abriste, o pedile un mazo"
            aria-label="Mensaje para Grok"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            onPaste={(event) => {
              const files = [...event.clipboardData.files];
              if (!files.length) return;
              event.preventDefault();
              const list = new DataTransfer();
              for (const item of files) list.items.add(item);
              void onFiles(list.files);
            }}
          />
          <button type="submit" className="btn btn-gold size-11 shrink-0 px-0" disabled={sending} aria-label="Enviar">
            <Send className="size-4" />
          </button>
        </div>
        <p className="text-xs text-mute">La colección queda en este navegador. Cada mensaje le muestra el álbum a Grok.</p>
      </form>
    </div>
  );
}

function looksLikeCollection(text: string): boolean {
  const head = text.slice(0, 300).toLowerCase();
  return head.includes("set") && (head.includes("cantidad") || head.includes("id"));
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>,
  );
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pude leer la imagen.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
  if (!blob) throw new Error("No pude preparar la imagen.");
  const dataUrl = await blobToDataUrl(blob);
  if (dataUrl.length > 1_100_000) throw new Error("La imagen es demasiado pesada.");
  return dataUrl;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No pude leer la imagen."));
    reader.readAsDataURL(blob);
  });
}
