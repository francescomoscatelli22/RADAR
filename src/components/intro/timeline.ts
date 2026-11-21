import type { MotionValue } from "motion/react";

/*
  Misure e curve condivise dall'intro animata.
  Come nella pubblicità (/ad), tutto gira attorno a UN SOLO orologio (`time`, in secondi):
  ogni elemento guarda quel numero e calcola dove sta e come appare.
*/

export type Time = MotionValue<number>;

// La barra di caricamento dura ESATTAMENTE 5 secondi; poi il foro circolare si apre sulla schermata iniziale.
export const BAR_SECONDS = 5;
export const REVEAL_SECONDS = 0.75;
export const TOTAL_SECONDS = BAR_SECONDS + REVEAL_SECONDS;

// Artboard 390 x 844, come il frame Figma e la schermata iniziale (così il radar cade nello stesso punto)
export const ART_W = 390;
export const ART_H = 844;
export const RADAR_CENTER = { x: 195, y: 306 };
export const RADAR_DY = 116; // il centro del radar sta 116 unità sopra il centro dello schermo

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type Ease = (p: number) => number;
export const easeOut: Ease = (p) => 1 - Math.pow(1 - p, 3);
export const easeInOut: Ease = (p) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
// supera il traguardo e torna indietro (rimbalzo)
export const backOut: Ease = (p) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

// font (arrivano da next/font in layout.tsx)
export const MONO = "var(--font-martian), ui-monospace, monospace";
export const DISPLAY = "var(--font-bricolage), system-ui, sans-serif";
