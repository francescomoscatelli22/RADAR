"use client";

import { useSyncExternalStore } from "react";
import { radar, type RadarData } from "./store";
import { supabaseBrowser } from "./supabase-browser";

/*
  Sincronizzazione con l'account: argomenti, fonti seguite e salvati sono copiati su Supabase
  (tabella user_state, una riga per utente, visibile solo al proprietario grazie alla RLS)
  e ritrovati su un altro dispositivo. Vince la copia più recente (updatedAt).
  Senza account o senza rete non succede nulla: l'archivio locale funziona da solo.
*/

export type SyncStatus = "idle" | "pulling" | "ready";

let status: SyncStatus = "idle";
const listeners = new Set<() => void>();
const setStatus = (s: SyncStatus) => {
  status = s;
  listeners.forEach((l) => l());
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => status,
    () => "idle" as SyncStatus,
  );
}

type Row = { data: Omit<RadarData, "updatedAt">; updated_at: number };

let stop: (() => void) | null = null;

/** Avvia la sincronizzazione per questo utente. Restituisce la funzione che la ferma. */
export function startSync(userId: string) {
  stop?.();
  const pending = supabaseBrowser();
  if (!pending) return () => {};

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let applyingRemote = false;

  const push = async () => {
    const db = await pending;
    const { ready: _ready, ...local } = radar.get();
    void _ready;
    const { updatedAt, ...data } = local;
    await db.from("user_state").upsert({ user_id: userId, data, updated_at: updatedAt });
  };

  const unsubscribe = radar.subscribe(() => {
    if (applyingRemote || cancelled) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      push().catch(() => {
        /* senza rete: ci riprova alla prossima modifica */
      });
    }, 1500);
  });

  (async () => {
    setStatus("pulling");
    try {
      const db = await pending;
      const { data: row } = await db.from("user_state").select("data, updated_at").eq("user_id", userId).maybeSingle<Row>();
      if (cancelled) return;
      const local = radar.get();
      if (row && row.updated_at > local.updatedAt) {
        applyingRemote = true;
        radar.replace({
          lang: row.data.lang ?? local.lang, // gli account creati prima della lingua non hanno il campo: si tiene quella del dispositivo
          topics: row.data.topics ?? null,
          follows: row.data.follows ?? [],
          saved: row.data.saved ?? [],
          updatedAt: row.updated_at,
        });
        applyingRemote = false;
      } else if (local.lang !== null || local.topics !== null || local.follows.length || local.saved.length) {
        await push();
      }
    } catch {
      /* offline: si userà la copia locale */
    } finally {
      if (!cancelled) setStatus("ready");
    }
  })();

  stop = () => {
    cancelled = true;
    clearTimeout(timer);
    unsubscribe();
    setStatus("idle");
  };
  return stop;
}
