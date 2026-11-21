"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "motion/react";
import { C, T, WIPE_AT, Wipe } from "./kit";
import { Scene1, Scene2, Scene3, Scene4, Scene5 } from "./scenes";

/*
  Pubblicità di Radar, 16:9 (1920×1080), 20 secondi, fatta con Motion.
  - /ad            → parte da sola; un clic la fa ripartire
  - /ad?t=5.5      → ferma sul secondo 5.5 (per controllare un fotogramma)
  - /ad?render=1   → non parte da sola: l'esportazione imposta il tempo con window.__ad.setTime(t)
*/

type AdApi = { duration: number; setTime: (t: number) => void };

export default function Ad() {
  const time = useMotionValue(0);
  const [scale, setScale] = useState(1);
  const playing = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const play = () => {
    playing.current?.stop();
    time.set(0);
    playing.current = animate(time, T.END, { duration: T.END, ease: "linear" });
  };

  useEffect(() => {
    const api: AdApi = { duration: T.END, setTime: (t) => time.set(t) };
    (window as unknown as { __ad: AdApi }).__ad = api;
    const q = new URLSearchParams(window.location.search);
    const fixed = q.get("t");
    if (fixed !== null) time.set(Number(fixed));
    else if (!q.get("render")) play();
    return () => playing.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", overflow: "hidden", cursor: "none" }} onClick={play}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          overflow: "hidden",
          background: C.paper,
        }}
      >
        <Scene1 time={time} />
        <Scene2 time={time} />
        <Scene3 time={time} />
        <Scene4 time={time} />
        <Scene5 time={time} />
        {WIPE_AT.map((at) => (
          <Wipe key={at} time={time} at={at} />
        ))}
      </div>
    </div>
  );
}
