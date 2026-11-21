"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { authErrorMessage, PROVIDER_NAME, signInWithProvider, useAuth, type OAuthProvider } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import BrandIcon from "@/components/ui/BrandIcon";

type Mode = "login" | "signup";

const COPY = {
  login: {
    eyebrow: "Accedi",
    title: "Bentornato",
    sticker: "di nuovo qui!",
    accent: "Ritrova i tuoi argomenti e i tuoi salvati.",
    cta: "Accedi",
    switchText: "Non hai un account?",
    switchLink: "Registrati",
    switchHref: "/registrati",
  },
  signup: {
    eyebrow: "Registrati",
    title: "Crea il tuo Raidar",
    sticker: "benvenuto!",
    accent: "Un account per ritrovare tutto su ogni dispositivo.",
    cta: "Crea account",
    switchText: "Hai già un account?",
    switchLink: "Accedi",
    switchHref: "/accedi",
  },
} as const;

// campo zine: al tocco il bordo diventa giallo e compare l'ombra dura gialla (si vede bene dove stai scrivendo)
const FIELD =
  "h-12 w-full border-[3px] border-cream bg-surface px-3 font-display text-base text-cream outline-none placeholder:text-cream-2/70 transition-[border-color,box-shadow] duration-150 focus:border-signal focus:shadow-[4px_4px_0_var(--color-signal)] aria-[invalid=true]:border-accent disabled:opacity-60 motion-reduce:transition-none";

const LABEL = "mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2";

// pulsante principale disattivato: grigio pieno invece del giallo "sporco" a metà trasparenza
const CTA_DISABLED = "disabled:opacity-100 disabled:border-cream/25 disabled:bg-surface-2 disabled:text-cream-2 disabled:shadow-none";

/* ---------- animazioni (Motion) ----------
   Un solo "regista": la pagina fa entrare i blocchi uno dopo l'altro (60 ms di distanza),
   ogni blocco sale di poco con una molla morbida. Con "Riduci movimento" solo dissolvenza. */
function useVariants() {
  const reduce = useReducedMotion();
  return useMemo(() => {
    const group: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.08 } },
    };
    const item: Variants = reduce
      ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
      : {
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 30 } },
        };
    // ogni parola del titolo sale da dietro un "taglio" invisibile
    const word: Variants = reduce
      ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
      : { hidden: { y: "105%" }, show: { y: "0%", transition: { type: "spring", stiffness: 260, damping: 26 } } };
    // l'adesivo si attacca con un piccolo rimbalzo
    const sticker: Variants = reduce
      ? { hidden: { opacity: 0 }, show: { opacity: 1, rotate: 6 } }
      : {
          hidden: { opacity: 0, scale: 1.8, rotate: -20 },
          show: { opacity: 1, scale: 1, rotate: 6, transition: { type: "spring", stiffness: 420, damping: 14, delay: 0.45 } },
        };
    // il sottotitolo si "scrive" una lettera alla volta, dopo il titolo
    const typeGroup: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.028, delayChildren: reduce ? 0 : 0.55 } },
    };
    const char: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0 } } };
    return { reduce, group, item, word, sticker, typeGroup, char };
  }, [reduce]);
}

