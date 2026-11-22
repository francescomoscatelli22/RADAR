"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem, FeedPage, Format } from "@/lib/feed";
import { useLang } from "@/lib/store";

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

async function fetchPage(q: Pick<FeedQuery, "topics" | "sources" | "format"> & { lang: string }, cursor: string | null, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  qs.set("lang", q.lang); // il server traduce titoli e anteprime scritti in altre lingue
  if (q.topics?.length) qs.set("topics", q.topics.join(","));
  if (q.sources?.length) qs.set("sources", q.sources.join(","));
  if (q.format !== "all") qs.set("format", q.format);
  if (cursor) qs.set("cursor", cursor);
  qs.set("limit", "20");
  const res = await fetch(`/api/feed?${qs}`, { signal });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  return (await res.json()) as FeedPage;
}

/**
 * Il server risponde presto con le traduzioni pronte e dice quante mancano (`pending`):
 * qui si richiede la stessa pagina, al massimo 12 volte a distanza di qualche secondo, finché le card in lingua originale diventano tradotte.
 */
async function completeTranslations(
  first: FeedPage,
  q: Parameters<typeof fetchPage>[0],
  cursor: string | null,
  apply: (page: FeedPage) => void,
  signal?: AbortSignal,
) {
  let page = first;
  for (let n = 0; n < 12 && page.pending; n++) {
    // le traduzioni in corso sul server finiscono in pochi secondi: si aspetta prima di richiedere
    await new Promise((r) => setTimeout(r, 2500));
    if (signal?.aborted) return;
    try {
      page = await fetchPage(q, cursor, signal);
    } catch {
      return; // senza rete o richiesta annullata: le card restano nella lingua originale
    }
    if (signal?.aborted) return;
    apply(page);
  }
}

/** Mette nelle card già in lista le traduzioni arrivate dopo (si abbinano per id). */
function mergeTranslations(items: FeedItem[], page: FeedPage): FeedItem[] {
  const byId = new Map(page.items.filter((i) => i.tr).map((i) => [i.id, i.tr]));
  if (!byId.size) return items;
  return items.map((i) => (!i.tr && byId.has(i.id) ? { ...i, tr: byId.get(i.id) } : i));
}

/*
  Memoria del feed finché l'app resta aperta: cambiando scheda e tornando indietro
  la lista ricompare subito, con tutte le pagine già caricate e nello stesso punto di scorrimento.
*/
type Memory = { items: FeedItem[]; next: string | null; scrollY: number };
const memory = new Map<string, Memory>();

