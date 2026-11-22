"use client";

import { useSyncExternalStore } from "react";
import type { FeedItem, Platform } from "@/lib/feed";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/languages";

/*
  Archivio locale di Radar (sul dispositivo, in localStorage): argomenti scelti,
  fonti seguite e contenuti salvati. Funziona anche senza account e senza rete.
  Con un account, src/lib/sync.ts copia questi dati su Supabase e li ritrova su un altro dispositivo.
*/

export type Follow = { ids: string[]; name: string; platform: Platform };

export type RadarData = {
  lang: Lang | null; // lingua scelta; null = non ancora scelta (si usa l'italiano)
  topics: string[] | null; // null = la scelta degli argomenti non è ancora stata fatta
  follows: Follow[];
  saved: FeedItem[]; // copie complete: si rileggono anche offline
  updatedAt: number; // serve alla sincronizzazione per capire quale copia è più recente
};

export type RadarState = RadarData & { ready: boolean };

const KEY = "radar:v1";
const MAX_SAVED = 300;

const EMPTY: RadarData = { lang: null, topics: null, follows: [], saved: [], updatedAt: 0 };
// sul server (e durante l'idratazione) l'archivio non c'è ancora: ready=false
const SERVER: RadarState = { ...EMPTY, ready: false };

let state: RadarState | null = null;
const listeners = new Set<() => void>();

function load(): RadarState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<RadarData>;
      return {
        ready: true,
        lang: isLang(d.lang) ? d.lang : null,
        topics: Array.isArray(d.topics) ? d.topics : null,
        follows: Array.isArray(d.follows) ? d.follows : [],
        saved: Array.isArray(d.saved) ? d.saved : [],
        updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : 0,
      };
    }
  } catch {
    /* dati rovinati o archivio non disponibile: si riparte da vuoto */
  }
  return { ...EMPTY, ready: true };
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(patch: Partial<RadarData>, touch = true) {
  const cur = getState();
  const next: RadarState = { ...cur, ...patch, ready: true, updatedAt: touch ? Date.now() : (patch.updatedAt ?? cur.updatedAt) };
  state = next;
  try {
    const { ready: _ready, ...data } = next;
    void _ready;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* spazio finito o navigazione privata: l'app continua a funzionare in memoria */
  }
  emit();
}

function getState(): RadarState {
  return (state ??= load());
}

// un solo ascoltatore per tutta l'app: le modifiche fatte in un'altra scheda del browser arrivano qui
let watchingStorage = false;
function watchStorage() {
  if (watchingStorage) return;
  watchingStorage = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  watchStorage();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// insiemi di id ricalcolati solo quando l'archivio cambia: "è salvato?" diventa una ricerca istantanea
let indexFor: RadarState | null = null;
let savedIds = new Set<string>();
let followedIds = new Set<string>();
function index() {
  const s = getState();
  if (indexFor !== s) {
    indexFor = s;
    savedIds = new Set(s.saved.map((i) => i.id));
    followedIds = new Set(s.follows.flatMap((f) => f.ids));
  }
}

export const radar = {
  get: getState,
  subscribe,
  setTopics(topics: string[]) {
    commit({ topics });
  },
  setLang(lang: Lang) {
    commit({ lang });
  },
  isFollowing(sourceId: string) {
    return getState().follows.some((f) => f.ids.includes(sourceId));
  },
  toggleFollow(f: Follow) {
    const cur = getState().follows;
    const has = cur.some((x) => x.ids.some((id) => f.ids.includes(id)));
    commit({
      follows: has ? cur.filter((x) => !x.ids.some((id) => f.ids.includes(id))) : [...cur, f],
    });
  },
  toggleSaved(item: FeedItem) {
    const cur = getState().saved;
    const has = cur.some((x) => x.id === item.id);
    commit({ saved: has ? cur.filter((x) => x.id !== item.id) : [item, ...cur].slice(0, MAX_SAVED) });
  },
  /** Rimette un salvato al suo posto (serve ad "Annulla" dopo averlo tolto). */
  restoreSaved(item: FeedItem, at: number) {
    const cur = getState().saved.filter((x) => x.id !== item.id);
    const pos = Math.max(0, Math.min(at, cur.length));
    commit({ saved: [...cur.slice(0, pos), item, ...cur.slice(pos)].slice(0, MAX_SAVED) });
  },
  /** Sostituisce tutto con i dati arrivati dall'account (non conta come modifica locale). */
  replace(data: Omit<RadarData, "updatedAt"> & { updatedAt: number }) {
    commit(data, false);
  },
  reset() {
    commit({ ...EMPTY, lang: getState().lang }, false); // la lingua non si cancella: non è un dato da "ripulire"
  },
};

/** Legge l'archivio nei componenti (si aggiorna da solo a ogni modifica). */
export function useRadar(): RadarState {
  return useSyncExternalStore(subscribe, getState, () => SERVER);
}

/** La lingua dell'utente (italiano finché non ne sceglie un'altra). Cambia solo quando la cambia lui. */
export function useLang(): Lang {
  return useSyncExternalStore(
    subscribe,
    () => getState().lang ?? DEFAULT_LANG,
    () => DEFAULT_LANG,
  );
}

/*
  Versioni "mirate" per le card: restituiscono solo un sì/no, quindi una card si ridisegna
  solo quando cambia il SUO stato (salvarne una non ridisegna le altre cento del feed).
*/
export function useIsSaved(itemId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (index(), savedIds.has(itemId)),
    () => false,
  );
}

export function useIsFollowing(sourceId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (index(), followedIds.has(sourceId)),
    () => false,
  );
}
