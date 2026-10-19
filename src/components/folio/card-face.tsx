import { useEffect, useState } from "react";
import { Crown, Star } from "lucide-react";
import { cardImageUrl } from "@/lib/folio/catalog";
import { RARITIES, padNumber } from "@/lib/folio/game";

export function RarityMark({ code }: { code: string }) {
  const rarity = RARITIES[code];
  if (!rarity) return null;
  if (rarity.group === "crown") return <Crown className="size-3.5 text-foil" aria-hidden="true" />;
  if (rarity.group === "star") {
    return (
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: rarity.count }, (_, index) => (
          <Star key={index} className="size-3 fill-foil text-foil" />
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {Array.from({ length: rarity.count }, (_, index) => (
        <i key={index} className="size-1.5 rotate-45 bg-foil" />
      ))}
    </span>
  );
}

export function CardFace({
  set,
  number,
  name,
  rarity,
  qty,
  tracked,
  eager = false,
}: {
  set: string;
  number: number;
  name: string;
  rarity: string;
  qty: number;
  tracked: boolean;
  eager?: boolean;
}) {
  const src = cardImageUrl(set, number);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <span className="card-tile relative block overflow-hidden rounded-lg bg-paper text-paper-ink shadow-hair">
      <span className="aspect-card relative block">
        {failed ? (
          <span className="flex h-full flex-col justify-between p-3">
            <span className="flex items-center justify-between text-xs text-foil">
              <span>{set}</span>
              <span className="tabular-nums">{padNumber(number)}</span>
            </span>
            <span className="font-display text-lg leading-tight">{name}</span>
            <RarityMark code={rarity} />
          </span>
        ) : (
          <img
            src={src}
            alt=""
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-cream/15"
            onError={() => setFailed(true)}
          />
        )}
        {tracked && qty === 0 ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-xs text-cream-dim">Falta</span>
        ) : null}
        {qty > 0 ? (
          <span className="absolute right-1.5 bottom-1.5 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink tabular-nums">
            ×{qty}
          </span>
        ) : null}
      </span>
    </span>
  );
}
