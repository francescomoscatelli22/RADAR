"use client";

import { useSyncExternalStore } from "react";

/*
  Un solo orologio per tutta l'app, che batte ogni minuto (e quando si torna sull'app).
  Serve agli orari relativi ("5 min" → "6 min"): si ridisegnano solo le scritte dell'orario,
  non le card intere. Finché nessuno lo usa, l'orologio è fermo.
*/

let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const tick = () => {
  now = Date.now();
  listeners.forEach((l) => l());
};
const onVisible = () => document.visibilityState === "visible" && tick();

function subscribe(cb: () => void) {
  if (listeners.size === 0) {
    now = Date.now();
    timer = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", onVisible);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** L'ora attuale (ms), aggiornata ogni minuto. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
