// Assegna gli argomenti a un contenuto.
// 1) quelli fissi della fonte (es. un canale taggato "ai-3d")
// 2) se la fonte è generalista (match_keywords), quelli trovati con le parole chiave.
// Le parole chiave NON sono nel codice: arrivano dalla tabella "topics".
//
// Due regole per le parole chiave (così con centinaia di argomenti non escono falsi positivi):
//  - Le SIGLE tutte maiuscole (AI, LLM, 3D, GPU…) distinguono le maiuscole: l'"ai" italiano
//    ("ai cittadini") non viene scambiato per AI.
//  - Un "@" davanti (es. "@healthcare", "@sanità") significa: vale solo se nel testo c'è
//    anche un termine dell'argomento "ai". Così "sanità" in un articolo di cronaca NON conta,
//    ma "sanità" in un articolo sull'intelligenza artificiale sì.

import type { RawItem, Source, Topic, Item } from "./types";

/** Una prova: dato il testo di un contenuto, dice se l'argomento ci sta dentro. */
export type Matcher = (text: string) => boolean;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parola (o frase) intera. Sigle di 2-6 caratteri tutte maiuscole: maiuscole obbligatorie. */
function keywordRegex(k: string): RegExp {
  const isAcronym = /^[A-Z0-9]{2,6}$/.test(k);
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(k)}(?![\\p{L}\\p{N}])`, isAcronym ? "u" : "iu");
}

/** Costruisce una volta sola le prove per ogni argomento. */
export function buildMatchers(topics: Topic[]): Map<string, Matcher[]> {
  // "contesto AI": le parole chiave dell'argomento radice "ai" (senza "@")
  const aiRegexes = (topics.find((t) => t.slug === "ai")?.keywords ?? [])
    .filter((k) => !k.startsWith("@"))
    .map(keywordRegex);
  const hasAiContext: Matcher = (text) => aiRegexes.some((r) => r.test(text));

  const map = new Map<string, Matcher[]>();
  for (const t of topics) {
    map.set(
      t.slug,
      t.keywords.map((k): Matcher => {
        if (k.startsWith("@")) {
          const r = keywordRegex(k.slice(1));
          return (text) => r.test(text) && hasAiContext(text);
        }
        const r = keywordRegex(k);
        return (text) => r.test(text);
      }),
    );
  }
  return map;
}

/** Restituisce l'item con gli argomenti, oppure null se va scartato. */
export function assignTopics(
  raw: RawItem,
  source: Source,
  matchers: Map<string, Matcher[]>,
): Item | null {
  // Argomenti fissi della fonte. Con il "+" davanti (es. "+ai-italia") valgono solo DOPO
  // il filtro: servono alle fonti generalista (Il Post, BBC…) per dire "se è roba AI, è anche Italia".
  const fixed = source.topics.filter((t) => !t.startsWith("+"));
  const afterFilter = source.topics.filter((t) => t.startsWith("+")).map((t) => t.slice(1));
  const found = new Set<string>(fixed);

  if (source.match_keywords) {
    const haystack = `${raw.title} ${raw.summary}`;
    for (const [slug, tests] of matchers) {
      if (tests.some((test) => test(haystack))) found.add(slug);
    }
    // Fonte generalista senza nessun argomento trovato: non è roba per Radar.
    if (found.size === 0) return null;
  }

  for (const t of afterFilter) found.add(t);
  return { ...raw, topics: [...found] };
}
