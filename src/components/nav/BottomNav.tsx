"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useRadar } from "@/lib/store";

/*
  Barra in basso con le tre schede. Sta sopra la barra Home dell'iPhone (margine di sicurezza)
  e ogni scheda è alta 64 px (area di tocco ben oltre i 44 px minimi).
  La scheda attiva è un blocco giallo: non si affida solo al colore, cambia anche il peso e l'icona è piena.
  Come nelle app iPhone: toccare la scheda in cui sei già riporta in cima.
  Cambiando scheda il contenuto scorre verso destra o sinistra secondo la posizione (vedi PageTransition).
*/
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Per te", icon: "radar" },
  { href: "/seguiti", label: "Seguiti", icon: "eye" },
  { href: "/salvati", label: "Salvati", icon: "bookmark" },
];

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export default function BottomNav() {
  const pathname = usePathname();
  const { saved } = useRadar();
  // il profilo sta "a destra" di tutte le schede
  const current = TABS.findIndex((t) => isActive(t.href, pathname));
  const from = current === -1 ? TABS.length : current;

  return (
    <nav
      aria-label="Schede principali"
      className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-cream bg-bg"
      style={{ paddingBottom: "var(--safe-bottom)", viewTransitionName: "app-nav" }}
    >
      <ul className="mx-auto flex max-w-[640px]">
        {TABS.map((t, i) => {
          const active = i === current;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                transitionTypes={[i > from ? "nav-forward" : "nav-back"]}
                onClick={(e) => {
                  if (!active) return;
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 font-display text-[13px] transition-colors duration-150 motion-reduce:transition-none ${
                  active ? "bg-signal font-extrabold text-card-ink" : "font-semibold text-cream-2 active:bg-surface-2"
                }`}
              >
                <Icon name={t.icon} size={22} filled={active && t.icon === "bookmark"} strokeWidth={active ? 2.5 : 2} />
                {t.label}
                {t.href === "/salvati" && saved.length > 0 && (
                  <span
                    aria-label={`${saved.length} salvati`}
                    className="absolute right-[calc(50%-26px)] top-2 grid min-w-5 place-items-center rounded-full border-2 border-card-ink bg-accent px-1 font-mono text-[10px] font-bold leading-4 text-card-ink"
                  >
                    {saved.length > 99 ? "99+" : saved.length}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
