"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { signOut, useAuth } from "@/lib/auth";
import { radar, useLang, useRadar } from "@/lib/store";
import { LANGUAGES } from "@/lib/languages";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon, { type IconName } from "@/components/ui/Icon";
import PageTitle from "@/components/ui/PageTitle";

// l'app è già installata sulla Home? (sul server si presume di sì: il suggerimento compare solo dopo il controllo)
function useStandalone() {
  return useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => true,
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 border-[3px] border-cream bg-surface p-5 shadow-zine-sm">
      <h2 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{title}</h2>
      {children}
    </section>
  );
}

function Row({ href, icon, label, value }: { href: string; icon: IconName; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-12 items-center gap-3 px-2 transition-colors duration-150 active:bg-surface-2 motion-reduce:transition-none"
    >
      <Icon name={icon} size={22} className="shrink-0 text-cream-2" />
      <span className="flex-1 font-display text-base font-bold">{label}</span>
      <span className="font-mono text-xs font-bold text-cream-2">{value}</span>
      <Icon name="back" size={18} className="rotate-180 text-cream-2" />
    </Link>
  );
}

export default function Profile() {
  const { configured, loading, user } = useAuth();
  const { topics, follows, saved } = useRadar();
  const lang = useLang();
  const standalone = useStandalone();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <PageTitle eyebrow="Profilo" title="Tu" accent="Account, argomenti e app." />

      <Section title="Account">
        {!configured ? (
          <p className="text-[15px] leading-snug text-cream-2">
            Gli account non sono ancora attivi. Intanto tutto resta su questo dispositivo: argomenti, fonti seguite e salvati.
          </p>
        ) : loading ? (
          <div className="skeleton h-12" aria-hidden="true" />
        ) : user ? (
          <>
            <p className="font-display text-lg font-extrabold">{user.email}</p>
            <p className="mt-1 text-[15px] leading-snug text-cream-2">
              Argomenti, fonti e salvati si sincronizzano su ogni dispositivo in cui accedi.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => signOut()}>
              <Icon name="logout" size={18} /> Esci
            </Button>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-snug text-cream-2">
              Crea un account per ritrovare argomenti, fonti e salvati su iPhone e computer.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/registrati">Registrati</Button>
              <Button href="/accedi" variant="ghost">
                Accedi
              </Button>
            </div>
          </>
        )}
      </Section>

      <Section title="Lingua">
        <p className="mb-4 text-[15px] leading-snug text-cream-2">
          Titoli e anteprime scritti in un&apos;altra lingua vengono tradotti nella tua. Il link porta sempre all&apos;originale.
        </p>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((l) => (
            <Chip key={l.code} selected={lang === l.code} onClick={() => radar.setLang(l.code)}>
              {l.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Il tuo radar">
        <Row href="/argomenti" icon="sliders" label="Argomenti" value={topics ? `${topics.length} scelti` : "da scegliere"} />
        <Row href="/seguiti" icon="eye" label="Fonti seguite" value={String(follows.length)} />
        <Row href="/salvati" icon="bookmark" label="Salvati" value={String(saved.length)} />
      </Section>

      {!standalone && (
        <Section title="Installa Raidar">
          <p className="text-[15px] leading-snug text-cream-2">
            Su iPhone: apri Raidar in <strong className="text-cream">Safari</strong>, tocca{" "}
            <Icon name="share" size={16} className="inline -translate-y-px" /> <strong className="text-cream">Condividi</strong> e poi{" "}
            <strong className="text-cream">Aggiungi alla schermata Home</strong>. Si apre a schermo intero, come un&apos;app.
          </p>
        </Section>
      )}

      <Section title="Dati su questo dispositivo">
        <p className="text-[15px] leading-snug text-cream-2">
          Cancella argomenti, fonti seguite e salvati da questo dispositivo. Se hai un account, restano al sicuro lì.
        </p>
        {confirmReset ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="danger"
              onClick={() => {
                radar.reset();
                setConfirmReset(false);
              }}
            >
              <Icon name="trash" size={18} /> Sì, cancella
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Annulla
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="mt-4" onClick={() => setConfirmReset(true)}>
            <Icon name="trash" size={18} /> Cancella dati
          </Button>
        )}
      </Section>

      <p className="mt-8 text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cream-2">
        Raidar · titoli e link, il resto sui siti originali
      </p>
    </>
  );
}
