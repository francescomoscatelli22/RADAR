"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Tiles from "./tiles";
import {
  ACCENT_SERIF,
  ART_H,
  ART_W,
  BAR_SECONDS,
  DISPLAY,
  MARKER,
  MONO,
  PEEL_AT,
  REVEAL_AT,
  STRIPES,
  STRIPE_SECONDS,
  STRIPE_STAGGER,
  TOTAL_SECONDS,
  backOut,
  clamp01,
  easeInOut,
  easeOut,
  type Time,
} from "./timeline";

/*
  Intro animata di Radar: un POSTER GIALLO da 5 secondi (la barra di caricamento), poi tre strisce
  colorate lo "strappano" via e scoprono la schermata iniziale (Splash, scura, con il radar).
  Apposta è l'opposto dello Splash: fondo giallo pieno, niente radar, scritte giganti.

  Cosa si vede (il tempo è quello dell'orologio unico `time`):
    0,2 – 1,0 s  le parole "L'AI / CHE / CONTA." salgono una alla volta, parte il contatore
    1,0 – 3,2 s  i 6 formati del feed arrivano dai lati come adesivi, ognuno con la sua micro-animazione
    4,3 s        adesivo "SI PARTE!"
    5,0 – 6,0 s  strappo a strisce → schermata iniziale

  Il contatore e la barra sono grafica: non misurano un vero caricamento (per ora non c'è niente da caricare).
*/

// temi del nastro (decorativi: l'intro non dipende dai dati dello Splash)
const TOPICS = [
  "AI generativa",
  "Immagini",
  "Video",
  "3D e scene",
  "UI / UX",
  "Agenti",
  "Modelli linguistici",
  "Strumenti",
  "Open source",
  "Prompt design",
  "Audio e voce",
  "Codice",
];

const INK = "var(--color-card-ink)";
const YELLOW = "var(--color-card-article)";
const CREAM = "var(--color-cream)";
const ACCENT = "var(--color-accent)";

type Geometry = RefObject<{ w: number; h: number }>;

// ---------- le tre parole giganti ----------
function Word({ time, at, instant, children }: { time: Time; at: number; instant: boolean; children: ReactNode }) {
  const p = (t: number) => (instant ? 1 : easeOut(clamp01((t - at) / 0.55)));
  const y = useTransform(time, (t) => `${(1 - p(t)) * 118}%`);
  const rotate = useTransform(time, (t) => (1 - p(t)) * 7);
  return (
    <div style={{ overflow: "hidden", padding: "2px 0" }}>
      <motion.div style={{ y, rotate, transformOrigin: "0 100%" }}>{children}</motion.div>
    </div>
  );
}

function Headline({ time, instant }: { time: Time; instant: boolean }) {
  const blockRotate = useTransform(time, (t) => -1.5 + (instant ? 0 : Math.sin(t * 2.4) * 0.6));
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 76,
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 88,
        lineHeight: 0.9,
        letterSpacing: "-0.055em",
        color: INK,
      }}
    >
      <Word time={time} at={0.2} instant={instant}>
        L&apos;AI
      </Word>
      <Word time={time} at={0.35} instant={instant}>
        CHE
      </Word>
      <Word time={time} at={0.5} instant={instant}>
        <motion.span
          style={{ display: "inline-block", padding: "0 12px 6px", background: INK, color: YELLOW, rotate: blockRotate }}
        >
          CONTA.
        </motion.span>
      </Word>
    </div>
  );
}

// frase d'accento accanto a "CHE"
function Phrase({ time, instant }: { time: Time; instant: boolean }) {
  const p = (t: number) => (instant ? 1 : easeOut(clamp01((t - 0.9) / 0.5)));
  const opacity = useTransform(time, (t) => p(t));
  const y = useTransform(time, (t) => 14 * (1 - p(t)));
  return (
    <motion.p
      style={{
        position: "absolute",
        left: 218,
        top: 168,
        width: 150,
        margin: 0,
        fontFamily: ACCENT_SERIF,
        fontStyle: "italic",
        fontSize: 23,
        lineHeight: 1.02,
        color: INK,
        opacity,
        y,
      }}
    >
      segnali dal web, scelti da te.
    </motion.p>
  );
}

