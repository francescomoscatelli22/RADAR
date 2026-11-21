"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Connessione di Supabase usata dal browser, SOLO per l'accesso con account (Supabase Auth).
  Usa la chiave "anon" (pubblica per natura: la sicurezza sta nelle regole RLS del database).
  Se le due variabili non sono impostate l'app funziona lo stesso, senza account.

  Velocità: la libreria di Supabase pesa ~65 KB compressi. Non la mettiamo nel primo
  caricamento: la scarichiamo a parte (import dinamico) solo quando serve davvero,
  così la pagina si vede e risponde prima.
*/

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: Promise<SupabaseClient> | null = null;

/** true se gli account sono configurati (servono URL e chiave anon). */
export const authConfigured = Boolean(URL && ANON);

/** Il client di Supabase (scaricato alla prima richiesta), o null se gli account non sono configurati. */
export function supabaseBrowser(): Promise<SupabaseClient> | null {
  if (!URL || !ANON) return null;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  );
  return client;
}
