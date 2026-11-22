"use client";

import { useMemo, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import type { Signal } from "@/lib/signals";
import {
  BLIP_LIFE,
  CARD_LIFE,
  CARD_W,
  CX,
  CY,
  KIND_COLOR,
  KIND_LABEL,
  RING_RADII,
  SCOPE_R,
  blipGeo,
  blipNow,
  cardHeight,
  cardSlot,
  itemOf,
  kindOf,
  labeledGeo,
  labeledNow,
  sweepAngle,
} from "./radar-model";
import { ART_W, DISPLAY, MONO, backOut, clamp01, easeOut, type Time } from "./timeline";

/*
  La scena dell'intro: uno schermo radar tondo (come un vero PPI), su fondo scuro.
  Bordo con scala dei gradi, anelli di distanza, mirino con le tacche, lancetta gialla con una scia lunga e morbida.
  La lancetta non si ferma mai e gira piano, un giro ogni 5 secondi. A ogni giro nascono puntini NUOVI in posti diversi:
  si accendono al passaggio della lancetta e poi svaniscono piano (non restano fermi). Due puntini a giro mostrano anche un contenuto
  vero: una scheda dello stesso colore del puntino, in un altro punto sopra il radar, collegata da una linea.
  Tutto si calcola da due orologi: `time` (l'intro) e `sweep` (la lancetta, che a fine caricamento continua da sola);
  i dati arrivano da /api/signals (vedi Intro.tsx).
  Con "Riduci movimento": schermo fermo, niente lancetta né puntini.
*/

const INK = "var(--color-card-ink)";
const CREAM = "var(--color-cream)";
const YELLOW = "var(--color-card-article)";

export type RadarData = {
  state: "loading" | "ok" | "error";
  pool: Signal[]; // contenuti veri in ordine "a rotazione" tra i formati (vuoto se il database non risponde)
};

type Props = {
  time: Time;
  live: Time;
  sweep: Time; // orologio della lancetta: come `time` fino a fine caricamento, poi continua da solo
  data: RefObject<RadarData>;
  version: MotionValue<number>; // cambia ogni volta che arrivano dati: fa ricalcolare i numeri anche a orologio fermo
  reduce: boolean;
};

const r2 = (v: number) => Math.round(v * 100) / 100; // arrotonda: i decimali lunghi possono differire tra server e telefono

// ---------- lo schermo: disco, anelli, scala dei gradi, mirino ----------
const BEZEL_R = SCOPE_R + 7;
const DEGREE_LABEL_R = SCOPE_R + 21;

function Scope({ time, reduce }: { time: Time; reduce: boolean }) {
  const ticks = useMemo(() => {
    // tacche ogni 5° dentro il bordo: lunghe ogni 30°, medie ogni 10°, corte le altre
    return Array.from({ length: 72 }, (_, k) => {
      const deg = k * 5;
      const a = (deg * Math.PI) / 180;
      const len = deg % 30 === 0 ? 13 : deg % 10 === 0 ? 8 : 4;
      return {
        k,
        major: deg % 30 === 0,
        x1: r2(CX + SCOPE_R * Math.sin(a)),
        y1: r2(CY - SCOPE_R * Math.cos(a)),
        x2: r2(CX + (SCOPE_R - len) * Math.sin(a)),
        y2: r2(CY - (SCOPE_R - len) * Math.cos(a)),
      };
    });
  }, []);
  const labels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, k) => {
        const deg = k * 30;
        const a = (deg * Math.PI) / 180;
        return {
          deg,
          x: r2(CX + DEGREE_LABEL_R * Math.sin(a)),
          y: r2(CY - DEGREE_LABEL_R * Math.cos(a)),
          text: deg === 0 ? "N" : String(deg).padStart(3, "0"),
        };
      }),
    [],
  );
  // tacche sugli assi del mirino, una ogni 16 unità
  const axis = useMemo(() => Array.from({ length: 19 }, (_, k) => (k - 9) * 16).filter((d) => d !== 0 && Math.abs(d) < SCOPE_R - 12), []);

  const appear = useTransform(time, (t) => (reduce ? 1 : clamp01((t - 0.15) / 0.8)));
  const scaleIn = useTransform(time, (t) => (reduce ? 1 : 0.94 + 0.06 * easeOut(clamp01((t - 0.1) / 0.9))));

  return (
    <motion.svg
      aria-hidden="true"
      width={ART_W}
      height={844}
      viewBox="0 0 390 844"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: appear, scale: scaleIn, originX: `${CX}px`, originY: `${CY}px` }}
    >
      <defs>
        <radialGradient id="scope-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={YELLOW} stopOpacity="0.1" />
          <stop offset="70%" stopColor={YELLOW} stopOpacity="0.03" />
          <stop offset="100%" stopColor={YELLOW} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* piastra e disco */}
      <circle cx={CX} cy={CY} r={BEZEL_R + 5} fill="rgba(255,253,245,0.03)" />
      <circle cx={CX} cy={CY} r={SCOPE_R} fill="#0d0d0d" />
      <circle cx={CX} cy={CY} r={SCOPE_R} fill="url(#scope-glow)" />
      {/* anelli di distanza */}
      {RING_RADII.slice(0, -1).map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke={CREAM} strokeOpacity={0.2} strokeWidth={1} />
      ))}
      {/* mirino */}
      <g stroke={CREAM} strokeOpacity={0.22} strokeWidth={1}>
        <line x1={CX - SCOPE_R} y1={CY} x2={CX + SCOPE_R} y2={CY} />
        <line x1={CX} y1={CY - SCOPE_R} x2={CX} y2={CY + SCOPE_R} />
      </g>
      <g stroke={CREAM} strokeOpacity={0.4} strokeWidth={1}>
        {axis.map((d) => (
          <g key={d}>
            <line x1={CX + d} y1={CY - 3} x2={CX + d} y2={CY + 3} />
            <line x1={CX - 3} y1={CY + d} x2={CX + 3} y2={CY + d} />
          </g>
        ))}
      </g>
      {/* bordo e scala dei gradi */}
      <circle cx={CX} cy={CY} r={SCOPE_R} fill="none" stroke={CREAM} strokeOpacity={0.6} strokeWidth={2} />
      <circle cx={CX} cy={CY} r={BEZEL_R} fill="none" stroke={CREAM} strokeOpacity={0.18} strokeWidth={1} />
      <g strokeLinecap="round">
        {ticks.map((tk) => (
          <line
            key={tk.k}
            x1={tk.x1}
            y1={tk.y1}
            x2={tk.x2}
            y2={tk.y2}
            stroke={tk.major ? YELLOW : CREAM}
            strokeOpacity={tk.major ? 0.9 : 0.45}
            strokeWidth={tk.major ? 2 : 1}
          />
        ))}
      </g>
      <g fontFamily={MONO} fontWeight={700} fontSize={7.5} letterSpacing="0.06em" fill={CREAM} fillOpacity={0.6} textAnchor="middle" dominantBaseline="central">
        {labels.map((l) => (
          <text key={l.deg} x={l.x} y={l.y} fill={l.deg === 0 ? YELLOW : CREAM} fillOpacity={l.deg === 0 ? 1 : 0.6}>
            {l.text}
          </text>
        ))}
      </g>
    </motion.svg>
  );
}

