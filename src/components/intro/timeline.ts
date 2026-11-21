import type { MotionValue } from "motion/react";

/*
  Misure e curve condivise dall'intro animata.
  Come nella pubblicità (/ad), tutto gira attorno a UN SOLO orologio (`time`, in secondi):
  ogni elemento guarda quel numero e calcola dove sta e come appare.
*/

export type Time = MotionValue<number>;

// La barra di caricamento dura ESATTAMENTE 5 secondi; poi tre strisce colorate "strappano" via il poster.
export const BAR_SECONDS = 5;
export const STRIPES = 3;
export const STRIPE_SECONDS = 0.35; // tempo di una striscia per attraversare lo schermo
export const STRIPE_STAGGER = 0.07; // ritardo tra una striscia e la successiva
export const REVEAL_AT = 5.4; // tutto è coperto: il poster sparisce e lo Splash viene montato sotto
export const PEEL_AT = 5.5; // le strisce cominciano a scoprire lo Splash
export const TOTAL_SECONDS = PEEL_AT + (STRIPES - 1) * STRIPE_STAGGER + STRIPE_SECONDS;

// Artboard 390 x 844, come il frame Figma e la schermata iniziale
export const ART_W = 390;
export const ART_H = 844;

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
export const ACCENT_SERIF = "var(--font-instrument), Georgia, serif";
export const MARKER = "var(--font-permanent), cursive";
