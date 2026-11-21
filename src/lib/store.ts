"use client";

import { useSyncExternalStore } from "react";
import type { FeedItem, Platform } from "@/lib/feed";

/*
  Archivio locale di Radar (sul dispositivo, in localStorage): argomenti scelti,
  fonti seguite e contenuti salvati. Funziona anche senza account e senza rete.
  Con un account, src/lib/sync.ts copia questi dati su Supabase e li ritrova su un altro dispositivo.
*/

export type Follow = { ids: string[]; name: string; platform: Platform };

export type RadarData = {
  topics: string[] | null; // null = la scelta degli argomenti non è ancora stata fatta
  follows: Follow[];
  saved: FeedItem[]; // copie complete: si rileggono anche offline
  updatedAt: number; // serve alla sincronizzazione per capire quale copia è più recente
};

export type RadarState = RadarData & { ready: boolean };

const KEY = "radar:v1";
const MAX_SAVED = 300;

const EMPTY: RadarData = { topics: null, follows: [], saved: [], updatedAt: 0 };
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

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const radar = {
  get: getState,
  subscribe,
  setTopics(topics: string[]) {
    commit({ topics });
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
  /** Sostituisce tutto con i dati arrivati dall'account (non conta come modifica locale). */
  replace(data: Omit<RadarData, "updatedAt"> & { updatedAt: number }) {
    commit(data, false);
  },
  reset() {
    commit({ ...EMPTY }, false);
  },
};

/** Legge l'archivio nei componenti (si aggiorna da solo a ogni modifica). */
export function useRadar(): RadarState {
  return useSyncExternalStore(subscribe, getState, () => SERVER);
}