export function useFeed(query: FeedQuery) {
  const { topics, sources, format, enabled } = query;
  const lang = useLang();
  // la lingua fa parte della chiave: cambiandola, memoria e copia offline del feed non si mescolano
  const key = JSON.stringify([topics ?? [], sources ?? [], format, lang]);
  const [data, setData] = useState<Data | null>(() => {
    const m = memory.get(key);
    return m ? { key, items: m.items, next: m.next, status: "ready", offline: false } : null;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(0);
  const [fresh, setFresh] = useState<FeedItem[]>([]);
  const busy = useRef(false);
  const manual = useRef(false); // true = l'utente ha chiesto di ricaricare (allora si sostituisce tutto)
  // sempre l'ultima richiesta, senza dover rifare gli effetti a ogni render
  const latest = useRef({ topics, sources, format, lang, key });
  useEffect(() => {
    latest.current = { topics, sources, format, lang, key };
  });

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    const q = latest.current;
    const replaceAll = manual.current;
    manual.current = false;

    // 0) cambiando filtro e tornando indietro: la lista già vista ricompare dalla memoria
    const m = memory.get(q.key);
    if (m) setData((prev) => (prev?.key === q.key ? prev : { key: q.key, items: m.items, next: m.next, status: "ready", offline: false }));

    // 1) la copia salvata (se c'è) appare subito
    Promise.resolve(readCache(q.key)).then((cached) => {
      if (ctrl.signal.aborted || !cached) return;
      setData((prev) => (prev && prev.key === q.key && prev.status === "ready" ? prev : { key: q.key, items: cached.items, next: cached.next, status: "ready", offline: false }));
    });

    // 2) i dati freschi arrivano e la sostituiscono
    fetchPage(q, null, ctrl.signal)
      .then((page) => {
        writeCache(q.key, page);
        // contenuti non ancora tradotti: si completano in background, senza bloccare la lista
        if (page.pending) {
          void completeTranslations(
            page,
            q,
            null,
            (p) => setData((prev) => (prev && prev.key === q.key ? { ...prev, items: mergeTranslations(prev.items, p) } : prev)),
            ctrl.signal,
          );
        }
        const kept = memory.get(q.key);
        // lista già in memoria (si torna da un'altra scheda) e la pagina nuova si "aggancia" a quella:
        // non si tocca la lista (resta il punto di lettura) e i nuovi arrivi compaiono con "N nuovi segnali"
        if (!replaceAll && kept && kept.items.length) {
          const seen = new Set(kept.items.map((i) => i.id));
          const joins = page.items.some((i) => seen.has(i.id));
          if (joins) {
            const top = new Date(kept.items[0].publishedAt).getTime();
            setFresh(page.items.filter((i) => !seen.has(i.id) && new Date(i.publishedAt).getTime() >= top));
            setData((prev) => (prev && prev.key === q.key ? { ...prev, offline: false } : prev));
            return;
          }
        }
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
  const itemsRef = useRef<FeedItem[]>([]);
  useEffect(() => {
    itemsRef.current = view?.items ?? [];
  });

  // la lista caricata resta in memoria (il punto di scorrimento lo aggiorna rememberScroll)
  useEffect(() => {
    if (!view || view.status !== "ready" || !view.items.length) return;
    const old = memory.get(view.key);
    memory.set(view.key, { items: view.items, next: view.next, scrollY: old?.scrollY ?? 0 });
  }, [view]);

  /** Il punto di scorrimento da ripristinare tornando su questa lista (0 = dall'inizio). */
  const savedScroll = useCallback(() => memory.get(latest.current.key)?.scrollY ?? 0, []);
  const rememberScroll = useCallback((y: number) => {
    const m = memory.get(latest.current.key);
    if (m) m.scrollY = y;
  }, []);

  const loadMore = useCallback(async () => {
    const cur = view;
    if (!cur?.next || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const query = latest.current;
      const page = await fetchPage(query, cur.next);
      setData((prev) => {
        if (!prev || prev.key !== latest.current.key) return prev;
        const seen = new Set(prev.items.map((i) => i.id));
        return { ...prev, items: [...prev.items, ...page.items.filter((i) => !seen.has(i.id))], next: page.next };
      });
      if (page.pending) {
        void completeTranslations(page, query, cur.next, (p) =>
          setData((prev) => (prev && prev.key === query.key ? { ...prev, items: mergeTranslations(prev.items, p) } : prev)),
        );
      }
    } catch {
      /* resta il pulsante "Riprova" in fondo */
      setData((prev) => (prev ? { ...prev, offline: true } : prev));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, [view]);

  const refresh = useCallback(() => {
    manual.current = true;
    setFresh([]);
    setRefreshing(true);
    setToken((t) => t + 1);
  }, []);

  // Segnali nuovi: ogni minuto (e quando si torna sull'app) si guarda la prima pagina.
  // Quelli che non sono ancora nella lista restano da parte e compaiono con "N nuovi segnali".
  const ready = view?.status === "ready";
  useEffect(() => {
    if (!enabled || !ready) return;
    let stop = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        let page = await fetchPage(latest.current, null);
        // i segnali appena usciti arrivano spesso non ancora tradotti: si completano prima di mostrare "N nuovi segnali"
        await completeTranslations(page, latest.current, null, (p) => (page = p));
        if (stop) return;
        const current = itemsRef.current;
        const seen = new Set(current.map((i) => i.id));
        // solo quelli più recenti del primo della lista
        const top = current[0] ? new Date(current[0].publishedAt).getTime() : 0;
        const news = page.items.filter((i) => !seen.has(i.id) && new Date(i.publishedAt).getTime() >= top);
        setFresh((old) => (old.length === news.length && old.every((o, k) => o.id === news[k].id) ? old : news));
      } catch {
        /* niente rete: riprova al prossimo giro */
      }
    };
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stop = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [enabled, ready, key]);

  /** Mette in cima i segnali nuovi arrivati nel frattempo. */
  const showFresh = useCallback(() => {
    setData((prev) => {
      if (!prev) return prev;
      const seen = new Set(prev.items.map((i) => i.id));
      const merged = [...fresh.filter((i) => !seen.has(i.id)), ...prev.items].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      return { ...prev, items: merged };
    });
    setFresh([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fresh]);

  return {
    freshCount: fresh.length,
    showFresh,
    items: view?.items ?? [],
    status: (view?.status ?? "loading") as Status,
    offline: view?.offline ?? false,
    hasMore: Boolean(view?.next),
    loadingMore,
    refreshing,
    loadMore,
    refresh,
    savedScroll,
    rememberScroll,
  };
}
