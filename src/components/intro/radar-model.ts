import type { Signal, SignalKind } from "@/lib/signals";
/*
  Il "modello" dell'intro radar: tutti i numeri e i tempi, senza grafica.

  La lancetta gira SENZA MAI FERMARSI, con calma: un giro ogni 5 secondi. Ogni giro:
  - fa apparire 5 puntini NUOVI in posti diversi (nascono al passaggio della lancetta e poi svaniscono piano: non restano fermi);
  - due dei 5 puntini mostrano un contenuto vero (una "scheda" dello stesso colore del puntino, in un posto diverso).

  Si lavora con un "orologio della lancetta" (`sweep`, in secondi): coincide con l'orologio dell'intro (`time`)
  finché dura il caricamento, poi continua da solo (vedi Intro.tsx). Da lì si ricava tutto, anche all'infinito:
  i puntini si generano da un "dado" a numeri fissi (stesso giro = stessi puntini), senza memorizzare nulla.
*/

// lo schermo del radar nell'artboard 390 x 844: tondo, sotto il nome, lontano dalla Dynamic Island
export const CX = 195;
export const CY = 424;
export const SCOPE_R = 148; // raggio dello schermo (il bordo con la scala dei gradi)
export const RING_RADII = [37, 74, 111, 148] as const;

export const SWEEP_START = 1.0; // la lancetta parte
export const START_ANGLE = 340; // gradi, in senso orario da "ore 12"
export const LAP_SECONDS = 5; // un giro = 5 secondi
export const SPEED = 360 / LAP_SECONDS; // gradi al secondo
export const PER_LAP = 5; // puntini nuovi a ogni giro
export const BLIP_LIFE = 3.2; // secondi di vita di un puntino prima di sparire del tutto
export const CARD_LIFE = 2.4; // secondi di vita di una scheda

/** Gradi percorsi dalla lancetta dal momento in cui parte (cresce senza limite: la lancetta non si ferma). */
export function sweepDist(s: number) {
  return s <= SWEEP_START ? 0 : SPEED * (s - SWEEP_START);
}

/** Angolo della lancetta (gradi, in senso orario da ore 12). */
export function sweepAngle(s: number) {
  return START_ANGLE + sweepDist(s);
}

/** Numero del giro in corso (0, 1, 2, … senza limite). */
export function lapIndex(s: number) {
  return Math.floor(sweepDist(s) / 360);
}

