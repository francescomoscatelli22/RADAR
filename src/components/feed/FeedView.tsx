"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Format } from "@/lib/feed";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import FeedCard, { FeedCardSkeleton } from "./FeedCard";
import { useFeed } from "./useFeed";

const PULL_TRIGGER = 64; // quanto bisogna tirare (px) per ricaricare

/** "Tira per aggiornare": su iPhone, nell'app installata, non esiste di serie. */
function usePullToRefresh(onRefresh: () => void, disabled: boolean) {
  const [pull, setPull] = useState(0);
  const start = useRef<number | null>(null);
  const current = useRef(0);
  const cb = useRef(onRefresh);
  useEffect(() => {
    cb.current = onRefresh;
  });

  useEffect(() => {
    if (disabled) return;
    const down = (e: TouchEvent) => {
      start.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const move = (e: TouchEvent) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) {
        current.current = 0;
        setPull(0);
        return;
      }
      current.current = Math.min(dy * 0.5, 96);
      setPull(current.current);
    };
    const up = () => {
      if (current.current >= PULL_TRIGGER) cb.current();
      start.current = null;
      current.current = 0;
      setPull(0);
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

  return pull;
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
  const pull = usePullToRefresh(feed.refresh, !enabled);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, loadMore } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "700px 0px" });
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

  if (feed.items.length === 0) return <>{empty}</>;

  return (
    <div>
      {/* indicatore di "tira per aggiornare" / aggiornamento in corso */}
      <div
        aria-hidden={pull === 0 && !feed.refreshing}
        className="flex items-end justify-center overflow-hidden text-cream-2 transition-[height] duration-150 motion-reduce:transition-none"
        style={{ height: feed.refreshing ? 40 : pull }}
      >
        <span className="pb-2">
          <Icon
            name="refresh"
            size={22}
            className={feed.refreshing ? "animate-spin motion-reduce:animate-none" : ""}
            style={{ transform: feed.refreshing ? undefined : `rotate(${pull * 4}deg)` }}
          />
        </span>
      </div>

      {feed.offline && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 border-[3px] border-accent bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-accent"
        >
          <Icon name="wifiOff" size={16} /> Sei offline: ecco gli ultimi segnali salvati
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {feed.items.map((item, i) => (
          <li key={item.id}>
            <FeedCard item={item} index={i} />
          </li>
        ))}
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
