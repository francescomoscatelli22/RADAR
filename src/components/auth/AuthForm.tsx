"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authErrorMessage, signInWithGoogle, useAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRadar } from "@/lib/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

type Mode = "login" | "signup";

const COPY = {
  login: {
    eyebrow: "Accedi",
    title: "Bentornato",
    accent: "Ritrova i tuoi argomenti e i tuoi salvati.",
    cta: "Accedi",
    switchText: "Non hai un account?",
    switchLink: "Registrati",
    switchHref: "/registrati",
  },
  signup: {
    eyebrow: "Registrati",
    title: "Crea il tuo Radar",
    accent: "Un account per ritrovare tutto su ogni dispositivo.",
    cta: "Crea account",
    switchText: "Hai già un account?",
    switchLink: "Accedi",
    switchHref: "/accedi",
  },
} as const;

const FIELD =
  "h-12 w-full border-[3px] border-cream bg-surface px-3 font-display text-base text-cream placeholder:text-cream-2/70 aria-[invalid=true]:border-accent";

/** Modulo di accesso e di registrazione (email e password, più Google). */
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { configured } = useAuth();
  const { topics } = useRadar();
  const c = COPY[mode];

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
    const db = supabaseBrowser();
    if (!db || busy) return;
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

  const google = async () => {
    setError(null);
    const res = await signInWithGoogle();
    if (!res.ok) setError("Google non è ancora collegato: usa email e password.");
  };

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4"
      style={{ paddingTop: "calc(var(--safe-top) + 16px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="flex h-11 items-center">
        {/* <a> normale (non Link) di proposito: ricarica la pagina e rimostra la schermata iniziale */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 font-mono text-xs font-bold uppercase tracking-wide text-cream-2">
          <Icon name="back" size={20} /> Indietro
        </a>
      </div>

      <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{c.eyebrow}</p>
      <h1 className="font-title text-[34px] font-black leading-[1.05] tracking-tight">{c.title}</h1>
      <p className="mt-3 font-accent text-xl italic leading-snug text-cream-2">{c.accent}</p>

      {checkMail ? (
        <div className="mt-8 border-[3px] border-cream bg-surface p-6 shadow-zine" role="status">
          <Icon name="sparkle" size={32} className="mb-3 text-signal" />
          <h2 className="font-display text-2xl font-extrabold">Controlla la posta</h2>
          <p className="mt-2 text-cream-2">
            Ti abbiamo scritto a <strong className="text-cream">{email}</strong>. Apri il link nel messaggio per confermare, poi torna qui.
          </p>
          <Button href="/accedi" className="mt-5" variant="ghost">
            Vai ad Accedi
          </Button>
        </div>
      ) : (
        <>
          {!configured && (
            <p className="mt-6 border-[3px] border-signal bg-surface p-4 text-[15px] leading-snug" role="note">
              <strong className="font-display text-base">Gli account non sono ancora attivi.</strong> Puoi usare Radar lo stesso:
              argomenti e salvati restano su questo dispositivo.
            </p>
          )}

          <form onSubmit={submit} className="mt-8 flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">
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
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">
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
            </div>

            {error && (
              <p id="auth-error" role="alert" className="flex items-start gap-2 text-[15px] font-semibold text-accent">
                <Icon name="x" size={18} strokeWidth={3} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" full disabled={!configured || busy || !email || password.length < 6}>
              {busy ? "Un attimo…" : c.cta}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wide text-cream-2">
            <span className="h-px flex-1 bg-cream/25" /> oppure <span className="h-px flex-1 bg-cream/25" />
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="secondary" full onClick={google} disabled={!configured}>
              Continua con Google
            </Button>
            <Button variant="ghost" full onClick={() => router.replace(topics === null ? "/argomenti" : "/")}>
              Continua senza account
            </Button>
          </div>

          <p className="mt-8 text-center text-[15px] text-cream-2">
            {c.switchText}{" "}
            <Link href={c.switchHref} className="font-bold text-cream underline underline-offset-4">
              {c.switchLink}
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