// ---------- contatore "segnali in arrivo": adesivo nero accanto a "L'AI" ----------
function Counter({ time }: { time: Time }) {
  const n = useTransform(time, (t) => String(Math.round(128 * easeOut(clamp01((t - 0.9) / 2.7)))));
  const scale = useTransform(time, (t) => backOut(clamp01((t - 0.8) / 0.5)));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: 236,
        top: 92,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 12px 9px",
        background: INK,
        boxShadow: `4px 4px 0 ${ACCENT}`,
        color: CREAM,
        rotate: 4,
        scale,
        opacity: scale,
      }}
    >
      <motion.b
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          color: YELLOW,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </motion.b>
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 8.5, lineHeight: 1.1, letterSpacing: "0.12em" }}>
        SEGNALI IN ARRIVO
      </span>
    </motion.div>
  );
}

// ---------- nastro nero con i temi che scorre ----------
function Tape({ time }: { time: Time }) {
  const group = useRef<HTMLDivElement>(null);
  const enter = useTransform(time, (t) => -520 * (1 - easeOut(clamp01((t - 0.9) / 0.6))));
  const scroll = useTransform(time, (t) => -((t * 55) % (group.current?.offsetWidth || 900)));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: -20,
        top: 338,
        width: 430,
        height: 28,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: INK,
        color: YELLOW,
        rotate: -2.5,
        x: enter,
      }}
    >
      <motion.div style={{ display: "flex", width: "max-content", x: scroll }}>
        {[0, 1].map((g) => (
          <div key={g} ref={g === 0 ? group : undefined} style={{ display: "flex", flex: "none" }}>
            {TOPICS.map((topic, i) => (
              <span
                key={topic}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingRight: 10,
                  whiteSpace: "nowrap",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {topic}
                <i
                  style={{
                    display: "block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: i % 2 ? ACCENT : CREAM,
                  }}
                />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---------- adesivo "SI PARTE!" sul blocco CONTA. ----------
function GoSticker({ time }: { time: Time }) {
  const p = (t: number) => backOut(clamp01((t - 4.3) / 0.45));
  const scale = useTransform(time, (t) => p(t));
  const rotate = useTransform(time, (t) => -8 + 24 * (1 - p(t)));
  return (
    <motion.span
      style={{
        position: "absolute",
        left: 318,
        top: 246,
        padding: "3px 12px",
        border: `3px solid ${INK}`,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: `3px 3px 0 ${INK}`,
        color: INK,
        fontFamily: MARKER,
        fontSize: 19,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        x: "-50%",
        y: "-50%",
        scale,
        opacity: scale,
        rotate,
      }}
    >
      SI PARTE!
    </motion.span>
  );
}

// ---------- barra di caricamento: 5 secondi esatti ----------
const STATUS = [
  { from: 0, text: "CAPTO SEGNALI…" },
  { from: 0.34, text: "ORDINO IL FEED…" },
  { from: 0.67, text: "QUASI FATTO…" },
  { from: 1, text: "PRONTO" },
];

function Bar({ time }: { time: Time }) {
  const progress = (t: number) => clamp01(t / BAR_SECONDS);
  const width = useTransform(time, (t) => `${progress(t) * 100}%`);
  const stripes = useTransform(time, (t) => `${t * 40}px 0`);
  const percent = useTransform(time, (t) => `${Math.round(progress(t) * 100)}%`);
  const status = useTransform(time, (t) => {
    const p = progress(t);
    return [...STATUS].reverse().find((s) => p >= s.from)?.text ?? STATUS[0].text;
  });
  const enter = useTransform(time, (t) => 30 * (1 - easeOut(clamp01(t / 0.5))));
  const opacity = useTransform(time, (t) => clamp01(t / 0.3));

  return (
    <motion.div style={{ position: "absolute", left: 24, top: 750, width: 342, y: enter, opacity }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 11,
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: INK,
        }}
      >
        <motion.span>{status}</motion.span>
        <motion.span style={{ fontSize: 15, letterSpacing: 0 }}>{percent}</motion.span>
      </div>
      <div
        style={{
          height: 28,
          boxSizing: "border-box",
          overflow: "hidden",
          border: `3px solid ${INK}`,
          background: CREAM,
          boxShadow: `4px 4px 0 ${INK}`,
        }}
      >
        <motion.div
          style={{
            height: "100%",
            boxSizing: "border-box",
            backgroundColor: INK,
            backgroundImage: "repeating-linear-gradient(-45deg, #2b2b2b 0 8px, transparent 8px 16px)",
            backgroundPosition: stripes,
            width,
          }}
        />
      </div>
    </motion.div>
  );
}

// ---------- strappo: tre strisce colorate attraversano lo schermo ----------
const STRIPE_COLORS = [INK, CREAM, ACCENT]; // dal fondo alla cima: l'ultima a restare è quella nera, come lo sfondo dello Splash

function Stripe({ time, i, geometry }: { time: Time; i: number; geometry: Geometry }) {
  const x = useTransform(time, (t) => {
    const travel = geometry.current.w + 400;
    const enter = easeInOut(clamp01((t - (BAR_SECONDS + i * STRIPE_STAGGER)) / STRIPE_SECONDS));
    const leave = easeInOut(clamp01((t - (PEEL_AT + (STRIPES - 1 - i) * STRIPE_STAGGER)) / STRIPE_SECONDS));
    return -travel * (1 - enter) + travel * leave;
  });
  return (
    <motion.div
      style={{
        position: "absolute",
        top: -80,
        bottom: -80,
        left: -200,
        right: -200,
        background: STRIPE_COLORS[i],
        skewX: -8,
        x,
        zIndex: 10 + i,
      }}
    />
  );
}

// "Riduci movimento": sul server vale false, sul telefono il valore vero (senza avvisi di idratazione)
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

// ---------- schermata completa ----------
export default function Intro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const reduce = usePrefersReducedMotion();
  const time = useMotionValue(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const geometry = useRef({ w: ART_W, h: ART_H });
  const [scale, setScale] = useState(0); // 0 = non ancora misurato (resta nascosto)

  // l'artboard 390 x 844 si adatta allo schermo, come la schermata iniziale
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      geometry.current = { w, h };
      setScale(Math.min(w / ART_W, h / ART_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleReveal = useEffectEvent(onReveal);
  const handleDone = useEffectEvent(onDone);

  // l'orologio: da 0 a 6 secondi, in linea retta
  useEffect(() => {
    // /?intro-t=3.2 → ferma l'orologio al secondo 3,2 (serve a controllare un fotogramma)
    const frozen = new URLSearchParams(window.location.search).get("intro-t");
    if (frozen !== null) {
      time.set(Number(frozen));
      return;
    }
    time.set(0);
    let revealed = false;
    // con le strisce lo Splash si monta quando tutto è coperto; con "Riduci movimento" subito, sotto la dissolvenza
    const revealAt = reduce ? BAR_SECONDS : REVEAL_AT;
    const stop = time.on("change", (t) => {
      if (!revealed && t >= revealAt) {
        revealed = true;
        handleReveal();
      }
    });
    const controls = animate(time, TOTAL_SECONDS, {
      duration: TOTAL_SECONDS,
      ease: "linear",
      onComplete: () => handleDone(),
    });
    return () => {
      stop();
      controls.stop();
    };
  }, [time, reduce]);

  // il poster sparisce quando le strisce lo coprono del tutto (o si dissolve, con "Riduci movimento")
  const posterOpacity = useTransform(time, (t) =>
    reduce ? 1 - clamp01((t - BAR_SECONDS) / 0.4) : t < REVEAL_AT ? 1 : 0,
  );
  // reticolo di puntini (mezzatinta) che scivola in diagonale
  const dotX = useTransform(time, (t) => (t * 7) % 26);
  const dotY = useTransform(time, (t) => (t * 14) % 52);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Caricamento di Radar"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        height: "100dvh",
        overflow: "hidden",
        fontFamily: DISPLAY,
      }}
    >
      <motion.div style={{ position: "absolute", inset: 0, background: YELLOW, opacity: posterOpacity }}>
        {!reduce && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -52,
              opacity: 0.1,
              backgroundImage:
                "radial-gradient(circle at 25% 25%, #000 1.1px, transparent 1.5px), radial-gradient(circle at 75% 75%, #000 1.1px, transparent 1.5px)",
              backgroundSize: "26px 52px",
              x: dotX,
              y: dotY,
            }}
          />
        )}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: ART_W,
            height: ART_H,
            marginLeft: -ART_W / 2,
            marginTop: -ART_H / 2,
            transform: `scale(${scale})`,
            visibility: scale > 0 ? "visible" : "hidden",
          }}
        >
          <Headline time={time} instant={reduce} />
          <Phrase time={time} instant={reduce} />
          {!reduce && (
            <>
              <Counter time={time} />
              <Tape time={time} />
              <Tiles time={time} />
              <GoSticker time={time} />
            </>
          )}
          <Bar time={time} />
        </div>
      </motion.div>

      {!reduce && STRIPE_COLORS.map((_, i) => <Stripe key={i} time={time} i={i} geometry={geometry} />)}
    </div>
  );
}
