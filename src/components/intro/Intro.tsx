"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { ARM_ANGLE, passDelay } from "../splash/geometry";
import Tiles from "./tiles";
import CodeRain from "../splash/CodeRain";
import {
  ART_H,
  ART_W,
  BAR_SECONDS,
  DISPLAY,
  MONO,
  RADAR_CENTER,
  RADAR_DY,
  TOTAL_SECONDS,
  backOut,
  clamp01,
  easeInOut,
  easeOut,
  type Time,
} from "./timeline";

/*
  Intro animata di Radar: dura 5 secondi (la barra di caricamento), poi un foro circolare
  si apre e scopre la schermata iniziale (Splash) già pronta sotto.

  Cosa si vede (il tempo è quello dell'orologio unico `time`):
    0,0 – 1,0 s  il radar si disegna, il contatore "segnali in arrivo" parte
    1,0 – 3,5 s  i 6 formati del feed escono dal radar, ognuno con la sua micro-animazione
    3,8 – 4,3 s  i blocchi tornano nel radar, il contatore esce
    4,1 – 5,0 s  compare il titolo RADAR (stesso punto e stile della schermata iniziale)
    5,0 – 5,75 s foro circolare → schermata iniziale

  Il contatore e la barra sono grafica: non misurano un vero caricamento (per ora non c'è niente da caricare).
*/

const C = 150; // centro del radar (viewBox 300)
const K = 0.9; // 270 px di radar / 300 unità del viewBox

const CREAM = "var(--color-cream)";
const YELLOW = "var(--color-card-article)";
const ACCENT = "var(--color-accent)";

// ---------- radar: stessa geometria della schermata iniziale ----------
const BLIPS = [
  { r: 67, a0: -141, period: 9, dir: 1, ping: true, pingDur: 2.4 },
  { r: 58, a0: 31, period: 6.5, dir: -1, ping: true, pingDur: 2 },
  { r: 92, a0: 90, period: 12, dir: 1, ping: false, pingDur: 0 },
  { r: 114, a0: -22, period: 16, dir: -1, ping: true, pingDur: 2.8 },
].map((b) => {
  const rad = (b.a0 * Math.PI) / 180;
  return { ...b, delay: passDelay(b.r * Math.cos(rad), b.r * Math.sin(rad)) };
});

