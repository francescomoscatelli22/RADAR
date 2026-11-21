"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { AnimationPlaybackControls, MotionValue } from "motion/react";
import { TOTAL_SECONDS } from "./timeline";

/*
  SOLO PER SVILUPPO: barra per fermare l'intro e guardarla fotogramma per fotogramma.
  Si monta solo se NODE_ENV !== "production" (vedi Intro.tsx): nella versione vera non esiste.
    Spazio  pausa / riprendi
    ← →     indietro / avanti di 0,1 secondi (con Maiusc: 0,5)
    B       mostra / nasconde la barra (di partenza è NASCOSTA: lo schermo resta pulito, i tasti funzionano lo stesso)
  La barra non fa parte del design: sta in basso e mostra il secondo esatto, così si può dire "a 3,4 s c'è un problema".
*/

export default function DevPause({
  time,
  controlsRef,
}: {
  time: MotionValue<number>;
  controlsRef: RefObject<AnimationPlaybackControls | null>;
}) {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const pausedRef = useRef(false);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // il numero e il cursore seguono l'orologio senza far rifare il disegno a React
  useEffect(() => {
    const show = (t: number) => {
      if (readoutRef.current) readoutRef.current.textContent = `${t.toFixed(2)} s`;
      if (sliderRef.current) sliderRef.current.value = String(t);
    };
    show(time.get());
    return time.on("change", show);
  }, [time, visible]);

  const setPause = (next: boolean) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (next) controls.pause();
    else controls.play();
    pausedRef.current = next;
    setPaused(next);
  };

  const seek = (t: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const clamped = Math.min(Math.max(t, 0), TOTAL_SECONDS);
    controls.time = clamped;
    time.set(clamped);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.key === "b" || e.key === "B") {
        setVisible((v) => !v);
      } else if (e.code === "Space") {
        e.preventDefault();
        setPause(!pausedRef.current);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = (e.shiftKey ? 0.5 : 0.1) * (e.key === "ArrowLeft" ? -1 : 1);
        if (!pausedRef.current) setPause(true);
        seek(time.get() + step);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setPause e seek usano solo ref stabili
  }, []);

  if (!visible) return null;

  return (
    <div
      data-dev-pause
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        background: "#000",
        color: "#fff",
        border: "2px solid #fff",
        font: "700 12px ui-monospace, monospace",
      }}
    >
      <button
        type="button"
        onClick={() => setPause(!paused)}
        aria-label={paused ? "Riprendi l'intro" : "Metti in pausa l'intro"}
        style={{ minWidth: 44, minHeight: 44, background: "#ffd23f", color: "#000", border: 0, font: "inherit", cursor: "pointer" }}
      >
        {paused ? "▶" : "❚❚"}
      </button>
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={TOTAL_SECONDS}
        step={0.05}
        defaultValue={0}
        aria-label="Secondo dell'intro"
        onChange={(e) => {
          if (!pausedRef.current) setPause(true);
          seek(Number(e.target.value));
        }}
        style={{ flex: 1, minWidth: 0 }}
      />
      <span ref={readoutRef} style={{ minWidth: 58, textAlign: "right" }}>
        0.00 s
      </span>
    </div>
  );
}
