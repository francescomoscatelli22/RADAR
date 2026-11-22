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
const CONCURRENCY = 10; // contenuti tradotti insieme (due richieste ciascuno)
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

// contenuti che questo server sta già traducendo: una richiesta ripetuta non li rifà (spreca il piano gratuito)
const inflight = new Set<string>();
const HARD_LIMIT_MS = 25_000; // oltre questo tempo una traduzione ancora in corso si abbandona

/**
 * Aggiunge `tr` ai contenuti scritti in una lingua diversa da `target`:
 * prima dalle traduzioni già salvate, poi traducendo quelle che mancano.
 * Aspetta al massimo `softMs`: le traduzioni ancora in corso proseguono e si salvano da sole
 * (la promessa `done` serve a `after()` di Next per tenerle vive), così la richiesta dopo le trova pronte.
 */
export async function attachTranslations(
  db: SupabaseClient,
  items: FeedItem[],
  target: Lang,
  softMs = 3000,
): Promise<{ done: Promise<void> }> {
  const none = { done: Promise.resolve() };
  const todo = items.filter((i) => i.lang && i.lang !== target);
  if (!todo.length) return none;

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

  const key = (id: string) => `${id}:${target}`;
  const missing = todo.filter((i) => !i.tr && !inflight.has(key(i.id)));
  if (!missing.length || !configured() || Date.now() < coolUntil) return none;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HARD_LIMIT_MS);
  const queue = [...missing];
  for (const i of queue) inflight.add(key(i.id));

  const done = Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let i = queue.shift(); i; i = queue.shift()) {
        try {
          const from = i.lang as string;
          // i titoli delle release sono versioni ("v0.40.17"): si lasciano com'è e si traduce solo l'anteprima.
          // Titolo e anteprima partono insieme: dimezza l'attesa.
          const [title, summary] = await Promise.all([
            i.platform === "github" ? i.title : translateText(i.title, from, target, ctrl.signal),
            i.summary ? translateText(i.summary, from, target, ctrl.signal) : "",
          ]);
          if (title === null || summary === null) continue;
          i.tr = { lang: target, title, summary };
          // si salva subito, una per una: anche se la richiesta è già finita, il lavoro fatto non si perde
          await db.from("translations").upsert({ item_id: i.id, lang: target, title, summary }, { onConflict: "item_id,lang" });
        } finally {
          inflight.delete(key(i.id));
        }
      }
    }),
  )
    .then(() => undefined)
    .finally(() => clearTimeout(timer));

  // risposta dopo `softMs` al massimo; il resto prosegue in `done`
  await Promise.race([done, new Promise((r) => setTimeout(r, softMs))]);
  return { done };
}
