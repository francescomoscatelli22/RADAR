"use client";

import { useEffect } from "react";

/** Registra il service worker (solo nella versione vera, non in sviluppo) per far aprire l'app anche offline. */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* nessun service worker: l'app funziona lo stesso, solo senza modalità offline */
    });
  }, []);
  return null;
}
