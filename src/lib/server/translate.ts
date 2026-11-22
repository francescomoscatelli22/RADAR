import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedItem } from "@/lib/feed";
import type { Lang } from "@/lib/languages";

/*
  Traduzione di titoli e anteprime, solo dal server.
  - Il traduttore è Cloudflare Workers AI (modello m2m100, piano gratuito: 10.000 "neuroni" al giorno).
    Servono CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN; senza, si usano solo le traduzioni già salvate.
  - Ogni traduzione si fa UNA volta e si salva nella tabella "translations": la volta dopo è gratis
    e vale per tutti. Così il piano gratuito basta.
  - Se il traduttore è lento o non risponde, la card resta nella lingua originale (mai errori all'utente)
    e alla prossima richiesta si riprova.
  Per cambiare servizio di traduzione basta riscrivere `translateText` qui sotto: il resto non cambia.
*/

const MODEL = "@cf/meta/m2m100-1.2b";
const CONCURRENCY = 6;
const COOLDOWN_MS = 5 * 60_000; // dopo un errore (es. limite giornaliero finito) si smette di insistere per qualche minuto

// nomi in inglese per il traduttore (la documentazione mostra sia codici "it" sia nomi "italian": si prova prima il codice)
const NAMES: Record<string, string> = {
  en: "english", it: "italian", es: "spanish", fr: "french", de: "german", pt: "portuguese", nl: "dutch",
  ru: "russian", zh: "chinese", ja: "japanese", ko: "korean", pl: "polish", tr: "turkish", ar: "arabic",
  sv: "swedish", uk: "ukrainian", hi: "hindi",
};

let coolUntil = 0;
let useNames = false; // diventa true se il servizio rifiuta i codici a due lettere

function configured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}

/** Traduce un testo. Restituisce null se non riesce. */
export async function translateText(text: string, from: string, to: string, signal?: AbortSignal): Promise<string | null> {
  if (!configured() || Date.now() < coolUntil) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const names = useNames;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source_lang: names ? (NAMES[from] ?? from) : from,
          target_lang: names ? (NAMES[to] ?? to) : to,
        }),
        signal,
      });
      if (res.status === 400 && attempt === 0) {
        useNames = !names; // forse non accetta questo formato di lingua: si riprova una volta con l'altro (impostato, non invertito: più richieste insieme non si annullano a vicenda)
        continue;
      }
      if (!res.ok) {
        if (res.status !== 400) coolUntil = Date.now() + COOLDOWN_MS;
        return null;
      }
      const json = (await res.json()) as { result?: { translated_text?: string; translation?: string }; success?: boolean };
      const out = json.result?.translated_text ?? json.result?.translation;
      return typeof out === "string" && out.trim() ? out.trim() : null;
    } catch {
      return null; // tempo scaduto o rete: la card resta in lingua originale
    }
  }
  return null;
}

/**
 * Aggiunge `tr` ai contenuti scritti in una lingua diversa da `target`:
 * prima dalle traduzioni già salvate, poi traducendo quelle che mancano (entro `budgetMs`).
 */
export async function attachTranslations(db: SupabaseClient, items: FeedItem[], target: Lang, budgetMs = 8000) {
  const todo = items.filter((i) => i.lang && i.lang !== target);
  if (!todo.length) return;

  const cached = await db
    .from("translations")
    .select("item_id, title, summary")
    .eq("lang", target)
    .in("item_id", todo.map((i) => i.id));
  const known = new Map<string, { title: string; summary: string }>();
  for (const r of (cached.data ?? []) as { item_id: string; title: string; summary: string }[]) known.set(r.item_id, r);
  for (const i of todo) {
    const t = known.get(i.id);
    if (t) i.tr = { lang: target, title: t.title, summary: t.summary };
  }

  const missing = todo.filter((i) => !i.tr);
  if (!missing.length || !configured() || Date.now() < coolUntil) return;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), budgetMs);
  const fresh: { item_id: string; lang: string; title: string; summary: string }[] = [];
  const queue = [...missing];
  try {
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let i = queue.shift(); i; i = queue.shift()) {
          const from = i.lang as string;
          // i titoli delle release sono versioni ("v0.40.17"): si lasciano com'è e si traduce solo l'anteprima
          const title = i.platform === "github" ? i.title : await translateText(i.title, from, target, ctrl.signal);
          if (title === null) continue;
          const summary = i.summary ? await translateText(i.summary, from, target, ctrl.signal) : "";
          if (summary === null) continue;
          i.tr = { lang: target, title, summary };
          fresh.push({ item_id: i.id, lang: target, title, summary });
        }
      }),
    );
  } finally {
    clearTimeout(timer);
  }
  if (fresh.length) await db.from("translations").upsert(fresh, { onConflict: "item_id,lang" });
}