// ---------- lancetta con la sua scia (dentro lo schermo tondo) ----------
function Sweep({ time, sweep }: { time: Time; sweep: Time }) {
  const rotate = useTransform(sweep, (s) => sweepAngle(s));
  const opacity = useTransform(time, (t) => clamp01((t - 0.7) / 0.5));
  const SIZE = SCOPE_R * 2;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: CX - SCOPE_R,
        top: CY - SCOPE_R,
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        overflow: "hidden",
        rotate,
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* scia: lunga e morbida, sfuma piano all'indietro; la punta (ore 12) è netta */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 215deg, rgba(255,217,61,0.025) 245deg, rgba(255,217,61,0.07) 285deg, rgba(255,217,61,0.15) 320deg, rgba(255,217,61,0.28) 346deg, rgba(255,217,61,0.46) 359.4deg, transparent 360deg)",
        }}
      />
      {/* lancetta: linea sottile e luminosa dal centro al bordo */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 2,
          height: SCOPE_R,
          marginLeft: -1,
          background: `linear-gradient(to top, rgba(255,217,61,0.2), ${YELLOW} 35%)`,
          boxShadow: `0 0 10px 1px rgba(255,217,61,0.55)`,
        }}
      />
    </motion.div>
  );
}

// ---------- puntini: 8 "posti" che si riempiono a rotazione ----------
// Ogni puntino nasce al passaggio della lancetta, vive ~2 secondi e svanisce; il suo posto ospita poi il puntino seguente.
// Nessun puntino resta fermo: a ogni giro i puntini sono nuovi e in posti diversi.
const BLIP_POOL = 8;
const mod = (a: number, n: number) => ((a % n) + n) % n;

