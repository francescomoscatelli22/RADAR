import type { Signal, SignalKind } from "@/lib/signals";
import { clamp01, easeOut } from "./timeline";

/*
  Il "modello" dell'intro radar: tutti i numeri e i tempi, senza grafica.

  La lancetta gira SENZA MAI FERMARSI, un giro ogni 3 secondi. Ogni giro:
  - fa apparire 5 puntini NUOVI in posti diversi (nascono al passaggio della lancetta e poi svaniscono: non restano fermi);
  - cambia la finestra di tempo del contatore (15 min, 30 min, 1 ora… 24 ore, poi di nuovo indietro): il numero
    sale o scende al valore vero di quella finestra, un passo a ogni puntino catturato;
  - due dei 5 puntini mostrano un contenuto vero (una "scheda" dello stesso colore del puntino, in un posto diverso).

  Si lavora con un "orologio della lancetta" (`sweep`, in secondi): coincide con l'orologio dell'intro (`time`)
  finché dura il caricamento, poi continua da solo (vedi Intro.tsx). Da lì si ricava tutto, anche all'infinito:
  i puntini si generano da un "dado" a numeri fissi (stesso giro = stessi puntini), senza memorizzare nulla.
*/

// lo schermo del radar nell'artboard 390 x 844: tondo, sotto il nome e il numero, lontano dalla Dynamic Island
export const CX = 195;
export const CY = 432;
export const SCOPE_R = 148; // raggio dello schermo (il bordo con la scala dei gradi)
export const RING_RADII = [37, 74, 111, 148] as const;

export const SWEEP_START = 1.0; // la lancetta parte
export const START_ANGLE = 340; // gradi, in senso orario da "ore 12"
export const LAP_SECONDS = 3; // un giro = 3 secondi = un aggiornamento del contatore
export const SPEED = 360 / LAP_SECONDS; // gradi al secondo
export const PER_LAP = 5; // puntini nuovi a ogni giro
const STEP_SECONDS = 0.3; // quanto ci mette il contatore a salire dopo una cattura
export const BLIP_LIFE = 1.9; // secondi di vita di un puntino prima di sparire del tutto
export const CARD_LIFE = 1.35; // secondi di vita di una scheda

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

// posti delle schede sopra il radar, in ordine: alto-sinistra, basso-destra, destra-metà, basso-sinistra
export const CARD_W = 176;
export const CARD_H = 42;
export const CARD_SLOTS = [
  { left: 14, top: 268 },
  { left: 200, top: 536 },
  { left: 200, top: 322 },
  { left: 14, top: 482 },
] as const;

/** Posto della scheda `ell`: a rotazione, ma mai sopra al suo stesso puntino. */
export function cardSlot(ell: number) {
  const b = labeledGeo(ell);
  const px = CX + b.x;
  const py = CY + b.y;
  for (let i = 0; i < CARD_SLOTS.length; i++) {
    const slot = CARD_SLOTS[(ell + i) % CARD_SLOTS.length];
    const covers = px > slot.left - 16 && px < slot.left + CARD_W + 16 && py > slot.top - 16 && py < slot.top + CARD_H + 16;
    if (!covers) return slot;
  }
  return CARD_SLOTS[ell % CARD_SLOTS.length];
}

// ---------- il contatore ----------
export type Lap = { seconds: number; count: number };

/** Tutte le finestre di tempo, dalla più corta alla più lunga, con i numeri veri (non scendono mai al crescere della finestra). */
export function buildLaps(windows: Lap[]): Lap[] {
  const all = [...windows].sort((a, b) => a.seconds - b.seconds);
  // le finestre vuote (0 segnali) farebbero restare il numero fermo a 0: si saltano, se ne restano almeno due con segnali
  const withSignals = all.filter((w) => w.count > 0);
  const sorted = withSignals.length >= 2 ? withSignals : all;
  const laps: Lap[] = [];
  for (const w of sorted) laps.push({ seconds: w.seconds, count: Math.max(w.count, laps[laps.length - 1]?.count ?? 0) });
  return laps;
}

/** Quale finestra tocca al giro n: sale dalla più corta alla più lunga e poi ridiscende, all'infinito. */
export function windowIndex(n: number, size: number) {
  if (size <= 1) return 0;
  const period = 2 * (size - 1);
  const m = ((n % period) + period) % period;
  return m < size ? m : period - m;
}

/** Valore del contatore al secondo s: a ogni giro va dal numero del giro prima a quello nuovo, un passo per puntino catturato. */
export function counterValue(s: number, laps: Lap[]) {
  if (s < SWEEP_START) return 0;
  const target = (m: number) => (m < 0 ? 0 : laps[windowIndex(m, laps.length)].count);
  const progress = (m: number) => {
    let p = 0;
    for (const b of lapBlips(m)) p += easeOut(clamp01((s - b.tc) / STEP_SECONDS));
    return p / PER_LAP;
  };
  const n = lapIndex(s);
  // il giro prima può avere ancora l'ultimo passo a metà: si somma anche quello, così il numero non fa salti
  const before = n >= 1 ? progress(n - 1) : 1;
  const base = target(n - 2);
  const mid = target(n - 1);
  const now = target(n);
  const first = n >= 1 ? mid - base : 0;
  return n >= 1 ? base + first * before + (now - mid) * progress(n) : now * progress(0);
}

/** Etichetta della finestra del giro in corso (secondi), o null prima che la lancetta parta. */
export function windowSeconds(s: number, laps: Lap[]) {
  if (s < SWEEP_START || laps.length === 0) return null;
  return laps[windowIndex(lapIndex(s), laps.length)].seconds;
}

/** 1 → 0 nell'istante dopo una cattura: fa "battere" il numero. */
export function counterBump(s: number) {
  if (s < SWEEP_START) return 0;
  const n = lapIndex(s);
  let bump = 0;
  for (const m of [n - 1, n]) {
    if (m < 0) continue;
    for (const b of lapBlips(m)) {
      const k = (s - b.tc) / 0.28;
      if (k >= 0 && k < 1) bump = Math.max(bump, 1 - k);
    }
  }
  return bump;
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
