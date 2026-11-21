"use client";

import { dismissToast, useToast } from "@/lib/toast";

/** Dove compaiono le notifiche brevi: sopra la barra delle schede, annunciate anche a VoiceOver. */
export default function Toaster() {
  const t = useToast();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 12px)" }}
    >
      {t && (
        <div
          key={t.id}
          role="status"
          className="toast-in pointer-events-auto flex w-full max-w-[420px] items-center gap-3 border-[3px] border-card-ink bg-cream py-1 pl-4 pr-1 text-card-ink shadow-zine-accent"
        >
          <p className="min-w-0 flex-1 truncate py-2 font-display text-[15px] font-bold">{t.message}</p>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action?.run();
                dismissToast();
              }}
              className="min-h-11 shrink-0 bg-card-ink px-4 font-mono text-xs font-bold uppercase tracking-wide text-cream active:opacity-80"
            >
              {t.action.label}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Chiudi"
              onClick={dismissToast}
              className="grid size-11 shrink-0 place-items-center font-mono text-lg font-bold"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
