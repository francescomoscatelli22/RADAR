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

export type SignalsResponse = {
  count: number; // quanti contenuti ha raccolto Radar in totale
  items: Signal[]; // video, articolo (più recente), articolo (di un'altra fonte), thread, release, podcast: quelli che esistono
};
