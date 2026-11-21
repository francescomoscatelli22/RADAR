import Link from "next/link";
import Icon from "@/components/ui/Icon";

/*
  Testata fissa: titolo RADAR con il puntino "live" e il collegamento al profilo.
  Altezza fissa 56 px (+ margine di sicurezza dell'iPhone): le barre dei filtri si appoggiano sotto.
*/
export default function AppHeader() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-cream/15 bg-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-4">
        <Link href="/" aria-label="Radar, vai a Per te" className="flex items-center gap-2.5">
          <span className="relative grid size-3 place-items-center" aria-hidden="true">
            <span className="absolute size-3 animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
            <span className="size-2.5 rounded-full bg-accent" />
          </span>
          <span className="font-title text-lg font-black tracking-tight">RADAR</span>
        </Link>
        <Link
          href="/profilo"
          aria-label="Profilo e impostazioni"
          className="-mr-2 grid size-11 place-items-center rounded-full text-cream-2 transition-colors duration-150 active:bg-surface-2 motion-reduce:transition-none"
        >
          <Icon name="user" size={24} />
        </Link>
      </div>
    </header>
  );
}
