// Segnaposto: qui arriverà il modulo di accesso (email e password), quando collegheremo Supabase.
export default function Accedi() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">Accedi</p>
      <h1 className="text-6xl font-extrabold tracking-tight">Bentornato</h1>
      <p className="font-accent text-2xl italic">Il modulo di accesso arriva qui.</p>
      {/* <a> normale (non Link) di proposito: ricarica la pagina e rimostra la schermata iniziale */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-6 font-mono text-xs uppercase tracking-[0.14em] underline">
        ← Indietro
      </a>
    </main>
  );
}
