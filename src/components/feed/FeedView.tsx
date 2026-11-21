"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { dayLabel, type Format } from "@/lib/feed";
import { useNow } from "@/lib/clock";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import FeedCard, { FeedCardSkeleton } from "./FeedCard";
import { useFeed } from "./useFeed";

const PULL_TRIGGER = 64; // quanto bisogna tirare (px) per ricaricare
const PULL_MAX = 96;

/**
 * "Tira per aggiornare": su iPhone, nell'app installata, non esiste di serie.
 * Velocità: mentre il dito si muove cambia solo questo indicatore (stile scritto direttamente),
 * non il feed intero, così il gesto resta fluido anche con cento card in lista.
 */
function PullToRefresh({ onRefresh, refreshing, disabled }: { onRefresh: () => void; refreshing: boolean; disabled: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const icon = useRef<SVGSVGElement>(null);
  const cb = useRef(onRefresh);
  const [armed, setArmed] = useState(false); // superata la soglia: lo si dice anche a parole
  useEffect(() => {
    cb.current = onRefresh;
  });

  useEffect(() => {
    if (disabled) return;
    let start: number | null = null;
    let pull = 0;
    const paint = (px: number) => {
      if (!box.current) return;
      box.current.style.height = `${px}px`;
      if (icon.current) icon.current.style.transform = `rotate(${px * 4}deg)`;
    };
    const down = (e: TouchEvent) => {
      start = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const move = (e: TouchEvent) => {
      if (start === null) return;
      const dy = e.touches[0].clientY - start;
      pull = dy <= 0 || window.scrollY > 0 ? 0 : Math.min(dy * 0.5, PULL_MAX);
      paint(pull);
      setArmed(pull >= PULL_TRIGGER);
    };
    const up = () => {
      if (pull >= PULL_TRIGGER) cb.current();
      start = null;
      pull = 0;
      paint(0);
      setArmed(false);
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    window.addEventListener("touchcancel", up);
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
    };
  }, [disabled]);

  return (
    <div
      ref={box}
      aria-hidden={!refreshing}
      className="flex items-end justify-center overflow-hidden text-cream-2 transition-[height] duration-150 motion-reduce:transition-none"
      style={refreshing ? { height: 44 } : { height: 0 }}
    >
      <span className={`flex items-center gap-2 pb-2 font-mono text-[11px] font-bold uppercase tracking-wide ${armed ? "text-signal" : ""}`}>
        <Icon
          ref={icon}
          name="refresh"
          size={20}
          className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}
        />
        {refreshing ? "Aggiorno…" : armed ? "Lascia per aggiornare" : ""}
      </span>
    </div>
  );
}

/** Etichetta del giorno nel feed ("Oggi", "Ieri", "lunedì 18 novembre"). */
function DayDivider({ label }: { label: string }) {
  return (
    <li aria-hidden="true" className="flex items-center gap-3 pt-2 first:pt-0">
      <span className="bg-cream px-2 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-card-ink">
        {label}
      </span>
      <span className="h-[3px] flex-1 bg-cream/15" />
    </li>
  );
}

type Props = {
  topics?: string[];
  sources?: string[];
  format: Format;
  enabled?: boolean;
  /** Cosa mostrare se non c'è nessun contenuto. */
  empty: ReactNode;
};

export default function FeedView({ topics, sources, format, enabled = true, empty }: Props) {
  const feed = useFeed({ topics, sources, format, enabled });
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, loadMore, savedScroll, rememberScroll } = feed;
  const now = useNow();
  const hasItems = feed.items.length > 0;

  // tornando su questa lista si riparte dal punto in cui eri (e uscendo lo si ricorda)
  useLayoutEffect(() => {
    if (!hasItems) return;
    const y = savedScroll();
    if (y > 0) {
      // subito dopo che Next.js ha portato la nuova pagina in cima
      const id = window.setTimeout(() => window.scrollTo(0, y), 0);
      return () => window.clearTimeout(id);
    }
  }, [hasItems, savedScroll]);
  useEffect(() => {
    if (!hasItems) return;
    const onScroll = () => rememberScroll(window.scrollY); // solo un numero in memoria: costo nullo
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasItems, rememberScroll]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, feed.items.length]);

  if (feed.status === "loading") {
    return (
      <div className="flex flex-col gap-5" role="status" aria-label="Carico i segnali">
        {Array.from({ length: 4 }, (_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (feed.status === "error") {
    return (
      <div className="border-[3px] border-cream bg-surface p-6 text-center shadow-zine" role="alert">
        <Icon name="wifiOff" size={36} className="mx-auto mb-3 text-accent" />
        <h2 className="font-display text-2xl font-extrabold">Segnale perso</h2>
        <p className="mx-auto mt-2 max-w-[28ch] font-accent text-xl italic text-cream-2">
          Non riesco a raggiungere Radar. Controlla la connessione.
        </p>
        <Button className="mt-5" onClick={feed.refresh}>
          <Icon name="refresh" size={18} /> Riprova
        </Button>
      </div>
    );
  }

  if (!hasItems) return <>{empty}</>;

  return (
    <div>
      {/* segnali arrivati mentre l'app era aperta: un tocco e salgono in cima */}
      {feed.freshCount > 0 && (
        <div className="pointer-events-none sticky top-[calc(var(--safe-top)+124px)] z-30 -mt-1 mb-3 flex h-0 justify-center overflow-visible">
          <button
            type="button"
            onClick={feed.showFresh}
            className="toast-in pointer-events-auto flex h-11 items-center gap-2 border-[3px] border-card-ink bg-signal px-4 font-mono text-xs font-bold uppercase tracking-wide text-ink shadow-zine"
          >
            <Icon name="radar" size={16} />
            {feed.freshCount === 1 ? "1 nuovo segnale" : `${feed.freshCount} nuovi segnali`}
            <Icon name="back" size={14} strokeWidth={3} className="rotate-90" />
          </button>
        </div>
      )}

      <PullToRefresh onRefresh={feed.refresh} refreshing={feed.refreshing} disabled={!enabled} />

      {feed.offline && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 border-[3px] border-accent bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-accent"
        >
          <Icon name="wifiOff" size={16} /> Sei offline: ecco gli ultimi segnali salvati
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {feed.items.map((item, i) => {
          const day = dayLabel(item.publishedAt, now);
          const divider = i === 0 || day !== dayLabel(feed.items[i - 1].publishedAt, now);
          return (
            <Fragment key={item.id}>
              {divider && <DayDivider label={day} />}
              {/* "cv-auto": le card lontane dallo schermo non vengono disegnate finché non ci arrivi */}
              <li className="cv-auto">
                <FeedCard item={item} index={i} />
              </li>
            </Fragment>
          );
        })}
      </ul>

      {feed.hasMore && (
        <div ref={sentinel} className="flex justify-center py-8">
          {feed.loadingMore ? (
            <Icon name="radar" size={28} className="animate-spin text-signal motion-reduce:animate-none" />
          ) : (
            <Button variant="ghost" onClick={loadMore}>
              Carica altri
            </Button>
          )}
        </div>
      )}
      {!feed.hasMore && (
        <p className="py-10 text-center font-accent text-xl italic text-cream-2">Sei in pari: non c&apos;è altro per ora.</p>
      )}
    </div>
  );
}
