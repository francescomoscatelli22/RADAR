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

// Categorie per i due nastri scorrevoli in fondo: sono i temi che l'utente sceglierà
// alla registrazione. Due liste senza voci in comune, così i nastri non si ripetono mai uguali.
export const CATEGORIES_A: string[] = [
  "AI",
  "AI generativa",
  "Immagini",
  "Video",
  "3D e scene",
  "UI / UX",
  "Agenti",
  "Modelli linguistici",
  "Prompt design",
  "Strumenti",
  "Open source",
  "Audio e voce",
  "Codice",
  "Robotica",
];

export const CATEGORIES_B: string[] = [
  "Etica e regole",
  "Ricerca",
  "Nuovi modelli",
  "Design e AI",
  "Creatività",
  "Musica generativa",
  "Sicurezza",
  "Lavoro e AI",
  "Dati e privacy",
  "Chip e hardware",
  "Tutorial",
  "Educazione",
  "No-code",
  "Diffusione",
];
