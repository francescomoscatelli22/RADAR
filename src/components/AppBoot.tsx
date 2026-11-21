"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { PROVIDER_NAME, signInWithProvider, signOut, useAuth, type OAuthProvider } from "@/lib/auth";
import { radar, useRadar } from "@/lib/store";
import type { Stage } from "./splash/Splash";

// Intro e splash (con la libreria di animazione Motion, ~75 KB compressi) servono solo aprendo l'app da "/":
// caricate a parte, le altre pagine non le scaricano. Su "/" l'intro resta nell'HTML del server, quindi compare subito.
const Intro = dynamic(() => import("./intro/Intro"));
const Splash = dynamic(() => import("./splash/Splash"));

type Phase = Stage | "gone";
// caricamento animato: "loading" (8,5 s con la barra) → "revealing" (le strisce scoprono la schermata iniziale) → "done"
type Boot = "loading" | "revealing" | "done";
const AUTH_PAGES = ["/accedi", "/registrati"];

/**
 * Apertura di Radar. Si vede solo aprendo l'app dalla home ("/").
 *  0. caricamento: poster giallo animato con la barra, poi lo strappo a strisce scopre la schermata iniziale
 *  1. intro: animazione radar in loop, senza fine, finché l'utente non tocca lo schermo
 *  2. menu: compaiono i pulsanti (Accedi, Registrati, Continua con Google, Continua con GitHub)
 *  3. leaving: scelta una pagina, il foro circolare si apre e la scopre
 * Chi ha già scelto gli argomenti (o ha un account) non vede la schermata iniziale: lo strappo scopre subito il feed.
 * Il layout resta montato tra le pagine, quindi non ricompare finché non si ricarica l'app.
 */
export default function AppBoot({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { topics } = useRadar();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>(pathname === "/" ? "intro" : "gone");
  const [boot, setBoot] = useState<Boot>(pathname === "/" ? "loading" : "done");
  const [note, setNote] = useState<string | null>(null);

  // Solo in sviluppo: "/?splash=1" forza la schermata iniziale anche se gli argomenti sono già scelti
  // (serve a rivederla mentre si rifinisce il design; nella versione di produzione non esiste).
  // Si legge solo quando l'intro finisce, mai nel primo disegno della pagina: niente differenze tra server e browser.
  const forceSplash =
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("splash");
  const returning = !forceSplash && (topics !== null || user !== null);

  // Tornando su "/" da un'altra pagina (es. "Indietro" da Accedi, o il gesto indietro di iPhone)
  // chi non ha ancora un account ritrova subito i pulsanti di accesso, senza rivedere caricamento e "Tocca per iniziare".
  // (Si confronta la pagina precedente durante il disegno, come consiglia React, invece che in un effetto.)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (pathname === "/" && !returning) setPhase("menu");
  }

  // Gesto indietro (iPhone) o tasto indietro del browser da Accedi/Registrati: la pagina precedente nella cronologia
  // è quella che stava sotto la schermata iniziale (spesso "/argomenti"), quindi rimettiamo sopra i pulsanti di accesso.
  // Next.js a volte cambia pagina prima che arrivi l'evento "indietro" (popstate), a volte dopo:
  // per questo ricordiamo le ultime due pagine e capiamo da sole da dove si arriva.
  const pages = useRef({ prev: pathname, curr: pathname, returning });
  useEffect(() => {
    const p = pages.current;
    if (p.curr !== pathname) {
      p.prev = p.curr;
      p.curr = pathname;
    }
    p.returning = returning;
  }, [pathname, returning]);
  useEffect(() => {
    const onPop = () => {
      const p = pages.current;
      const to = window.location.pathname;
      const from = p.curr === to ? p.prev : p.curr;
      if (AUTH_PAGES.includes(from) && !AUTH_PAGES.includes(to) && !p.returning) setPhase("menu");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Solo in sviluppo: dentro la cornice del telefono (design/phone-preview.html) nasconde la barra di scorrimento del computer
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && window.self !== window.top) {
      document.documentElement.classList.add("in-phone-frame");
    }
  }, []);

  // Solo in sviluppo: "/?fresh=1" azzera argomenti, seguiti e salvati di questo dispositivo ed esce dall'account,
  // come per chi apre Radar la prima volta (con un account attivo la schermata iniziale non compare).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("fresh")) {
      radar.reset();
      void signOut();
    }
  }, []);

  const choose = (href: string) => {
    setPhase("leaving");
    router.push(href);
  };

  // Google e GitHub funzionano solo se Supabase e il provider sono collegati: altrimenti lo diciamo chiaramente
  const social = async (provider: OAuthProvider) => {
    const res = await signInWithProvider(provider);
    if (!res.ok) setNote(`${PROVIDER_NAME[provider]} arriva presto: va ancora collegato l'accesso.`);
  };

  return (
    <>
      {children}
      {/* lo Splash viene montato quando il foro inizia ad aprirsi: così le sue animazioni partono sotto l'intro */}
      {phase !== "gone" && boot !== "loading" && !returning && (
        <Splash
          stage={phase}
          note={note}
          onStart={() => setPhase("menu")}
          onChoose={choose}
          onSocial={social}
          onExited={() => setPhase("gone")}
        />
      )}
      {boot !== "done" && <Intro onReveal={() => setBoot("revealing")} onDone={() => setBoot("done")} />}
    </>
  );
}
