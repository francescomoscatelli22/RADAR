"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem, FeedPage, Format } from "@/lib/feed";

/*
  Carica il feed a pagine dalla rotta /api/feed.
  - mostra subito l'ultima copia salvata (anche offline) e intanto chiede i dati freschi
  - `loadMore` aggiunge la pagina dopo; `refresh` ricarica da capo senza svuotare la lista
*/

export type FeedQuery = {
  topics?: string[];
  sources?: string[];
  format: Format;
  enabled: boolean;
};

type Status = "loading" | "ready" | "error";
type Data = { key: string; items: FeedItem[]; next: string | null; status: Status; offline: boolean };

const CACHE_KEY = "radar:feedcache:v1";
const CACHE_MAX_ENTRIES = 8;

type CacheMap = Record<string, { page: FeedPage; at: number }>;

function readCache(key: string): FeedPage | null {
  try {
    const map = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as CacheMap;
    return map[key]?.page ?? null;
  } catch {
    return null;
  }
}

function writeCache(key: string, page: FeedPage) {
  try {
    const map = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as CacheMap;
    map[key] = { page, at: Date.now() };
    const keys = Object.keys(map).sort((a, b) => map[b].at - map[a].at);
    for (const old of keys.slice(CACHE_MAX_ENTRIES)) delete map[old];
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* spazio finito: pazienza, la copia offline è solo un di più */
  }
}

async function fetchPage(q: Pick<FeedQuery, "topics" | "sources" | "format">, cursor: string | null, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  if (q.topics?.length) qs.set("topics", q.topics.join(","));
  if (q.sources?.length) qs.set("sources", q.sources.join(","));
  if (q.format !== "all") qs.set("format", q.format);
  if (cursor) qs.set("cursor", cursor);
  qs.set("limit", "20");
  const res = await fetch(`/api/feed?${qs}`, { signal });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  return (await res.json()) as FeedPage;
}

export function useFeed(query: FeedQuery) {
  const { topics, sources, format, enabled } = query;
  const key = JSON.stringify([topics ?? [], sources ?? [], format]);
  const [data, setData] = useState<Data | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(0);
  const busy = useRef(false);
  // sempre l'ultima richiesta, senza dover rifare gli effetti a ogni render
  const latest = useRef({ topics, sources, format, key });
  useEffect(() => {
    latest.current = { topics, sources, format, key };
  });

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    const q = latest.current;

    // 1) la copia salvata (se c'è) appare subito
    Promise.resolve(readCache(q.key)).then((cached) => {
      if (ctrl.signal.aborted || !cached) return;
      setData((prev) => (prev && prev.key === q.key && prev.status === "ready" ? prev : { key: q.key, items: cached.items, next: cached.next, status: "ready", offline: false }));
    });

    // 2) i dati freschi arrivano e la sostituiscono
    fetchPage(q, null, ctrl.signal)
      .then((page) => {
        writeCache(q.key, page);
        setData({ key: q.key, items: page.items, next: page.next, status: "ready", offline: false });
      })
      .catch((err) => {
        if (ctrl.signal.aborted || err?.name === "AbortError") return;
        // senza rete: se c'è una copia la teniamo e lo segnaliamo, altrimenti errore
        setData((prev) =>
          prev && prev.key === q.key && prev.items.length
            ? { ...prev, offline: true }
            : { key: q.key, items: [], next: null, status: "error", offline: false },
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setRefreshing(false);
      });

    return () => ctrl.abort();
  }, [key, enabled, token]);

  const view = data && data.key === key ? data : null;

  const loadMore = useCallback(async () => {
    const cur = view;
    if (!cur?.next || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchPage(latest.current, cur.next);
      setData((prev) => {
        if (!prev || prev.key !== latest.current.key) return prev;
        const seen = new Set(prev.items.map((i) => i.id));
        return { ...prev, items: [...prev.items, ...page.items.filter((i) => !seen.has(i.id))], next: page.next };
      });
    } catch {
      /* resta il pulsante "Riprova" in fondo */
      setData((prev) => (prev ? { ...prev, offline: true } : prev));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, [view]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setToken((t) => t + 1);
  }, []);

  return {
    items: view?.items ?? [],
    status: (view?.status ?? "loading") as Status,
    offline: view?.offline ?? false,
    hasMore: Boolean(view?.next),
    loadingMore,
    refreshing,
    loadMore,
    refresh,
  };
}