type SlotProps = { sweep: Time; data: RefObject<RadarData>; version: MotionValue<number> };

function BlipSlot({ i, sweep, data, version }: SlotProps & { i: number }) {
  // numero del puntino che questo posto sta mostrando (-1 = nessuno)
  const gAt = (s: number) => {
    const now = blipNow(s);
    return now < 0 ? -1 : now - mod(now - i, BLIP_POOL);
  };
  const ageAt = (s: number) => {
    const g = gAt(s);
    return g < 0 ? -1 : s - blipGeo(g).tc;
  };

  const x = useTransform(sweep, (s) => {
    const g = gAt(s);
    return g < 0 ? -60 : CX + blipGeo(g).x - 18;
  });
  const y = useTransform(sweep, (s) => {
    const g = gAt(s);
    return g < 0 ? -60 : CY + blipGeo(g).y - 18;
  });
  // stesso colore della scheda collegata: segue il formato del contenuto vero
  const color = useTransform([sweep, version], ([s]: number[]) => KIND_COLOR[kindOf(gAt(s), data.current.pool)]);
  const glow = useTransform(color, (c) => `0 0 16px 3px ${c}`);

  const dotScale = useTransform(sweep, (s) => {
    const age = ageAt(s);
    return age < 0 ? 0 : backOut(clamp01(age / 0.55)) * (1 + 0.3 * Math.exp(-age / 0.35));
  });
  const dotOpacity = useTransform(sweep, (s) => {
    const age = ageAt(s);
    if (age < 0 || age > BLIP_LIFE) return 0;
    // si accende di colpo, si smorza piano (fosforo) e svanisce del tutto prima del giro dopo
    return (0.12 + 0.88 * Math.exp(-age / 1.3)) * (1 - clamp01((age - (BLIP_LIFE - 0.9)) / 0.9));
  });
  const pingScale = useTransform(sweep, (s) => 1 + 3 * easeOut(clamp01(ageAt(s) / 1.8)));
  const pingOpacity = useTransform(sweep, (s) => {
    const age = ageAt(s);
    return age < 0 || age > 1.8 ? 0 : 0.9 * (1 - age / 1.8);
  });

  return (
    <motion.div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 36, height: 36, x, y, pointerEvents: "none" }}>
      <motion.i
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          borderRadius: "50%",
          border: "2.5px solid",
          borderColor: color,
          scale: pingScale,
          opacity: pingOpacity,
        }}
      />
      <motion.i
        style={{
          position: "absolute",
          left: 9,
          top: 9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: color,
          boxShadow: glow,
          scale: dotScale,
          opacity: dotOpacity,
        }}
      />
    </motion.div>
  );
}

// ---------- schede con un contenuto vero, sopra il radar ----------
// Compaiono un attimo dopo la cattura, in un posto diverso ogni volta, collegate al loro puntino da una linea sottile
// e dello stesso colore del puntino. Restano ~1,3 secondi.
const CARD_POOL = 3;

