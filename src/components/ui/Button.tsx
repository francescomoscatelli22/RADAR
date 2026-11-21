import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
  Pulsante zine: bordo spesso, ombra dura, "si schiaccia" quando lo tocchi
  (l'ombra sparisce e il pulsante scende: feedback chiaro entro 100 ms, senza spostare il resto).
  Con href diventa un link (stesso aspetto).
*/
type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-signal text-card-ink border-card-ink shadow-[4px_4px_0_var(--color-cream)]",
  secondary: "bg-cream text-card-ink border-card-ink shadow-[4px_4px_0_var(--color-accent)]",
  ghost: "bg-transparent text-cream border-cream/50 shadow-none",
  danger: "bg-accent text-card-ink border-card-ink shadow-[4px_4px_0_var(--color-cream)]",
};

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 border-[3px] px-5 font-display text-base font-extrabold uppercase tracking-wide transition-[transform,box-shadow] duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none";

type Common = { variant?: Variant; children: ReactNode; className?: string; full?: boolean };

export default function Button({
  variant = "primary",
  full = false,
  className = "",
  children,
  href,
  ...rest
}: Common & { href?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">) {
  const cls = `${BASE} ${VARIANT[variant]} ${full ? "w-full" : ""} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
