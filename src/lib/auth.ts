"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser, authConfigured } from "./supabase-browser";

/*
  Stato dell'accesso, leggibile da qualunque componente con useAuth().
  Tiene un solo ascoltatore di Supabase per tutta l'app.
*/

export type AuthState = {
  configured: boolean;
  loading: boolean; // true finché non sappiamo se c'è una sessione
  user: User | null;
};

const SERVER: AuthState = { configured: authConfigured, loading: authConfigured, user: null };
let state: AuthState = { configured: authConfigured, loading: authConfigured, user: null };
const listeners = new Set<() => void>();
let started = false;

function set(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  const db = supabaseBrowser();
  if (!db) return;
  db.auth.getSession().then(({ data }) => set({ loading: false, user: data.session?.user ?? null }));
  db.auth.onAuthStateChange((_event, session) => set({ loading: false, user: session?.user ?? null }));
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Traduce gli errori di Supabase in frasi chiare per l'utente. */
export function authErrorMessage(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Email o password non corrette.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esiste già un account con questa email: prova ad accedere.";
  if (m.includes("at least") && m.includes("character")) return "La password deve avere almeno 6 caratteri.";
  if (m.includes("valid email") || m.includes("invalid email") || m.includes("unable to validate email")) return "Controlla l'indirizzo email: non sembra valido.";
  if (m.includes("not confirmed")) return "Prima conferma la tua email: ti abbiamo scritto un link.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Troppi tentativi: riprova tra qualche minuto.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Connessione assente: riprova quando torna la rete.";
  return "Qualcosa è andato storto. Riprova.";
}

export async function signInWithGoogle() {
  const db = supabaseBrowser();
  if (!db) return { ok: false as const, reason: "not-configured" as const };
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  return error ? { ok: false as const, reason: "error" as const, message: error.message } : { ok: true as const };
}

export async function signOut() {
  await supabaseBrowser()?.auth.signOut();
}
