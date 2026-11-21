"use client";

import { useSyncExternalStore } from "react";

/*
  Notifiche brevi in basso ("Salvato · Annulla"). Una alla volta: la nuova sostituisce la vecchia.
  Scritte a mano invece di usare una libreria: sono poche righe e restano nello stile zine.
  Esempio: toast("Salvato", { label: "Annulla", run: () => radar.toggleSaved(item) })
*/

export type Toast = { id: number; message: string; action?: { label: string; run: () => void } };

const DURATION_MS = 3500;

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, action?: Toast["action"]) {
  clearTimeout(timer);
  current = { id: nextId++, message, action };
  emit();
  timer = setTimeout(dismissToast, action ? DURATION_MS + 1500 : DURATION_MS); // con "Annulla" c'è più tempo
}

export function dismissToast() {
  clearTimeout(timer);
  current = null;
  emit();
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => current,
    () => null,
  );
}
