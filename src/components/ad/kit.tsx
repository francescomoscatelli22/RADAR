"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/*
  Mattoncini della pubblicità. Tutto ruota attorno a UN SOLO "orologio" (`time`, in secondi):
  ogni elemento calcola dove sta e come appare guardando solo quel numero.
  Vantaggi: la pubblicità si può mettere in pausa, saltare a un secondo preciso
  e registrare fotogramma per fotogramma (serve per esportare l'MP4).
*/

export type Time = MotionValue<number>;
type Ease = (v: number) => number;

// Colori dell'app (stessi di src/design/tokens.css)
export const C = {
  ink: "#17150f",
  paper: "#f6f1e7",
  cream: "#fffaf0",
  signal: "#ffd23f",
  coral: "#f0674a",
};

// Secondi in cui cambia scena (= momento in cui lo "strappo" colorato copre tutto lo schermo)
export const T = { S2: 3.62, S3: 7.42, S4: 13.02, S5: 17.02, END: 20 };
export const WIPE_AT = [2.9, 6.7, 12.3, 16.3]; // inizio di ogni strappo; la scena cambia a +0.72 s

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// Curve di movimento
export const easeOut: Ease = (p) => 1 - Math.pow(1 - p, 3);
export const easeInOut: Ease = (p) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const backOut: Ease = (p) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

type From = { x?: number; y?: number; scale?: number; rotate?: number };

/** Fa comparire un elemento al secondo `at` (e, se serve, sparire a `out`). */
export function Appear({
  time,
  at,
  dur = 0.6,
  out,
  outDur = 0.25,
  from = { y: 60 },
  ease = backOut,
  rotate = 0,
  wobble = 0,
  style,
  children,
}: {
  time: Time;
  at: number;
  dur?: number;
  out?: number;
  outDur?: number;
  from?: From;
  ease?: Ease;
  rotate?: number;
  wobble?: number; // piccolo tremolio continuo, in gradi
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const prog = (t: number) => ease(clamp01((t - at) / dur));
  const x = useTransform(time, (t) => (from.x ?? 0) * (1 - prog(t)));
  const y = useTransform(time, (t) => (from.y ?? 0) * (1 - prog(t)));
  const scale = useTransform(time, (t) => 1 + ((from.scale ?? 1) - 1) * (1 - prog(t)));
  const rot = useTransform(
    time,
    (t) =>
      rotate +
      (from.rotate ?? 0) * (1 - prog(t)) +
      (wobble ? Math.sin(t * 8 + rotate * 3) * wobble : 0),
  );
  const opacity = useTransform(
    time,
    (t) =>
      clamp01((t - at) / (dur * 0.4)) *
      (out === undefined ? 1 : 1 - clamp01((t - out) / outDur)),
  );
  return (
    <motion.div style={{ x, y, scale, rotate: rot, opacity, ...style }}>{children}</motion.div>
  );
}

/** Una scena: visibile solo tra `from` e `to` (il cambio avviene sotto lo strappo colorato). */
export function Scene({
  time,
  from,
  to,
  bg,
  children,
}: {
  time: Time;
  from: number;
  to: number;
  bg: string;
  children: ReactNode;
}) {
  const opacity = useTransform(time, (t) => (t >= from && t < to ? 1 : 0));
  return (
    <motion.div style={{ position: "absolute", inset: 0, background: bg, opacity }}>
      {children}
    </motion.div>
  );
}

function Stripe({
  time,
  at,
  i,
  n,
  color,
}: {
  time: Time;
  at: number;
  i: number;
  n: number;
  color: string;
}) {
  const x = useTransform(time, (t) => {
    const inStart = at + 0.1 * i;
    const outStart = at + 0.1 * (n - 1) + 0.5 + 0.1 * (n - 1 - i);
    if (t < outStart) return -2700 + 2700 * easeInOut(clamp01((t - inStart) / 0.5));
    return 2700 * easeInOut(clamp01((t - outStart) / 0.5));
  });
  return (
    <motion.div
      style={{
        position: "absolute",
        top: -100,
        left: -300,
        width: 2520,
        height: 1280,
        background: color,
        x,
        skewX: -8,
        zIndex: 50,
      }}
    />
  );
}

/** Strappo di tre strisce colorate che attraversa lo schermo (stile zine). */
export function Wipe({ time, at }: { time: Time; at: number }) {
  const colors = [C.coral, C.signal, C.ink];
  return (
    <>
      {colors.map((c, i) => (
        <Stripe key={i} time={time} at={at} i={i} n={colors.length} color={c} />
      ))}
    </>
  );
}

/** Lettere che entrano una dopo l'altra (per titoli grandi). */
export function Letters({
  time,
  at,
  text,
  stagger = 0.07,
  style,
  colors,
}: {
  time: Time;
  at: number;
  text: string;
  stagger?: number;
  style?: CSSProperties;
  /** colore di alcune lettere, per posizione (es. { 1: giallo, 2: giallo } per l'"AI" di RAIDAR) */
  colors?: Record<number, string>;
}) {
  return (
    <div style={{ display: "flex", ...style }}>
      {text.split("").map((ch, i) => (
        <Appear
          key={i}
          time={time}
          at={at + i * stagger}
          dur={0.55}
          from={{ y: 120, rotate: i % 2 ? 9 : -9 }}
          style={{ display: "inline-block", whiteSpace: "pre", color: colors?.[i] }}
        >
          {ch}
        </Appear>
      ))}
    </div>
  );
}