// ---------- il dado a numeri fissi ----------
function rand(seed: number) {
  // mulberry32: stesso seme = stessi numeri, su server e telefono
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- i puntini ----------
export type Geo = {
  g: number; // numero progressivo del puntino (n * PER_LAP + k)
  n: number; // giro
  k: number; // posizione nel giro (0..4, in ordine di passaggio della lancetta)
  x: number; // distanza dal centro, in unità dell'artboard
  y: number;
  tc: number; // secondo in cui la lancetta lo cattura
};

const lapCache = new Map<number, Geo[]>();

/** I 5 puntini del giro n: angoli sparsi ma diversi a ogni giro, in ordine di passaggio della lancetta. */
export function lapBlips(n: number): Geo[] {
  const hit = lapCache.get(n);
  if (hit) return hit;
  const r = rand(n + 1);
  const offset = r() * (360 / PER_LAP);
  // angoli (rispetto alla partenza) distribuiti sul giro con una deviazione, poi messi in ordine
  const angles = Array.from({ length: PER_LAP }, (_, k) => (offset + k * (360 / PER_LAP) + (r() - 0.5) * 40 + 360) % 360).sort((a, b) => a - b);
  const blips = angles.map((m, k) => {
    const rad = ((START_ANGLE + m) * Math.PI) / 180;
    const dist = 26 + r() * (SCOPE_R * 0.88 - 26);
    return {
      g: n * PER_LAP + k,
      n,
      k,
      x: dist * Math.sin(rad),
      y: -dist * Math.cos(rad),
      tc: SWEEP_START + (n * 360 + m) / SPEED,
    };
  });
  if (lapCache.size > 400) lapCache.clear();
  lapCache.set(n, blips);
  return blips;
}

export function blipGeo(g: number): Geo {
  const n = Math.floor(g / PER_LAP);
  return lapBlips(n)[g - n * PER_LAP];
}

/** Numero dell'ultimo puntino già catturato al secondo s (-1 se la lancetta non è ancora partita). */
export function blipNow(s: number) {
  if (s < SWEEP_START) return -1;
  const n = lapIndex(s);
  let count = 0;
  for (const b of lapBlips(n)) if (b.tc <= s) count++;
  return n * PER_LAP + count - 1;
}

// i puntini che mostrano anche un contenuto vero: il primo e il quarto di ogni giro
const LABELED_K = [0, 3] as const;

/** Il puntino del "contenuto" numero `ell` (2 per giro). */
export function labeledGeo(ell: number): Geo {
  const n = Math.floor(ell / 2);
  return lapBlips(n)[LABELED_K[ell - n * 2]];
}

/** Numero dell'ultimo contenuto già comparso al secondo s (-1 se nessuno). */
export function labeledNow(s: number) {
  if (s < SWEEP_START) return -1;
  const n = lapIndex(s);
  let count = 0;
  for (const k of LABELED_K) if (lapBlips(n)[k].tc <= s) count++;
  return n * 2 + count - 1;
}

// ---------- colori e contenuti veri ----------
export const KIND_ORDER: SignalKind[] = ["video", "article", "podcast", "thread", "release"];

/** Mette i contenuti veri in ordine "a rotazione" tra i formati (un video, un articolo, un podcast…), così i colori si alternano. */
export function interleave(items: Signal[]): Signal[] {
  const byKind = new Map<SignalKind, Signal[]>();
  for (const it of items) byKind.set(it.kind, [...(byKind.get(it.kind) ?? []), it]);
  const out: Signal[] = [];
  for (let i = 0; out.length < items.length; i++) {
    for (const kind of KIND_ORDER) {
      const it = byKind.get(kind)?.[i];
      if (it) out.push(it);
    }
  }
  return out;
}

/** Formato (quindi colore) del puntino g: segue i contenuti veri, o ruota sui formati se non ce ne sono. */
export function kindOf(g: number, pool: Signal[]): SignalKind {
  return pool.length > 0 ? pool[((g % pool.length) + pool.length) % pool.length].kind : KIND_ORDER[((g % KIND_ORDER.length) + KIND_ORDER.length) % KIND_ORDER.length];
}

/** Il contenuto vero collegato al contenuto numero `ell` (il puntino con lo stesso g ha lo stesso colore). */
export function itemOf(ell: number, pool: Signal[]): Signal | undefined {
  if (pool.length === 0) return undefined;
  return pool[labeledGeo(ell).g % pool.length];
}

// schede sopra il radar
export const CARD_W = 250;
const CARD_LINE = 18; // altezza di una riga di titolo
const CARD_CHARS = 25; // caratteri del titolo che entrano in una riga
const CARD_MAX_LINES = 5; // oltre, il titolo viene tagliato (rarissimo)

/** Altezza stimata della scheda: il titolo va a capo e si legge per intero, quindi la scheda si allunga. */
export function cardHeight(item?: Signal) {
  const lines = item ? Math.min(CARD_MAX_LINES, Math.max(1, Math.ceil(item.title.length / CARD_CHARS))) : 1;
  return 4 + 16 + 12 + 3 + lines * CARD_LINE; // bordo + margini + intestazione + spazio + righe
}
// Le schede non si sovrappongono MAI: due schede consecutive possono essere visibili insieme (una compare mentre l'altra
// sta sparendo), quindi stanno in due fasce diverse dello schermo. Le schede pari stanno SOPRA (fascia alta, anche con
// 5 righe di titolo finiscono prima di y=430), quelle dispari SOTTO (partono da y=448). Dentro la fascia si alternano
// sinistra e destra, così cambiano posto a ogni giro.
const UPPER = [
  { left: 14, top: 262 },
  { left: 126, top: 300 },
] as const;
const LOWER = [
  { left: 126, top: 448 },
  { left: 14, top: 470 },
] as const;

/** Posto della scheda `ell`: fascia alta se è pari, bassa se è dispari; mai sopra al suo stesso puntino. */
export function cardSlot(ell: number, height: number) {
  const zone = ell % 2 === 0 ? UPPER : LOWER;
  const side = Math.floor(ell / 2) % 2;
  const order = [zone[side], zone[1 - side]];
  const b = labeledGeo(ell);
  const px = CX + b.x;
  const py = CY + b.y;
  for (const slot of order) {
    const covers = px > slot.left - 16 && px < slot.left + CARD_W + 16 && py > slot.top - 16 && py < slot.top + height + 16;
    if (!covers) return slot;
  }
  return order[0];
}

export const KIND_LABEL: Record<SignalKind, string> = {
  video: "Video",
  article: "Articolo",
  thread: "Thread",
  release: "Release",
  podcast: "Podcast",
};

export const KIND_COLOR: Record<SignalKind, string> = {
  video: "var(--color-card-video)",
  article: "var(--color-card-article)",
  thread: "var(--color-card-thread)",
  release: "var(--color-card-code)",
  podcast: "var(--color-card-audio)",
};