const TRAIL = [0.22, 0.16, 0.1, 0.05].map((opacity, k) => {
  const R = 138;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(C + R * Math.cos(rad)).toFixed(1)} ${(C + R * Math.sin(rad)).toFixed(1)}`;
  };
  const from = ARM_ANGLE - 9 * (k + 1);
  const to = ARM_ANGLE - 9 * k;
  return { opacity, d: `M${C} ${C} L${point(from)} A${R} ${R} 0 0 1 ${point(to)} Z` };
});

function Ring({ time, r, i }: { time: Time; r: number; i: number }) {
  const pathLength = useTransform(time, (t) => easeOut(clamp01((t - i * 0.12) / 0.55)));
  return (
    <g transform={`rotate(-90 ${C} ${C})`}>
      <motion.circle cx={C} cy={C} r={r} fill="none" stroke={CREAM} strokeWidth={3} style={{ pathLength }} />
    </g>
  );
}

function Blip({ time, b }: { time: Time; b: (typeof BLIPS)[number] }) {
  const size = 16 * K;
  const pos = (t: number) => {
    const a = ((b.a0 + (b.dir * 360 * t) / b.period) * Math.PI) / 180;
    return { x: (C + b.r * Math.cos(a)) * K, y: (C + b.r * Math.sin(a)) * K };
  };
  const x = useTransform(time, (t) => pos(t).x - size / 2);
  const y = useTransform(time, (t) => pos(t).y - size / 2);
  const scale = useTransform(time, (t) => backOut(clamp01((t - b.delay) / 0.45)));
  const phase = (t: number) => (t < b.delay ? 1 : ((t - b.delay) % b.pingDur) / b.pingDur);
  const pingSize = 38 * K;
  const px = useTransform(time, (t) => pos(t).x - pingSize / 2);
  const py = useTransform(time, (t) => pos(t).y - pingSize / 2);
  const pingScale = useTransform(time, (t) => 1 + 1.6 * easeOut(phase(t)));
  const pingOpacity = useTransform(time, (t) => 0.9 * (1 - phase(t)));
  return (
    <>
      {b.ping && (
        <motion.div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: pingSize,
            height: pingSize,
            boxSizing: "border-box",
            border: `2.25px solid ${ACCENT}`,
            borderRadius: "50%",
            x: px,
            y: py,
            scale: pingScale,
            opacity: pingOpacity,
          }}
        />
      )}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          boxSizing: "border-box",
          border: `2.25px solid ${CREAM}`,
          borderRadius: "50%",
          background: ACCENT,
          x,
          y,
          scale,
          opacity: scale,
        }}
      />
    </>
  );
}

function Radar({ time }: { time: Time }) {
  const discOpacity = useTransform(time, (t) => clamp01((t - 0.15) / 0.4));
  const sweepRotate = useTransform(time, (t) => Math.max(0, t - 0.3) * (360 / 1.6));
  const sweepOpacity = useTransform(time, (t) => clamp01((t - 0.2) / 0.3));
  const coreScale = useTransform(time, (t) => backOut(clamp01((t - 0.3) / 0.45)) * (1 + 0.22 * Math.max(0, Math.sin((t - 0.9) * 3.9))));
  // quando i blocchi rientrano il radar "incassa" con un piccolo colpo
  const bump = useTransform(time, (t) => 1 + 0.05 * Math.sin(clamp01((t - 4.25) / 0.35) * Math.PI));
  const box = { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" } as const;
  const coreSize = 18 * K;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: RADAR_CENTER.x - 135,
        top: RADAR_CENTER.y - 135,
        width: 270,
        height: 270,
        scale: bump,
      }}
    >
      <svg viewBox="0 0 300 300" style={box}>
        <motion.g style={{ opacity: discOpacity }}>
          <circle cx={C + 4} cy={C + 4} r={140} fill={CREAM} />
          <circle cx={C} cy={C} r={138.5} fill="var(--color-surface)" />
          <circle cx={C} cy={C} r={46.5} fill="var(--color-surface-2)" />
          <g stroke={CREAM} strokeWidth="1.5" opacity="0.22">
            <line x1="10" y1={C} x2="290" y2={C} />
            <line x1={C} y1="10" x2={C} y2="290" />
          </g>
        </motion.g>
        {[46.5, 92.5, 138.5].map((r, i) => (
          <Ring key={r} time={time} r={r} i={i} />
        ))}
      </svg>
      {/* lancetta + scia: l'intero disegno ruota attorno al suo centro */}
      <motion.svg viewBox="0 0 300 300" style={{ ...box, rotate: sweepRotate, opacity: sweepOpacity }}>
        {TRAIL.map((t, i) => (
          <path key={i} d={t.d} fill={YELLOW} opacity={t.opacity} />
        ))}
        <line x1={C} y1={C} x2="249" y2="51" stroke={YELLOW} strokeWidth="9" strokeLinecap="round" />
      </motion.svg>
      {BLIPS.map((b, i) => (
        <Blip key={i} time={time} b={b} />
      ))}
      <motion.div
        style={{
          position: "absolute",
          left: 135 - coreSize / 2,
          top: 135 - coreSize / 2,
          width: coreSize,
          height: coreSize,
          boxSizing: "border-box",
          border: `2.25px solid ${CREAM}`,
          borderRadius: "50%",
          background: ACCENT,
          scale: coreScale,
        }}
      />
    </motion.div>
  );
}

// onde che si allargano dal radar, sincronizzate con la lancetta
function Pulse({ time, offset }: { time: Time; offset: number }) {
  const phase = (t: number) => (t < 0.9 + offset ? 1 : ((t - 0.9 - offset) % 2.4) / 2.4);
  const scale = useTransform(time, (t) => 0.9 + 1.7 * easeOut(phase(t)));
  const opacity = useTransform(time, (t) => 0.4 * (1 - phase(t)));
  return (
    <motion.div
      style={{
        position: "absolute",
        left: RADAR_CENTER.x - 135,
        top: RADAR_CENTER.y - 135,
        width: 270,
        height: 270,
        boxSizing: "border-box",
        border: `2px solid ${ACCENT}`,
        borderRadius: "50%",
        scale,
        opacity,
      }}
    />
  );
}

// ---------- contatore "segnali in arrivo" (in alto, lascia il posto al titolo) ----------
function Counter({ time }: { time: Time }) {
  const n = useTransform(time, (t) => String(Math.round(128 * easeOut(clamp01((t - 0.9) / 2.9)))).padStart(3, "0"));
  const y = useTransform(time, (t) => 40 * (1 - backOut(clamp01((t - 0.3) / 0.6))) - 90 * easeInOut(clamp01((t - 4.0) / 0.4)));
  const opacity = useTransform(time, (t) => clamp01((t - 0.3) / 0.2) * (1 - clamp01((t - 4.0) / 0.35)));
  return (
    <motion.div style={{ position: "absolute", left: 24, top: 56, display: "flex", alignItems: "flex-end", gap: 12, y, opacity }}>
      <motion.span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </motion.span>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingBottom: 4,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 11,
          lineHeight: 1,
          letterSpacing: "0.12em",
        }}
      >
        <span>SEGNALI</span>
        <span style={{ color: YELLOW }}>IN ARRIVO</span>
      </span>
    </motion.div>
  );
}

// ---------- titolo RADAR: identico a quello della schermata iniziale ----------
const WORD = "RADAR".split("");

function TitleLetter({ time, ch, start, instant }: { time: Time; ch: string; start: number; instant: boolean }) {
  const y = useTransform(time, (t) => `${instant ? 0 : (1 - easeOut(clamp01((t - start) / 0.55))) * 110}%`);
  return <motion.span style={{ display: "inline-block", y }}>{ch}</motion.span>;
}

function Title({ time, instant }: { time: Time; instant: boolean }) {
  const at = instant ? 0 : 4.1;
  const opacity = useTransform(time, (t) => (instant ? 1 : clamp01((t - at) / 0.12)));
  const scale = useTransform(time, (t) => (instant ? 1 : 0.85 + 0.15 * backOut(clamp01((t - at) / 0.5))));
  const liveScale = useTransform(time, (t) => (instant ? 1 : backOut(clamp01((t - 4.85) / 0.45))));
  return (
    <>
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 62,
          width: "max-content",
          marginInline: "auto",
          boxSizing: "border-box",
          display: "flex",
          overflow: "hidden",
          padding: "7px 18px",
          background: YELLOW,
          border: `3px solid ${CREAM}`,
          boxShadow: `4px 4px 0 ${CREAM}`,
          color: "var(--color-card-ink)",
          fontFamily: "var(--font-unbounded), var(--font-bricolage), system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 54,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          rotate: -1.5,
          scale,
          opacity,
        }}
      >
        {WORD.map((ch, i) => (
          <TitleLetter key={i} time={time} ch={ch} start={at + 0.1 + i * 0.07} instant={instant} />
        ))}
      </motion.div>
      {/* adesivo LIVE: nello stesso punto della schermata iniziale */}
      <motion.span
        style={{
          position: "absolute",
          left: 344,
          top: 66,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          border: `3px solid ${CREAM}`,
          background: ACCENT,
          boxShadow: `4px 4px 0 ${CREAM}`,
          color: "var(--color-card-ink)",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 12,
          lineHeight: 1,
          x: "-50%",
          y: "-50%",
          rotate: -5,
          scale: liveScale,
        }}
      >
        <i style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: "var(--color-card-ink)" }} />
        LIVE
      </motion.span>
    </>
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
        }}
      >
        <motion.span>{status}</motion.span>
        <motion.span style={{ color: YELLOW, fontSize: 14, letterSpacing: 0 }}>{percent}</motion.span>
      </div>
      <div
        style={{
          height: 28,
          boxSizing: "border-box",
          overflow: "hidden",
          border: `3px solid ${CREAM}`,
          background: "var(--color-surface)",
          boxShadow: `4px 4px 0 ${ACCENT}`,
        }}
      >
        <motion.div
          style={{
            height: "100%",
            boxSizing: "border-box",
            borderRight: "3px solid var(--color-card-ink)",
            backgroundColor: YELLOW,
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(0,0,0,0.16) 0 8px, transparent 8px 16px)",
            backgroundPosition: stripes,
            width,
          }}
        />
      </div>
    </motion.div>
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
  const geometry = useRef({ w: ART_W, h: ART_H, cx: ART_W / 2, cy: RADAR_CENTER.y });
  const [scale, setScale] = useState(0); // 0 = non ancora misurato (resta nascosto)

  // l'artboard 390 x 844 si adatta allo schermo, come la schermata iniziale
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / ART_W, h / ART_H);
      geometry.current = { w, h, cx: w / 2, cy: h / 2 - RADAR_DY * s };
      setScale(s);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleReveal = useEffectEvent(onReveal);
  const handleDone = useEffectEvent(onDone);

  // l'orologio: da 0 a 5,75 secondi, in linea retta
  useEffect(() => {
    // /?intro-t=3.2 → ferma l'orologio al secondo 3,2 (serve a controllare un fotogramma)
    const frozen = new URLSearchParams(window.location.search).get("intro-t");
    if (frozen !== null) {
      time.set(Number(frozen));
      return;
    }
    time.set(0);
    let revealed = false;
    const stop = time.on("change", (t) => {
      if (!revealed && t >= BAR_SECONDS) {
        revealed = true;
        handleReveal(); // lo Splash viene montato sotto: si apre insieme al foro
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
  }, [time]);

  // uscita: foro circolare centrato sul radar (stesso centro della schermata iniziale)
  const mask = useTransform(time, (t) => {
    if (t < BAR_SECONDS) return "none";
    const { w, h, cx, cy } = geometry.current;
    const p = easeInOut(clamp01((t - BAR_SECONDS - 0.1) / 0.65));
    const r = -3 + p * (Math.hypot(w, h) + 3);
    return `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${r + 2}px)`;
  });
  // con "Riduci movimento": niente foro, solo dissolvenza
  const fade = useTransform(time, (t) => 1 - clamp01((t - BAR_SECONDS) / 0.4));
  const contentOut = useTransform(time, (t) => 1 - clamp01((t - BAR_SECONDS) / 0.3));
  const contentScale = useTransform(time, (t) => 1 - 0.06 * easeOut(clamp01((t - BAR_SECONDS) / 0.3)));

  return (
    <motion.div
      ref={rootRef}
      role="status"
      aria-label="Caricamento di Radar"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        height: "100dvh",
        overflow: "hidden",
        background: "var(--color-bg)",
        color: CREAM,
        fontFamily: DISPLAY,
        ...(reduce ? { opacity: fade } : { maskImage: mask }),
      }}
    >
      {/* sfondo: codice Python che scorre piano (lo stesso della schermata iniziale) */}
      {!reduce && (
        <div
          aria-hidden="true"
          style={
            {
              position: "absolute",
              inset: 0,
              containerType: "size", // serve alle colonne extra sui computer
              "--u": "min(calc(100vw / 390), calc(100dvh / 844))",
            } as React.CSSProperties
          }
        >
          <CodeRain />
        </div>
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
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            ...(reduce ? {} : { opacity: contentOut, scale: contentScale }),
          }}
        >
          {!reduce && (
            <>
              <Pulse time={time} offset={0} />
              <Pulse time={time} offset={1.2} />
              <Counter time={time} />
              <Radar time={time} />
              <Tiles time={time} />
            </>
          )}
          <Title time={time} instant={reduce} />
          <Bar time={time} />
        </motion.div>
      </div>
    </motion.div>
  );
}
