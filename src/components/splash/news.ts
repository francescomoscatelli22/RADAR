/*
  Notizie di ESEMPIO per la schermata iniziale (decorative, non vere).
  Nel feed vero arriveranno dal raccoglitore di fonti.
  Servono alla card in evidenza. Sotto ci sono anche le categorie dei nastri.
*/

export type Item =
  | { id: string; type: "video"; tag: string; title: string }
  | { id: string; type: "post"; name: string; role: string; initials: string; body: string }
  | { id: string; type: "article"; tag: string; title: string; excerpt: string }
  | { id: string; type: "thread"; points: number; title: string }
  | { id: string; type: "release"; repo: string; version: string; notes: string[] }
  | { id: string; type: "audio"; tag: string; title: string; meta: string };

export type Type = Item["type"];

// Formati alternati, così due notizie di fila non sono mai dello stesso tipo.
export const POOL: Item[] = [
  { id: "vid-1", type: "video", tag: "YOUTUBE · LAB AI · 2 H", title: "Come funziona un modello di diffusione" },
  { id: "post-1", type: "post", name: "Marta Rossi", role: "Head of Design · Milano", initials: "MR", body: "Tre anni fa abbiamo smesso di fare roadmap trimestrali." },
  { id: "thr-1", type: "thread", points: 482, title: "Show HN: un editor di video nel browser" },
  { id: "aud-1", type: "audio", tag: "PODCAST · FUTURI SINTETICI", title: "Il futuro degli agenti: intervista ai fondatori", meta: "42 MIN · EP. 318" },
  { id: "art-1", type: "article", tag: "ARTICOLO · DESIGN BLOG · 1 H", title: "Come progettare un servizio che le persone usano davvero", excerpt: "Cinque domande da farsi prima di disegnare una schermata." },
  { id: "rel-1", type: "release", repo: "ACME/AGENT-KIT", version: "v2.4.0", notes: ["+ sub-agenti in parallelo", "+ nuovi hook pre-commit", "~ fix: memoria sessione"] },
  { id: "vid-2", type: "video", tag: "YOUTUBE · DESIGN LAB · 5 H", title: "Un logo con l'AI in 60 secondi" },
  { id: "post-2", type: "post", name: "Luca Bianchi", role: "Product · Torino", initials: "LB", body: "Ho provato 12 strumenti di AI per il design: ne uso ancora tre." },
  { id: "thr-2", type: "thread", points: 317, title: "Ask HN: come usate gli agenti AI al lavoro?" },
  { id: "aud-2", type: "audio", tag: "PODCAST · SEGNALI", title: "Immagini che si muovono: la nuova ondata", meta: "58 MIN · EP. 61" },
  { id: "art-2", type: "article", tag: "ARTICOLO · AI NEWS · 3 H", title: "Che cos'è un modello multimodale, spiegato bene", excerpt: "Testo, immagini e audio nello stesso cervello." },
  { id: "rel-2", type: "release", repo: "DIFFUSION-LAB", version: "v0.9.1", notes: ["+ supporto video", "+ modelli più piccoli", "~ fix: memoria GPU"] },
  { id: "vid-3", type: "video", tag: "YOUTUBE · DEV LAB · 1 H", title: "Agenti AI: 5 errori da evitare" },
  { id: "post-3", type: "post", name: "Giulia Verdi", role: "UX Research · Roma", initials: "GV", body: "Il miglior prompt è una buona domanda, non un trucco." },
  { id: "thr-3", type: "thread", points: 905, title: "Un nuovo modello open source per le immagini" },
  { id: "aud-3", type: "audio", tag: "PODCAST · FUTURI SINTETICI", title: "Etica e AI: chi decide le regole?", meta: "36 MIN · EP. 322" },
  { id: "art-3", type: "article", tag: "ARTICOLO · ETICA · 6 H", title: "AI generativa e copyright: cosa sta cambiando", excerpt: "Le regole nuove, caso per caso." },
];

// Categorie dei due nastri in fondo: sono TUTTI i settori dell'AI, letti dallo stesso elenco
// che usa la raccolta (scripts/seed/topics.json). Una sola fonte di verità: se aggiungi un
// settore lì, compare anche qui. Si mescolano le aree (generativa, tecnologia, settori…)
// e si dividono in due liste senza voci in comune.
import topicsData from "../../../scripts/seed/topics.json";

type SeedTopic = { slug: string; label: string; parent_slug: string | null; sort_order: number; keywords: string[] };
const ALL = topicsData as SeedTopic[];

function areaOf(t: SeedTopic): string {
  let cur = t;
  while (cur.parent_slug && cur.parent_slug !== "ai") {
    const parent = ALL.find((x) => x.slug === cur.parent_slug);
    if (!parent) break;
    cur = parent;
  }
  return cur.slug;
}

function interleavedLabels(): string[] {
  const areas = new Map<string, string[]>();
  for (const t of [...ALL].sort((a, b) => a.sort_order - b.sort_order)) {
    if (t.slug === "ai") continue; // la radice "AI" è il tutto, non una categoria
    if (t.keywords.length === 0) continue; // i contenitori ("Dove", "Settori e applicazioni"…) non sono categorie da leggere
    const key = areaOf(t);
    areas.set(key, [...(areas.get(key) ?? []), t.label]);
  }
  const lists = [...areas.values()];
  const out: string[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
  }
  return out;
}

const LABELS = interleavedLabels();
export const CATEGORIES_A: string[] = LABELS.filter((_, i) => i % 2 === 0);
export const CATEGORIES_B: string[] = LABELS.filter((_, i) => i % 2 === 1);
