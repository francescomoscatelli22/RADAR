import "server-only";
import { createClient } from "@supabase/supabase-js";

/*
  Connessione al database SOLO dal server, con la chiave di servizio.
  Il database ha RLS attiva e nessuna regola di lettura pubblica: il browser non può
  leggerlo da solo, passa dalle rotte in src/app/api/ che restituiscono solo i campi pubblici.
*/
export function serverDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
