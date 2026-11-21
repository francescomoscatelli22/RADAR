/*
  Forma dei dati che l'intro riceve da /api/signals: il totale dei contenuti raccolti
  e gli ultimi contenuti veri per formato (servono ai blocchi animati).
  Niente post LinkedIn: non si possono leggere (vedi CLAUDE.md), quindi non esiste quel formato.
*/

export type SignalKind = "video" | "article" | "thread" | "release" | "podcast";

export type Signal = {
  kind: SignalKind;
  title: string;
  source: string; // nome della fonte, ripulito (es. "ComfyUI", "Two Minute Papers")
  ageMinutes: number; // da quanto è stato pubblicato, calcolato dal server
  points?: number; // solo thread (Hacker News)
  comments?: number; // solo thread
};

// Finestre di tempo del contatore dell'intro (in secondi), apposta in ordine MISTO e non crescente:
// 3 ore, 30 min, 24 ore, 15 min, 5 ore, 1 ora, 12 ore (niente 5 min: troppo spesso vuoto). Il contatore le mostra una dopo l'altra.
export const RECENT_WINDOWS = [10800, 1800, 86400, 900, 18000, 3600, 43200] as const;

export function windowLabel(seconds: number) {
  if (seconds < 60) return `negli ultimi ${seconds} secondi`;
  if (seconds < 3600) {
    const m = seconds / 60;
    return m === 1 ? "nell'ultimo minuto" : `negli ultimi ${m} minuti`;
  }
  if (seconds < 86400) {
    const h = seconds / 3600;
    return h === 1 ? "nell'ultima ora" : `nelle ultime ${h} ore`;
  }
  const d = seconds / 86400;
  return d === 1 ? "nelle ultime 24 ore" : `negli ultimi ${d} giorni`;
}

export type SignalsResponse = {
  // Segnali VERI pubblicati (colonna published_at = quando il contenuto è uscito, non quando è stato raccolto) in ogni
  // finestra di RECENT_WINDOWS, nello stesso ordine. Le finestre che non si sono potute contare mancano.
  windows: { seconds: number; count: number }[];
  count: number; // quanti contenuti ha raccolto Radar in totale
  items: Signal[]; // gli ultimi contenuti veri di tutti i formati, dal più recente (max 2 per formato)
};