function CardSlot({ j, sweep, data, version }: SlotProps & { j: number }) {
  const ellAt = (s: number) => {
    const e = labeledNow(s);
    return e < 0 ? -1 : e - mod(e - j, CARD_POOL);
  };
  // posto della scheda e sua altezza (dipende da quanto è lungo il titolo)
  const slotAt = (e: number) => cardSlot(e, cardHeight(itemOf(e, data.current.pool)));
  const itemAt = (s: number) => {
    const e = ellAt(s);
    return e < 0 ? undefined : itemOf(e, data.current.pool);
  };
  const ageAt = (s: number) => {
    const e = ellAt(s);
    return e < 0 ? -1 : s - labeledGeo(e).tc;
  };
  // 0 = invisibile, 1 = piena (sale di colpo con un rimbalzo e scende alla fine)
  const show = (s: number) => {
    const age = ageAt(s);
    if (age < 0.2 || age > CARD_LIFE || !itemAt(s)) return 0;
    return clamp01(backOut(clamp01((age - 0.2) / 0.5))) * (1 - clamp01((age - (CARD_LIFE - 0.45)) / 0.45));
  };

  const x = useTransform(sweep, (s) => {
    const e = ellAt(s);
    return e < 0 ? -400 : slotAt(e).left;
  });
  const y = useTransform(sweep, (s) => {
    const e = ellAt(s);
    return e < 0 ? -400 : slotAt(e).top;
  });
  const opacity = useTransform(sweep, show);
  const scale = useTransform(sweep, (s) => 0.75 + 0.25 * show(s));
  const color = useTransform([sweep, version], ([s]: number[]) => {
    const it = itemAt(s);
    return it ? KIND_COLOR[it.kind] : "transparent";
  });
  const head = useTransform([sweep, version], ([s]: number[]) => {
    const it = itemAt(s);
    return it ? `${KIND_LABEL[it.kind]} · ${it.source}` : "";
  });
  const title = useTransform([sweep, version], ([s]: number[]) => itemAt(s)?.title ?? "");

  // linea dal puntino al punto più vicino del bordo della scheda
  const link = (s: number) => {
    const e = ellAt(s);
    if (e < 0) return { bx: 0, by: 0, len: 0, ang: 0 };
    const b = labeledGeo(e);
    const slot = slotAt(e);
    const h = cardHeight(itemOf(e, data.current.pool));
    const bx = CX + b.x;
    const by = CY + b.y;
    const qx = Math.min(slot.left + CARD_W, Math.max(slot.left, bx));
    const qy = Math.min(slot.top + h, Math.max(slot.top, by));
    return { bx, by, len: Math.hypot(qx - bx, qy - by), ang: (Math.atan2(qy - by, qx - bx) * 180) / Math.PI };
  };
  const lx = useTransform(sweep, (s) => link(s).bx);
  const ly = useTransform(sweep, (s) => link(s).by);
  const lw = useTransform(sweep, (s) => link(s).len);
  const la = useTransform(sweep, (s) => link(s).ang);
  const lo = useTransform(sweep, (s) => show(s) * 0.8);

  return (
    <>
      <motion.i
        aria-hidden="true"
        style={{ position: "absolute", left: 0, top: 0, height: 1.5, background: color, originX: 0, originY: 0.5, x: lx, y: ly, width: lw, rotate: la, opacity: lo, pointerEvents: "none" }}
      />
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CARD_W,
          boxSizing: "border-box",
          padding: "8px 12px",
          background: color,
          border: `2px solid ${INK}`,
          boxShadow: `4px 4px 0 ${CREAM}`,
          color: INK,
          x,
          y,
          scale,
          opacity,
          pointerEvents: "none",
        }}
      >
        <motion.span
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1.2,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {head}
        </motion.span>
        <motion.b
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 5,
            overflow: "hidden",
            marginTop: 3,
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 15,
            lineHeight: "18px",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </motion.b>
      </motion.div>
    </>
  );
}

// ---------- il centro: un puntino fisso e un "ping" che si ripete (orologio libero) ----------
function Hub({ time, live, reduce }: { time: Time; live: Time; reduce: boolean }) {
  const phase = (l: number) => (l * 0.3) % 1;
  const scale = useTransform(live, (l) => 0.1 + 3.1 * easeOut(phase(l)));
  const opacity = useTransform([time, live], ([t, l]: number[]) => clamp01((t - 1) / 0.4) * 0.5 * (1 - phase(l)));
  return (
    <>
      {!reduce && (
        <motion.i
          aria-hidden="true"
          style={{
            position: "absolute",
            left: CX - 50,
            top: CY - 50,
            width: 100,
            height: 100,
            boxSizing: "border-box",
            borderRadius: "50%",
            border: `1.5px solid ${YELLOW}`,
            scale,
            opacity,
            pointerEvents: "none",
          }}
        />
      )}
      <i
        aria-hidden="true"
        style={{
          position: "absolute",
          left: CX - 4,
          top: CY - 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: YELLOW,
          boxShadow: `0 0 10px 2px rgba(255,217,61,0.6)`,
        }}
      />
    </>
  );
}

export default function Radar({ time, live, sweep, data, version, reduce }: Props) {
  return (
    <>
      <Scope time={time} reduce={reduce} />
      {!reduce && <Sweep time={time} sweep={sweep} />}
      {!reduce && Array.from({ length: BLIP_POOL }, (_, i) => <BlipSlot key={i} i={i} sweep={sweep} data={data} version={version} />)}
      {!reduce && Array.from({ length: CARD_POOL }, (_, j) => <CardSlot key={j} j={j} sweep={sweep} data={data} version={version} />)}
      <Hub time={time} live={live} reduce={reduce} />
    </>
  );
}
