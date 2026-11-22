/*
  Forma dei dati che l'intro riceve da /api/signals: gli ultimi contenuti veri per formato
  (servono alle schede che compaiono sul radar).
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
  items: Signal[]; // gli ultimi contenuti veri di tutti i formati, dal più recente (max 2 per formato)
};
