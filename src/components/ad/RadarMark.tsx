"use client";

import { motion, useTransform } from "motion/react";
import { C, backOut, clamp01, easeOut, type Time } from "./kit";

/*
  Il radar dell'icona (stessa geometria di Splash.tsx e public/icons/icon.svg, viewBox 512),
  ma guidato dall'orologio della pubblicità invece che dai CSS.
*/

const CEN = 256;
const ARM_ANGLE = -45;
const RINGS = [60, 125, 190];
const BLIPS = [
  { x: 256, y: 256 },
  { x: 302, y: 294.6 },
  { x: 256, y: 381 },
  { x: 147.7, y: 193.5 },
];

const TRAIL = [0.28, 0.2, 0.12, 0.06].map((opacity, k) => {
  const R = 178;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(CEN + R * Math.cos(rad)).toFixed(1)} ${(CEN + R * Math.sin(rad)).toFixed(1)}`;
  };
  const from = ARM_ANGLE - 9 * (k + 1);
  const to = ARM_ANGLE - 9 * k;
  return { opacity, d: `M${CEN} ${CEN} L${pt(from)} A${R} ${R} 0 0 1 ${pt(to)} Z` };
});

function Ring({ time, start, r }: { time: Time; start: number; r: number }) {
  const pathLength = useTransform(time, (t) => easeOut(clamp01((t - start) / 0.55)));
  return (
    <motion.circle
      cx={CEN}
      cy={CEN}
      r={r}
      fill="none"
      stroke={C.paper}
      strokeWidth={24}
      transform={`rotate(-90 ${CEN} ${CEN})`}
      style={{ pathLength }}
    />
  );
}

function Blip({
  time,
  x,
  y,
  delay,
  period,
}: {
  time: Time;
  x: number;
  y: number;
  delay: number;
  period: number;
}) {
  const scale = useTransform(time, (t) => backOut(clamp01((t - delay) / 0.4)));
  const pingR = useTransform(time, (t) =>
    t < delay ? 14 : 14 + 52 * easeOut(((t - delay) % period) / period),
  );
  const pingO = useTransform(time, (t) =>
    t < delay ? 0 : 0.9 * (1 - ((t - delay) % period) / period),
  );
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={pingR}
        fill="none"
        stroke={C.coral}
        strokeWidth={6}
        style={{ opacity: pingO }}
      />
      <motion.g style={{ scale, opacity: scale }}>
        <circle cx={x} cy={y} r={34} fill={C.ink} />
        <circle cx={x} cy={y} r={14} fill={C.coral} />
      </motion.g>
    </g>
  );
}

export default function RadarMark({
  time,
  t0,
  size,
  period = 1.6,
}: {
  time: Time;
  t0: number; // secondo in cui la lancetta parte
  size: number;
  period?: number;
}) {
  const rotate = useTransform(time, (t) => (Math.max(0, t - t0) * 360) / period);
  const sweepOpacity = useTransform(time, (t) => clamp01((t - (t0 - 0.5)) / 0.4));

  const blips = BLIPS.map((b) => {
    const angle = (Math.atan2(b.y - CEN, b.x - CEN) * 180) / Math.PI;
    const turn = (((angle - ARM_ANGLE) % 360) + 360) % 360;
    return { ...b, delay: t0 + (turn / 360) * period };
  });

  const box = { position: "absolute", inset: 0, width: "100%", height: "100%" } as const;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox="0 0 512 512" style={{ ...box, overflow: "visible" }}>
        {RINGS.map((r, i) => (
          <Ring key={r} time={time} start={t0 - 0.5 + i * 0.12} r={r} />
        ))}
      </svg>
      {/* lancetta + scia: l'intero svg ruota attorno al suo centro */}
      <motion.svg viewBox="0 0 512 512" style={{ ...box, overflow: "visible", rotate: rotate, opacity: sweepOpacity }}>
        {TRAIL.map((t, i) => (
          <path key={i} d={t.d} fill={C.signal} opacity={t.opacity} />
        ))}
        <path d={`M${CEN} ${CEN} L381.9 130.1`} stroke={C.signal} strokeWidth={24} fill="none" />
      </motion.svg>
      <svg viewBox="0 0 512 512" style={{ ...box, overflow: "visible" }}>
        {blips.map((b, i) => (
          <Blip key={i} time={time} x={b.x} y={b.y} delay={b.delay} period={period} />
        ))}
      </svg>
    </div>
  );
}
