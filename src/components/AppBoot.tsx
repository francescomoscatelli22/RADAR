"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Intro from "./intro/Intro";
import Splash, { type Stage } from "./splash/Splash";

type Phase = Stage | "gone";
// caricamento animato: "loading" (5 s con la barra) → "revealing" (il foro scopre la schermata iniziale) → "done"
type Boot = "loading" | "revealing" | "done";

/**
 * Apertura di Radar. Si vede solo aprendo l'app dalla home ("/").
 *  0. caricamento: intro animata con la barra da 5 secondi, poi un foro circolare scopre la schermata iniziale
 *  1. intro: animazione radar in loop, senza fine, finché l'utente non tocca lo schermo
 *  2. menu: compaiono i tre pulsanti (Accedi, Registrati, Continua con Google)
 *  3. leaving: scelta una pagina, il foro circolare si apre e la scopre
 * Il layout resta montato tra le pagine, quindi non ricompare finché non si ricarica l'app.
 */
export default function AppBoot({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>(pathname === "/" ? "intro" : "gone");
  const [boot, setBoot] = useState<Boot>(pathname === "/" ? "loading" : "done");
  const [note, setNote] = useState<string | null>(null);

  const choose = (href: string) => {
    setPhase("leaving");
    router.push(href);
  };

  // Google non è ancora collegato (serve Supabase + Google Cloud): lo diciamo chiaramente
  const google = () => setNote("Google arriva presto: va ancora collegato l'accesso.");

  return (
    <>
      {children}
      {/* lo Splash viene montato quando il foro inizia ad aprirsi: così le sue animazioni partono sotto l'intro */}
      {phase !== "gone" && boot !== "loading" && (
        <Splash
          stage={phase}
          note={note}
          onStart={() => setPhase("menu")}
          onChoose={choose}
          onGoogle={google}
          onExited={() => setPhase("gone")}
        />
      )}
      {boot !== "done" && <Intro onReveal={() => setBoot("revealing")} onDone={() => setBoot("done")} />}
    </>
  );
}
