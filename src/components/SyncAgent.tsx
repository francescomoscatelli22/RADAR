"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { startSync } from "@/lib/sync";

/** Non mostra niente: quando c'è un account collegato, tiene sincronizzati i dati con Supabase. */
export default function SyncAgent() {
  const { user } = useAuth();
  const id = user?.id;
  useEffect(() => {
    if (!id) return;
    return startSync(id);
  }, [id]);
  return null;
}
