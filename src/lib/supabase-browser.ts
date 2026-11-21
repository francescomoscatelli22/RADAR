"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
  Connessione di Supabase usata dal browser, SOLO per l'accesso con account (Supabase Auth).
  Usa la chiave "anon" (pubblica per natura: la sicurezza sta nelle regole RLS del database).
  Se le due variabili non sono impostate l'app funziona lo stesso, senza account.
*/

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** true se gli account sono configurati (servono URL e chiave anon). */
export const authConfigured = Boolean(URL && ANON);

export function supabaseBrowser(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  client ??= createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