/** Modulo di accesso e di registrazione (email e password, più Google e GitHub). */
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { configured } = useAuth();
  const { topics } = useRadar();
  const c = COPY[mode];
  const v = useVariants();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkMail, setCheckMail] = useState(false);

  // chi ha già scelto gli argomenti torna al feed, gli altri vanno a sceglierli
  const after = () => router.replace(topics === null && mode === "signup" ? "/argomenti" : "/");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const db = await supabaseBrowser();
    if (!db) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(authErrorMessage(error.message));
        else after();
      } else {
        const { data, error } = await db.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) setError(authErrorMessage(error.message));
        else if (data.session) after();
        else setCheckMail(true); // la conferma via email è attiva: serve il link
      }
    } catch (err) {
      setError(authErrorMessage(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: OAuthProvider) => {
    setError(null);
    const res = await signInWithProvider(provider);
    if (!res.ok) setError(`${PROVIDER_NAME[provider]} non è ancora collegato: usa email e password.`);
  };

  return (
    <motion.main
      initial="hidden"
      animate="show"
      variants={v.group}
      className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden px-4"
      style={{ paddingTop: "calc(var(--safe-top) + 12px)", paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
    >
      <RadarBackdrop still={Boolean(v.reduce)} />

      {/* tre spazi elastici uguali: titolo, modulo e piede si dividono l'altezza della pagina */}
      <div aria-hidden className="min-h-4 flex-1" />

      <header className="relative">
        <motion.div variants={v.item} className="flex items-center gap-2">
          {/* il trattino "respira" come un segnale */}
          <motion.span
            className="h-[3px] w-6 origin-left bg-accent"
            animate={v.reduce ? undefined : { scaleX: [1, 1.8, 1] }}
            transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{c.eyebrow}</span>
        </motion.div>

        <h1 aria-label={c.title} className="mt-2 font-title text-[clamp(34px,11.5vw,48px)] font-black leading-[1.02] tracking-tight">
          <TitleWords text={c.title} word={v.word} still={Boolean(v.reduce)} />
        </h1>

        <motion.p
          aria-label={c.accent}
          variants={v.typeGroup}
          className="mt-2 font-accent text-xl italic leading-snug text-cream-2"
        >
          {Array.from(c.accent).map((ch, i) => (
            <motion.span key={i} aria-hidden variants={v.char}>
              {ch}
            </motion.span>
          ))}
          {/* cursore: compare quando la frase è scritta, poi lampeggia */}
          {!v.reduce && (
            <motion.span aria-hidden variants={v.char} className="ml-0.5 inline-block">
              <motion.span
                className="inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-signal"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity }}
              />
            </motion.span>
          )}
        </motion.p>

        {/* adesivo a mano, come quelli dell'intro */}
        <motion.span
          aria-hidden
          variants={v.sticker}
          className="absolute -top-3 right-0 rounded-full border-[3px] border-card-ink bg-accent px-3 py-0.5 font-marker text-[15px] text-card-ink shadow-[3px_3px_0_var(--color-card-ink)]"
        >
          {/* dopo essersi attaccato, l'adesivo dondola piano */}
          <motion.span
            className="inline-block"
            animate={v.reduce ? undefined : { rotate: [0, -5, 3, 0], y: [0, -2, 0, 0] }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 1.2, repeat: Infinity, repeatDelay: 1.8 }}
          >
            {c.sticker}
          </motion.span>
        </motion.span>
      </header>

      <div aria-hidden className="min-h-6 flex-1" />

      {checkMail ? (
        <motion.div
          initial={v.reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="border-[3px] border-cream bg-surface p-6 shadow-zine"
          role="status"
        >
          <Icon name="sparkle" size={32} className="mb-3 text-signal" />
          <h2 className="font-display text-2xl font-extrabold">Controlla la posta</h2>
          <p className="mt-2 text-cream-2">
            Ti abbiamo scritto a <strong className="text-cream">{email}</strong>. Apri il link nel messaggio per confermare, poi torna qui.
          </p>
          <Button href="/accedi" className="mt-5" variant="ghost">
            Vai ad Accedi
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={v.group} className="flex flex-col">
          {!configured && (
            <motion.p variants={v.item} className="mb-5 border-[3px] border-signal bg-surface p-4 text-[15px] leading-snug" role="note">
              <strong className="font-display text-base">Gli account non sono ancora attivi.</strong> Puoi usare Raidar lo stesso:
              argomenti e salvati restano su questo dispositivo.
            </motion.p>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <motion.div variants={v.item}>
              <label htmlFor="email" className={LABEL}>
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                disabled={!configured}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "auth-error" : undefined}
                className={FIELD}
              />
            </motion.div>

            <motion.div variants={v.item}>
              <label htmlFor="password" className={LABEL}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Almeno 6 caratteri" : "La tua password"}
                  disabled={!configured}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "auth-error" : undefined}
                  className={`${FIELD} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-pressed={show}
                  className="absolute right-1 top-1/2 min-h-11 -translate-y-1/2 px-3 font-mono text-[11px] font-bold uppercase tracking-wide text-cream-2"
                >
                  {show ? "Nascondi" : "Mostra"}
                </button>
              </div>
            </motion.div>

            {error && (
              // l'errore "scuote la testa": si capisce subito che qualcosa non va
              <motion.p
                key={error}
                id="auth-error"
                role="alert"
                initial={{ opacity: 0 }}
                animate={v.reduce ? { opacity: 1 } : { opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-2 text-[15px] font-semibold text-accent"
              >
                <Icon name="x" size={18} strokeWidth={3} className="mt-0.5 shrink-0" />
                {error}
              </motion.p>
            )}

            <motion.div variants={v.item} className="mt-1">
              <Button type="submit" full className={CTA_DISABLED} disabled={!configured || busy || !email || password.length < 6}>
                {busy ? "Un attimo…" : c.cta}
                {!busy && <Icon name="back" size={18} strokeWidth={3} className="rotate-180" />}
              </Button>
            </motion.div>
          </form>

          <motion.div
            variants={v.item}
            className="my-5 flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wide text-cream-2"
          >
            <span className="h-px flex-1 bg-cream/25" /> oppure <span className="h-px flex-1 bg-cream/25" />
          </motion.div>

          <div className="flex flex-col gap-3">
            <motion.div variants={v.item}>
              <Button variant="secondary" full onClick={() => social("google")} disabled={!configured}>
                <BrandIcon name="google" />
                Continua con Google
              </Button>
            </motion.div>
            <motion.div variants={v.item}>
              <Button variant="secondary" full onClick={() => social("github")} disabled={!configured}>
                <BrandIcon name="github" />
                Continua con GitHub
              </Button>
            </motion.div>
            <motion.div variants={v.item}>
              <Button variant="ghost" full onClick={() => router.replace(topics === null ? "/argomenti" : "/")}>
                Continua senza account
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      <div aria-hidden className="min-h-6 flex-1" />

      {/* piede: cambio modulo e Indietro, in fondo alla pagina */}
      <motion.footer variants={v.item} className="flex flex-col items-center gap-3">
        {!checkMail && (
          <p className="text-center text-[15px] text-cream-2">
            {c.switchText}{" "}
            <Link href={c.switchHref} className="font-bold text-cream underline decoration-signal decoration-2 underline-offset-4">
              {c.switchLink}
            </Link>
          </p>
        )}
        {/* torna alla schermata iniziale già sui pulsanti di accesso (lo decide AppBoot), senza ricaricare l'app */}
        <Link
          href="/"
          replace
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-cream/25 px-4 font-mono text-xs font-bold uppercase tracking-wide text-cream-2 transition-colors duration-150 hover:border-cream hover:text-cream active:scale-95 motion-reduce:transition-none"
        >
          <Icon name="back" size={18} /> Indietro
        </Link>
      </motion.footer>
    </motion.main>
  );
}

/* ---------- decorazioni ---------- */

/** Titolo: le parole salgono all'ingresso, poi ogni 4 s un'"onda" passa sulle lettere (come il fascio del radar). */
function TitleWords({ text, word, still }: { text: string; word: Variants; still: boolean }) {
  let n = 0; // indice della lettera nell'intero titolo, per far scorrere l'onda da sinistra a destra
  return text.split(" ").map((w, i) => (
    // il "taglio" lascia un po' d'aria sopra, così l'onda non viene tagliata
    <span key={i} aria-hidden className="-mt-[0.2em] inline-block overflow-hidden pb-[0.06em] pt-[0.2em] align-bottom">
      <motion.span variants={word} className="inline-block">
        {Array.from(w).map((ch, j) => {
          const k = n++;
          return (
            <motion.span
              key={j}
              className="inline-block"
              animate={still ? undefined : { y: ["0em", "-0.14em", "0em"], color: ["var(--color-cream)", "var(--color-signal)", "var(--color-cream)"] }}
              transition={{ duration: 0.55, ease: "easeInOut", delay: 1.1 + k * 0.045, repeat: Infinity, repeatDelay: 3.4 }}
            >
              {ch}
            </motion.span>
          );
        })}
      </motion.span>{" "}
    </span>
  ));
}

/** Anelli del radar che girano piano dietro il titolo: il segno di Raidar, molto in sottofondo. */
function RadarBackdrop({ still }: { still: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      // tutto dentro lo schermo: prima metà radar era tagliata e il fascio "spariva" a metà giro
      className="pointer-events-none absolute right-3 top-16 size-[min(260px,62vw)]"
    >
      <svg viewBox="0 0 300 300" className="absolute inset-0 size-full">
        {[148, 110, 72, 34].map((r) => (
          <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="var(--color-cream)" strokeOpacity="0.09" strokeWidth="2" />
        ))}
        <line x1="150" y1="2" x2="150" y2="298" stroke="var(--color-cream)" strokeOpacity="0.06" strokeWidth="2" />
        <line x1="2" y1="150" x2="298" y2="150" stroke="var(--color-cream)" strokeOpacity="0.06" strokeWidth="2" />
      </svg>
      {/* fascio che ruota: un giro completo ogni 2,8 s, con una linea netta sul bordo che "spazza" */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, rgb(255 210 63 / 0.28) 359deg, rgb(255 210 63 / 0.7) 360deg)" }}
        animate={still ? undefined : { rotate: 360 }}
        transition={{ duration: 2.8, ease: "linear", repeat: Infinity }}
      />
      {/* due "segnali" che lampeggiano (posizioni in % così seguono la misura del radar) */}
      {[
        { x: "29%", y: "37%", d: 0.6 },
        { x: "65%", y: "23%", d: 1.9 },
      ].map((b) => (
        <motion.span
          key={b.x}
          className="absolute size-2 rounded-full bg-accent"
          style={{ left: b.x, top: b.y }}
          animate={still ? { opacity: 0.5 } : { opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
          transition={{ duration: 1.4, delay: b.d, repeat: Infinity, repeatDelay: 1.4 }}
        />
      ))}
    </motion.div>
  );
}
