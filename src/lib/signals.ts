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

// Finestre di tempo provate dalla più stretta alla più larga (in secondi).
export const RECENT_WINDOWS = [30, 60, 300, 900, 1800, 3600, 10800, 86400, 604800] as const;

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
  // Segnali VERI arrivati in Radar (colonna created_at = quando sono stati raccolti) nella
  // finestra più stretta che ne contiene almeno uno. null se nessuno è arrivato negli ultimi 7 giorni.
  recent: { count: number; seconds: number } | null;
  count: number; // quanti contenuti ha raccolto Radar in totale
  items: Signal[]; // video, articolo (più recente), articolo (di un'altra fonte), thread, release, podcast: quelli che esistono
};
